import { estadoDoDia, normalizarRelatoHabito } from './contador';
import type { Habito, Relato } from './tipos';

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

export type Economia = { centavos: number; unidades: number };

/**
 * Quanto a pessoa deixou de gastar, contado a partir dos relatos (mesmo recorte do `resumoHabito`:
 * do início até hoje, só os dias com relato do hábito).
 * - parar: cada dia livre economiza o consumo habitual (`unidadesPorDia`) e o custo do dia.
 * - reduzir: dia livre economiza o consumo habitual; dia dentro da meta, só a diferença entre o
 *   habitual e o que foi usado (nunca negativa); deslize não economiza. Sem `unidadesPorDia` não
 *   há base para a conta e o resultado é `null` ("sem dado").
 * O dinheiro é proporcional às unidades economizadas, arredondado ao centavo.
 */
export function economia(h: Habito, relatos: Relato[], hoje: string): Economia | null {
  const porDia = h.unidadesPorDia;
  const reduzir = h.meta.tipo === 'reduzir';
  if (reduzir && !porDia) return null;

  let livres = 0;
  let unidadesReduzir = 0;
  for (const relato of relatos) {
    if (relato.dia < h.inicio || relato.dia > hoje) continue;
    const entrada = relato.habitos.find((x) => x.habitoId === h.id);
    if (!entrada) continue;
    const normalizada = normalizarRelatoHabito(entrada);
    const estado = estadoDoDia(h.meta, normalizada);
    if (estado === 'livre') {
      livres += 1;
      unidadesReduzir += porDia ?? 0;
    } else if (estado === 'dentroDaMeta') {
      unidadesReduzir += Math.max(0, (porDia ?? 0) - (normalizada.quantidade ?? 0));
    }
  }

  const custo = h.custoPorDiaCentavos ?? 0;
  if (!reduzir) return { centavos: custo * livres, unidades: (porDia ?? 0) * livres };
  return { centavos: Math.round((custo * unidadesReduzir) / (porDia as number)), unidades: unidadesReduzir };
}
