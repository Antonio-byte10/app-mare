/** Fluxo completo do store (persist + guarda de versão + migrar/mesclar) sobre um armazenamento em memória. */
import { describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { aplicarHabito, estadoInicial, mesclar, migrar, paraPersistir, VERSAO_ESTADO, type EstadoPersistido } from './estado';
import { protegerVersao } from './guardaVersao';
import type { Habito } from './tipos';

const habito: Habito = {
  id: 'a',
  tipo: 'tabaco',
  apelido: 'Fôlego',
  cor: 'aqua',
  meta: { tipo: 'parar' },
  inicio: '2026-01-01',
  criadoEm: 1,
};

type S = EstadoPersistido & { erro: boolean; salvar: (h: Habito) => void };

function montar(dados: Record<string, string>) {
  const base: StateStorage = {
    getItem: (n) => dados[n] ?? null,
    setItem: (n, v) => {
      dados[n] = v;
    },
    removeItem: (n) => {
      delete dados[n];
    },
  };
  const guarda = protegerVersao(base);
  const store = create<S>()(
    persist(
      (set) => ({
        ...estadoInicial(),
        erro: false,
        salvar: (h) => set((e) => aplicarHabito(e, h)),
      }),
      {
        name: 'mare',
        version: VERSAO_ESTADO,
        storage: createJSONStorage(() => guarda.storage),
        partialize: (e): EstadoPersistido => paraPersistir(e, ['erro']),
        migrate: (p, v) => migrar(p, v) ?? estadoInicial(),
        merge: (p, atual) => {
          const m = mesclar(p, atual);
          return { ...(m ?? atual), erro: m === null || guarda.futura() };
        },
      },
    ),
  );
  return store;
}

const pronto = async (store: ReturnType<typeof montar>) => {
  await store.persist.rehydrate();
};

describe('persistência do store', () => {
  it('dados de versão futura não viram vazio, acendem o erro e não são sobrescritos', async () => {
    const futuro = JSON.stringify({ state: { habitos: [habito], relatos: [], novo: 1 }, version: VERSAO_ESTADO + 1 });
    const dados = { mare: futuro };
    const store = montar(dados);
    await pronto(store);
    expect(store.getState().erro).toBe(true);
    store.getState().salvar({ ...habito, id: 'b' });
    await Promise.resolve();
    expect(dados.mare).toBe(futuro);
  });

  it('campo extra salvo sobrevive a ler e gravar de novo', async () => {
    const dados = {
      mare: JSON.stringify({ state: { ...estadoInicial(), campoNovo: { x: 1 } }, version: VERSAO_ESTADO }),
    };
    const store = montar(dados);
    await pronto(store);
    expect(store.getState().erro).toBe(false);
    store.getState().salvar(habito);
    await new Promise((r) => setTimeout(r, 0));
    const gravado = JSON.parse(dados.mare);
    expect(gravado.state.campoNovo).toEqual({ x: 1 });
    expect(gravado.state.habitos).toHaveLength(1);
    expect(gravado.state.erro).toBeUndefined();
    expect(gravado.state.salvar).toBeUndefined();
  });

  it('depois de apagar o armazenamento e reler, o erro some e dá para gravar', async () => {
    const dados: Record<string, string> = {
      mare: JSON.stringify({ state: estadoInicial(), version: VERSAO_ESTADO + 1 }),
    };
    const store = montar(dados);
    await pronto(store);
    expect(store.getState().erro).toBe(true);
    delete dados.mare;
    await pronto(store);
    expect(store.getState().erro).toBe(false);
    store.getState().salvar(habito);
    await new Promise((r) => setTimeout(r, 0));
    expect(JSON.parse(dados.mare).version).toBe(VERSAO_ESTADO);
  });
});
