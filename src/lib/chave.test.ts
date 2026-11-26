import { describe, expect, it, vi } from 'vitest';
import { obterChave, type Cofre } from './chave';

function cofreFalso(inicial: Record<string, string> = {}): Cofre & { dados: Map<string, string> } {
  const dados = new Map(Object.entries(inicial));
  return {
    dados,
    ler: async (nome) => dados.get(nome) ?? null,
    gravar: async (nome, valor) => {
      dados.set(nome, valor);
    },
  };
}

describe('obterChave', () => {
  it('sem chave e sem banco: gera, grava e não recomeça', async () => {
    const cofre = cofreFalso();
    const gerar = vi.fn(() => 'chave-nova');
    const r = await obterChave(cofre, false, gerar);
    expect(r).toEqual({ chave: 'chave-nova', recomecou: false });
    expect(gerar).toHaveBeenCalledTimes(1);
    expect(cofre.dados.get('mare.db.key')).toBe('chave-nova');
  });

  it('chave existente: devolve a mesma, sem chamar gerar', async () => {
    const cofre = cofreFalso({ 'mare.db.key': 'chave-antiga' });
    const gerar = vi.fn(() => 'outra');
    const r = await obterChave(cofre, true, gerar);
    expect(r).toEqual({ chave: 'chave-antiga', recomecou: false });
    expect(gerar).not.toHaveBeenCalled();
  });

  it('sem chave mas com banco existente: gera nova chave e recomeça', async () => {
    const cofre = cofreFalso();
    const r = await obterChave(cofre, true, () => 'chave-nova');
    expect(r).toEqual({ chave: 'chave-nova', recomecou: true });
    expect(cofre.dados.get('mare.db.key')).toBe('chave-nova');
  });
});
