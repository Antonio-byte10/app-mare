export type TipoHabito = 'tabaco' | 'alcool' | 'sexual';

export type Meta = { tipo: 'parar' } | { tipo: 'reduzir'; maxPorDia: number; unidade: string };

export interface Habito {
  id: string;
  tipo: TipoHabito;
  apelido: string;
  cor: 'aqua' | 'peri' | 'coral' | 'sand' | 'foam';
  meta: Meta;
  /** Dia de início, "AAAA-MM-DD". */
  inicio: string;
  custoPorDiaCentavos?: number;
  unidadesPorDia?: number;
  /**
   * "Já estou há N dias": dias livres antes do `inicio`, contados na sequência, no total e no
   * recorde (a pessoa não perde o que já conquistou antes de usar o app).
   */
  diasAntes?: number;
  criadoEm: number;
}

export interface RelatoHabito {
  habitoId: string;
  /** Vontade de 0 a 10. */
  vontade: number;
  usou: boolean;
  quantidade?: number;
}

export interface Relato {
  /** Dia do relato, "AAAA-MM-DD". */
  dia: string;
  habitos: RelatoHabito[];
  humor?: 1 | 2 | 3 | 4 | 5;
  gatilhos: string[];
  nota?: string;
  salvoEm: number;
}

export type EstadoDia = 'livre' | 'dentroDaMeta' | 'deslize';

/** Nível de atenção da avaliação "Como você está". Não é diagnóstico. */
export type NivelAtencao = 'leve' | 'moderada' | 'alta';

export interface ResultadoAvaliacao {
  habitoId: string;
  tipo: TipoHabito;
  pontos: number;
  maximo: number;
  nivel: NivelAtencao;
}

export interface Avaliacao {
  id: string;
  feitaEm: number;
  resultados: ResultadoAvaliacao[];
}

/** "Meus porquês": o motivo da pessoa, mostrado na Fissura. */
export interface Porque {
  id: string;
  texto: string;
  criadoEm: number;
}

/** Plano "se-então": "Se <situação>, então <ação>". */
export interface PlanoSeEntao {
  id: string;
  se: string;
  entao: string;
  habitoId?: string;
  criadoEm: number;
}

/** Uma passagem pela Fissura agora. `venceu` = chegou ao passo "Passou". */
export interface Fissura {
  id: string;
  /** Início, em ms desde 1970. */
  inicio: number;
  duracaoSeg: number;
  venceu: boolean;
  vontadeAntes?: number;
  vontadeDepois?: number;
  habitoId?: string;
  /** "Anotar o que ajudou", texto livre opcional. */
  ajudou?: string;
}

export type Halt = 'fome' | 'raiva' | 'solidao' | 'cansaco';

/** "Recomeçar com cuidado": a reflexão depois de um deslize. */
export interface Recomeco {
  id: string;
  /** Dia do deslize, "AAAA-MM-DD". */
  dia: string;
  habitoId: string;
  gatilhos: string[];
  halt: Halt[];
  oQueAcontecia?: string;
  proximaVez?: string;
  salvoEm: number;
}

/** Contato de confiança: fica só no celular e nunca vai para a IA. */
export interface Contato {
  id: string;
  nome: string;
  /** Como a pessoa digitou; para ligar, só os dígitos (e o "+") são usados. */
  telefone: string;
  criadoEm: number;
}

export type ProvedorIa = 'gemini' | 'openai' | 'claude';

/** Mensagem da Conversa com IA. Fica só no celular. */
export interface MensagemConversa {
  id: string;
  papel: 'usuario' | 'ia';
  texto: string;
  em: number;
}

/**
 * Configuração da IA. A chave (modo direto) e o código de acesso (modo servidor) ficam no
 * expo-secure-store, nunca aqui.
 */
export interface AjustesIa {
  provedor: ProvedorIa;
  modo: 'direto' | 'servidor';
  modelo: string;
  /** Endereço do servidor, "https://...onrender.com" (modo servidor). */
  endereco?: string;
  /** A pessoa já viu o aviso de privacidade deste provedor. */
  avisoVisto: boolean;
}
