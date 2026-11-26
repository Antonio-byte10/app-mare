import { describe, expect, it } from 'vitest';
import { colunasMarcos, progressoMarco, rotuloUnidades, tituloMarco } from './marcosTela';
import type { Habito } from './tipos';

const habito = (extra: Partial<Habito> = {}): Habito => ({
  id: 'h1',
  tipo: 'tabaco',
  apelido: 'Fôlego',
  cor: 'aqua',
  meta: { tipo: 'parar' },
  inicio: '2026-10-01',
  custoPorDiaCentavos: 454,
  unidadesPorDia: 8,
  criadoEm: 0,
  ...extra,
});

describe('rotuloUnidades', () => {
  it('rotula por tipo e esconde no sexual', () => {
    expect(rotuloUnidades('tabaco')).toBe('cigarros a menos');
    expect(rotuloUnidades('alcool')).toBe('doses a menos');
    expect(rotuloUnidades('sexual')).toBeNull();
  });
});

describe('colunasMarcos', () => {
  it('tabaco: fissuras 0, cigarros e economia', () => {
    const c = colunasMarcos(habito(), 41);
    expect(c.map((x) => x.rotulo)).toEqual(['fissuras vencidas', 'cigarros a menos', 'no bolso']);
    expect(c[0].valor).toBe('0');
    expect(c[1].valor).toBe('328');
    expect(c[2].cor).toBe('sand');
  });
  it('álcool usa doses', () => {
    expect(colunasMarcos(habito({ tipo: 'alcool' }), 3)[1].rotulo).toBe('doses a menos');
  });
  it('sexual tem só fissuras e economia', () => {
    const c = colunasMarcos(habito({ tipo: 'sexual' }), 10);
    expect(c.map((x) => x.rotulo)).toEqual(['fissuras vencidas', 'no bolso']);
  });
  it('sem custo nem unidades mostra travessão', () => {
    const c = colunasMarcos(habito({ custoPorDiaCentavos: undefined, unidadesPorDia: undefined }), 5);
    expect(c[1].valor).toBe('—');
    expect(c[2].valor).toBe('—');
  });
});

describe('tituloMarco', () => {
  it('atual mostra quantos dias faltam', () => {
    expect(tituloMarco(14, 'atual', 12, false)).toBe('2 semanas · faltam 2 dias');
    expect(tituloMarco(14, 'atual', 13, false)).toBe('2 semanas · falta 1 dia');
  });
  it('números ocultos ou outros estados só trazem o nome', () => {
    expect(tituloMarco(14, 'atual', 12, true)).toBe('2 semanas');
    expect(tituloMarco(7, 'atingido', 12, false)).toBe('1 semana');
    expect(tituloMarco(30, 'futuro', 12, false)).toBe('1 mês');
  });
});

describe('progressoMarco', () => {
  it('é sequência dividida pelos dias do marco, entre 0 e 1', () => {
    expect(progressoMarco(14, 12)).toBeCloseTo(12 / 14);
    expect(progressoMarco(14, 0)).toBe(0);
    expect(progressoMarco(14, 20)).toBe(1);
  });
});
