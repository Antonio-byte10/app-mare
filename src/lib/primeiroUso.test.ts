import { describe, expect, it } from 'vitest';
import { alternarTipo, errosDoRascunho, montarHabito, proximaDepoisDaAvaliacao, rascunhoPadrao, temErros } from './primeiroUso';

describe('rascunhoPadrao', () => {
  it('sugere apelido discreto e cor por tipo', () => {
    expect(rascunhoPadrao('tabaco')).toMatchObject({ apelido: 'Fôlego', cor: 'aqua', unidade: 'cigarros', comecou: 'hoje' });
    expect(rascunhoPadrao('alcool')).toMatchObject({ apelido: 'Calmaria', cor: 'peri', unidade: 'doses' });
    expect(rascunhoPadrao('sexual')).toMatchObject({ apelido: 'Foco', unidade: 'vezes' });
  });
});

describe('alternarTipo', () => {
  it('adiciona na ordem fixa e remove ao tocar de novo', () => {
    let l = alternarTipo([], 'sexual');
    l = alternarTipo(l, 'tabaco');
    expect(l.map((r) => r.tipo)).toEqual(['tabaco', 'sexual']);
    l = alternarTipo(l, 'tabaco');
    expect(l.map((r) => r.tipo)).toEqual(['sexual']);
  });
  it('não perde o apelido editado dos outros', () => {
    let l = alternarTipo([], 'tabaco');
    l = l.map((r) => ({ ...r, apelido: 'Ar' }));
    l = alternarTipo(l, 'alcool');
    expect(l.find((r) => r.tipo === 'tabaco')?.apelido).toBe('Ar');
  });
});

describe('errosDoRascunho', () => {
  it('rascunho padrão não tem erro', () => {
    expect(temErros(errosDoRascunho(rascunhoPadrao('tabaco')))).toBe(false);
  });
  it('apelido vazio ou repetido', () => {
    const a = { ...rascunhoPadrao('tabaco'), apelido: ' ' };
    expect(errosDoRascunho(a).apelido).toBeTruthy();
    const b = { ...rascunhoPadrao('alcool'), apelido: 'Foco' };
    const c = rascunhoPadrao('sexual');
    expect(errosDoRascunho(b, [b, c]).apelido).toMatch(/Já existe/);
    expect(errosDoRascunho(c, [b, c]).apelido).toMatch(/Já existe/);
  });
  it('reduzir pede limite e unidade', () => {
    const r = { ...rascunhoPadrao('alcool'), reduzir: true, unidade: ' ' };
    const e = errosDoRascunho(r);
    expect(e.maxPorDia).toBeTruthy();
    expect(e.unidade).toBeTruthy();
    expect(temErros(errosDoRascunho({ ...r, maxPorDia: '2', unidade: 'doses' }))).toBe(false);
  });
  it('"Já estou há N dias" pede um número', () => {
    const r = { ...rascunhoPadrao('tabaco'), comecou: 'ja' as const };
    expect(errosDoRascunho(r).diasAntes).toBeTruthy();
    expect(errosDoRascunho({ ...r, diasAntes: '0' }).diasAntes).toBeTruthy();
    expect(errosDoRascunho({ ...r, diasAntes: 'x' }).diasAntes).toBeTruthy();
    expect(errosDoRascunho({ ...r, diasAntes: '12' }).diasAntes).toBeUndefined();
  });
  it('dias de antes não importam quando começou hoje', () => {
    expect(temErros(errosDoRascunho({ ...rascunhoPadrao('tabaco'), diasAntes: 'lixo' }))).toBe(false);
  });
});

describe('montarHabito', () => {
  it('hoje: início de hoje, sem dias de antes', () => {
    const h = montarHabito({ ...rascunhoPadrao('tabaco'), apelido: ' Ar ' }, 'id1', '2026-11-26', 7);
    expect(h).toEqual({
      id: 'id1',
      tipo: 'tabaco',
      apelido: 'Ar',
      cor: 'aqua',
      meta: { tipo: 'parar' },
      inicio: '2026-11-26',
      criadoEm: 7,
    });
    expect('diasAntes' in h).toBe(false);
  });
  it('já estou há N dias: grava diasAntes', () => {
    const h = montarHabito({ ...rascunhoPadrao('alcool'), comecou: 'ja', diasAntes: '30' }, 'id2', '2026-11-26', 1);
    expect(h.diasAntes).toBe(30);
    expect(h.inicio).toBe('2026-11-26');
  });
  it('reduzir: limite e unidade', () => {
    const h = montarHabito({ ...rascunhoPadrao('alcool'), reduzir: true, maxPorDia: '2' }, 'id3', '2026-11-26', 1);
    expect(h.meta).toEqual({ tipo: 'reduzir', maxPorDia: 2, unidade: 'doses' });
  });
});

describe('proximaDepoisDaAvaliacao', () => {
  it('com álcool, passa pelo aviso de segurança; sem álcool, vai direto aos porquês', () => {
    expect(proximaDepoisDaAvaliacao([{ tipo: 'tabaco' }, { tipo: 'alcool' }])).toBe('/boas-vindas/seguranca');
    expect(proximaDepoisDaAvaliacao([{ tipo: 'tabaco' }, { tipo: 'sexual' }])).toBe('/boas-vindas/porques');
  });
});
