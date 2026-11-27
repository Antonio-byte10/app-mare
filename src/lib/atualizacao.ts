/**
 * "Procurar atualização": só quando a pessoa toca no botão, nunca em segundo plano. Consulta as
 * versões publicadas no GitHub, acha a mais nova e compara com a instalada. Não baixa nem instala
 * nada: no máximo abre a página da versão no navegador. A lógica é pura e a rede é injetada.
 *
 * Usa `/releases` (e não `/releases/latest`) porque versões beta podem estar marcadas como
 * pré-lançamento, e o `/latest` as ignora.
 */

export const URL_VERSOES = 'https://api.github.com/repos/Antonio-byte10/app-mare/releases?per_page=10';
const TEMPO_LIMITE_MS = 15_000;

export interface Versao {
  major: number;
  minor: number;
  patch: number;
  /** Identificadores depois do hífen ("beta.1" vira ["beta", "1"]). Vazio = versão final. */
  pre: string[];
}

const PADRAO_SEMVER = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z.-]+)?$/;

/** Lê "v0.4.0", "0.4.0" ou "v1.0.0-beta.1". `null` se a etiqueta não for uma versão. */
export function lerVersao(etiqueta: string): Versao | null {
  const m = PADRAO_SEMVER.exec(etiqueta.trim());
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]), pre: m[4] ? m[4].split('.') : [] };
}

const SO_DIGITOS = /^\d+$/;

function compararIdentificador(a: string, b: string): number {
  const numA = SO_DIGITOS.test(a);
  const numB = SO_DIGITOS.test(b);
  if (numA && numB) return Math.sign(Number(a) - Number(b));
  if (numA) return -1; // números vêm antes de textos
  if (numB) return 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Ordem de versões (semver): negativo se a < b, 0 se iguais, positivo se a > b. Pré-lançamento < versão final. */
export function compararVersoes(a: Versao, b: Versao): number {
  for (const campo of ['major', 'minor', 'patch'] as const) {
    if (a[campo] !== b[campo]) return a[campo] < b[campo] ? -1 : 1;
  }
  if (a.pre.length === 0 && b.pre.length === 0) return 0;
  if (a.pre.length === 0) return 1;
  if (b.pre.length === 0) return -1;
  const n = Math.min(a.pre.length, b.pre.length);
  for (let i = 0; i < n; i++) {
    const c = compararIdentificador(a.pre[i]!, b.pre[i]!);
    if (c !== 0) return c;
  }
  return Math.sign(a.pre.length - b.pre.length);
}

export interface VersaoPublicada {
  /** Versão sem o "v" inicial, como "1.0.0-beta.1". */
  versao: string;
  /** Página da versão no GitHub. */
  url: string;
}

const ehObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Entre as versões da resposta do GitHub, ignora rascunhos e etiquetas estranhas e fica com a mais alta. */
export function escolherMaisNova(dados: unknown): VersaoPublicada | null {
  if (!Array.isArray(dados)) return null;
  let melhor: { v: Versao; publicada: VersaoPublicada } | null = null;
  for (const item of dados) {
    if (!ehObjeto(item) || item.draft === true) continue;
    const { tag_name: etiqueta, html_url: url } = item;
    if (typeof etiqueta !== 'string' || typeof url !== 'string') continue;
    // Só abrimos links do próprio GitHub.
    if (!url.startsWith('https://github.com/')) continue;
    const v = lerVersao(etiqueta);
    if (!v) continue;
    if (!melhor || compararVersoes(v, melhor.v) > 0) {
      melhor = { v, publicada: { versao: etiqueta.trim().replace(/^v/, ''), url } };
    }
  }
  return melhor?.publicada ?? null;
}

export type MotivoErro =
  /** Sem internet, sem resposta ou demorou demais. */
  | 'rede'
  /** O GitHub limitou os pedidos (403 ou 429): tentar de novo mais tarde. */
  | 'limite'
  /** Qualquer outro status de erro. */
  | 'http'
  /** A resposta não veio no formato esperado. */
  | 'formato'
  /** Ainda não há nenhuma versão publicada. */
  | 'sem_versoes';

export type ResultadoAtualizacao =
  | { tipo: 'atual'; instalada: string }
  | { tipo: 'nova'; versao: string; url: string }
  | { tipo: 'erro'; motivo: MotivoErro };

/** O pedaço de `fetch` que usamos; o `fetch` global satisfaz este formato. */
export type BuscarVersoes = (
  url: string,
  init: { headers: Record<string, string>; signal: AbortSignal },
) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export async function procurarAtualizacao(
  instalada: string,
  buscar: BuscarVersoes,
  tempoLimiteMs = TEMPO_LIMITE_MS,
): Promise<ResultadoAtualizacao> {
  const atual = lerVersao(instalada);
  if (!atual) return { tipo: 'erro', motivo: 'formato' };

  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), tempoLimiteMs);
  try {
    let resposta: Awaited<ReturnType<BuscarVersoes>>;
    try {
      resposta = await buscar(URL_VERSOES, {
        headers: { Accept: 'application/vnd.github+json' },
        signal: controle.signal,
      });
    } catch {
      return { tipo: 'erro', motivo: 'rede' };
    }
    if (!resposta.ok) {
      return { tipo: 'erro', motivo: resposta.status === 403 || resposta.status === 429 ? 'limite' : 'http' };
    }
    let dados: unknown;
    try {
      dados = await resposta.json();
    } catch {
      return { tipo: 'erro', motivo: 'formato' };
    }
    if (!Array.isArray(dados)) return { tipo: 'erro', motivo: 'formato' };
    const maisNova = escolherMaisNova(dados);
    if (!maisNova) return { tipo: 'erro', motivo: 'sem_versoes' };
    if (compararVersoes(lerVersao(maisNova.versao)!, atual) > 0) {
      return { tipo: 'nova', versao: maisNova.versao, url: maisNova.url };
    }
    return { tipo: 'atual', instalada };
  } finally {
    clearTimeout(relogio);
  }
}

export const MENSAGEM_ERRO_ATUALIZACAO: Record<MotivoErro, string> = {
  rede: 'Não consegui conversar com o GitHub agora. Confira a internet e tente de novo.',
  limite: 'O GitHub pediu uma pausa nas consultas. Tente de novo daqui a um tempinho.',
  http: 'O GitHub não respondeu como esperado. Tente de novo mais tarde.',
  formato: 'Recebi uma resposta que não consegui entender. Tente de novo mais tarde.',
  sem_versoes: 'Ainda não há versões publicadas para comparar.',
};
