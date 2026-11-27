/**
 * Backup cifrado (spec 5.2). Lógica pura: gera e abre o conteúdo do arquivo `.mare`; ler e gravar
 * arquivos fica em `arquivos.ts`.
 *
 * Cifra: AES-256-GCM (@noble/ciphers) com nonce aleatório de 12 bytes. Chave: scrypt (@noble/hashes)
 * a partir da senha (normalizada em NFC) e de um sal de 16 bytes. Parâmetros: N = 2^15, r = 8, p = 1
 * (cerca de 32 MiB de memória). Ficam abaixo do mínimo mais forte que o OWASP sugere (N = 2^17)
 * porque o scrypt aqui roda em JavaScript no Hermes, onde N = 2^17 levaria dezenas de segundos;
 * a senha precisa ser longa (mínimo de 8 caracteres) para compensar. Os parâmetros vão no
 * cabeçalho do arquivo, então dá para aumentá-los depois sem quebrar backups antigos.
 *
 * Formato (JSON de texto, uma linha):
 *   { app: 'mare', formato: 1, criadoEm, kdf: { nome: 'scrypt', N, r, p, sal }, cifra: { nome: 'aes-256-gcm', nonce }, dados }
 * `sal`, `nonce` e `dados` em Base64. O cabeçalho inteiro entra como dado associado (AAD) do GCM:
 * trocar qualquer campo dele (parâmetros, data, nonce) faz a verificação falhar.
 *
 * O que vai cifrado: `{ versaoEstado, estado, fotos? }`. `fotos` é opcional (backups antigos não têm): as fotos dos
 * porquês, já reduzidas, em Base64 e indexadas pelo nome do arquivo (`Porque.foto`); entram só dentro da parte
 * cifrada e são cifradas de novo, com a chave do aparelho, ao restaurar (ver `fotos.ts`). Do estado saem as configurações que pertencem ao
 * aparelho (IA, bloqueio, disfarce, telas protegidas): a chave e o código da IA moram no cofre e o
 * PIN nunca sai dele, então restaurar essas opções deixaria o aparelho num estado incoerente.
 */
import { gcm } from '@noble/ciphers/aes.js';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { deBase64, deUtf8, paraBase64, paraUtf8 } from './bytes';
import { dataLocal } from './datas';
import { VERSAO_ESTADO, ehVersaoFutura, migrar, type EstadoPersistido } from './estado';
import { nomeFotoValido, removerFotosAusentes } from './fotosPuro';
import type { Aleatorio } from './pin';

export const FORMATO_BACKUP = 1;
export const SENHA_MIN = 8;
export const PARAMETROS_SCRYPT = { N: 2 ** 15, r: 8, p: 1 } as const;
/** Tamanho máximo aceito para um arquivo de backup (texto). */
export const MAX_CARACTERES_BACKUP = 40_000_000;

export interface ArquivoBackup {
  app: 'mare';
  formato: number;
  criadoEm: string;
  kdf: { nome: 'scrypt'; N: number; r: number; p: number; sal: string };
  cifra: { nome: 'aes-256-gcm'; nonce: string };
  dados: string;
}

export type MotivoFalha =
  /** Não é um backup do Maré, está cortado ou usa parâmetros que não aceitamos. */
  | 'formato'
  /** Feito por uma versão do app mais nova do que esta. */
  | 'versao_futura'
  /** Senha incorreta ou arquivo alterado (o GCM não distingue os dois). */
  | 'senha'
  /** Decifrou, mas o conteúdo está fora do formato. */
  | 'dados';

export interface ResumoBackup {
  habitos: number;
  relatos: number;
  /** Primeiro dia com dados ("AAAA-MM-DD"), se houver. */
  desde?: string;
  /** Quando o backup foi feito (ISO). */
  criadoEm: string;
}

/** Fotos dos porquês do backup: nome do arquivo (`Porque.foto`) -> JPEG em Base64. */
export type FotosBackup = Record<string, string>;

export type ResultadoAbrir =
  | { ok: true; estado: EstadoPersistido; resumo: ResumoBackup; fotos: FotosBackup }
  | { ok: false; motivo: MotivoFalha };

export const senhaValida = (senha: string) => senha.length >= SENHA_MIN;

/** Nome do arquivo: `mare-backup-AAAA-MM-DD.mare`. */
export const nomeDoBackup = (quando: Date | number = Date.now()) => `mare-backup-${dataLocal(quando)}.mare`;

/** O estado sem o que pertence ao aparelho (ver o cabeçalho deste arquivo). */
export function paraBackup(e: EstadoPersistido): EstadoPersistido {
  const { ia: _ia, bloqueio: _bloqueio, disfarce: _disfarce, protegerTela: _protegerTela, ...ajustes } = e.ajustes;
  return { ...e, ajustes };
}

