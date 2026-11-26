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
