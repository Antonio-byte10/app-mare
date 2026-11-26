import type { TipoHabito } from '../lib/tipos';

/**
 * Questionários da avaliação "Como você está" (spec 6.1). São instrumentos de triagem conhecidos,
 * com os itens e as pontuações originais. O texto foi adaptado para uma linguagem acolhedora
 * (e, no tabaco, para "cigarro ou vape") sem mudar o sentido de cada pergunta.
 * O resultado é um retrato de hoje: NÃO é diagnóstico.
 *
 * Os pontos de corte em três faixas (leve, moderada, alta) são uma simplificação feita para o app
 * (decisão do projeto, 25/11/2026); estão em `cortes`.
 */
export interface OpcaoAvaliacao {
  rotulo: string;
  pontos: number;
}

export interface PerguntaAvaliacao {
  id: string;
  texto: string;
  /** Explicação curta que ajuda a responder (ex.: o que é uma dose). */
  dica?: string;
  opcoes: OpcaoAvaliacao[];
}

export interface Questionario {
  tipo: TipoHabito;
  /** Nome do instrumento. */
  nome: string;
  /** Referência da fonte original. */
  fonte: string;
  /** Pontuação máxima possível. */
  maximo: number;
  /** A partir de quantos pontos a atenção é moderada e alta. Abaixo do primeiro valor: leve. */
  cortes: { moderada: number; alta: number };
  perguntas: PerguntaAvaliacao[];
}

const SIM_NAO: OpcaoAvaliacao[] = [
  { rotulo: 'Não', pontos: 0 },
  { rotulo: 'Sim', pontos: 1 },
];

/**
 * Álcool: AUDIT-C (3 primeiras perguntas do AUDIT, da OMS), pontuação de 0 a 12.
 * Fonte: Babor TF, Higgins-Biddle JC, Saunders JB, Monteiro MG. AUDIT: Teste para Identificação de
 * Problemas Relacionados ao Uso de Álcool. OMS/OPAS, 2ª ed., 2001 (WHO/MSD/MSB/01.6a);
 * AUDIT-C: Bush KR et al., Arch Intern Med 1998;158:1789-95.
 * Faixas do app: 0 a 3 leve, 4 a 7 moderada, 8 a 12 alta.
 */
const AUDIT_C: Questionario = {
  tipo: 'alcool',
  nome: 'AUDIT-C (OMS)',
  fonte:
    'OMS/OPAS. AUDIT: Teste para Identificação de Problemas Relacionados ao Uso de Álcool, 2ª ed. (WHO/MSD/MSB/01.6a); Bush et al., Arch Intern Med 1998 (AUDIT-C).',
  maximo: 12,
  cortes: { moderada: 4, alta: 8 },
  perguntas: [
    {
      id: 'audit1',
      texto: 'Com que frequência você toma bebida com álcool?',
      dica: 'Pense em como era antes de você começar a mudar. Se você não bebe, escolha a primeira opção.',
      opcoes: [
        { rotulo: 'Nunca', pontos: 0 },
        { rotulo: 'Uma vez por mês ou menos', pontos: 1 },
        { rotulo: 'De 2 a 4 vezes por mês', pontos: 2 },
        { rotulo: 'De 2 a 3 vezes por semana', pontos: 3 },
        { rotulo: '4 ou mais vezes por semana', pontos: 4 },
      ],
    },
    {
      id: 'audit2',
      texto: 'Nos dias em que você bebe, quantas doses costuma tomar?',
      dica: 'Uma dose é, por exemplo, uma lata de cerveja, uma taça pequena de vinho ou uma dose de destilado.',
      opcoes: [
        { rotulo: '1 ou 2 doses', pontos: 0 },
        { rotulo: '3 ou 4 doses', pontos: 1 },
        { rotulo: '5 ou 6 doses', pontos: 2 },
        { rotulo: 'De 7 a 9 doses', pontos: 3 },
        { rotulo: '10 doses ou mais', pontos: 4 },
      ],
    },
    {
      id: 'audit3',
      texto: 'Com que frequência você toma 6 doses ou mais numa mesma ocasião?',
      opcoes: [
        { rotulo: 'Nunca', pontos: 0 },
        { rotulo: 'Menos de uma vez por mês', pontos: 1 },
        { rotulo: 'Todo mês', pontos: 2 },
        { rotulo: 'Toda semana', pontos: 3 },
        { rotulo: 'Quase todos os dias', pontos: 4 },
      ],
    },
  ],
};

/**
 * Nicotina: Teste de Fagerström para Dependência de Nicotina (FTND), 6 perguntas, 0 a 10.
 * Fonte: Heatherton TF, Kozlowski LT, Frecker RC, Fagerström KO. The Fagerström Test for Nicotine
 * Dependence. Br J Addict 1991;86:1119-27. Versão em português: Carmo JT, Pueyo AA. A adaptação ao
 * português do FTND. Rev Bras Med 2002;59(1/2):73-80.
 * Faixas do app: 0 a 3 leve, 4 a 6 moderada, 7 a 10 alta (o original tem cinco faixas).
 */
