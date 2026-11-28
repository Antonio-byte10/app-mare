import { deslocarDia, meioDia } from './datas';
import { NOMES_DIAS } from './insights';
import type { EstadoDia, Relato } from './tipos';

/** Mês no formato "AAAA-MM". */
export type Mes = string;

const NOMES_MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

export type EstadoCelula =
  | EstadoDia
  | 'semRelato'
  | 'hoje'
  | 'futuro'
  | 'antes';

/** "2026-11-26" → "2026-11". */
export const mesDe = (dia: string): Mes => dia.slice(0, 7);

/** "2026-11" → "Novembro 2026". */
export function tituloMes(mes: Mes): string {
  const [ano, m] = mes.split('-').map(Number);
  return `${NOMES_MESES[m - 1]} ${ano}`;
}

/** Soma `delta` meses (pode ser negativo). */
export function deslocarMes(mes: Mes, delta: number): Mes {
  const [ano, m] = mes.split('-').map(Number);
  const indice = ano * 12 + (m - 1) + delta;
  const novoAno = Math.floor(indice / 12);
  return `${novoAno}-${String((indice % 12) + 1).padStart(2, '0')}`;
}

/** Último dia (1 a 31) do mês. */
function diasNoMes(mes: Mes): number {
  const [ano, m] = mes.split('-').map(Number);
  return new Date(ano, m, 0).getDate();
}

/**
 * Células do mês para uma grade que começa no domingo: `null` antes do dia 1
 * (para alinhar o dia da semana) e depois todos os dias "AAAA-MM-DD".
 */
export function gradeDoMes(mes: Mes): (string | null)[] {
  const primeiro = meioDia(`${mes}-01`).getDay();
  const dias: string[] = [];
  for (let d = 1; d <= diasNoMes(mes); d++) dias.push(`${mes}-${String(d).padStart(2, '0')}`);
  return [...new Array<null>(primeiro).fill(null), ...dias];
}

type Contexto = {
  estados: Record<string, EstadoDia>;
  /** Dia de início do hábito. */
  inicio: string;
  hoje: string;
};

/**
 * Como uma célula do calendário aparece. Depois do dia de hoje: `futuro`; antes do início: `antes`.
 * Com relato, vale o estado do relato (inclusive hoje); sem relato, hoje é `hoje` e
 * qualquer dia passado desde o início é `semRelato`.
 */
export function estadoCelula(dia: string, { estados, inicio, hoje }: Contexto): EstadoCelula {
  if (dia > hoje) return 'futuro';
  if (dia < inicio) return 'antes';
  const estado = estados[dia];
  if (estado) return estado;
  return dia === hoje ? 'hoje' : 'semRelato';
}

/** Dá para abrir o relato deste dia? Só do início até hoje. */
export const celulaTocavel = (estado: EstadoCelula) => estado !== 'futuro' && estado !== 'antes';

type Limites = { inicio: string; hoje: string };

/** Primeiro e último mês que o calendário mostra: do mês do início até o mês atual. */
function limitesDeMes({ inicio, hoje }: Limites): [Mes, Mes] {
  const ultimo = mesDe(hoje);
  const primeiro = mesDe(inicio);
  return [primeiro > ultimo ? ultimo : primeiro, ultimo];
}

/** Mantém o mês entre o mês do início do hábito e o mês atual. */
export function limitarMes(mes: Mes, limites: Limites): Mes {
  const [primeiro, ultimo] = limitesDeMes(limites);
  if (mes < primeiro) return primeiro;
  if (mes > ultimo) return ultimo;
  return mes;
}

/** Se a seta que anda `delta` mês(es) ainda leva a um mês válido. */
export const podeIrParaMes = (mes: Mes, delta: number, limites: Limites) =>
  limitarMes(deslocarMes(mes, delta), limites) === deslocarMes(mes, delta);

/** Quantos relatos do hábito caem na janela de `semanas` semanas até `hoje` (a mesma de `vontadePorDiaDaSemana`). */
export function totalRelatosNaJanela(relatos: Relato[], habitoId: string, hoje: string, semanas = 8): number {
  const inicio = deslocarDia(hoje, -(semanas * 7 - 1));
  return relatos.filter(
    (r) => r.dia >= inicio && r.dia <= hoje && r.habitos.some((h) => h.habitoId === habitoId),
  ).length;
}

/** Texto do dia mais difícil: "Suas vontades sobem às sextas." (aos domingos, aos sábados). */
export function textoPico(pico: number | null): { antes: string; destaque: string; depois: string } | null {
  if (pico === null) return null;
  const aos = pico === 0 || pico === 6;
  return { antes: `Suas vontades sobem ${aos ? 'aos' : 'às'} `, destaque: NOMES_DIAS[pico], depois: '.' };
}

/**
 * Direção do gesto horizontal no calendário:
 * arrastar o dedo para a esquerda (`dx < 0`) avança para o próximo mês (`+1`);
 * arrastar para a direita (`dx > 0`) volta ao mês anterior (`-1`).
 */
export function direcaoSwipeMes(dx: number, dy: number, vx: number): -1 | 0 | 1 {
  if (Math.abs(dx) <= Math.abs(dy) * 1.2) return 0;
  const passouDistancia = Math.abs(dx) > 45;
  const passouImpulso = Math.abs(dx) > 20 && Math.abs(vx) > 0.35;
  if (!passouDistancia && !passouImpulso) return 0;
  return dx < 0 ? 1 : -1;
}
