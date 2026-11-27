import type { StateStorage } from 'zustand/middleware';

/**
 * Envolve um armazenamento que pode não abrir (chave perdida, arquivo ilegível).
 * Se abrir ou ler falhar, `falhou()` vira `true`, a leitura devolve `null` (o app termina de
 * carregar) e as escritas viram no-op: nada sobrescreve o arquivo ilegível.
 * `reiniciar()` limpa a falha e tenta abrir de novo na próxima chamada.
 *
 * Uma escrita que falha (disco cheio, conexão fechada) não derruba o app nem vira erro solto:
 * `escritaFalhou()` fica `true` até a próxima escrita dar certo, e `aoMudarEscrita` avisa a tela.
 */
export function protegerArmazenamento(abrir: () => Promise<StateStorage>): {
  storage: StateStorage;
  falhou: () => boolean;
  reiniciar: () => void;
  escritaFalhou: () => boolean;
  aoMudarEscrita: (fn: (falhou: boolean) => void) => () => void;
} {
  let interno: Promise<StateStorage | null> | undefined;
  let falha = false;
  let geracao = 0;
  let falhaEscrita = false;
  const ouvintes = new Set<(falhou: boolean) => void>();
  const marcarEscrita = (falhou: boolean) => {
    if (falhou === falhaEscrita) return;
    falhaEscrita = falhou;
    for (const fn of ouvintes) fn(falhou);
  };

  const obter = () => {
    if (!interno) {
      const minha = geracao;
      interno = abrir().catch(() => {
        if (minha === geracao) falha = true;
        return null;
      });
    }
    return interno;
  };

  const storage: StateStorage = {
    getItem: async (nome) => {
      const base = await obter();
      if (!base || falha) return null;
      const minha = geracao;
      try {
        return await base.getItem(nome);
      } catch {
        if (minha === geracao) falha = true;
        return null;
      }
    },
    setItem: async (nome, valor) => {
      const base = await obter();
      if (!base || falha) return;
      try {
        await base.setItem(nome, valor);
        marcarEscrita(false);
      } catch {
        marcarEscrita(true);
      }
    },
    removeItem: async (nome) => {
      const base = await obter();
      if (base && !falha) await base.removeItem(nome);
    },
  };

  return {
    storage,
    falhou: () => falha,
    escritaFalhou: () => falhaEscrita,
    aoMudarEscrita: (fn) => {
      ouvintes.add(fn);
      return () => ouvintes.delete(fn);
    },
    reiniciar: () => {
      geracao += 1;
      interno = undefined;
      falha = false;
    },
  };
}
