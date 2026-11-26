import { describe, expect, it } from 'vitest';
import type { StateStorage } from 'zustand/middleware';
import { protegerVersao } from './guardaVersao';

function memoria(inicial: Record<string, string> = {}) {
  const dados = { ...inicial };
  const storage: StateStorage = {
    getItem: (n) => dados[n] ?? null,
    setItem: (n, v) => {
      dados[n] = v;
    },
    removeItem: (n) => {
      delete dados[n];
    },
  };
  return { dados, storage };
}

const salvo = (version: number) => JSON.stringify({ state: { habitos: [{ id: 'a' }] }, version });

describe('protegerVersao', () => {
  it('versão atual passa direto, sem trava', async () => {
    const { storage, dados } = memoria({ mare: salvo(1) });
    const g = protegerVersao(storage);
    expect(await g.storage.getItem('mare')).toBe(salvo(1));
    expect(g.futura()).toBe(false);
    await g.storage.setItem('mare', salvo(1).replace('"id":"a"', '"id":"b"'));
    expect(dados.mare).toContain('"b"');
  });

  it('versão futura: leitura devolve null, marca a trava e nada é gravado nem removido', async () => {
    const { storage, dados } = memoria({ mare: salvo(2) });
    const g = protegerVersao(storage);
    expect(await g.storage.getItem('mare')).toBeNull();
    expect(g.futura()).toBe(true);
    await g.storage.setItem('mare', salvo(1));
    await g.storage.removeItem('mare');
    expect(dados.mare).toBe(salvo(2));
  });

  it('depois de apagar o armazenamento, a próxima leitura libera as escritas', async () => {
    const { storage, dados } = memoria({ mare: salvo(2) });
    const g = protegerVersao(storage);
    await g.storage.getItem('mare');
    delete dados.mare; // recomecarDoZero
    expect(await g.storage.getItem('mare')).toBeNull();
    expect(g.futura()).toBe(false);
    await g.storage.setItem('mare', salvo(1));
    expect(dados.mare).toBe(salvo(1));
  });

  it('vazio ou texto que não é JSON seguem para o store', async () => {
    const { storage } = memoria({ lixo: 'não é json' });
    const g = protegerVersao(storage);
    expect(await g.storage.getItem('nada')).toBeNull();
    expect(await g.storage.getItem('lixo')).toBe('não é json');
    expect(g.futura()).toBe(false);
  });
});
