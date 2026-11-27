import { create } from 'zustand';
import { calcularResultados, type Respostas } from './avaliacao';
import { alternarTipo, type RascunhoHabito } from './primeiroUso';
import type { Habito, ResultadoAvaliacao, TipoHabito } from './tipos';

/**
 * Rascunho do primeiro uso. Fica só na memória: nada é gravado até "Concluir"; se o app for
 * fechado no meio, a pessoa recomeça da abertura (são poucos passos).
 */
/** Um porquê ainda não gravado: texto (pode ser vazio se houver foto) e o nome do arquivo cifrado da foto. */
export type PorqueRascunho = { texto: string; foto?: string };

type Rascunho = {
  rascunhos: RascunhoHabito[];
  /** Hábitos já montados (com id), depois do passo "Quando você começou?". */
  habitos: Habito[];
  respostas: Respostas;
  /** `true` quando a pessoa passou pela avaliação (mesmo que não tenha respondido tudo). */
  avaliou: boolean;
  resultados: ResultadoAvaliacao[];
  porques: PorqueRascunho[];
  alternarTipo: (tipo: TipoHabito) => void;
  mudarHabito: (tipo: TipoHabito, parcial: Partial<RascunhoHabito>) => void;
  definirHabitos: (h: Habito[]) => void;
  responder: (chave: string, indice: number) => void;
  concluirAvaliacao: () => void;
  pularAvaliacao: () => void;
  adicionarPorque: (porque: PorqueRascunho) => void;
  removerPorque: (indice: number) => void;
  reiniciar: () => void;
};

const VAZIO = {
  rascunhos: [] as RascunhoHabito[],
  habitos: [] as Habito[],
  respostas: {} as Respostas,
  avaliou: false,
  resultados: [] as ResultadoAvaliacao[],
  porques: [] as PorqueRascunho[],
};

export const useRascunhoPrimeiroUso = create<Rascunho>()((set) => ({
  ...VAZIO,
  alternarTipo: (tipo) => set((e) => ({ rascunhos: alternarTipo(e.rascunhos, tipo) })),
  mudarHabito: (tipo, parcial) =>
    set((e) => ({ rascunhos: e.rascunhos.map((r) => (r.tipo === tipo ? { ...r, ...parcial } : r)) })),
  // Mudou os hábitos: as respostas e o resultado de antes não valem mais.
  definirHabitos: (habitos) => set({ habitos, respostas: {}, resultados: [], avaliou: false }),
  responder: (chave, indice) => set((e) => ({ respostas: { ...e.respostas, [chave]: indice } })),
  concluirAvaliacao: () => set((e) => ({ avaliou: true, resultados: calcularResultados(e.habitos, e.respostas) })),
  pularAvaliacao: () => set({ avaliou: true, resultados: [] }),
  adicionarPorque: (porque) => set((e) => ({ porques: [...e.porques, porque] })),
  removerPorque: (indice) => set((e) => ({ porques: e.porques.filter((_, i) => i !== indice) })),
  reiniciar: () => set({ ...VAZIO }),
}));