const FAGERSTROM: Questionario = {
  tipo: 'tabaco',
  nome: 'Teste de Fagerström (FTND)',
  fonte:
    'Heatherton et al., Br J Addict 1991;86:1119-27 (FTND); Carmo & Pueyo, Rev Bras Med 2002;59:73-80 (versão em português).',
  maximo: 10,
  cortes: { moderada: 4, alta: 7 },
  perguntas: [
    {
      id: 'ftnd1',
      texto: 'Depois de acordar, quanto tempo você leva para fumar o primeiro cigarro (ou usar o vape)?',
      opcoes: [
        { rotulo: 'Mais de 60 minutos', pontos: 0 },
        { rotulo: 'De 31 a 60 minutos', pontos: 1 },
        { rotulo: 'De 6 a 30 minutos', pontos: 2 },
        { rotulo: 'Em até 5 minutos', pontos: 3 },
      ],
    },
    {
      id: 'ftnd2',
      texto: 'É difícil para você ficar sem fumar em lugares onde é proibido, como ônibus, trabalho ou hospital?',
      opcoes: SIM_NAO,
    },
    {
      id: 'ftnd3',
      texto: 'Qual seria o mais difícil de deixar de lado?',
      opcoes: [
        { rotulo: 'Qualquer um dos outros do dia', pontos: 0 },
        { rotulo: 'O primeiro da manhã', pontos: 1 },
      ],
    },
    {
      id: 'ftnd4',
      texto: 'Quantos cigarros você fuma por dia?',
      dica: 'Se você usa vape, escolha a faixa que mais se parece com o seu dia.',
      opcoes: [
        { rotulo: '10 ou menos', pontos: 0 },
        { rotulo: 'De 11 a 20', pontos: 1 },
        { rotulo: 'De 21 a 30', pontos: 2 },
        { rotulo: '31 ou mais', pontos: 3 },
      ],
    },
    {
      id: 'ftnd5',
      texto: 'Você fuma mais nas primeiras horas depois de acordar do que no resto do dia?',
      opcoes: SIM_NAO,
    },
    {
      id: 'ftnd6',
      texto: 'Você fuma mesmo quando está tão doente que precisa ficar de cama quase o dia todo?',
      opcoes: SIM_NAO,
    },
  ],
};

const FREQUENCIA_BPS: OpcaoAvaliacao[] = [
  { rotulo: 'Nunca', pontos: 0 },
  { rotulo: 'De vez em quando', pontos: 1 },
  { rotulo: 'Muitas vezes', pontos: 2 },
];

/**
 * Pornografia/masturbação: Brief Pornography Screen (BPS), 5 itens, 0 a 10 (nunca = 0, de vez em
 * quando = 1, muitas vezes = 2), sobre os últimos 6 meses.
 * Fonte: Kraus SW, Gola M, Grubbs JB, Kowalewska E, Hoff RA, Lew-Starowicz M, Martino S, Shirk SD,
 * Potenza MN. Validation of a Brief Pornography Screen across multiple samples.
 * J Behav Addict 2020;9(2):259-271. Os itens foram escritos sem julgamento moral.
 * Faixas do app: 0 a 3 leve, 4 a 6 moderada, 7 a 10 alta (o estudo sugere 4 ou mais como sinal para
 * conversar com um profissional).
 */
const BPS: Questionario = {
  tipo: 'sexual',
  nome: 'Brief Pornography Screen',
  fonte:
    'Kraus et al. Validation of a Brief Pornography Screen across multiple samples. J Behav Addict 2020;9(2):259-271.',
  maximo: 10,
  cortes: { moderada: 4, alta: 7 },
  perguntas: [
    {
      id: 'bps1',
      texto: 'Nos últimos 6 meses, você se pegou usando pornografia mais do que queria?',
      opcoes: FREQUENCIA_BPS,
    },
    {
      id: 'bps2',
      texto: 'Nos últimos 6 meses, você tentou diminuir ou parar de usar pornografia e não conseguiu?',
      opcoes: FREQUENCIA_BPS,
    },
    {
      id: 'bps3',
      texto: 'Nos últimos 6 meses, foi difícil resistir à vontade forte de usar pornografia?',
      opcoes: FREQUENCIA_BPS,
    },
    {
      id: 'bps4',
      texto: 'Nos últimos 6 meses, você usou pornografia para lidar com emoções fortes, como tristeza, raiva ou solidão?',
      opcoes: FREQUENCIA_BPS,
    },
    {
      id: 'bps5',
      texto: 'Nos últimos 6 meses, você continuou usando pornografia mesmo sentindo culpa por isso?',
      opcoes: FREQUENCIA_BPS,
    },
  ],
};

export const QUESTIONARIOS: Record<TipoHabito, Questionario> = {
  alcool: AUDIT_C,
  tabaco: FAGERSTROM,
  sexual: BPS,
};
