/** Lógica pura da "Fissura agora": tempos, contagem, sorteio do porquê e registro da passagem. */
import { limparGatilhosFissura } from './gatilhos';
import type { Fissura, Porque } from './tipos';

/** Respiração guiada: 4 s para dentro, 6 s para fora, 6 ciclos (1 minuto). */
export const INSPIRA_MS = 4000;
export const EXPIRA_MS = 6000;
export const CICLOS = 6;

/**
 * Âncora do passo 2: enquanto o dedo segura, a vibração marca o mesmo ritmo da respiração
 * (4 s para dentro, 6 s para fora), contado desde o toque.
 */
export function faseAncora(msSegurando: number): 'inspire' | 'solte' {
  const ciclo = INSPIRA_MS + EXPIRA_MS;
  const t = ((Math.max(0, msSegurando) % ciclo) + ciclo) % ciclo;
  return t < INSPIRA_MS ? 'inspire' : 'solte';
}

/** A onda da fissura costuma passar em 3 a 5 minutos: o passo 2 conta 3 minutos. */
export const ONDA_SEG = 180;

/** "Esperar 10 minutos": contagem opcional, à parte dos 3 minutos do passo 2. */
export const ESPERA_SEG = 600;

/** Segundos que faltam para `fim` (ms), arredondados para cima; calculado pelo relógio, nunca por ticks. */
export function segundosRestantes(fim: number, agora: number): number {
  return Math.max(0, Math.ceil((fim - agora) / 1000));
}

/** Segundos -> "7 minutos e 12 segundos" (para leitor de tela; singular e sem parte zerada). */
export function falarTempo(seg: number): string {
  const s = Math.max(0, Math.round(seg));
  const m = Math.floor(s / 60);
  const r = s % 60;
  const min = `${m} ${m === 1 ? 'minuto' : 'minutos'}`;
  const sec = `${r} ${r === 1 ? 'segundo' : 'segundos'}`;
  if (m === 0) return sec;
  return r === 0 ? min : `${min} e ${sec}`;
}

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
  /** Ids de `GATILHOS_FISSURA` marcados no fim da onda. */
  gatilhos?: string[];
};

const limitarVontade = (v: number | undefined) =>
  v === undefined || !Number.isFinite(v) ? undefined : Math.min(10, Math.max(0, Math.round(v)));

/** Monta o registro da passagem (vontade entre 0 e 10, texto sem espaços sobrando, só gatilhos conhecidos). */
export function montarFissura({ id, inicio, agora, venceu, habitoId, vontadeAntes, vontadeDepois, ajudou, gatilhos }: Entrada): Fissura {
  const f: Fissura = { id, inicio, duracaoSeg: Math.max(0, Math.round((agora - inicio) / 1000)), venceu };
  if (habitoId) f.habitoId = habitoId;
  const antes = limitarVontade(vontadeAntes);
  const depois = limitarVontade(vontadeDepois);
  if (antes !== undefined) f.vontadeAntes = antes;
  if (depois !== undefined) f.vontadeDepois = depois;
  const texto = ajudou?.trim();
  if (texto) f.ajudou = texto;
  const tags = limparGatilhosFissura(gatilhos);
  if (tags.length > 0) f.gatilhos = tags;
  return f;
}

/**
 * Fechar a tela sem ter vencido só vira registro se a pessoa ficou um pouco (passou do primeiro
 * passo ou passou de 20 s): abrir e fechar sem querer não suja o histórico.
 */
export function deveRegistrarAoFechar(passo: 1 | 2 | 3, duracaoSeg: number): boolean {
  return passo >= 2 || duracaoSeg >= 20;
}

export type PassoAterramento = {
  total: number;
  sentido: string;
  instrucao: string;
};

/** Aterramento 5-4-3-2-1: cinco sentidos, quinze toques sem pressa. */
export const PASSOS_ATERRAMENTO: readonly PassoAterramento[] = [
  { total: 5, sentido: '5 coisas que você vê ao redor', instrucao: 'Olhe com calma e toque uma vez para cada coisa.' },
  { total: 4, sentido: '4 coisas que sente no tato', instrucao: 'O pé no chão, o tecido da roupa, o celular na mão.' },
  { total: 3, sentido: '3 sons que você ouve agora', instrucao: 'Mesmo sons baixos, de perto ou de longe.' },
  { total: 2, sentido: '2 cheiros ou o ar que entra', instrucao: 'Perceba o ar entrando e saindo sem pressa.' },
  { total: 1, sentido: '1 coisa boa que sente agora', instrucao: 'Um último toque para fechar no seu ritmo.' },
];

/** Avança um toque no aterramento 5-4-3-2-1, até concluir todos os passos. */
export function proximoPassoAterramento(
  indice: number,
  toques: number,
): { indice: number; toques: number; mudouPasso: boolean; concluido: boolean } {
  const atual = PASSOS_ATERRAMENTO[indice];
  if (!atual) return { indice: PASSOS_ATERRAMENTO.length - 1, toques: 0, mudouPasso: false, concluido: true };
  const proximo = toques + 1;
  if (proximo < atual.total) return { indice, toques: proximo, mudouPasso: false, concluido: false };
  if (indice + 1 >= PASSOS_ATERRAMENTO.length) {
    return { indice, toques: atual.total, mudouPasso: false, concluido: true };
  }
  return { indice: indice + 1, toques: 0, mudouPasso: true, concluido: false };
}

/** Velocidade ideal de deslize lento na água (dp/s), inspirada no movimento contínuo do PAUSE. */
const DESLIZE_DURACAO_MS = 35_000;
const VELOCIDADE_MIN = 8;
const VELOCIDADE_IDEAL_MAX = 190;
const VELOCIDADE_RAPIDA = 260;

/**
 * Calcula o ganho de calma (0..1) ao mover o dedo sobre a água:
 * - movimento lento e contínuo enche o círculo em ~35 s;
 * - rápido demais não pune, só recua um pouco e pede mais calma.
 */
export function avancoDeslize(distanciaDp: number, dtMs: number): { delta: number; rapido: boolean } {
  if (!Number.isFinite(distanciaDp) || !Number.isFinite(dtMs) || distanciaDp <= 0 || dtMs <= 0) {
    return { delta: 0, rapido: false };
  }
  const dt = Math.min(120, Math.max(16, dtMs));
  const velocidade = (distanciaDp * 1000) / Math.max(16, dtMs);
  if (velocidade < VELOCIDADE_MIN) return { delta: 0, rapido: false };
  if (velocidade > VELOCIDADE_RAPIDA) return { delta: -0.015, rapido: true };
  const fator = velocidade <= VELOCIDADE_IDEAL_MAX ? 1 : 0.45;
  return { delta: (dt / DESLIZE_DURACAO_MS) * fator, rapido: false };
}
