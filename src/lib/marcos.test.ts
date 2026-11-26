import { describe, expect, it } from 'vitest';
import { textoMarco } from '../conteudo/marcos';
import { MARCOS, economia, estadoMarco, nomeMarco, proximoMarco } from './marcos';
import type { Habito, TipoHabito } from './tipos';

const habito = (extra: Partial<Habito> = {}): Habito => ({
  id: 'h1',
  tipo: 'tabaco',
  apelido: 'Cigarro',
  cor: 'aqua',
  meta: { tipo: 'parar' },
  inicio: '2026-11-01',
  criadoEm: 0,
  ...extra,
});

describe('MARCOS', () => {
  it('tem os valores combinados', () => {
    expect(MARCOS).toEqual([1, 3, 7, 14, 30, 90, 180, 365]);
  });
});

describe('estadoMarco', () => {
  it('marca o próximo marco como atual', () => {
    expect(estadoMarco(14, 12, 19)).toBe('atual');
  });
  it('marca marcos já cumpridos como atingidos', () => {
    expect(estadoMarco(7, 12, 19)).toBe('atingido');
  });
  it('não pune quem já chegou lá antes', () => {
    expect(estadoMarco(14, 2, 19)).toBe('jaAlcancado');
  });
  it('marca marcos distantes como futuros', () => {
    expect(estadoMarco(30, 12, 19)).toBe('futuro');
  });
});

describe('proximoMarco', () => {
  it('devolve o próximo marco e quantos dias faltam', () => {
    expect(proximoMarco(12)).toEqual({ dias: 14, faltam: 2 });
    expect(proximoMarco(0)).toEqual({ dias: 1, faltam: 1 });
  });
  it('devolve null depois do último marco', () => {
    expect(proximoMarco(365)).toBeNull();
    expect(proximoMarco(400)).toBeNull();
  });
});

describe('nomeMarco', () => {
  it('nomeia cada marco', () => {
    expect(MARCOS.map(nomeMarco)).toEqual([
      '24 horas',
      '3 dias',
      '1 semana',
      '2 semanas',
      '1 mês',
      '3 meses',
      '6 meses',
      '1 ano',
    ]);
  });
});

describe('economia', () => {
  it('multiplica custo e unidades pelos dias livres', () => {
    const h = habito({ custoPorDiaCentavos: 1550, unidadesPorDia: 8 });
    expect(economia(h, 12)).toEqual({ centavos: 18600, unidades: 96 });
  });
  it('devolve zero sem custo informado', () => {
    expect(economia(habito(), 12)).toEqual({ centavos: 0, unidades: 0 });
  });
});

describe('textoMarco', () => {
  it('tabaco no primeiro dia fala do monóxido de carbono', () => {
    expect(textoMarco('tabaco', 1)).toContain('monóxido de carbono');
  });
  it('todo texto existe e não tem emoji', () => {
    const tipos: TipoHabito[] = ['tabaco', 'alcool', 'sexual'];
    for (const tipo of tipos) {
      for (const dias of MARCOS) {
        const t = textoMarco(tipo, dias);
        expect(t.length).toBeGreaterThan(0);
        expect(t).not.toMatch(/\p{Extended_Pictographic}/u);
      }
    }
  });
});
