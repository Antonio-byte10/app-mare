import { describe, expect, it } from 'vitest';
import { diaDePico, NOMES_DIAS, vontadePorDiaDaSemana } from './insights';
import type { Relato } from './tipos';

const relato = (dia: string, habitoId: string, vontade: number): Relato =>
  ({ dia, habitos: [{ habitoId, vontade, usou: false }] }) as Relato;

describe('vontadePorDiaDaSemana', () => {
  it('média por dia da semana, 0 = domingo', () => {
    const r = [relato('2026-11-20', 'a', 8), relato('2026-11-13', 'a', 6)];
    const m = vontadePorDiaDaSemana(r, 'a', '2026-11-26');
    expect(m).toHaveLength(7);
    expect(m[5]).toBe(7);
  });
  it('dias sem relato são null e outros hábitos são ignorados', () => {
    const r = [relato('2026-11-20', 'a', 8), relato('2026-11-21', 'b', 9)];
    const m = vontadePorDiaDaSemana(r, 'a', '2026-11-26');
    expect(m[6]).toBeNull();
    expect(m[0]).toBeNull();
  });
  it('só considera a janela de semanas*7 dias até hoje', () => {
    const r = [relato('2026-11-20', 'a', 8), relato('2026-09-25', 'a', 2), relato('2026-11-27', 'a', 1)];
    const m = vontadePorDiaDaSemana(r, 'a', '2026-11-26', 8);
    expect(m[5]).toBe(8);
  });
});

describe('diaDePico', () => {
  it('null com menos de 10 relatos', () => {
    expect(diaDePico([1, 2, 3, 4, 5, 6, 7], 9)).toBeNull();
  });
  it('índice da maior média; empate fica com o primeiro', () => {
    expect(diaDePico([1, 2, 9, 3, 9, 1, 0], 10)).toBe(2);
  });
  it('ignora null; tudo null dá null', () => {
    expect(diaDePico([null, 3, null, null, null, null, null], 12)).toBe(1);
    expect(diaDePico([null, null, null, null, null, null, null], 12)).toBeNull();
  });
});

it('NOMES_DIAS', () => {
  expect(NOMES_DIAS[0]).toBe('domingos');
  expect(NOMES_DIAS).toHaveLength(7);
});
