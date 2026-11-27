/**
 * Lembrete de marcos: avisa de manhã (09:00) no dia em que o próximo marco do hábito seria
 * atingido se a pessoa continuar no mesmo ritmo. Lógica pura.
 *
 * Conta: `faltam` = dias que faltam para o próximo marco, pela sequência atual. O dia-base é hoje,
 * se o relato de hoje já foi feito (a sequência já o inclui), ou ontem, se ainda não (hoje ainda
 * pode contar). O marco cai em dia-base + faltam. O aviso é de manhã e diz só "hoje é um dia para
 * notar": o marco de fato fecha quando o relato do dia é feito, à noite.
 */
import { resumoHabito } from '../contador';
import { deslocarDia } from '../datas';
import { proximoMarco } from '../marcos';
import type { Habito, Relato } from '../tipos';
import { instanteDoDia } from './horario';

export const HORA_MARCO = { hora: 9, minuto: 0 } as const;

export type AvisoMarco = {
  /** Dias do marco (1, 3, 7...). */
  dias: number;
  /** Dia do aviso, "AAAA-MM-DD". */
  dia: string;
  /** Instante do aviso (09:00 desse dia, no fuso do aparelho). */
  em: number;
};

/** O próximo aviso de marco, ou `null` se não há (todos os marcos passaram, ou a hora já passou). */
export function proximoAvisoMarco(habito: Habito, relatos: Relato[], hoje: string, agora: number): AvisoMarco | null {
  const resumo = resumoHabito(habito, relatos, hoje);
  const proximo = proximoMarco(resumo.sequenciaAtual);
  if (!proximo) return null;
  const base = resumo.hojeRespondido ? hoje : deslocarDia(hoje, -1);
  const dia = deslocarDia(base, proximo.faltam);
  const em = instanteDoDia(dia, HORA_MARCO.hora, HORA_MARCO.minuto);
  if (em <= agora) return null;
  return { dias: proximo.dias, dia, em };
}
