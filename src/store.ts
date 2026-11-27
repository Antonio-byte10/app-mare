import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { criarArmazenamento, falhaAoAbrir, observarEscrita, recomecouDoZero } from './lib/armazenamento';
import { protegerVersao } from './lib/guardaVersao';
import {
  aplicarHabito,
  aplicarRelato,
  aplicarRemocaoHabito,
  estadoInicial,
  inserirOuTrocar,
  MAX_CONVERSA,
  mesclar,
  migrar,
  paraPersistir,
  VERSAO_ESTADO,
  type Ajustes,
  type EstadoPersistido,
} from './lib/estado';
import type {
  Avaliacao,
  Contato,
  Fissura,
  Habito,
  MensagemConversa,
  PlanoSeEntao,
  Porque,
  Recomeco,
  Relato,
} from './lib/tipos';

export { migrar } from './lib/estado';
export type { Ajustes, EstadoPersistido } from './lib/estado';

type Mare = EstadoPersistido & {
  /** Não é persistido: vem de `recomecouDoZero()` ao carregar. */
  avisoRecomeco: boolean;
  /** Não é persistido: `true` se o banco não abriu; nada é lido nem gravado até recomeçar. */
  erroArmazenamento: boolean;
  /** Não é persistido: `true` enquanto as gravações estiverem falhando (ex.: armazenamento cheio). */
  erroEscrita: boolean;
  salvarHabito: (h: Habito) => void;
  removerHabito: (id: string) => void;
  salvarRelato: (r: Relato) => void;
  setAjustes: (p: Partial<Ajustes>) => void;
  /** Troca todos os dados de uma vez (restaurar backup). Quem chama monta o estado com `aplicarRestauracao`. */
  substituirEstado: (e: EstadoPersistido) => void;
  dispensarAvisoRecomeco: () => void;
  salvarAvaliacao: (a: Avaliacao) => void;
  salvarPorque: (p: Porque) => void;
  removerPorque: (id: string) => void;
  salvarPlano: (p: PlanoSeEntao) => void;
  removerPlano: (id: string) => void;
  /** Registra (ou atualiza pelo id) uma passagem pela Fissura. */
  salvarFissura: (f: Fissura) => void;
  salvarRecomeco: (r: Recomeco) => void;
  /** Acrescenta uma mensagem à Conversa (guarda só as últimas `MAX_CONVERSA`). */
  adicionarMensagem: (m: MensagemConversa) => void;
  limparConversa: () => void;
  salvarContato: (c: Contato) => void;
  removerContato: (id: string) => void;
};

/** Dados de uma versão futura do app: nada é lido nem gravado até a pessoa recomeçar. */
const guardaVersao = protegerVersao(criarArmazenamento());

/** Campos que só existem na sessão e nunca vão para o disco. */
const EFEMEROS = ['avisoRecomeco', 'erroArmazenamento', 'erroEscrita'] as const;

export const useMare = create<Mare>()(
  persist(
    (set) => ({
      ...estadoInicial(),
      avisoRecomeco: false,
      erroArmazenamento: false,
      erroEscrita: false,
      salvarHabito: (h) => set((e) => aplicarHabito(e, h)),
      removerHabito: (id) => set((e) => aplicarRemocaoHabito(e, id)),
      salvarRelato: (r) => set((e) => aplicarRelato(e, r)),
      setAjustes: (p) => set((e) => ({ ajustes: { ...e.ajustes, ...p } })),
      substituirEstado: (novo) => set({ ...novo }),
      dispensarAvisoRecomeco: () => set({ avisoRecomeco: false }),
      salvarAvaliacao: (a) => set((e) => ({ avaliacoes: inserirOuTrocar(e.avaliacoes, a) })),
      salvarPorque: (p) => set((e) => ({ porques: inserirOuTrocar(e.porques, p) })),
      removerPorque: (id) => set((e) => ({ porques: e.porques.filter((x) => x.id !== id) })),
      salvarPlano: (p) => set((e) => ({ planos: inserirOuTrocar(e.planos, p) })),
      removerPlano: (id) => set((e) => ({ planos: e.planos.filter((x) => x.id !== id) })),
      salvarFissura: (f) => set((e) => ({ fissuras: inserirOuTrocar(e.fissuras, f) })),
      salvarRecomeco: (r) => set((e) => ({ recomecos: inserirOuTrocar(e.recomecos, r) })),
      adicionarMensagem: (m) => set((e) => ({ conversa: [...e.conversa, m].slice(-MAX_CONVERSA) })),
      limparConversa: () => set({ conversa: [] }),
      salvarContato: (c) => set((e) => ({ contatos: inserirOuTrocar(e.contatos, c) })),
      removerContato: (id) => set((e) => ({ contatos: e.contatos.filter((x) => x.id !== id) })),
    }),
    {
      name: 'mare',
      version: VERSAO_ESTADO,
      storage: createJSONStorage(() => guardaVersao.storage),
      partialize: (e): EstadoPersistido => paraPersistir(e, EFEMEROS),
      // Só chega aqui versão passada (a futura é barrada por `guardaVersao`); ver `migrar`.
      migrate: (persistido, versao) => migrar(persistido, versao) ?? estadoInicial(),
      // Sempre passa pelo `mesclar`, que descarta o que estiver fora do formato.
      merge: (persistido, atual) => {
        const mesclado = mesclar(persistido, atual);
        return {
          ...(mesclado ?? atual),
          avisoRecomeco: recomecouDoZero(),
          erroArmazenamento: mesclado === null || falhaAoAbrir() || guardaVersao.futura(),
        };
      },
    },
  ),
);

observarEscrita((falhou) => useMare.setState({ erroEscrita: falhou }));

const hidratado = () => useMare.persist.hasHydrated();
const aoHidratar = (fn: () => void) => useMare.persist.onFinishHydration(fn);

/** Espera os dados salvos carregarem antes de mostrar as telas. */
export const useHydrated = () => useSyncExternalStore(aoHidratar, hidratado);
