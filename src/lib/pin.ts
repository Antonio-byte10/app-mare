/**
 * PIN do bloqueio: só o hash com sal é guardado (no cofre do aparelho), nunca o PIN. Lógica pura;
 * o acesso ao cofre fica em `cofrePin.ts`.
 *
 * Hash: PBKDF2-HMAC-SHA256 com 100 mil iterações e sal de 16 bytes. Um PIN de 4 a 6 dígitos tem
 * poucas combinações, então o custo do hash só encarece um ataque se o cofre for copiado; a defesa
 * de verdade é a espera crescente entre tentativas e o cofre do próprio Android. As iterações vão
 * junto no registro, para poder aumentar depois sem invalidar PINs já criados.
 */
import { pbkdf2Async } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { deBase64, iguaisConstante, paraBase64 } from './bytes';

export const PIN_MIN = 4;
export const PIN_MAX = 6;
export const ITERACOES_PIN = 100_000;
const TAMANHO_SAL = 16;
const TAMANHO_HASH = 32;

export const pinValido = (pin: string) => new RegExp(`^\\d{${PIN_MIN},${PIN_MAX}}$`).test(pin);

export interface RegistroPin {
  v: 1;
  /** Iterações do PBKDF2 usadas neste registro. */
  iter: number;
  /** Sal em Base64. */
  sal: string;
  /** Hash em Base64. */
  hash: string;
  /** Quantos dígitos tem o PIN (a tela de bloqueio confere sozinha ao chegar nesse número). */
  tamanho: number;
  /** Erros seguidos desde o último acerto. */
  falhas: number;
  /** Instante (ms) até o qual novas tentativas são recusadas; 0 = sem espera. */
  bloqueadoAte: number;
}

export type Aleatorio = (n: number) => Uint8Array;

const derivar = (pin: string, sal: Uint8Array, iter: number) =>
  pbkdf2Async(sha256, pin, sal, { c: iter, dkLen: TAMANHO_HASH });

/** Cria o registro de um PIN novo. Lança se o PIN não tiver de 4 a 6 dígitos. */
export async function criarRegistroPin(pin: string, aleatorio: Aleatorio, iter = ITERACOES_PIN): Promise<RegistroPin> {
  if (!pinValido(pin)) throw new Error('PIN inválido.');
  const sal = aleatorio(TAMANHO_SAL);
  const hash = await derivar(pin, sal, iter);
  return { v: 1, iter, sal: paraBase64(sal), hash: paraBase64(hash), tamanho: pin.length, falhas: 0, bloqueadoAte: 0 };
}

/** Confere o PIN com o hash guardado, em tempo constante. Não mexe no contador de erros. */
export async function conferirPin(pin: string, r: RegistroPin): Promise<boolean> {
  const sal = deBase64(r.sal);
  const esperado = deBase64(r.hash);
  if (!sal || !esperado || !pinValido(pin)) return false;
  return iguaisConstante(await derivar(pin, sal, r.iter), esperado);
}

/** Lê o registro guardado; `null` se não existir ou estiver fora do formato. */
export function lerRegistroPin(bruto: string | null): RegistroPin | null {
  if (!bruto) return null;
  try {
    const r: unknown = JSON.parse(bruto);
    if (typeof r !== 'object' || r === null) return null;
    const o = r as Record<string, unknown>;
    const inteiro = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
    const sal = typeof o.sal === 'string' ? deBase64(o.sal) : null;
    const hash = typeof o.hash === 'string' ? deBase64(o.hash) : null;
    if (o.v !== 1 || !inteiro(o.iter, 1, 10_000_000) || sal?.length !== TAMANHO_SAL || hash?.length !== TAMANHO_HASH) return null;
    if (!inteiro(o.tamanho, PIN_MIN, PIN_MAX) || !inteiro(o.falhas, 0, 1_000_000)) return null;
    if (typeof o.bloqueadoAte !== 'number' || !Number.isFinite(o.bloqueadoAte) || o.bloqueadoAte < 0) return null;
    return o as unknown as RegistroPin;
  } catch {
    return null;
  }
}

export const serializarRegistroPin = (r: RegistroPin) => JSON.stringify(r);

/** Erros seguidos que ainda passam sem espera. */
export const ERROS_LIVRES = 4;

/** Espera, em segundos, depois do erro de número `falhas`: 5º = 30 s, 6º = 1 min, 7º = 5 min, 8º em diante = 15 min. */
export function esperaDaFalha(falhas: number): number {
  if (falhas <= ERROS_LIVRES) return 0;
  if (falhas === ERROS_LIVRES + 1) return 30;
  if (falhas === ERROS_LIVRES + 2) return 60;
  if (falhas === ERROS_LIVRES + 3) return 300;
  return 900;
}

/** Quanto falta (ms) para poder tentar de novo. Se o relógio voltou, nunca passa da espera máxima daquela falha. */
export function restanteDaEspera(r: Pick<RegistroPin, 'falhas' | 'bloqueadoAte'>, agora: number): number {
  const teto = esperaDaFalha(r.falhas) * 1000;
  return Math.max(0, Math.min(r.bloqueadoAte - agora, teto));
}

export type ResultadoTentativa =
  | { resultado: 'ok'; registro: RegistroPin }
  | { resultado: 'errado'; registro: RegistroPin; restanteMs: number; tentativasLivres: number }
  | { resultado: 'espera'; registro: RegistroPin; restanteMs: number };

/**
 * Uma tentativa de PIN. Durante a espera nem confere (não dá para adivinhar à força); erro soma
 * ao contador e pode abrir uma espera; acerto zera tudo. Devolve o registro a guardar.
 */
export async function tentarPin(pin: string, r: RegistroPin, agora: number): Promise<ResultadoTentativa> {
  const restante = restanteDaEspera(r, agora);
  if (restante > 0) return { resultado: 'espera', registro: r, restanteMs: restante };
  if (await conferirPin(pin, r)) return { resultado: 'ok', registro: { ...r, falhas: 0, bloqueadoAte: 0 } };
  const falhas = r.falhas + 1;
  const espera = esperaDaFalha(falhas) * 1000;
  const registro = { ...r, falhas, bloqueadoAte: espera > 0 ? agora + espera : 0 };
  return { resultado: 'errado', registro, restanteMs: espera, tentativasLivres: Math.max(0, ERROS_LIVRES - falhas) };
}
