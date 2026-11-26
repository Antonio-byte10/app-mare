import { describe, expect, it } from 'vitest';
import {
  aplicarHabito,
  aplicarRelato,
  aplicarRemocaoHabito,
  estadoInicial,
  migrar,
} from './estado';
import type { Habito, Relato } from './tipos';

const habito = (id: string): Habito => ({
  id,
  tipo: 'tabaco',
  apelido: id,
  cor: 'aqua',
  meta: { tipo: 'parar' },
  inicio: '2026-01-01',
  criadoEm: 1,
});

const relato = (dia: string, ...ids: string[]): Relato => ({
  dia,
  habitos: ids.map((habitoId) => ({ habitoId, vontade: 3, usou: false })),
  gatilhos: [],
  salvoEm: 1,
});

describe('aplicarRelato', () => {
  it('substitui o relato do mesmo dia em vez de duplicar', () => {
    let e = aplicarRelato(estadoInicial(), relato('2026-02-01', 'a'));
    e = aplicarRelato(e, { ...relato('2026-02-01', 'a'), nota: 'novo' });
    expect(e.relatos).toHaveLength(1);
    expect(e.relatos[0].nota).toBe('novo');
  });

  it('normaliza a vontade 12 para 10', () => {
    const r = relato('2026-02-01', 'a');
    r.habitos[0].vontade = 12;
    const e = aplicarRelato(estadoInicial(), r);
    expect(e.relatos[0].habitos[0].vontade).toBe(10);
  });

  it('não altera o estado recebido', () => {
    const base = estadoInicial();
    aplicarRelato(base, relato('2026-02-01', 'a'));
    expect(base.relatos).toHaveLength(0);
  });
});

describe('aplicarHabito', () => {
  it('insere e depois substitui pelo id', () => {
    let e = aplicarHabito(estadoInicial(), habito('a'));
    e = aplicarHabito(e, { ...habito('a'), apelido: 'outro' });
    expect(e.habitos).toHaveLength(1);
    expect(e.habitos[0].apelido).toBe('outro');
  });
});

describe('aplicarRemocaoHabito', () => {
  it('apaga o hábito e as entradas dele, removendo relatos que ficarem vazios', () => {
    let e = estadoInicial();
    e = aplicarHabito(aplicarHabito(e, habito('a')), habito('b'));
    e = aplicarRelato(e, relato('2026-02-01', 'a'));
    e = aplicarRelato(e, relato('2026-02-02', 'a', 'b'));
    const depois = aplicarRemocaoHabito(e, 'a');
    expect(depois.habitos.map((h) => h.id)).toEqual(['b']);
    expect(depois.relatos).toHaveLength(1);
    expect(depois.relatos[0].dia).toBe('2026-02-02');
    expect(depois.relatos[0].habitos.map((x) => x.habitoId)).toEqual(['b']);
  });
});

describe('migrar', () => {
  it('versão desconhecida devolve o estado inicial, sem lançar erro', () => {
    expect(migrar({ versao: 1, habitos: [habito('a')] }, 99)).toEqual(estadoInicial());
  });

  it('estado inválido devolve o estado inicial, sem lançar erro', () => {
    expect(migrar(null, 1)).toEqual(estadoInicial());
    expect(migrar('lixo', 1)).toEqual(estadoInicial());
    expect(migrar({ habitos: 'x' }, 1)).toEqual(estadoInicial());
  });

  it('estado válido da versão 1 é mantido', () => {
    const e = aplicarRelato(aplicarHabito(estadoInicial(), habito('a')), relato('2026-02-01', 'a'));
    expect(migrar(e, 1)).toEqual(e);
  });
});
