import { normalizarRelatoHabito } from './contador';
import { deslocarDia, meioDia } from './datas';
import type { Relato } from './tipos';

export const NOMES_DIAS: readonly string[] = ['domingos', 'segundas', 'terças', 'quartas', 'quintas', 'sextas', 'sábados'];

/** Média da vontade por dia da semana (0 = domingo) nos últimos `semanas*7` dias até `hoje`; null sem dados. */
export function vontadePorDiaDaSemana(relatos: Relato[], habitoId: string, hoje: string, semanas = 8): (number | null)[] {
  const inicio = deslocarDia(hoje, -(semanas * 7 - 1));
  const somas = new Array<number>(7).fill(0);
  const contagens = new Array<number>(7).fill(0);
  for (const relato of relatos) {
    if (relato.dia < inicio || relato.dia > hoje) continue;
    const dia = meioDia(relato.dia).getDay();
    for (const h of relato.habitos) {
      if (h.habitoId !== habitoId) continue;
      somas[dia] += normalizarRelatoHabito(h).vontade;
      contagens[dia] += 1;
    }
  }
  return somas.map((s, i) => (contagens[i] > 0 ? s / contagens[i] : null));
}

/** Índice do dia com maior média; null com menos de 10 relatos ou sem dados. */
export function diaDePico(medias: (number | null)[], totalRelatos: number): number | null {
  if (totalRelatos < 10) return null;
  let melhor: number | null = null;
  medias.forEach((m, i) => {
    if (m !== null && (melhor === null || m > (medias[melhor] as number))) melhor = i;
  });
  return melhor;
}
