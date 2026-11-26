import type { Habito } from './tipos';

export const MARCOS: readonly number[] = [1, 3, 7, 14, 30, 90, 180, 365];

export type EstadoMarco = 'atingido' | 'atual' | 'jaAlcancado' | 'futuro';

export function proximoMarco(sequencia: number): { dias: number; faltam: number } | null {
  const dias = MARCOS.find((m) => m > sequencia);
  return dias === undefined ? null : { dias, faltam: dias - sequencia };
}

export function estadoMarco(dias: number, sequencia: number, recorde: number): EstadoMarco {
  if (sequencia >= dias) return 'atingido';
  if (proximoMarco(sequencia)?.dias === dias) return 'atual';
  if (recorde >= dias) return 'jaAlcancado';
  return 'futuro';
}

const NOMES: Record<number, string> = {
  1: '24 horas',
  3: '3 dias',
  7: '1 semana',
  14: '2 semanas',
  30: '1 mês',
  90: '3 meses',
  180: '6 meses',
  365: '1 ano',
};

export function nomeMarco(dias: number): string {
  return NOMES[dias] ?? `${dias} dias`;
}

export function economia(h: Habito, totalLivres: number): { centavos: number; unidades: number } {
  return {
    centavos: (h.custoPorDiaCentavos ?? 0) * totalLivres,
    unidades: (h.unidadesPorDia ?? 0) * totalLivres,
  };
}
