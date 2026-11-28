/**
 * Resumo limpo dos últimos 30 dias para levar a uma consulta (psicólogo, médico, UBS ou CAPS AD).
 * Lógica pura, sem dados íntimos: nunca inclui notas livres, fotos, conversas com a IA nem
 * gatilhos digitados à mão.
 */
import { TEXTO_NIVEL, ultimaAvaliacao } from './avaliacao';
import { estadoDaEntrada, normalizarRelatoHabito, resumoHabito } from './contador';
import { dataCurta, dataLocal, deslocarDia } from './datas';
import { contarFissurasVencidas } from './fissura';
import { contarGatilhos, GATILHOS_FISSURA, normalizarGatilho } from './gatilhos';
import { horaAproximada, horaMaisPesada, nosDias } from './reflexao';
import { diaDePico, vontadePorDiaDaSemana } from './insights';
import type { Avaliacao, Fissura, Habito, Relato, TipoHabito } from './tipos';
import { GATILHOS } from '../conteudo/gatilhos';

export const DIAS_RESUMO_CONSULTA = 30;

const NOME_TIPO: Record<TipoHabito, string> = {
  tabaco: 'Tabaco / nicotina',
  alcool: 'Álcool',
  sexual: 'Comportamento sexual',
};

const GATILHOS_CONHECIDOS = new Set<string>([...GATILHOS_FISSURA.map((g) => g.id), ...GATILHOS.map(normalizarGatilho)]);

const numero = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
const plural = (n: number, um: string, muitos: string) => `${n} ${n === 1 ? um : muitos}`;

export type EntradaResumoConsulta = {
  habitos: readonly Habito[];
  relatos: readonly Relato[];
  fissuras: readonly Fissura[];
  avaliacoes: readonly Avaliacao[];
  hoje: string;
  dias?: number;
};

export type ResultadoResumoConsulta = {
  texto: string;
  temDados: boolean;
};

/**
 * Monta um texto objetivo e sem julgamento para compartilhar com um profissional de saúde.
 * Só inclui contagens, médias, horários concentrados e gatilhos da lista padrão do app.
 */
export function gerarResumoConsulta({
  habitos,
  relatos,
  fissuras,
  avaliacoes,
  hoje,
  dias = DIAS_RESUMO_CONSULTA,
}: EntradaResumoConsulta): ResultadoResumoConsulta {
  if (habitos.length === 0) return { texto: '', temDados: false };

  const inicio = deslocarDia(hoje, -(dias - 1));
  const noPeriodo = (dia: string) => dia >= inicio && dia <= hoje;
  const relatosPeriodo = relatos.filter((r) => noPeriodo(r.dia));
  const fissurasPeriodo = fissuras.filter((f) => noPeriodo(dataLocal(f.inicio)));

  let temAlgumDado = false;
  const blocos: string[] = [
    `Resumo dos últimos ${dias} dias (${dataCurta(inicio)} a ${dataCurta(hoje)})`,
    'Registro pessoal feito no Maré (não é diagnóstico).',
  ];

  const ultima = ultimaAvaliacao([...avaliacoes]);

  for (const h of habitos) {
    const inicioHabito = h.inicio > inicio ? h.inicio : inicio;
    const diasPossiveis = contarDiasIntervalo(inicioHabito, hoje);
    let livres = 0;
    let dentroDaMeta = 0;
    let deslizes = 0;
    const vontades: number[] = [];

    for (const r of relatosPeriodo) {
      if (r.dia < h.inicio) continue;
      const entrada = r.habitos.find((x) => x.habitoId === h.id);
      if (!entrada) continue;
      const norm = normalizarRelatoHabito(entrada);
      const estado = estadoDaEntrada(h.meta, norm);
      if (estado === 'livre') livres += 1;
      else if (estado === 'dentroDaMeta') dentroDaMeta += 1;
      else deslizes += 1;
      vontades.push(norm.vontade);
    }

    const fissurasHabito = fissurasPeriodo.filter((f) => !f.habitoId || f.habitoId === h.id);
    const ondasVencidas = contarFissurasVencidas(fissurasHabito, h.id);
    const relatados = livres + dentroDaMeta + deslizes;
    if (relatados > 0 || ondasVencidas > 0) temAlgumDado = true;

    const resumo = resumoHabito(h, [...relatos], hoje);
    const metaTexto = h.meta.tipo === 'parar' ? 'Meta: parar' : `Meta: reduzir (até ${h.meta.maxPorDia} ${h.meta.unidade}/dia)`;
    const linhas = [`\n• ${h.apelido} (${NOME_TIPO[h.tipo]}) — ${metaTexto}`];

    const partesDias = [plural(livres, 'dia livre', 'dias livres')];
    if (h.meta.tipo === 'reduzir') partesDias.push(plural(dentroDaMeta, 'dia dentro da meta', 'dias dentro da meta'));
    partesDias.push(plural(deslizes, 'deslize', 'deslizes'));
    const semRelato = Math.max(0, diasPossiveis - relatados);
    if (semRelato > 0) partesDias.push(`${semRelato} sem registro`);
    linhas.push(`  Nos últimos ${dias} dias: ${partesDias.join(', ')}.`);
    linhas.push(`  Sequência atual: ${plural(resumo.sequenciaAtual, 'dia', 'dias')} (recorde: ${plural(resumo.recorde, 'dia', 'dias')}).`);

    if (vontades.length > 0) {
      const media = vontades.reduce((a, b) => a + b, 0) / vontades.length;
      linhas.push(`  Vontade média: ${numero(media)} de 10.`);
    }

    const mediasSemana = vontadePorDiaDaSemana(relatosPeriodo, h.id, hoje, Math.ceil(dias / 7));
    const pico = diaDePico(mediasSemana, relatados);
    if (pico !== null) linhas.push(`  Dia com maior vontade: ${nosDias(pico)}.`);

    if (ondasVencidas > 0) linhas.push(`  Ondas de fissura atravessadas: ${ondasVencidas}.`);
    const hora = horaMaisPesada(fissurasHabito);
    if (hora !== null) linhas.push(`  Horário mais frequente das ondas: ${horaAproximada(hora)}.`);

    const gatilhos = contarGatilhos({
      fissuras: fissurasHabito,
      relatos: relatosPeriodo,
      hoje,
      dias,
      limite: 3,
      habitoId: h.id,
    }).filter((g) => GATILHOS_CONHECIDOS.has(g.chave));
    if (gatilhos.length > 0) {
      linhas.push(`  Principais gatilhos marcados: ${gatilhos.map((g) => `${g.rotulo} (${g.total}x)`).join(', ')}.`);
    }

    const av = ultima?.resultados.find((x) => x.habitoId === h.id);
    if (av && ultima) {
      linhas.push(`  Autoavaliação (${dataCurta(ultima.feitaEm)}): ${TEXTO_NIVEL[av.nivel]} (${av.pontos}/${av.maximo}).`);
    }

    blocos.push(linhas.join('\n'));
  }

  if (!temAlgumDado) return { texto: '', temDados: false };
  blocos.push('\nObservação: notas pessoais, fotos e conversas ficam apenas no celular e não entram neste resumo.');
  return { texto: blocos.join('\n'), temDados: true };
}

function contarDiasIntervalo(inicio: string, fim: string): number {
  if (inicio > fim) return 0;
  let total = 0;
  for (let d = inicio; d <= fim; d = deslocarDia(d, 1)) total += 1;
  return total;
}
