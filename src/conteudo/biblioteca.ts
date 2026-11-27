/**
 * Biblioteca "Aprender" (spec 6.7). Texto curto, humano e sem julgamento.
 *
 * Regras deste conteúdo (spec 2, 3 e 10):
 * - Toda afirmação de saúde tem fonte oficial ou científica listada no fim do artigo (`fontes`).
 * - O app informa e aproxima de ajuda; nunca diagnostica, prescreve nem recomenda remédio ou terapia.
 *   Terapias aparecem como "vale conversar com seu psicólogo"; remédios, como "existem; só um médico
 *   pode avaliar", sem nome de dose.
 * - Sem imagens ou descrições que funcionem como gatilho.
 * - Links e telefones devem ser conferidos antes de cada Release.
 */
export interface Fonte {
  titulo: string;
  url: string;
}

export type Bloco =
  | { tipo: 'paragrafo'; texto: string }
  | { tipo: 'subtitulo'; texto: string }
  | { tipo: 'lista'; itens: string[] }
  /** Destaque de segurança (ex.: abstinência alcoólica grave). */
  | { tipo: 'aviso'; texto: string };

export type GrupoArtigo = 'Entender' | 'No momento difícil' | 'O que esperar' | 'Ajuda de verdade';

export interface Artigo {
  id: string;
  grupo: GrupoArtigo;
  titulo: string;
  /** Uma linha, mostrada na lista. */
  resumo: string;
  /** Tempo de leitura, em minutos. */
  minutos: number;
  blocos: Bloco[];
  fontes: Fonte[];
}

const FONTE = {
  berridge: {
    titulo: 'Berridge & Robinson (2016). Liking, wanting, and the incentive-sensitization theory of addiction. American Psychologist',
    url: 'https://pubmed.ncbi.nlm.nih.gov/27977239/',
  },
  omsTabaco: {
    titulo: 'OMS. Tabaco (nota informativa)',
    url: 'https://www.who.int/news-room/fact-sheets/detail/tobacco',
  },
  omsAlcool: {
    titulo: 'OMS. Álcool (nota informativa)',
    url: 'https://www.who.int/news-room/fact-sheets/detail/alcohol',
  },
  omsBeneficios: {
    titulo: 'OMS. Benefícios de parar de fumar para a saúde',
    url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation',
  },
  omsCigarroEletronico: {
    titulo: 'OMS. Cigarros eletrônicos: perguntas e respostas',
    url: 'https://www.who.int/news-room/questions-and-answers/item/tobacco-e-cigarettes',
  },
  medlineTabaco: {
    titulo: 'MedlinePlus (NIH). Lidando com a vontade de fumar e com a abstinência da nicotina',
    url: 'https://medlineplus.gov/ency/patientinstructions/000854.htm',
  },
  pcdtTabagismo: {
    titulo: 'Ministério da Saúde / Conitec. Protocolo Clínico e Diretrizes Terapêuticas do Tabagismo (versão resumida)',
    url: 'https://www.gov.br/conitec/pt-br/midias/protocolos/resumidos/20210113_pcdt_resumido_tabagismo.pdf',
  },
  bowenSurf: {
    titulo: 'Bowen & Marlatt (2009). Surfing the urge: brief mindfulness-based intervention for college student smokers',
    url: 'https://pubmed.ncbi.nlm.nih.gov/20025372/',
  },
  mbrp: {
    titulo: 'Bowen et al. Mindfulness-Based Relapse Prevention for substance use disorders (ensaio clínico)',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3408809',
  },
  respiracao: {
    titulo: 'Balban et al. (2023). Brief structured respiration practices enhance mood and reduce physiological arousal. Cell Reports Medicine',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9873947',
  },
  marlatt: {
    titulo: 'Efeito de violação da abstinência e prevenção de recaída, modelo de Marlatt & Gordon (revisão). PMC',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6760427',
  },
  abstinenciaAlcool: {
    titulo: 'Síndrome de abstinência alcoólica (revisão). PMC',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6761825/',
  },
  aafpAbstinencia: {
    titulo: 'American Academy of Family Physicians. Alcohol withdrawal',
    url: 'https://www.aafp.org/pubs/afp/issues/2005/0201/p495.html',
  },
  aafpMedicamentos: {
    titulo: 'American Academy of Family Physicians (2024). Medications for alcohol use disorder',
    url: 'https://www.aafp.org/pubs/afp/issues/2024/0100/alcohol-use-disorder.html',
  },
  briken: {
    titulo: 'Briken et al. (2024). Assessment and treatment of compulsive sexual behavior disorder: a sexual medicine perspective',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38529667/',
  },
  grubbs: {
    titulo: 'Grubbs et al. (2019). Pornography problems due to moral incongruence',
    url: 'https://pubmed.ncbi.nlm.nih.gov/30076491/',
  },
  cid11: {
    titulo: 'OMS. Classificação Internacional de Doenças (CID-11)',
    url: 'https://www.who.int/standards/classifications/classification-of-diseases',
  },
  icanquit: {
    titulo: 'Bricker et al. (2020). Smartphone app com Terapia de Aceitação e Compromisso para parar de fumar. JAMA Internal Medicine',
    url: 'https://pubmed.ncbi.nlm.nih.gov/32955554/',
  },
  actPorno: {
    titulo: 'Crosby & Twohig (2016). Terapia de Aceitação e Compromisso para uso problemático de pornografia',
    url: 'https://pubmed.ncbi.nlm.nih.gov/27157029',
  },
  nimhTerapias: {
    titulo: 'NIMH (EUA). Psychotherapies',
    url: 'https://www.nimh.nih.gov/health/topics/psychotherapies',
  },
  cochraneAA: {
    titulo: 'Cochrane (2020). Alcoólicos Anônimos e programas de facilitação dos 12 passos',
    url: 'https://www.cochrane.org/news/new-cochrane-review-finds-alcoholics-anonymous-and-12-step-facilitation-programs-help-people',
  },
  caps: {
    titulo: 'Ministério da Saúde. Centros de Atenção Psicossocial (CAPS)',
    url: 'https://www.gov.br/saude/pt-br/composicao/saes/desmad/raps/caps',
  },
  raps: {
    titulo: 'Ministério da Saúde. Rede de Atenção Psicossocial (RAPS)',
    url: 'https://www.gov.br/saude/pt-br/composicao/saes/desmad/raps',
  },
  saudeMental: {
    titulo: 'Ministério da Saúde. Saúde mental',
    url: 'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/s/saude-mental',
  },
  revisaoSexual: {
    titulo: 'Revisão sistemática dos tratamentos do comportamento sexual compulsivo (2022). PMC',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9872540',
  },
  omsSuicidio: {
    titulo: 'OMS. Suicídio (nota informativa)',
    url: 'https://www.who.int/news-room/fact-sheets/detail/suicide',
  },
} satisfies Record<string, Fonte>;

