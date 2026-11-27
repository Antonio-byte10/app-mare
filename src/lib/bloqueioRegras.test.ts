import { describe, expect, it } from 'vitest';
import { deveBloquear, formatarEspera } from './bloqueioRegras';

const MIN = 60_000;

describe('deveBloquear', () => {
  it('desligado nunca bloqueia', () => {
    expect(deveBloquear({ ligado: false, aposMinutos: 0 }, 0, 10 * MIN)).toBe(false);
    expect(deveBloquear({ ligado: false, aposMinutos: 0 }, null, 10 * MIN)).toBe(false);
  });
  it('imediatamente: qualquer saída bloqueia', () => {
    expect(deveBloquear({ ligado: true, aposMinutos: 0 }, 1000, 1000)).toBe(true);
    expect(deveBloquear({ ligado: true, aposMinutos: 0 }, 1000, 1001)).toBe(true);
  });
  it('só bloqueia quando o tempo fora chega ao escolhido', () => {
    const cfg = { ligado: true, aposMinutos: 5 };
    expect(deveBloquear(cfg, 0, 4 * MIN + 59_999)).toBe(false);
    expect(deveBloquear(cfg, 0, 5 * MIN)).toBe(true);
    expect(deveBloquear(cfg, 0, 20 * MIN)).toBe(true);
  });
  it('sem saber quando saiu, ou com o relógio atrasado, bloqueia', () => {
    expect(deveBloquear({ ligado: true, aposMinutos: 15 }, null, 0)).toBe(true);
    expect(deveBloquear({ ligado: true, aposMinutos: 15 }, 10 * MIN, 5 * MIN)).toBe(true);
  });
});

describe('formatarEspera', () => {
  it('formata minutos e segundos, arredondando para cima', () => {
    expect(formatarEspera(30_000)).toBe('0:30');
    expect(formatarEspera(29_100)).toBe('0:30');
    expect(formatarEspera(65_000)).toBe('1:05');
    expect(formatarEspera(900_000)).toBe('15:00');
    expect(formatarEspera(-5)).toBe('0:00');
  });
});
