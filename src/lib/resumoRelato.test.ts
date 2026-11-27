import { describe, expect, it } from 'vitest';
import { resumoDoRelato } from './resumoRelato';
import type { Rascunhos } from './relato';
import type { Habito } from './tipos';

const habito = (id: string, apelido: string, meta: Habito['meta'] = { tipo: 'parar' }): Habito => ({
  id,
  tipo: 'tabaco',
  apelido,
  cor: 'aqua',
  meta,
  inicio: '2026-11-01',
  criadoEm: 0,
});

const resp = (extra: Partial<Rascunhos[string]> = {}): Rascunhos[string] => ({
  respondido: true,
  vontade: 0,
  usou: false,
  quantidade: '',
  ...extra,
});

describe('resumoDoRelato', () => {
  it('um hábito pré-respondido: "Hoje: sem uso, vontade 0"', () => {
    expect(resumoDoRelato([habito('a', 'Fôlego')], { a: resp() }, true)).toBe('Hoje: sem uso, vontade 0');
  });

  it('dia passado diz "Nesse dia"', () => {
    expect(resumoDoRelato([habito('a', 'Fôlego')], { a: resp({ usou: true, vontade: 6 }) }, false)).toBe(
      'Nesse dia: usou, vontade 6',
    );
  });

  it('com mais de um hábito leva o apelido e deixa de fora os não respondidos', () => {
    const hs = [habito('a', 'Fôlego'), habito('b', 'Foco'), habito('c', 'Calma')];
    const rs: Rascunhos = {
      a: resp(),
      b: resp({ usou: true, vontade: 4 }),
      c: resp({ respondido: false }),
    };
    expect(resumoDoRelato(hs, rs, true)).toBe('Hoje: Fôlego sem uso, vontade 0 · Foco usou, vontade 4');
  });

  it('meta reduzir: mostra a quantidade quando válida', () => {
    const h = habito('a', 'Fôlego', { tipo: 'reduzir', maxPorDia: 3, unidade: 'cigarros' });
    expect(resumoDoRelato([h], { a: resp({ usou: true, vontade: 5, quantidade: ' 2 ' }) }, true)).toBe(
      'Hoje: usou 2 cigarros, vontade 5',
    );
    expect(resumoDoRelato([h], { a: resp({ usou: true, quantidade: '' }) }, true)).toBe('Hoje: usou, vontade 0');
  });

  it('nada respondido: null', () => {
    expect(resumoDoRelato([habito('a', 'Fôlego')], { a: resp({ respondido: false }) }, true)).toBeNull();
  });
});
