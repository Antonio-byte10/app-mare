import { deslocarDia } from './datas';
import type { EstadoDia, Habito, Meta, Relato, RelatoHabito } from './tipos';

export type ResumoHabito = {
  sequenciaAtual: number;
  totalLivres: number;
  recorde: number;
  /** Dias sem relato nos últimos 7 dias (sem hoje), do mais antigo ao mais recente. */
  pendentes: string[];
  hojeRespondido: boolean;
  estados: Record<string, EstadoDia>;
  /** Percentual de dias livres/dentro da meta nos últimos 30 dias; null com menos de 7 relatos. */
  percentual30d: number | null;
};

const DIAS_PENDENTES = 7;
const DIAS_PERCENTUAL = 30;
const MIN_RELATOS_PERCENTUAL = 7;

/** Estado de um dia para uma meta: nunca "falha", só livre, dentro da meta ou deslize. */
export function estadoDoDia(meta: Meta, r: RelatoHabito): EstadoDia {
  if (!r.usou) return 'livre';
  if (meta.tipo === 'parar') return 'deslize';
  if (r.quantidade === undefined) return 'deslize';
  return r.quantidade <= meta.maxPorDia ? 'dentroDaMeta' : 'deslize';
}

/** Vontade inteira de 0 a 10 (NaN vira 0); quantidade nunca negativa. */
export function normalizarRelatoHabito(r: RelatoHabito): RelatoHabito {
  const vontade = Number.isFinite(r.vontade) ? Math.min(10, Math.max(0, Math.round(r.vontade))) : 0;
  const normalizado: RelatoHabito = { ...r, vontade };
  if (r.quantidade !== undefined) {
    normalizado.quantidade = Number.isFinite(r.quantidade) ? Math.max(0, r.quantidade) : 0;
  }
  return normalizado;
}

export function resumoHabito(h: Habito, relatos: Relato[], hoje: string): ResumoHabito {
  const estados: Record<string, EstadoDia> = {};
  for (const relato of relatos) {
    if (relato.dia < h.inicio || relato.dia > hoje) continue;
    const entrada = relato.habitos.find((x) => x.habitoId === h.id);
    if (!entrada) continue;
    estados[relato.dia] = estadoDoDia(h.meta, normalizarRelatoHabito(entrada));
  }

  let sequenciaAtual = 0;
  let totalLivres = 0;
  let recorde = 0;
  for (let d = h.inicio; d <= hoje; d = deslocarDia(d, 1)) {
    const estado = estados[d];
    if (!estado) continue;
    if (estado === 'deslize') {
      sequenciaAtual = 0;
    } else {
      sequenciaAtual += 1;
      totalLivres += 1;
      if (sequenciaAtual > recorde) recorde = sequenciaAtual;
    }
  }

  const pendentes: string[] = [];
  const primeiroPendente = deslocarDia(hoje, -DIAS_PENDENTES);
  for (let d = h.inicio > primeiroPendente ? h.inicio : primeiroPendente; d < hoje; d = deslocarDia(d, 1)) {
    if (!estados[d]) pendentes.push(d);
  }

  const inicioJanela = deslocarDia(hoje, -(DIAS_PERCENTUAL - 1));
  const naJanela = Object.entries(estados).filter(([d]) => d >= inicioJanela);
  const percentual30d =
    naJanela.length < MIN_RELATOS_PERCENTUAL
      ? null
      : Math.round((naJanela.filter(([, e]) => e !== 'deslize').length / naJanela.length) * 100);

  return {
    sequenciaAtual,
    totalLivres,
    recorde,
    pendentes,
    hojeRespondido: estados[hoje] !== undefined,
    estados,
    percentual30d,
  };
}
