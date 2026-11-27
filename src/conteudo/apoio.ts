/**
 * Rede de apoio no Brasil (spec 6.6; docs/01-pesquisa-fundamentos.md, seção 5).
 *
 * ATENÇÃO: telefones e links mudam. Conferir tudo antes de cada Release (última conferência dos
 * links: 26/11/2026). O DASA não tem um site nacional confirmado: o link aponta para o texto de
 * apresentação em português no site internacional da irmandade (SLAA); trocar quando houver um
 * endereço oficial. O AA (aa.org.br) tem buscador de reuniões; o telefone nacional não foi incluído
 * porque só aparece em diretórios de terceiros.
 */
export type GrupoApoio = 'Ajuda agora' | 'Saúde pública (SUS)' | 'Grupos de apoio';

export interface Recurso {
  id: string;
  grupo: GrupoApoio;
  nome: string;
  descricao: string;
  /** Telefone para ligar, só dígitos. */
  telefone?: string;
  /** Texto do botão de ligar (ex.: "Ligar 188"). */
  rotuloTelefone?: string;
  url?: string;
  rotuloUrl?: string;
  /** Detalhe curto (horário, onde procurar). */
  nota?: string;
}

export const GRUPOS_APOIO: GrupoApoio[] = ['Ajuda agora', 'Saúde pública (SUS)', 'Grupos de apoio'];

export const CVV = {
  telefone: '188',
  chat: 'https://cvv.org.br/chat/',
  site: 'https://cvv.org.br',
} as const;

export const SAMU = { telefone: '192' } as const;

export const RECURSOS: Recurso[] = [
  {
    id: 'cvv',
    grupo: 'Ajuda agora',
    nome: 'CVV · 188',
    descricao: 'Apoio emocional e prevenção do suicídio, 24 horas por dia, de graça. Por telefone ou chat.',
    telefone: CVV.telefone,
    rotuloTelefone: 'Ligar 188',
    url: CVV.chat,
    rotuloUrl: 'Chat do CVV',
  },
  {
    id: 'samu',
    grupo: 'Ajuda agora',
    nome: 'SAMU · 192',
    descricao: 'Emergência médica: sinais graves de abstinência do álcool, intoxicação, convulsão ou risco de vida.',
    telefone: SAMU.telefone,
    rotuloTelefone: 'Ligar 192',
  },
  {
    id: 'disque-saude',
    grupo: 'Saúde pública (SUS)',
    nome: 'Disque Saúde · 136',
    descricao: 'Ligação gratuita do Ministério da Saúde para tirar dúvidas e saber onde ser atendido, inclusive para parar de fumar.',
    telefone: '136',
    rotuloTelefone: 'Ligar 136',
  },
  {
    id: 'ubs',
    grupo: 'Saúde pública (SUS)',
    nome: 'UBS (Unidade Básica de Saúde)',
    descricao: 'A porta de entrada do SUS, perto de casa. Tem o programa para parar de fumar e encaminha para outros serviços.',
    nota: 'Procure a unidade do seu bairro ou ligue para o 136.',
  },
  {
    id: 'caps-ad',
    grupo: 'Saúde pública (SUS)',
    nome: 'CAPS AD',
    descricao: 'Centro de Atenção Psicossocial Álcool e Drogas: tratamento gratuito. Em muitos municípios não precisa de encaminhamento.',
    url: 'https://www.gov.br/saude/pt-br/composicao/saes/desmad/raps/caps',
    rotuloUrl: 'Saiba mais',
    nota: 'Pergunte na UBS ou na secretaria de saúde da sua cidade qual é o mais perto.',
  },
  {
    id: 'aa',
    grupo: 'Grupos de apoio',
    nome: 'Alcoólicos Anônimos (AA)',
    descricao: 'Grupos gratuitos de pessoas que querem parar de beber. Há reuniões presenciais e online.',
    url: 'https://www.aa.org.br',
    rotuloUrl: 'Achar uma reunião',
  },
  {
    id: 'al-anon',
    grupo: 'Grupos de apoio',
    nome: 'Al-Anon',
    descricao: 'Grupos para familiares e amigos de quem tem problema com álcool.',
    url: 'https://al-anon.org.br',
    rotuloUrl: 'Achar um grupo',
  },
  {
    id: 'na',
    grupo: 'Grupos de apoio',
    nome: 'Narcóticos Anônimos (NA)',
    descricao: 'Grupos gratuitos de pessoas que querem parar de usar drogas.',
    url: 'https://www.na.org.br',
    rotuloUrl: 'Achar uma reunião',
  },
  {
    id: 'dasa',
    grupo: 'Grupos de apoio',
    nome: 'DASA',
    descricao: 'Dependentes de Amor e Sexo Anônimos: grupos gratuitos de apoio para quem sofre com o comportamento sexual compulsivo.',
    url: 'https://slaafws.org/lang/portuguese/Preambulo.pdf',
    rotuloUrl: 'Ler a apresentação',
    nota: 'Busque por "DASA" e o nome da sua cidade para achar reuniões.',
  },
  {
    id: 'amor-exigente',
    grupo: 'Grupos de apoio',
    nome: 'Amor-Exigente',
    descricao: 'Apoio a famílias que convivem com a dependência de alguém querido.',
    url: 'https://amorexigente.org',
    rotuloUrl: 'Saiba mais',
  },
];

/** Texto do bloco "Vale conversar com um profissional". */
export const TEXTO_PROFISSIONAL = {
  titulo: 'Vale conversar com um profissional',
  corpo:
    'Um psicólogo ou um médico pode ouvir você, avaliar o seu caso e acompanhar o caminho. Pelo SUS isso é gratuito: o primeiro passo é ir à UBS do seu bairro e dizer que você quer ajuda com um hábito. Se for difícil falar, o Disque Saúde 136 orienta.',
  passos: [
    'Vá à UBS mais próxima, com um documento com foto e o cartão do SUS, se tiver.',
    'Diga: "Estou com dificuldade com um hábito e quero ajuda."',
    'A equipe acompanha você ou encaminha para um CAPS AD ou para um psicólogo.',
  ],
} as const;
