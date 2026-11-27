/**
 * "Antes da onda": descobre, pelo diário, o dia da semana em que a vontade costuma ser maior e um
 * horário de referência, e sugere avisar 30 minutos antes. Lógica pura (sem Expo/React Native).
 *
 * Regra (a "regra exata" deixada para o construtor na spec, seção 12):
 *
 * 1. Janela: os relatos do hábito nas últimas 8 semanas (56 dias, até hoje).
 * 2. Dados suficientes: pelo menos 14 relatos em pelo menos 3 semanas diferentes. Antes disso,
 *    nada é sugerido ("precisa de mais relatos para aprender seu horário").
 * 3. Dia de pico: a maior média de vontade por dia da semana, só entre dias com pelo menos 2
 *    relatos. O pico precisa ser relevante: média >= 4 e pelo menos 1,5 ponto acima da média dos
 *    relatos dos outros dias. Senão, "nenhum horário se destaca" e nada é sugerido.
 *    Empate (até 0,25 de diferença): vence o dia com mais relatos; persistindo, o mais cedo na semana.
 * 4. Horário da onda, no dia de pico (média circular, então 23:50 e 00:10 dão meia-noite):
 *    a) preferido: a hora em que a pessoa abriu a Fissura nesse dia da semana (pelo menos 3
 *       passagens);
 *    b) aproximação: a hora em que salvou o relato desse dia da semana, só os relatos salvos no
 *       próprio dia (pelo menos 2). Quem só registra dias passados não gera horário.
 *    Horários muito espalhados (concentração < 0,5) não formam padrão: nada é sugerido.
 *    O horário é arredondado a 5 minutos.
 * 5. O aviso sai 30 minutos antes; passando da meia-noite, vai para o dia anterior.
 */
import { normalizarRelatoHabito } from '../contador';
import { DIA_MS, dataLocal, deslocarDia, meioDia } from '../datas';
import type { Fissura, Relato } from '../tipos';
import { horarioDeMinutos, MIN_DIA } from './horario';

export const SEMANAS_ANALISE = 8;
export const MIN_RELATOS = 14;
export const MIN_SEMANAS = 3;
export const MIN_RELATOS_POR_DIA = 2;
export const MIN_VONTADE_PICO = 4;
export const MARGEM_PICO = 1.5;
export const TOLERANCIA_EMPATE = 0.25;
export const MIN_FISSURAS = 3;
export const MIN_SALVOS = 2;
export const MIN_CONCENTRACAO = 0.5;
export const ANTECEDENCIA_MIN = 30;

export type SugestaoOnda = {
  status: 'ok';
  /** Dia da semana da onda, 0 = domingo. */
  diaSemana: number;
  /** Minutos do dia (0 a 1439) do horário de referência da onda. */
  minutos: number;
  /** Dia da semana e minutos do dia do aviso (30 min antes; pode cair no dia anterior). */
  avisoDiaSemana: number;
  avisoMinutos: number;
  origemHorario: 'fissuras' | 'relatos';
  vontadePico: number;
  vontadeOutros: number;
  relatos: number;
};

export type SemSugestaoOnda = {
  /** `poucosDados`: ainda não dá para aprender; `semPico`: há dados, mas nenhum dia se destaca. */
  status: 'poucosDados' | 'semPico';
};

export type ResultadoOnda = SugestaoOnda | SemSugestaoOnda;

const NOMES_DIA_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'] as const;

export const nomeDiaSemana = (i: number) => NOMES_DIA_SEMANA[((i % 7) + 7) % 7];

/** Média circular de minutos do dia; `concentracao` vai de 0 (espalhado) a 1 (todos iguais). */
export function mediaCircular(minutos: number[]): { minutos: number; concentracao: number } | null {
  if (minutos.length === 0) return null;
  let s = 0;
  let c = 0;
  for (const m of minutos) {
    const ang = (2 * Math.PI * m) / MIN_DIA;
    s += Math.sin(ang);
    c += Math.cos(ang);
  }
  const concentracao = Math.hypot(s, c) / minutos.length;
  const bruto = (((Math.atan2(s, c) / (2 * Math.PI)) * MIN_DIA) + MIN_DIA) % MIN_DIA;
  return { minutos: (Math.round(bruto / 5) * 5) % MIN_DIA, concentracao };
}

const minutosDoDia = (t: number) => {
  const d = new Date(t);
  return d.getHours() * 60 + d.getMinutes();
};

const diaDaSemana = (dia: string) => meioDia(dia).getDay();

const diasEntre = (a: string, b: string) => Math.round((meioDia(b).getTime() - meioDia(a).getTime()) / DIA_MS);

