import type { StateStorage } from 'zustand/middleware';

// Somente desenvolvimento: no navegador os dados ficam em localStorage, sem criptografia.
// O app de verdade é só Android.
export function criarArmazenamento(): StateStorage {
  return {
    getItem: (nome) => localStorage.getItem(nome),
    setItem: (nome, valor) => localStorage.setItem(nome, valor),
    removeItem: (nome) => localStorage.removeItem(nome),
  };
}

export function recomecouDoZero(): boolean {
  return false;
}

export function falhaAoAbrir(): boolean {
  return false;
}

/** Mesmo `name` do persist em store.ts. */
export async function recomecarDoZero(): Promise<void> {
  localStorage.removeItem('mare');
}
