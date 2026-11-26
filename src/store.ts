import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { criarArmazenamento, falhaAoAbrir, recomecouDoZero } from './lib/armazenamento';
import {
  aplicarHabito,
  aplicarRelato,
  aplicarRemocaoHabito,
  estadoInicial,
  migrar,
  VERSAO_ESTADO,
  type Ajustes,
  type EstadoPersistido,
} from './lib/estado';
import type { Habito, Relato } from './lib/tipos';

export { migrar } from './lib/estado';
export type { Ajustes, EstadoPersistido } from './lib/estado';

type Mare = EstadoPersistido & {
  /** Não é persistido: vem de `recomecouDoZero()` ao carregar. */
  avisoRecomeco: boolean;
  /** Não é persistido: `true` se o banco não abriu; nada é lido nem gravado até recomeçar. */
  erroArmazenamento: boolean;
  salvarHabito: (h: Habito) => void;
  removerHabito: (id: string) => void;
  salvarRelato: (r: Relato) => void;
  setAjustes: (p: Partial<Ajustes>) => void;
  dispensarAvisoRecomeco: () => void;
};

export const useMare = create<Mare>()(
  persist(
    (set) => ({
      ...estadoInicial(),
      avisoRecomeco: false,
      erroArmazenamento: false,
      salvarHabito: (h) => set((e) => aplicarHabito(e, h)),
      removerHabito: (id) => set((e) => aplicarRemocaoHabito(e, id)),
      salvarRelato: (r) => set((e) => aplicarRelato(e, r)),
      setAjustes: (p) => set((e) => ({ ajustes: { ...e.ajustes, ...p } })),
      dispensarAvisoRecomeco: () => set({ avisoRecomeco: false }),
    }),
    {
      name: 'mare',
      version: VERSAO_ESTADO,
      storage: createJSONStorage(criarArmazenamento),
      partialize: ({ versao, habitos, relatos, ajustes }): EstadoPersistido => ({
        versao,
        habitos,
        relatos,
        ajustes,
      }),
      migrate: (persistido, versao) => migrar(persistido, versao),
      // Sempre passa pelo `migrar`, que descarta o que estiver fora do formato.
      merge: (persistido, atual) => ({
        ...atual,
        ...migrar(persistido, VERSAO_ESTADO),
        avisoRecomeco: recomecouDoZero(),
        erroArmazenamento: falhaAoAbrir(),
      }),
    },
  ),
);

const hidratado = () => useMare.persist.hasHydrated();
const aoHidratar = (fn: () => void) => useMare.persist.onFinishHydration(fn);

/** Espera os dados salvos carregarem antes de mostrar as telas. */
export const useHydrated = () => useSyncExternalStore(aoHidratar, hidratado);
