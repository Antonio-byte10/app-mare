/**
 * Gatilhos do app: UMA lista só, usada no relato do dia ("O que mexeu com você?"), no fim da onda
 * ("O que puxou a onda?") e em Recomeçar com cuidado. Também alimenta a contagem do cartão do Diário.
 */
import { dataLocal, deslocarDia } from './datas';
import type { Fissura, Halt, Relato } from './tipos';

/**
 * Gatilhos de um toque, na ordem em que aparecem. O `id` é o que fica guardado em `Fissura.gatilhos`;
 * o relato do dia e o Recomeçar guardam o `rotulo`. Nunca troque um id ou rótulo que já existiu: dados
 * antigos dependem deles (para um rótulo antigo que mudou, use `ROTULOS_ANTIGOS`).
 */
export const GATILHOS_CANONICOS = [
  { id: 'estresse', rotulo: 'Estresse' },
  { id: 'ansiedade', rotulo: 'Ansiedade' },
  { id: 'tedio', rotulo: 'Tédio' },
  { id: 'solidao', rotulo: 'Solidão' },
  { id: 'cansaco', rotulo: 'Cansaço' },
  { id: 'raiva', rotulo: 'Raiva' },
  { id: 'fome', rotulo: 'Fome' },
  { id: 'celular', rotulo: 'Celular/telas' },
  { id: 'festa', rotulo: 'Festa ou evento' },
  { id: 'discussao', rotulo: 'Discussão' },
  { id: 'lugar', rotulo: 'Um lugar' },
  { id: 'pessoas', rotulo: 'Pessoas' },
] as const;

/** Mesma lista, com o nome que a tela do fim da onda já usava. */
export const GATILHOS_FISSURA = GATILHOS_CANONICOS;

/** Rótulos que já foram oferecidos no relato e hoje contam como outro gatilho (texto normalizado -> id). */
const ROTULOS_ANTIGOS: Record<string, string> = {
  'celular a noite': 'celular',
};

export type IdGatilhoFissura = (typeof GATILHOS_FISSURA)[number]['id'];

const IDS: readonly string[] = GATILHOS_FISSURA.map((g) => g.id);

/** Minúsculas, sem acento e com espaços simples: "  Tédio " e "tedio" viram a mesma coisa. */
export function normalizarGatilho(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Só os ids conhecidos, sem repetir e na ordem da lista (descarta o que vier de um dado antigo ou estranho). */
export function limparGatilhosFissura(ids: readonly string[] | undefined): string[] {
  if (!ids) return [];
  return IDS.filter((id) => ids.includes(id));
}

// Texto normalizado (rótulo ou id) -> id, para casar o texto livre do relato com os gatilhos de um toque.
const PORTEXTO = new Map<string, string>([
  ...GATILHOS_FISSURA.flatMap((g) => [
    [normalizarGatilho(g.rotulo), g.id] as [string, string],
    [g.id, g.id] as [string, string],
  ]),
  ...Object.entries(ROTULOS_ANTIGOS),
]);

/** Id do gatilho conhecido para um texto (rótulo, id ou rótulo antigo, sem ligar para caixa e acento). */
export const idDoGatilho = (texto: string): string | undefined => PORTEXTO.get(normalizarGatilho(texto));

const ROTULO_DO_ID = new Map<string, string>(GATILHOS_FISSURA.map((g) => [g.id, g.rotulo]));

/**
 * Os rótulos da lista no lugar de textos antigos ("celular à noite" vira "Celular/telas"), sem repetir.
 * O texto livre que não é da lista fica como está.
 */
export function rotulosCanonicos(textos: readonly string[]): string[] {
  const saida: string[] = [];
  for (const t of textos) {
    const id = idDoGatilho(t);
    const r = id ? (ROTULO_DO_ID.get(id) ?? t) : t;
    if (!saida.includes(r)) saida.push(r);
  }
  return saida;
}

/** O antigo bloco "HALT" do Recomeçar (fome, raiva, solidão, cansaço) agora faz parte da lista única. */
const IDS_HALT: readonly Halt[] = ['fome', 'raiva', 'solidao', 'cansaco'];

/** Quais itens do HALT estão entre os gatilhos marcados (para guardar em `Recomeco.halt`). */
export const haltDosGatilhos = (gatilhos: readonly string[]): Halt[] => {
  const ids = gatilhos.map(idDoGatilho);
  return IDS_HALT.filter((h) => ids.includes(h));
};

/** Gatilhos de um recomeço antigo: o que estava no HALT vira um gatilho marcado também. */
export const gatilhosComHalt = (gatilhos: readonly string[], halt: readonly Halt[] = []): string[] =>
  rotulosCanonicos([...gatilhos, ...halt.map((h) => ROTULO_DO_ID.get(h) ?? h)]);

/** Rótulo de um id guardado; um id que não existe mais volta como veio (nunca quebra a tela). */
export const rotuloGatilho = (id: string): string => ROTULO_DO_ID.get(id) ?? id;

export type GatilhoContado = {
  /** Id do gatilho conhecido, ou o texto normalizado quando é um gatilho livre do relato. */
  chave: string;
  rotulo: string;
  total: number;
};

type Entrada = {
  fissuras: readonly Fissura[];
  relatos: readonly Relato[];
  /** Hoje, "AAAA-MM-DD". */
  hoje: string;
  /** Janela em dias, contando hoje. */
  dias?: number;
  /** Quantos mostrar. */
  limite?: number;
  /** Filtra fissuras e relatos pelo hábito (fissuras sem hábito contam para todos). */
  habitoId?: string;
};

/**
 * Os gatilhos que mais aparecem nos últimos `dias` dias (30 por padrão), somando os marcados no fim
 * de uma Fissura e os do relato do dia. Cada Fissura e cada relato conta no máximo uma vez por
 * gatilho. O texto livre do relato que bate com um gatilho de um toque (sem ligar para maiúsculas
 * e acentos) soma com ele; o resto é contado pelo próprio texto. Empate: ordem alfabética.
 */
export function contarGatilhos({ fissuras, relatos, hoje, dias = 30, limite = 3, habitoId }: Entrada): GatilhoContado[] {
  const primeiro = deslocarDia(hoje, -(dias - 1));
  const noPeriodo = (dia: string) => dia >= primeiro && dia <= hoje;
  const contagem = new Map<string, GatilhoContado>();

  const somar = (chave: string, rotulo: string) => {
    const atual = contagem.get(chave);
    if (atual) atual.total += 1;
    else contagem.set(chave, { chave, rotulo, total: 1 });
  };

  for (const f of fissuras) {
    if (habitoId && f.habitoId && f.habitoId !== habitoId) continue;
    if (!f.gatilhos?.length || !noPeriodo(dataLocal(f.inicio))) continue;
    for (const id of limparGatilhosFissura(f.gatilhos)) somar(id, rotuloGatilho(id));
  }

  for (const r of relatos) {
    if (habitoId && !r.habitos.some((x) => x.habitoId === habitoId)) continue;
    if (!r.gatilhos?.length || !noPeriodo(r.dia)) continue;
    const vistos = new Set<string>();
    for (const texto of r.gatilhos) {
      const norm = normalizarGatilho(texto);
      if (!norm) continue;
      const id = idDoGatilho(texto);
      const chave = id ?? norm;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      somar(chave, id ? rotuloGatilho(id) : texto.trim());
    }
  }

  return [...contagem.values()]
    .sort((a, b) => b.total - a.total || a.rotulo.localeCompare(b.rotulo, 'pt-BR'))
    .slice(0, Math.max(0, limite));
}