export const ARTIGOS: Artigo[] = [
  {
    id: 'por-que-acontece',
    grupo: 'Entender',
    titulo: 'Por que isso acontece',
    resumo: 'Não é falta de força de vontade nem de caráter.',
    minutos: 3,
    blocos: [
      {
        tipo: 'paragrafo',
        texto:
          'Ter dificuldade de parar um hábito não é fraqueza de caráter. A ciência hoje entende isso como uma soma de coisas: o que acontece no cérebro, o que a pessoa vive e sente, e o ambiente em volta.',
      },
      { tipo: 'subtitulo', texto: 'Querer não é a mesma coisa que gostar' },
      {
        tipo: 'paragrafo',
        texto:
          'Com o uso repetido, o cérebro aprende a desejar com muita força, e esse "querer" pode crescer mesmo quando o prazer já diminuiu. Por isso alguém que de verdade quer parar pode sentir uma vontade enorme ao ver ou lembrar de algo ligado ao hábito.',
      },
      { tipo: 'subtitulo', texto: 'Gatilhos' },
      {
        tipo: 'paragrafo',
        texto:
          'Lugares, horários, pessoas, emoções e até o cansaço podem acender a vontade. Conhecer os seus gatilhos é um dos melhores primeiros passos: dá para se preparar para eles em vez de ser pego de surpresa.',
      },
      { tipo: 'subtitulo', texto: 'O hábito costuma ter um trabalho' },
      {
        tipo: 'paragrafo',
        texto:
          'Muita gente usa para aliviar ansiedade, tédio, solidão ou insônia. Isso ajuda a explicar por que parar só "na raça" é tão difícil. Cuidar do que está por trás conta tanto quanto o hábito em si, e é um bom assunto para levar a um profissional.',
      },
      {
        tipo: 'paragrafo',
        texto: 'Se você sente vergonha, saiba que ela é comum e que não ajuda ninguém a mudar. Aqui, o que vale é o próximo passo.',
      },
    ],
    fontes: [FONTE.berridge, FONTE.omsTabaco, FONTE.omsAlcool, FONTE.saudeMental],
  },
  {
    id: 'surfar-a-fissura',
    grupo: 'No momento difícil',
    titulo: 'Surfar a onda',
    resumo: 'A vontade sobe, chega ao pico e passa.',
    minutos: 3,
    blocos: [
      {
        tipo: 'paragrafo',
        texto:
          'A vontade vem como uma onda. Ela sobe, chega ao pico e depois desce, mesmo que você não faça nada. No tabaco, cada onda costuma durar poucos minutos.',
      },
      { tipo: 'subtitulo', texto: 'O que é "surfar"' },
      {
        tipo: 'paragrafo',
        texto:
          'É observar a vontade com curiosidade, sem brigar com ela e sem obedecer a ela. Você percebe onde sente no corpo, respira e deixa a onda passar. Estudos com pessoas que querem parar de fumar e com pessoas em tratamento para outras substâncias mostraram resultados promissores com essa prática, embora o surfar isolado ainda tenha evidência preliminar.',
      },
      { tipo: 'subtitulo', texto: 'Um jeito simples' },
      {
        tipo: 'lista',
        itens: [
          'Pare por um instante e note: "estou sentindo vontade".',
          'Procure no corpo onde ela está: peito, garganta, mãos, barriga.',
          'Solte o ar devagar, mais longo do que você inspirou.',
          'Imagine a vontade como uma onda crescendo. Você só precisa ficar até ela descer.',
          'Lembre do seu porquê.',
        ],
      },
      {
        tipo: 'paragrafo',
        texto:
          'Respirar devagar, com a expiração mais longa que a inspiração, ajuda o corpo a se acalmar. Um estudo com cinco minutos por dia de respiração guiada mostrou melhora de humor. É isso que a tela da onda do Maré faz com você.',
      },
      {
        tipo: 'paragrafo',
        texto: 'Se a onda parecer grande demais, tudo bem: recomece a respiração, mude de lugar, beba água ou fale com alguém. Isso também conta.',
      },
    ],
    fontes: [FONTE.bowenSurf, FONTE.mbrp, FONTE.medlineTabaco, FONTE.respiracao],
  },
  {
    id: 'deslize-nao-e-recaida',
    grupo: 'No momento difícil',
    titulo: 'Deslize não é recaída',
    resumo: 'O que você faz depois do deslize importa mais do que ele.',
    minutos: 3,
    blocos: [
      {
        tipo: 'paragrafo',
        texto:
          'Um deslize é um uso pontual. Recaída é voltar ao padrão antigo. A diferença entre os dois costuma estar menos no que aconteceu e mais no que a pessoa pensa e sente depois.',
      },
      { tipo: 'subtitulo', texto: 'O efeito "já estraguei tudo"' },
      {
        tipo: 'paragrafo',
        texto:
          'Pesquisadores de prevenção de recaída descreveram um efeito comum: depois de um deslize, a pessoa se enche de culpa ("não tenho jeito, nunca vou conseguir") e pensa "já que estraguei, vou até o fim". É a vergonha, e não o deslize, que empurra para o uso de novo.',
      },
      { tipo: 'subtitulo', texto: 'O que costuma ajudar' },
      {
        tipo: 'lista',
        itens: [
          'Tratar o deslize como informação: o que estava acontecendo?',
          'Perceber os gatilhos (fome, raiva, solidão, cansaço, uma situação).',
          'Combinar consigo o que vai ser diferente da próxima vez.',
          'Voltar ao plano no mesmo dia, sem se punir.',
        ],
      },
      {
        tipo: 'paragrafo',
        texto:
          'Por isso o Maré nunca zera o seu caminho. Os seus dias totais continuam contando, e o fluxo "Recomeçar com cuidado" existe para você aprender com o momento, sem se culpar.',
      },
    ],
    fontes: [FONTE.marlatt, FONTE.mbrp],
  },
  {
    id: 'abstinencia-tabaco',
    grupo: 'O que esperar',
    titulo: 'Cigarro e nicotina: o que esperar',
    resumo: 'Os primeiros dias são os mais difíceis. Depois melhora.',
    minutos: 3,
    blocos: [
      {
        tipo: 'paragrafo',
        texto:
          'A nicotina chega ao cérebro em segundos e o hábito se espalha pelo dia (café, pausas, ansiedade). Por isso parar mexe com o corpo e com a rotina. Isso vale também para o vape, que contém nicotina.',
      },
      { tipo: 'subtitulo', texto: 'O que muita gente sente' },
      {
        tipo: 'paragrafo',
        texto:
          'Irritação, ansiedade, dificuldade de concentração, mais apetite, sono ruim e humor mais baixo. Cada onda de vontade costuma durar de 3 a 5 minutos. O pior período costuma ser nos 2 ou 3 primeiros dias, e a maior parte dos sintomas melhora em cerca de 4 semanas. Vontades ocasionais podem voltar mais tarde, principalmente ligadas a gatilhos.',
      },
      { tipo: 'subtitulo', texto: 'O que o seu corpo ganha' },
      {
        tipo: 'lista',
        itens: [
          'Em cerca de 20 minutos, a frequência cardíaca começa a baixar.',
          'Em cerca de 12 horas, o monóxido de carbono no sangue volta ao normal.',
          'De 2 a 12 semanas, a circulação e a função dos pulmões melhoram.',
          'De 1 a 9 meses, a tosse e a falta de ar tendem a diminuir.',
          'Em 1 ano, o risco de doença do coração cai para cerca da metade em relação a quem continua fumando.',
        ],
      },
      {
        tipo: 'paragrafo',
        texto:
          'No SUS existe tratamento gratuito para parar de fumar, feito com acompanhamento em grupo na UBS. Vale conversar com a equipe de saúde da sua unidade.',
      },
    ],
    fontes: [FONTE.omsBeneficios, FONTE.medlineTabaco, FONTE.omsCigarroEletronico, FONTE.pcdtTabagismo],
  },
  {
    id: 'abstinencia-alcool',
    grupo: 'O que esperar',
    titulo: 'Álcool: o que esperar e quando buscar ajuda',
    resumo: 'Parar de uma vez pode ser perigoso para quem bebe muito.',
    minutos: 4,
    blocos: [
      {
        tipo: 'aviso',
        texto:
          'Se você bebe muito e todos os dias, não pare de uma vez sem falar com um médico. Procure uma UBS ou um CAPS AD. A abstinência do álcool pode ser perigosa.',
      },
      {
        tipo: 'paragrafo',
        texto:
          'Quando o corpo se acostumou com bastante álcool, ficar sem ele pode causar sintomas. Em muitos casos são leves: ansiedade, suor, tremor nas mãos, insônia, náusea e irritação, que costumam aparecer nas primeiras horas e dias.',
      },
      { tipo: 'subtitulo', texto: 'Sinais de que é uma emergência' },
      {
        tipo: 'lista',
        itens: [
          'Tremores fortes pelo corpo',
          'Convulsão',
          'Ver ou ouvir coisas que não existem',
          'Confusão: não saber onde está ou quem é',
        ],
      },
      {
        tipo: 'aviso',
        texto: 'Diante de qualquer um desses sinais, ligue para o SAMU (192) agora. Não espere passar.',
      },
      {
        tipo: 'paragrafo',
        texto:
          'O risco é maior em quem bebe muito há bastante tempo, já teve convulsão ou abstinência antes. Mas não dá para saber de longe: quem decide a melhor forma de parar é um profissional de saúde.',
      },
      { tipo: 'subtitulo', texto: 'Parar ou reduzir' },
      {
        tipo: 'paragrafo',
        texto:
          'Para algumas pessoas, beber menos já é uma meta que faz bem. Para outras, parar é o mais seguro. Por isso o Maré deixa você escolher a sua meta, e vale conversar com um profissional sobre qual faz sentido para você.',
      },
    ],
    fontes: [FONTE.abstinenciaAlcool, FONTE.aafpAbstinencia, FONTE.omsAlcool, FONTE.caps],
  },
  {
    id: 'abstinencia-sexual',
    grupo: 'O que esperar',
    titulo: 'Pornografia e masturbação: o que esperar',
    resumo: 'Sem julgamento: a meta é sua, e o sofrimento é o que importa.',
    minutos: 3,
    blocos: [
      {
        tipo: 'paragrafo',
        texto:
          'A masturbação em si é considerada um comportamento comum e saudável. O que merece atenção é quando a pessoa sente que perdeu o controle, tenta diminuir e não consegue, ou passa a sofrer ou a ter prejuízos por causa disso.',
      },
      {
        tipo: 'paragrafo',
        texto:
          'A classificação internacional de doenças (CID-11) descreve um "transtorno do comportamento sexual compulsivo" e deixa claro que sofrer apenas por julgamento moral ou desaprovação do comportamento não basta para esse diagnóstico. Quem decide se existe um problema é um profissional, não um aplicativo.',
      },
      { tipo: 'subtitulo', texto: 'Você escolhe a sua meta' },
      {
        tipo: 'paragrafo',
        texto:
          'Alguns querem parar a pornografia, outros reduzir, outros mudar em que momentos acontece. Tudo bem. Parte do sentimento de "ter um vício" pode vir do conflito entre os seus valores e o que você faz, e isso também é um assunto legítimo para trabalhar, com autocompaixão e sem vergonha.',
      },
      { tipo: 'subtitulo', texto: 'O que esperar' },
      {
        tipo: 'paragrafo',
        texto:
          'Não existe uma "abstinência" física como a do álcool. Muita gente sente inquietação, irritação, tédio e vontade em ondas, principalmente à noite, sem ninguém por perto e com o celular. Promessas de "superpoderes" ou de efeitos garantidos não têm base científica sólida.',
      },
      {
        tipo: 'lista',
        itens: [
          'Deixar o celular fora da cama pode ajudar.',
          'Ter um plano para os horários de maior vontade (veja "Meu plano").',
          'Conversar com um psicólogo, de preferência um que trabalhe a sexualidade sem julgamento.',
        ],
      },
    ],
    fontes: [FONTE.briken, FONTE.grubbs, FONTE.cid11, FONTE.actPorno],
  },
  {
    id: 'terapias',
    grupo: 'Ajuda de verdade',
    titulo: 'Terapias que existem',
    resumo: 'Vale conversar com seu psicólogo sobre elas.',
    minutos: 4,
    blocos: [
      {
        tipo: 'paragrafo',
        texto:
          'Existem abordagens de psicoterapia estudadas para ajudar quem quer mudar um hábito. O Maré não indica tratamento: quem avalia o que serve para você é um profissional. Mas conhecer os nomes ajuda a conversar.',
      },
      { tipo: 'subtitulo', texto: 'Terapia Cognitivo-Comportamental (TCC)' },
      {
        tipo: 'paragrafo',
        texto:
          'Ajuda a perceber os pensamentos e as situações que levam ao uso e a treinar jeitos de lidar com eles. É a base do tratamento do tabagismo no SUS. Vale conversar com seu psicólogo.',
      },
      { tipo: 'subtitulo', texto: 'Entrevista Motivacional' },
      {
        tipo: 'paragrafo',
        texto:
          'Uma conversa sem pressão que ajuda a pessoa a lidar com o "quero e não quero parar". É muito usada para o álcool. Vale conversar com seu psicólogo.',
      },
      { tipo: 'subtitulo', texto: 'Terapia de Aceitação e Compromisso (ACT)' },
      {
        tipo: 'paragrafo',
        texto:
          'Trabalha aceitar a vontade e as emoções sem obedecer a elas, e agir de acordo com o que importa para você. Um aplicativo baseado em ACT ajudou mais pessoas a parar de fumar do que um aplicativo tradicional, num estudo grande. Vale conversar com seu psicólogo.',
      },
      { tipo: 'subtitulo', texto: 'Mindfulness e prevenção de recaída' },
      {
        tipo: 'paragrafo',
        texto:
          'Programas de atenção plena para prevenção de recaída ensinam a surfar a vontade e a notar os gatilhos. Em um ensaio clínico, participantes tiveram menos dias de uso e menos consumo pesado em um ano. Vale conversar com seu psicólogo.',
      },
      { tipo: 'subtitulo', texto: 'Grupos de apoio' },
      {
        tipo: 'paragrafo',
        texto:
          'Grupos de pessoas que passam pelo mesmo, como AA, NA e DASA, são gratuitos. Uma revisão grande mostrou que o programa de 12 passos ajudou a manter a abstinência por mais tempo do que outros tratamentos para o álcool. Veja a tela Apoio.',
      },
    ],
    fontes: [FONTE.nimhTerapias, FONTE.pcdtTabagismo, FONTE.icanquit, FONTE.actPorno, FONTE.mbrp, FONTE.cochraneAA],
  },
  {
    id: 'remedios',
    grupo: 'Ajuda de verdade',
    titulo: 'E os remédios?',
    resumo: 'Existem; só um médico pode avaliar.',
    minutos: 2,
    blocos: [
      {
        tipo: 'paragrafo',
        texto:
          'Para alguns casos de tabagismo e de álcool existem medicamentos que um médico pode avaliar. Para o comportamento sexual compulsivo não há remédio aprovado específico, e em alguns casos o psiquiatra pode avaliar tratamentos para o que está junto (como ansiedade ou depressão).',
      },
      {
        tipo: 'aviso',
        texto:
          'Só um médico pode avaliar se um remédio serve para você. Nunca comece, pare, misture ou troque remédio por conta própria, nem com base em um aplicativo.',
      },
      {
        tipo: 'paragrafo',
        texto:
          'No SUS, o tratamento do tabagismo pode incluir medicamentos, sempre junto com acompanhamento em grupo. Procure a UBS da sua região.',
      },
    ],
    fontes: [FONTE.pcdtTabagismo, FONTE.aafpMedicamentos, FONTE.revisaoSexual],
  },
  {
    id: 'ajuda-no-sus',
    grupo: 'Ajuda de verdade',
    titulo: 'Como encontrar ajuda gratuita',
    resumo: 'UBS, CAPS AD, Disque Saúde 136 e grupos.',
    minutos: 3,
    blocos: [
      {
        tipo: 'paragrafo',
        texto:
          'Você não precisa pagar para ser acompanhado por um profissional. O SUS tem portas de entrada para quem quer parar ou reduzir.',
      },
      { tipo: 'subtitulo', texto: 'UBS (Unidade Básica de Saúde)' },
      {
        tipo: 'paragrafo',
        texto:
          'É a porta de entrada mais perto de casa. Diga à equipe que você quer parar de fumar, beber ou que está sofrendo com um hábito. A UBS oferece o programa de tabagismo, acompanha o seu caso e encaminha para outros serviços quando precisa. Leve documento com foto e o cartão do SUS, se tiver.',
      },
      { tipo: 'subtitulo', texto: 'CAPS AD (Centro de Atenção Psicossocial Álcool e Drogas)' },
      {
        tipo: 'paragrafo',
        texto:
          'Atende pessoas com problemas pelo uso de álcool e outras drogas, de graça. Em muitos municípios dá para chegar sem encaminhamento. Pergunte na UBS ou na secretaria de saúde da sua cidade onde fica o mais próximo.',
      },
      { tipo: 'subtitulo', texto: 'Disque Saúde 136' },
      {
        tipo: 'paragrafo',
        texto: 'Ligação gratuita do Ministério da Saúde para tirar dúvidas sobre o SUS e saber onde ser atendido.',
      },
      { tipo: 'subtitulo', texto: 'Grupos de apoio' },
      {
        tipo: 'paragrafo',
        texto:
          'AA, NA, DASA e outros grupos são gratuitos e muitas vezes têm reuniões online. Veja a tela Apoio para os contatos.',
      },
      {
        tipo: 'paragrafo',
        texto:
          'Se for difícil falar, anote antes o que você quer dizer. Dizer "estou com dificuldade e quero ajuda" já basta.',
      },
    ],
    fontes: [FONTE.raps, FONTE.caps, FONTE.pcdtTabagismo, FONTE.cochraneAA],
  },
];

export const GRUPOS: GrupoArtigo[] = ['Entender', 'No momento difícil', 'O que esperar', 'Ajuda de verdade'];

export const artigoPorId = (id: string | undefined): Artigo | undefined => ARTIGOS.find((a) => a.id === id);

/** Aviso que aparece no fim de todo artigo. */
export const AVISO_PROFISSIONAL =
  'Este conteúdo informa e não substitui um profissional de saúde. O Maré não diagnostica nem indica tratamento.';

/** Fonte usada por `FONTE.omsSuicidio`, reservada para o texto de apoio emocional (tela Apoio). */
export const FONTE_SUICIDIO: Fonte = FONTE.omsSuicidio;