/** Horário da onda no dia de pico, ou `null` se não há padrão. */
function horarioDaOnda(
  diaSemana: number,
  fissuras: Fissura[],
  habitoId: string,
  inicio: string,
  hoje: string,
  salvos: number[],
): { minutos: number; origem: 'fissuras' | 'relatos' } | null {
  const daFissura = fissuras
    .filter((f) => f.habitoId === undefined || f.habitoId === habitoId)
    .filter((f) => {
      const d = dataLocal(f.inicio);
      return d >= inicio && d <= hoje && diaDaSemana(d) === diaSemana;
    })
    .map((f) => minutosDoDia(f.inicio));
  const origem = daFissura.length >= MIN_FISSURAS ? 'fissuras' : salvos.length >= MIN_SALVOS ? 'relatos' : null;
  if (!origem) return null;
  const media = mediaCircular(origem === 'fissuras' ? daFissura : salvos);
  if (!media || media.concentracao < MIN_CONCENTRACAO) return null;
  return { minutos: media.minutos, origem };
}

export function calcularAntesDaOnda(
  relatos: Relato[],
  fissuras: Fissura[],
  habitoId: string,
  hoje: string,
): ResultadoOnda {
  const inicio = deslocarDia(hoje, -(SEMANAS_ANALISE * 7 - 1));
  type Amostra = { semana: number; diaSemana: number; vontade: number; salvoNoDia: number | null };
  const amostras: Amostra[] = [];
  for (const r of relatos) {
    if (r.dia < inicio || r.dia > hoje) continue;
    const h = r.habitos.find((x) => x.habitoId === habitoId);
    if (!h) continue;
    amostras.push({
      semana: Math.floor(diasEntre(inicio, r.dia) / 7),
      diaSemana: diaDaSemana(r.dia),
      vontade: normalizarRelatoHabito(h).vontade,
      salvoNoDia: dataLocal(r.salvoEm) === r.dia ? minutosDoDia(r.salvoEm) : null,
    });
  }
  if (amostras.length < MIN_RELATOS || new Set(amostras.map((a) => a.semana)).size < MIN_SEMANAS) {
    return { status: 'poucosDados' };
  }

  const dias = Array.from({ length: 7 }, (_, i) => {
    const doDia = amostras.filter((a) => a.diaSemana === i);
    const soma = doDia.reduce((t, a) => t + a.vontade, 0);
    return { diaSemana: i, n: doDia.length, media: doDia.length ? soma / doDia.length : 0 };
  }).filter((d) => d.n >= MIN_RELATOS_POR_DIA);
  if (dias.length === 0) return { status: 'semPico' };

  const maior = Math.max(...dias.map((d) => d.media));
  const pico = dias
    .filter((d) => d.media >= maior - TOLERANCIA_EMPATE)
    .sort((a, b) => b.n - a.n || a.diaSemana - b.diaSemana)[0];

  const outros = amostras.filter((a) => a.diaSemana !== pico.diaSemana);
  if (outros.length === 0) return { status: 'semPico' };
  const vontadeOutros = outros.reduce((t, a) => t + a.vontade, 0) / outros.length;
  if (pico.media < MIN_VONTADE_PICO || pico.media - vontadeOutros < MARGEM_PICO) return { status: 'semPico' };

  const salvos = amostras
    .filter((a) => a.diaSemana === pico.diaSemana && a.salvoNoDia !== null)
    .map((a) => a.salvoNoDia as number);
  const horario = horarioDaOnda(pico.diaSemana, fissuras, habitoId, inicio, hoje, salvos);
  if (!horario) return { status: 'poucosDados' };

  let avisoMinutos = horario.minutos - ANTECEDENCIA_MIN;
  let avisoDiaSemana = pico.diaSemana;
  if (avisoMinutos < 0) {
    avisoMinutos += MIN_DIA;
    avisoDiaSemana = (pico.diaSemana + 6) % 7;
  }
  return {
    status: 'ok',
    diaSemana: pico.diaSemana,
    minutos: horario.minutos,
    avisoDiaSemana,
    avisoMinutos,
    origemHorario: horario.origem,
    vontadePico: pico.media,
    vontadeOutros,
    relatos: amostras.length,
  };
}

/** "sexta 21:30 · aprendido do seu diário": o dia e a hora do AVISO. */
export function textoSugestao(s: SugestaoOnda): string {
  return `${nomeDiaSemana(s.avisoDiaSemana)} ${horarioDeMinutos(s.avisoMinutos)} · aprendido do seu diário`;
}

export const TEXTO_POUCOS_DADOS = 'precisa de mais relatos para aprender seu horário';
export const TEXTO_SEM_PICO = 'ainda não apareceu um horário que se destaque no seu diário';
