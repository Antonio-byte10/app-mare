import { describe, expect, it } from 'vitest';
import { alternarItem, deslizesSemRecomeco, INICIO_CONVERSA_RECOMECO, montarRecomeco, recomecoExistente, sugestaoPlano } from './recomeco';

describe('alternarItem', () => {
  it('liga e desliga sem mexer na lista original', () => {
    const base = ['a'];
    expect(alternarItem(base, 'b')).toEqual(['a', 'b']);
    expect(alternarItem(['a', 'b'], 'a')).toEqual(['b']);
    expect(base).toEqual(['a']);
  });
});

describe('montarRecomeco', () => {
  const base = { id: 'r', dia: '2026-11-25', habitoId: 'h', gatilhos: ['Tédio'], halt: ['fome' as const], agora: 5 };
  it('apara os textos e omite os vazios', () => {
    expect(montarRecomeco({ ...base, oQueAcontecia: '  sozinho em casa ', proximaVez: '' })).toEqual({
      id: 'r',
      dia: '2026-11-25',
      habitoId: 'h',
      gatilhos: ['Tédio'],
      halt: ['fome'],
      oQueAcontecia: 'sozinho em casa',
      salvoEm: 5,
    });
  });
});

describe('sugestaoPlano', () => {
  it('usa o primeiro gatilho e a próxima vez escrita', () => {
    expect(sugestaoPlano({ gatilhos: ['Ansiedade'], halt: [], proximaVez: ' respirar fundo ' })).toEqual({
      se: 'eu sentir ansiedade',
      entao: 'respirar fundo',
    });
  });
  it('sem gatilho, cai no HALT; sem nada, vem vazio', () => {
    expect(sugestaoPlano({ gatilhos: [], halt: ['raiva'], proximaVez: undefined }).se).toBe('eu estiver com raiva');
    expect(sugestaoPlano({ gatilhos: [], halt: [], proximaVez: undefined })).toEqual({ se: '', entao: '' });
  });
  it('gatilho que a pessoa criou também entra', () => {
    expect(sugestaoPlano({ gatilhos: ['Reunião'], halt: [], proximaVez: 'x' }).se).toBe('acontecer: reunião');
  });
});

describe('recomecoExistente', () => {
  const r = (id: string, dia: string, habitoId: string) => ({ id, dia, habitoId, gatilhos: [], halt: [], salvoEm: 0 });
  it('acha o recomeço do mesmo dia e hábito', () => {
    const lista = [r('1', '2026-11-25', 'a'), r('2', '2026-11-25', 'b')];
    expect(recomecoExistente(lista, '2026-11-25', 'b')?.id).toBe('2');
    expect(recomecoExistente(lista, '2026-11-24', 'a')).toBeUndefined();
  });
  it('o início da conversa com a IA não leva nomes', () => {
    expect(INICIO_CONVERSA_RECOMECO).not.toMatch(/[A-Z]\w+ (disse|é)/);
    expect(INICIO_CONVERSA_RECOMECO.length).toBeLessThan(100);
  });
});

describe('deslizesSemRecomeco', () => {
  const h = (id: string) => ({ id, tipo: 'tabaco' as const, apelido: id, cor: 'aqua' as const, meta: { tipo: 'parar' as const }, inicio: '2026-11-01', criadoEm: 1 });
  const relato = {
    dia: '2026-11-20',
    habitos: [
      { habitoId: 'a', vontade: 5, usou: true },
      { habitoId: 'b', vontade: 2, usou: false },
      { habitoId: 'c', vontade: 7, usou: true },
    ],
    gatilhos: [],
    salvoEm: 1,
  };
  it('lista os deslizes do dia que ainda não tiveram recomeço', () => {
    const feito = { id: 'r', dia: '2026-11-20', habitoId: 'c', gatilhos: [], halt: [], salvoEm: 1 };
    expect(deslizesSemRecomeco([h('a'), h('b'), h('c')], relato, [feito], '2026-11-20')).toEqual(['a']);
    expect(deslizesSemRecomeco([h('a')], undefined, [], '2026-11-20')).toEqual([]);
  });
});
