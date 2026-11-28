/**
 * Plano de lembretes: de ajustes + diário, a lista exata do que deve estar agendado. Lógica pura;
 * `agendador.ts` só aplica a lista no aparelho (cancela tudo e agenda de novo, então é idempotente).
 *
 * - Relato e "Bom dia": uma notificação por dia nos próximos 14 dias (a janela se renova toda vez
 *   que o app abre). Assim o relato de hoje, se já foi respondido, simplesmente não é agendado, e
 *   cada "Bom dia" tem a sua frase. Depois de 14 dias sem abrir o app, os avisos silenciam.
 * - "Antes da onda": semanal, no dia e hora aprendidos (`antesDaOnda.ts`).
 * - Marco: uma só, às 09:00 do dia previsto (`marcos.ts`).
 * - Reflexão da semana: semanal, no domingo, na hora escolhida (padrão 19:00); texto que não cita o hábito.
 * - Título de toda notificação: o nome do disfarce. O texto nunca cita o hábito.
 */
import { fraseDoDia, TEXTO_ANTES_DA_ONDA, TEXTO_MARCO, TEXTO_REFLEXAO, TEXTO_RELATO } from '../../conteudo/lembretes';
import { dataLocal, deslocarDia } from '../datas';
import type { AjustesLembretes, Fissura, Habito, Relato } from '../tipos';
import { calcularAntesDaOnda } from './antesDaOnda';
import { instanteDoDia, lerHorario } from './horario';
import { proximoAvisoMarco } from './marcos';
import { CATEGORIA_ONDA, ROTA_FISSURA, ROTA_INICIO, ROTA_MARCOS, ROTA_REFLEXAO, rotaRelato } from './toque';

export const DIAS_JANELA = 14;

export type TipoLembrete = 'relato' | 'bomDia' | 'antesDaOnda' | 'marco' | 'reflexao';

export type Quando =
  | { tipo: 'data'; em: number }
  /** `diaSemana` no padrão do Expo: 1 = domingo ... 7 = sábado. */
  | { tipo: 'semanal'; diaSemana: number; hora: number; minuto: number };

export type Notificacao = {
  id: string;
  tipo: TipoLembrete;
  titulo: string;
  corpo: string;
  quando: Quando;
  /** Rota aberta ao tocar. */
  rota: string;
  /** Categoria com botão rápido (ex.: "Abrir um respiro" em Antes da onda). */
  categoria?: string;
};

export type EntradaPlano = {
  agora: number;
  lembretes: AjustesLembretes;
  /** Nome do disfarce (título de toda notificação). */
  titulo: string;
  /** Hábito ativo; sem hábito não há relato, "antes da onda" nem marco. */
  habito: Habito | undefined;
  relatos: Relato[];
  fissuras: Fissura[];
};

export function planejarLembretes(e: EntradaPlano): Notificacao[] {
  const { agora, lembretes, titulo, habito, relatos, fissuras } = e;
  const hoje = dataLocal(agora);
  const lista: Notificacao[] = [];

  if (habito && lembretes.relato.ligado) {
    const { hora, minuto } = lerHorario(lembretes.relato.hora);
    const respondido = relatos.some((r) => r.dia === hoje);
    for (let i = 0; i < DIAS_JANELA; i++) {
      const dia = deslocarDia(hoje, i);
      const em = instanteDoDia(dia, hora, minuto);
      if (em <= agora || (i === 0 && respondido)) continue;
      lista.push({
        id: `relato-${dia}`,
        tipo: 'relato',
        titulo,
        corpo: TEXTO_RELATO,
        quando: { tipo: 'data', em },
        rota: rotaRelato(dia),
      });
    }
  }

  if (lembretes.bomDia.ligado) {
    const { hora, minuto } = lerHorario(lembretes.bomDia.hora);
    for (let i = 0; i < DIAS_JANELA; i++) {
      const dia = deslocarDia(hoje, i);
      const em = instanteDoDia(dia, hora, minuto);
      if (em <= agora) continue;
      lista.push({
        id: `bomdia-${dia}`,
        tipo: 'bomDia',
        titulo,
        corpo: fraseDoDia(dia),
        quando: { tipo: 'data', em },
        rota: ROTA_INICIO,
      });
    }
  }

  if (habito && lembretes.antesDaOnda) {
    const onda = calcularAntesDaOnda(relatos, fissuras, habito.id, hoje);
    if (onda.status === 'ok') {
      lista.push({
        id: 'antes-da-onda',
        tipo: 'antesDaOnda',
        titulo,
        corpo: TEXTO_ANTES_DA_ONDA,
        quando: {
          tipo: 'semanal',
          diaSemana: onda.avisoDiaSemana + 1,
          hora: Math.floor(onda.avisoMinutos / 60),
          minuto: onda.avisoMinutos % 60,
        },
        rota: ROTA_FISSURA,
        categoria: CATEGORIA_ONDA,
      });
    }
  }

  if (habito && lembretes.marcos) {
    const marco = proximoAvisoMarco(habito, relatos, hoje, agora);
    if (marco) {
      lista.push({
        id: `marco-${marco.dias}`,
        tipo: 'marco',
        titulo,
        corpo: TEXTO_MARCO,
        quando: { tipo: 'data', em: marco.em },
        rota: ROTA_MARCOS,
      });
    }
  }

  if (habito && lembretes.reflexao?.ligado) {
    const { hora, minuto } = lerHorario(lembretes.reflexao.hora);
    lista.push({
      id: 'reflexao-semanal',
      tipo: 'reflexao',
      titulo,
      corpo: TEXTO_REFLEXAO,
      // Domingo (1 no padrão do Expo).
      quando: { tipo: 'semanal', diaSemana: 1, hora, minuto },
      rota: ROTA_REFLEXAO,
    });
  }

  return lista;
}
