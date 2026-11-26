import type { StateStorage } from 'zustand/middleware';
import { ehVersaoFutura } from './estado';

/**
 * Protege dados gravados por uma versão mais nova do app. Se o que está salvo tem `version`
 * maior que a atual, a leitura devolve `null` (o app não interpreta nem troca por vazio) e as
 * escritas viram no-op, para que um app antigo nunca sobrescreva dados que não entende.
 * Cada leitura reavalia: depois de apagar o armazenamento (`recomecarDoZero`) a trava some.
 */
export function protegerVersao(base: StateStorage): { storage: StateStorage; futura: () => boolean } {
  let futura = false;
  const storage: StateStorage = {
    getItem: async (nome) => {
      const bruto = await base.getItem(nome);
      futura = false;
      if (bruto === null) return null;
      try {
        const lido: unknown = JSON.parse(bruto);
        const versao = typeof lido === 'object' && lido !== null ? (lido as { version?: unknown }).version : undefined;
        if (typeof versao === 'number' && ehVersaoFutura(versao)) {
          futura = true;
          return null;
        }
      } catch {
        // Não é JSON: segue para o parse do store, que trata como dado ilegível.
      }
      return bruto;
    },
    setItem: async (nome, valor) => {
      if (!futura) await base.setItem(nome, valor);
    },
    removeItem: async (nome) => {
      if (!futura) await base.removeItem(nome);
    },
  };
  return { storage, futura: () => futura };
}
