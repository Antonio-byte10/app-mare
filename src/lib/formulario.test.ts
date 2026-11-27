import { describe, expect, it } from 'vitest';
import {
  brParaIso,
  diasAntesDeTexto,
  inteiroPositivo,
  isoParaBr,
  paraCentavos,
  recalculaHistorico,
  validarInicio,
} from './formulario';
import type { Habito } from './tipos';

describe('paraCentavos', () => {
  it('converte reais em centavos', () => {
    expect(paraCentavos('15,50').valor).toBe(1550);
    expect(paraCentavos('15.5').valor).toBe(1550);
    expect(paraCentavos('R$ 20').valor).toBe(2000);
    expect(paraCentavos('1.234,56').valor).toBe(123456);
    expect(paraCentavos('0,05').valor).toBe(5);
  });
  it('vazio é opcional', () => {
    expect(paraCentavos('  ')).toEqual({ valor: undefined });
  });
  it('rejeita inválido', () => {
    for (const t of ['abc', '1,234', '-3', '1,2,3']) expect(paraCentavos(t).erro).toBeTruthy();
  });
});

describe('datas do formulário', () => {
  it('converte nos dois sentidos', () => {
    expect(brParaIso('24/11/2026').valor).toBe('2026-11-24');
    expect(isoParaBr('2026-11-24')).toBe('24/11/2026');
  });
  it('rejeita formato e data inexistente', () => {
    expect(brParaIso('2026-11-24').erro).toBeTruthy();
    expect(brParaIso('30/02/2026').erro).toBeTruthy();
  });
  it('rejeita data futura, aceita hoje', () => {
    expect(validarInicio('27/11/2026', '2026-11-26').erro).toBeTruthy();
    expect(validarInicio('26/11/2026', '2026-11-26').valor).toBe('2026-11-26');
    expect(validarInicio('01/01/2020', '2026-11-26').valor).toBe('2020-01-01');
  });
  it('rejeita início de mais de 20 anos atrás (travaria o contador)', () => {
    expect(validarInicio('01/01/1900', '2026-11-26').erro).toBeTruthy();
    expect(validarInicio('25/11/2006', '2026-11-26').erro).toBeTruthy();
    expect(validarInicio('26/11/2006', '2026-11-26').valor).toBe('2006-11-26');
  });
});

describe('inteiroPositivo', () => {
  it('trata opcional e obrigatório', () => {
    expect(inteiroPositivo('')).toEqual({ valor: undefined });
    expect(inteiroPositivo('', true).erro).toBeTruthy();
    expect(inteiroPositivo('0').erro).toBeTruthy();
    expect(inteiroPositivo('3.5').erro).toBeTruthy();
    expect(inteiroPositivo('12').valor).toBe(12);
  });
});

describe('recalculaHistorico', () => {
  const base: Habito = {
    id: 'a',
    tipo: 'tabaco',
    apelido: 'Fôlego',
    cor: 'aqua',
    meta: { tipo: 'reduzir', maxPorDia: 5, unidade: 'cigarros' },
    inicio: '2026-11-01',
    custoPorDiaCentavos: 1000,
    unidadesPorDia: 10,
    criadoEm: 1,
  };
  it('apelido, cor, custo, unidades e unidade da meta não mexem nos dias anteriores', () => {
    expect(
      recalculaHistorico(base, {
        ...base,
        apelido: 'Outro',
        cor: 'peri',
        custoPorDiaCentavos: 2000,
        unidadesPorDia: 20,
        meta: { tipo: 'reduzir', maxPorDia: 5, unidade: 'cigarrilhas' },
      }),
    ).toBe(false);
  });
  it('mudar a meta ou o tipo não reescreve o passado', () => {
    expect(recalculaHistorico(base, { ...base, meta: { tipo: 'reduzir', maxPorDia: 3, unidade: 'cigarros' } })).toBe(false);
    expect(recalculaHistorico(base, { ...base, meta: { tipo: 'parar' } })).toBe(false);
    expect(recalculaHistorico(base, { ...base, tipo: 'alcool' })).toBe(false);
  });
  it('só mudar o início muda quais dias contam', () => {
    expect(recalculaHistorico(base, { ...base, inicio: '2026-10-01' })).toBe(true);
  });
});

describe('diasAntesDeTexto', () => {
  it('vazio ou zero não é erro: não há dias antes', () => {
    expect(diasAntesDeTexto('')).toEqual({ valor: undefined });
    expect(diasAntesDeTexto('  ')).toEqual({ valor: undefined });
    expect(diasAntesDeTexto('0')).toEqual({ valor: undefined });
  });
  it('aceita número inteiro de dias', () => {
    expect(diasAntesDeTexto('12').valor).toBe(12);
    expect(diasAntesDeTexto(' 3650 ').valor).toBe(3650);
  });
  it('rejeita texto, decimal, negativo e exagero', () => {
    for (const t of ['abc', '1,5', '-2', '3651']) expect(diasAntesDeTexto(t).erro).toBeTruthy();
  });
});