/**
 * Estado a usar depois de restaurar: o do backup, mantendo as configurações do aparelho
 * (IA, bloqueio, disfarce, telas protegidas) como estão agora.
 */
export function aplicarRestauracao(atual: EstadoPersistido, restaurado: EstadoPersistido): EstadoPersistido {
  const { ia, bloqueio, disfarce, protegerTela } = atual.ajustes;
  const habitoAtivo = restaurado.habitos.some((h) => h.id === restaurado.ajustes.habitoAtivo)
    ? restaurado.ajustes.habitoAtivo
    : undefined;
  const ajustes = {
    ...restaurado.ajustes,
    habitoAtivo,
    // Quem tem hábitos não passa de novo pelo primeiro uso.
    onboardingConcluido: restaurado.ajustes.onboardingConcluido || restaurado.habitos.length > 0,
    ia,
    bloqueio,
    disfarce,
    protegerTela,
  };
  // Sem chaves `undefined`: o estado fica igual ao que viria do disco.
  const limpo = Object.fromEntries(Object.entries(ajustes).filter(([, v]) => v !== undefined)) as EstadoPersistido['ajustes'];
  return { ...restaurado, ajustes: limpo };
}

export function resumoDoBackup(e: EstadoPersistido, criadoEm: string): ResumoBackup {
  const dias = [...e.relatos.map((r) => r.dia), ...e.habitos.map((h) => h.inicio)].filter(
    (d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d),
  );
  const desde = dias.length > 0 ? dias.reduce((a, b) => (a < b ? a : b)) : undefined;
  return { habitos: e.habitos.length, relatos: e.relatos.length, ...(desde ? { desde } : {}), criadoEm };
}

/** Dado associado do GCM: tudo o que o cabeçalho diz, numa ordem fixa. */
function cabecalhoAutenticado(a: Omit<ArquivoBackup, 'dados'>): Uint8Array {
  const { kdf, cifra } = a;
  return paraUtf8(
    ['mare-backup', a.formato, a.criadoEm, kdf.nome, kdf.N, kdf.r, kdf.p, kdf.sal, cifra.nome, cifra.nonce].join('|'),
  );
}

const chaveDaSenha = (senha: string, p: { N: number; r: number; p: number }, sal: Uint8Array, aoProgresso?: (f: number) => void) =>
  scryptAsync(senha.normalize('NFC'), sal, {
    N: p.N,
    r: p.r,
    p: p.p,
    dkLen: 32,
    maxmem: 256 * 1024 * 1024,
    onProgress: aoProgresso,
  });

export interface OpcoesCriar {
  aleatorio: Aleatorio;
  agora?: Date;
  /** Só para testes: parâmetros mais leves. */
  parametros?: { N: number; r: number; p: number };
  /** Progresso da derivação da chave, de 0 a 1. */
  aoProgresso?: (fracao: number) => void;
  /** Fotos dos porquês (ver `empacotarFotos` em `fotos.ts`). Ausente ou vazio = backup sem fotos. */
  fotos?: FotosBackup;
}

/** Cifra o estado com a senha. Devolve o nome sugerido e o texto do arquivo. */
export async function criarBackup(
  estado: EstadoPersistido,
  senha: string,
  { aleatorio, agora = new Date(), parametros = PARAMETROS_SCRYPT, aoProgresso, fotos }: OpcoesCriar,
): Promise<{ nome: string; conteudo: string }> {
  if (!senhaValida(senha)) throw new Error('Senha curta demais.');
  const sal = aleatorio(16);
  const nonce = aleatorio(12);
  const cabecalho: Omit<ArquivoBackup, 'dados'> = {
    app: 'mare',
    formato: FORMATO_BACKUP,
    criadoEm: agora.toISOString(),
    kdf: { nome: 'scrypt', N: parametros.N, r: parametros.r, p: parametros.p, sal: paraBase64(sal) },
    cifra: { nome: 'aes-256-gcm', nonce: paraBase64(nonce) },
  };
  const chave = await chaveDaSenha(senha, parametros, sal, aoProgresso);
  const temFotos = fotos !== undefined && Object.keys(fotos).length > 0;
  const aberto = paraUtf8(JSON.stringify({ versaoEstado: VERSAO_ESTADO, estado: paraBackup(estado), ...(temFotos ? { fotos } : {}) }));
  const cifrado = gcm(chave, nonce, cabecalhoAutenticado(cabecalho)).encrypt(aberto);
  chave.fill(0);
  const arquivo: ArquivoBackup = { ...cabecalho, dados: paraBase64(cifrado) };
  return { nome: nomeDoBackup(agora), conteudo: JSON.stringify(arquivo) };
}

const ehObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** As fotos do conteúdo decifrado: só nomes válidos com Base64 válido; o resto é ignorado. */
function lerFotos(bruto: unknown): FotosBackup {
  const fotos: FotosBackup = {};
  if (!ehObjeto(bruto)) return fotos;
  for (const [nome, dados] of Object.entries(bruto)) {
    if (nomeFotoValido(nome) && typeof dados === 'string' && deBase64(dados) !== null) fotos[nome] = dados;
  }
  return fotos;
}
const potenciaDeDois = (n: number) => Number.isInteger(n) && n > 0 && (n & (n - 1)) === 0;

/** Lê e confere o cabeçalho. `null` se não for um backup do Maré que este app saiba abrir. */
function lerCabecalho(texto: string): { arquivo: ArquivoBackup; futuro: boolean } | null {
  if (texto.length > MAX_CARACTERES_BACKUP) return null;
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return null;
  }
  if (!ehObjeto(bruto) || bruto.app !== 'mare' || typeof bruto.formato !== 'number' || !Number.isInteger(bruto.formato)) return null;
  if (bruto.formato > FORMATO_BACKUP) return { arquivo: bruto as unknown as ArquivoBackup, futuro: true };
  const { kdf, cifra, criadoEm, dados } = bruto;
  if (bruto.formato < 1 || typeof criadoEm !== 'string' || typeof dados !== 'string' || !ehObjeto(kdf) || !ehObjeto(cifra)) return null;
  const { N, r, p, sal } = kdf;
  if (kdf.nome !== 'scrypt' || typeof N !== 'number' || typeof r !== 'number' || typeof p !== 'number' || typeof sal !== 'string') return null;
  // Limites contra um arquivo malicioso que peça memória ou tempo demais.
  if (!potenciaDeDois(N) || N < 2 ** 10 || N > 2 ** 17 || !Number.isInteger(r) || r < 1 || r > 8 || !Number.isInteger(p) || p < 1 || p > 4) return null;
  if (cifra.nome !== 'aes-256-gcm' || typeof cifra.nonce !== 'string') return null;
  if (deBase64(sal)?.length !== 16 || deBase64(cifra.nonce)?.length !== 12) return null;
  return { arquivo: bruto as unknown as ArquivoBackup, futuro: false };
}

/** Decifra e valida um backup. Nunca lança por causa do conteúdo: devolve o motivo da falha. */
export async function abrirBackup(
  texto: string,
  senha: string,
  aoProgresso?: (fracao: number) => void,
): Promise<ResultadoAbrir> {
  const lido = lerCabecalho(texto);
  if (!lido) return { ok: false, motivo: 'formato' };
  if (lido.futuro) return { ok: false, motivo: 'versao_futura' };
  const { dados, ...cabecalho } = lido.arquivo;
  const cifrado = deBase64(dados);
  if (!cifrado || cifrado.length < 16) return { ok: false, motivo: 'formato' };

  let aberto: Uint8Array;
  try {
    const chave = await chaveDaSenha(senha, cabecalho.kdf, deBase64(cabecalho.kdf.sal)!, aoProgresso);
    aberto = gcm(chave, deBase64(cabecalho.cifra.nonce)!, cabecalhoAutenticado(cabecalho)).decrypt(cifrado);
    chave.fill(0);
  } catch {
    return { ok: false, motivo: 'senha' };
  }

  const json = deUtf8(aberto);
  let conteudo: unknown;
  try {
    conteudo = json === null ? null : JSON.parse(json);
  } catch {
    return { ok: false, motivo: 'dados' };
  }
  if (!ehObjeto(conteudo) || typeof conteudo.versaoEstado !== 'number') return { ok: false, motivo: 'dados' };
  if (ehVersaoFutura(conteudo.versaoEstado)) return { ok: false, motivo: 'versao_futura' };
  const bruto = conteudo.estado;
  if (!ehObjeto(bruto) || !Array.isArray(bruto.habitos) || !Array.isArray(bruto.relatos)) return { ok: false, motivo: 'dados' };
  const migrado = migrar(bruto, conteudo.versaoEstado);
  if (!migrado) return { ok: false, motivo: 'dados' };
  // Porquê com foto que não veio no backup (ou com nome estranho) fica só com o texto.
  const fotos = lerFotos(conteudo.fotos);
  const estado = { ...migrado, porques: removerFotosAusentes(migrado.porques, new Set(Object.keys(fotos))) };
  return { ok: true, estado, resumo: resumoDoBackup(estado, cabecalho.criadoEm), fotos };
}

export const MENSAGEM_FALHA: Record<MotivoFalha, string> = {
  formato: 'Este arquivo não parece um backup do Maré, ou está incompleto.',
  versao_futura: 'Este backup foi feito por uma versão mais nova do Maré. Atualize o app para restaurá-lo.',
  senha: 'Senha incorreta, ou o arquivo foi alterado. Confira a senha e tente de novo.',
  dados: 'Consegui abrir o arquivo, mas o conteúdo está fora do formato esperado.',
};
