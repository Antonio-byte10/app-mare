import { describe, expect, it, vi } from 'vitest';
import { protegerArmazenamento } from './protegido';
import type { StateStorage } from 'zustand/middleware';

function interno(dados: Record<string, string> = {}): StateStorage & { dados: Record<string, string> } {
  return {
    dados,
    getItem: async (n) => dados[n] ?? null,
    setItem: async (n, v) => {
      dados[n] = v;
    },
    removeItem: async (n) => {
      delete dados[n];
    },
  };
}

describe('protegerArmazenamento', () => {
  it('abre uma vez e repassa leitura e escrita', async () => {
    const base = interno({ a: '1' });
    const abrir = vi.fn(async () => base);
    const { storage, falhou } = protegerArmazenamento(abrir);
    expect(await storage.getItem('a')).toBe('1');
    await storage.setItem('b', '2');
    await storage.removeItem('a');
    expect(base.dados).toEqual({ b: '2' });
    expect(abrir).toHaveBeenCalledTimes(1);
    expect(falhou()).toBe(false);
  });

  it('se abrir falha: getItem devolve null, escrita vira no-op e falhou() fica true', async () => {
    const { storage, falhou } = protegerArmazenamento(async () => {
      throw new Error('file is not a database');
    });
    expect(await storage.getItem('a')).toBeNull();
    await expect(storage.setItem('a', '1')).resolves.toBeUndefined();
    await expect(storage.removeItem('a')).resolves.toBeUndefined();
    expect(falhou()).toBe(true);
  });

  it('se a leitura falha depois de abrir: devolve null e não escreve mais nada', async () => {
    const base = interno({ a: '1' });
    base.getItem = async () => {
      throw new Error('boom');
    };
    const { storage, falhou } = protegerArmazenamento(async () => base);
    expect(await storage.getItem('a')).toBeNull();
    expect(falhou()).toBe(true);
    await storage.setItem('a', 'novo');
    await storage.removeItem('a');
    expect(base.dados).toEqual({ a: '1' });
  });

  it('reiniciar() limpa a falha e tenta abrir de novo', async () => {
    let tentativas = 0;
    const base = interno();
    const { storage, falhou, reiniciar } = protegerArmazenamento(async () => {
      tentativas += 1;
      if (tentativas === 1) throw new Error('falha');
      return base;
    });
    expect(await storage.getItem('a')).toBeNull();
    expect(falhou()).toBe(true);
    reiniciar();
    expect(falhou()).toBe(false);
    await storage.setItem('a', '1');
    expect(base.dados).toEqual({ a: '1' });
    expect(tentativas).toBe(2);
  });

  it('escrita que falha não vira erro solto: avisa, e avisa de novo quando volta a dar certo', async () => {
    const base = interno();
    let cheio = true;
    const setOriginal = base.setItem;
    base.setItem = async (nome, valor) => {
      if (cheio) throw new Error('SQLITE_FULL');
      return setOriginal(nome, valor);
    };
    const { storage, escritaFalhou, aoMudarEscrita, falhou } = protegerArmazenamento(async () => base);
    const avisos: boolean[] = [];
    aoMudarEscrita((f) => avisos.push(f));
    await expect(storage.setItem('a', '1')).resolves.toBeUndefined();
    await storage.setItem('a', '2');
    expect(escritaFalhou()).toBe(true);
    expect(falhou()).toBe(false);
    cheio = false;
    await storage.setItem('a', '3');
    expect(escritaFalhou()).toBe(false);
    expect(avisos).toEqual([true, false]);
    expect(base.dados).toEqual({ a: '3' });
  });
});
