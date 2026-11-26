import { describe, expect, it } from 'vitest';
import { textoMarco } from '../conteudo/marcos';
import { MARCOS, economia, estadoMarco, nomeMarco, proximoMarco } from './marcos';
import type { Habito, Relato, TipoHabito } from './tipos';

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
  const rel = (dia: string, usou: boolean, quantidade?: number): Relato => ({
    dia,
    habitos: [{ habitoId: 'h1', vontade: 0, usou, ...(quantidade !== undefined ? { quantidade } : {}) }],
    gatilhos: [],
    salvoEm: 0,
  });
  const dias = (n: number) => Array.from({ length: n }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`);
  const HOJE = '2026-11-30';

  it('parar: multiplica custo e unidades pelos dias livres', () => {
    const h = habito({ custoPorDiaCentavos: 1550, unidadesPorDia: 8 });
    const relatos = dias(12).map((d) => rel(d, false));
    expect(economia(h, relatos, HOJE)).toEqual({ centavos: 18600, unidades: 96 });
  });
  it('parar: dia com deslize não economiza', () => {
    const h = habito({ custoPorDiaCentavos: 1000, unidadesPorDia: 10 });
    const relatos = [rel('2026-11-01', false), rel('2026-11-02', true), rel('2026-11-03', false)];
    expect(economia(h, relatos, HOJE)).toEqual({ centavos: 2000, unidades: 20 });
  });
  it('parar: devolve zero sem custo informado', () => {
    const relatos = dias(12).map((d) => rel(d, false));
    expect(economia(habito(), relatos, HOJE)).toEqual({ centavos: 0, unidades: 0 });
  });
  it('ignora relatos antes do início, depois de hoje e de outros hábitos', () => {
    const h = habito({ inicio: '2026-11-05', custoPorDiaCentavos: 100, unidadesPorDia: 1 });
    const outro: Relato = { ...rel('2026-11-06', false), habitos: [{ habitoId: 'x', vontade: 0, usou: false }] };
    const relatos = [rel('2026-11-04', false), rel('2026-11-06', false), outro, rel('2026-12-01', false)];
    expect(economia(h, relatos, HOJE)).toEqual({ centavos: 100, unidades: 1 });
  });
  it('reduzir: dia livre economiza o consumo habitual; dentro da meta, só a diferença', () => {
    const h = habito({
      meta: { tipo: 'reduzir', maxPorDia: 5, unidade: 'cigarros' },
      custoPorDiaCentavos: 2000,
      unidadesPorDia: 20,
    });
    // livre: 20 un.; dentro da meta (5 de 20): 15 un.; deslize (8 > 5)... sem economia.
    const relatos = [rel('2026-11-01', false), rel('2026-11-02', true, 5), rel('2026-11-03', true, 9)];
    // 20 + 15 = 35 unidades; dinheiro = 2000 * 35 / 20 = 3500.
    expect(economia(h, relatos, HOJE)).toEqual({ centavos: 3500, unidades: 35 });
  });
  it('reduzir: quantidade acima do habitual nunca economiza negativo', () => {
    const h = habito({
      meta: { tipo: 'reduzir', maxPorDia: 30, unidade: 'cigarros' },
      custoPorDiaCentavos: 2000,
      unidadesPorDia: 20,
    });
    expect(economia(h, [rel('2026-11-01', true, 25)], HOJE)).toEqual({ centavos: 0, unidades: 0 });
  });
  it('reduzir: arredonda o dinheiro para o centavo', () => {
    const h = habito({
      meta: { tipo: 'reduzir', maxPorDia: 10, unidade: 'doses' },
      custoPorDiaCentavos: 1000,
      unidadesPorDia: 3,
    });
    // 1 dose economizada de 3: 1000 / 3 = 333,33...
    expect(economia(h, [rel('2026-11-01', true, 2)], HOJE)).toEqual({ centavos: 333, unidades: 1 });
  });
  it('reduzir sem unidades por dia: sem dado', () => {
    const h = habito({ meta: { tipo: 'reduzir', maxPorDia: 5, unidade: 'cigarros' }, custoPorDiaCentavos: 2000 });
    expect(economia(h, dias(3).map((d) => rel(d, false)), HOJE)).toBeNull();
  });
});

describe('textoMarco', () => {
  const reduzir = { tipo: 'reduzir', maxPorDia: 5, unidade: 'cigarros' } as const;
  it('tabaco com meta reduzir nunca traz afirmação de saúde de quem parou', () => {
    for (const dias of MARCOS) {
      const t = textoMarco('tabaco', dias, reduzir);
      expect(t.length).toBeGreaterThan(0);
      expect(t).not.toMatch(/monóxido|coronariana|pulmonar|circulação|abstinência|tosse|falta de ar/i);
    }
  });
  it('meta reduzir tem texto próprio, igual para todos os tipos', () => {
    expect(textoMarco('alcool', 7, reduzir)).toBe(textoMarco('tabaco', 7, reduzir));
    expect(textoMarco('tabaco', 7, reduzir)).not.toBe(textoMarco('tabaco', 7));
  });
  it('sem meta informada, vale o texto de quem para', () => {
    expect(textoMarco('tabaco', 1, { tipo: 'parar' })).toBe(textoMarco('tabaco', 1));
  });
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
        const r = textoMarco(tipo, dias, { tipo: 'reduzir', maxPorDia: 3, unidade: 'doses' });
        expect(r.length).toBeGreaterThan(0);
        expect(r).not.toMatch(/\p{Extended_Pictographic}/u);
      }
    }
  });
});
