/** Lógica pura da "Fissura agora": tempos, contagem, sorteio do porquê e registro da passagem. */
import type { Fissura, Porque } from './tipos';

/** Respiração guiada: 4 s para dentro, 6 s para fora, 6 ciclos (1 minuto). */
export const INSPIRA_MS = 4000;
export const EXPIRA_MS = 6000;
export const CICLOS = 6;

/** A onda da fissura costuma passar em 3 a 5 minutos: o passo 2 conta 3 minutos. */
export const ONDA_SEG = 180;

/** Segundos -> "2:41" (nunca negativo). */
export function formatarContagem(seg: number): string {
  const s = Math.max(0, Math.round(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Duração no chip do passo 3: "6 min" (arredondado, no mínimo 1). */
export function duracaoTexto(seg: number): string {
  return `${Math.max(1, Math.round(seg / 60))} min`;
}

/** Um porquê entre os da pessoa; `undefined` se ela ainda não escreveu nenhum. */
export function sortearPorque(porques: Porque[], aleatorio: () => number = Math.random): Porque | undefined {
  if (porques.length === 0) return undefined;
  const i = Math.min(porques.length - 1, Math.floor(aleatorio() * porques.length));
  return porques[i];
}

/**
 * Fissuras vencidas. Com `habitoId`, conta as desse hábito e as que não foram ligadas a nenhum
 * (a pessoa não escolheu qual hábito).
 */
export function contarFissurasVencidas(fissuras: Fissura[], habitoId?: string): number {
  return fissuras.filter((f) => f.venceu && (!habitoId || !f.habitoId || f.habitoId === habitoId)).length;
}

type Entrada = {
  id: string;
  /** Início da passagem, em ms. */
  inicio: number;
  /** Agora, em ms. */
  agora: number;
  venceu: boolean;
  habitoId?: string;
  vontadeAntes?: number;
  vontadeDepois?: number;
  ajudou?: string;
};

const limitarVontade = (v: number | undefined) =>
  v === undefined || !Number.isFinite(v) ? undefined : Math.min(10, Math.max(0, Math.round(v)));

/** Monta o registro da passagem (vontade entre 0 e 10, texto sem espaços sobrando). */
export function montarFissura({ id, inicio, agora, venceu, habitoId, vontadeAntes, vontadeDepois, ajudou }: Entrada): Fissura {
  const f: Fissura = { id, inicio, duracaoSeg: Math.max(0, Math.round((agora - inicio) / 1000)), venceu };
  if (habitoId) f.habitoId = habitoId;
  const antes = limitarVontade(vontadeAntes);
  const depois = limitarVontade(vontadeDepois);
  if (antes !== undefined) f.vontadeAntes = antes;
  if (depois !== undefined) f.vontadeDepois = depois;
  const texto = ajudou?.trim();
  if (texto) f.ajudou = texto;
  return f;
}

/**
 * Fechar a tela sem ter vencido só vira registro se a pessoa ficou um pouco (passou do primeiro
 * passo ou passou de 20 s): abrir e fechar sem querer não suja o histórico.
 */
export function deveRegistrarAoFechar(passo: 1 | 2 | 3, duracaoSeg: number): boolean {
  return passo >= 2 || duracaoSeg >= 20;
}
