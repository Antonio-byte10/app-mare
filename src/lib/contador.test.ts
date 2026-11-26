import { describe, expect, it } from 'vitest';
import { diasAntesValidos, estadoDoDia, normalizarRelatoHabito, resumoHabito } from './contador';
import type { Habito, Relato, RelatoHabito } from './tipos';

const HOJE = '2026-11-25';

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

const dia = (n: number) => `2026-11-${String(n).padStart(2, '0')}`;

const relato = (d: string, usou = false, habitoId = 'h1'): Relato => ({
  dia: d,
  habitos: [{ habitoId, vontade: 3, usou }],
  gatilhos: [],
  salvoEm: 0,
});

const livres = (de: number, ate: number) =>
  Array.from({ length: ate - de + 1 }, (_, i) => relato(dia(de + i)));

const rh = (extra: Partial<RelatoHabito>): RelatoHabito => ({ habitoId: 'h1', vontade: 0, usou: false, ...extra });

describe('estadoDoDia', () => {
  const parar = { tipo: 'parar' } as const;
  const reduzir = { tipo: 'reduzir', maxPorDia: 2, unidade: 'cigarros' } as const;

  it('meta parar: sem uso é livre, com uso é deslize', () => {
    expect(estadoDoDia(parar, rh({ usou: false }))).toBe('livre');
    expect(estadoDoDia(parar, rh({ usou: true }))).toBe('deslize');
  });

  it('meta reduzir: até o limite é dentro da meta, acima é deslize', () => {
    expect(estadoDoDia(reduzir, rh({ usou: true, quantidade: 2 }))).toBe('dentroDaMeta');
    expect(estadoDoDia(reduzir, rh({ usou: true, quantidade: 3 }))).toBe('deslize');
  });

  it('meta reduzir: uso sem quantidade é deslize, sem uso é livre', () => {
    expect(estadoDoDia(reduzir, rh({ usou: true }))).toBe('deslize');
    expect(estadoDoDia(reduzir, rh({ usou: false }))).toBe('livre');
  });
});

describe('normalizarRelatoHabito', () => {
  it('limita e arredonda a vontade entre 0 e 10', () => {
    expect(normalizarRelatoHabito(rh({ vontade: 14 })).vontade).toBe(10);
    expect(normalizarRelatoHabito(rh({ vontade: -2 })).vontade).toBe(0);
    expect(normalizarRelatoHabito(rh({ vontade: NaN })).vontade).toBe(0);
    expect(normalizarRelatoHabito(rh({ vontade: 6.6 })).vontade).toBe(7);
  });

  it('quantidade negativa vira 0', () => {
    expect(normalizarRelatoHabito(rh({ usou: true, quantidade: -1 })).quantidade).toBe(0);
  });
});

describe('resumoHabito', () => {
  const base = () => [...livres(1, 11), relato(dia(12), true), ...livres(13, 24)];

  it('deslize zera a sequência atual mas não o total', () => {
    const r = resumoHabito(habito(), base(), HOJE);
    expect(r.sequenciaAtual).toBe(12);
    expect(r.hojeRespondido).toBe(false);
    expect(r.recorde).toBe(12);
    expect(r.totalLivres).toBe(23);
    expect(r.estados[dia(12)]).toBe('deslize');
    expect(r.estados[dia(13)]).toBe('livre');
  });

  it('dia sem relato não quebra a sequência', () => {
    const relatos = [relato(dia(20)), relato(dia(22)), relato(dia(23)), relato(dia(24))];
    expect(resumoHabito(habito(), relatos, HOJE).sequenciaAtual).toBe(4);
  });

  it('edição posterior do dia do deslize recalcula tudo', () => {
    const relatos = base().map((r) => (r.dia === dia(12) ? relato(dia(12), false) : r));
    const r = resumoHabito(habito(), relatos, HOJE);
    expect(r.sequenciaAtual).toBe(24);
    expect(r.recorde).toBe(24);
    expect(r.totalLivres).toBe(24);
  });

  it('relato de hoje conta e marca hojeRespondido', () => {
    const r = resumoHabito(habito(), [...base(), relato(HOJE)], HOJE);
    expect(r.hojeRespondido).toBe(true);
    expect(r.sequenciaAtual).toBe(13);
    expect(r.estados[HOJE]).toBe('livre');
  });

  it('início hoje ou no futuro: tudo zerado, sem pendentes e sem erro', () => {
    for (const inicio of ['2026-11-25', '2026-12-01']) {
      const r = resumoHabito(habito({ inicio }), [], HOJE);
      expect(r.sequenciaAtual).toBe(0);
      expect(r.totalLivres).toBe(0);
      expect(r.recorde).toBe(0);
      expect(r.pendentes).toEqual([]);
      expect(r.estados).toEqual({});
      expect(r.percentual30d).toBeNull();
    }
  });

  it('hábito antigo sem relatos: pendentes são os 7 dias anteriores a hoje', () => {
    const r = resumoHabito(habito({ inicio: '2026-01-01' }), [], HOJE);
    expect(r.pendentes).toEqual([
      '2026-11-18',
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
      '2026-11-23',
      '2026-11-24',
    ]);
    expect(r.totalLivres).toBe(0);
  });

  it('pendentes não incluem dias antes do início nem hoje', () => {
    const r = resumoHabito(habito({ inicio: '2026-11-22' }), [], HOJE);
    expect(r.pendentes).toEqual(['2026-11-22', '2026-11-23', '2026-11-24']);
    expect(r.pendentes).not.toContain(HOJE);
  });

  it('dias com relato não são pendentes', () => {
    const r = resumoHabito(habito(), [relato('2026-11-20'), relato('2026-11-24')], HOJE);
    expect(r.pendentes).toEqual(['2026-11-18', '2026-11-19', '2026-11-21', '2026-11-22', '2026-11-23']);
  });

  it('percentual30d é null com menos de 7 relatos', () => {
    expect(resumoHabito(habito(), livres(19, 24), HOJE).percentual30d).toBeNull();
  });

  it('percentual30d com 10 relatos (8 livres) dá 80', () => {
    const relatos = [...livres(1, 8), relato(dia(9), true), relato(dia(10), true)];
    expect(resumoHabito(habito(), relatos, HOJE).percentual30d).toBe(80);
  });

  it('ignora relatos de outros hábitos e de dias fora de início..hoje', () => {
    const relatos = [
      relato('2026-10-30'),
      relato('2026-11-26'),
      relato(dia(20), false, 'outro'),
      relato(dia(21)),
    ];
    const r = resumoHabito(habito(), relatos, HOJE);
    expect(r.totalLivres).toBe(1);
    expect(r.sequenciaAtual).toBe(1);
    expect(Object.keys(r.estados)).toEqual([dia(21)]);
  });

  it('meta reduzir: dentroDaMeta conta na sequência e no total', () => {
    const h = habito({ meta: { tipo: 'reduzir', maxPorDia: 2, unidade: 'cigarros' } });
    const um = (d: number, usou: boolean, quantidade?: number): Relato => ({
      dia: dia(d),
      habitos: [{ habitoId: 'h1', vontade: 5, usou, quantidade }],
      gatilhos: [],
      salvoEm: 0,
    });
    const r = resumoHabito(h, [um(22, true, 2), um(23, true, 3), um(24, false)], HOJE);
    expect(r.estados).toEqual({ [dia(22)]: 'dentroDaMeta', [dia(23)]: 'deslize', [dia(24)]: 'livre' });
    expect(r.totalLivres).toBe(2);
    expect(r.sequenciaAtual).toBe(1);
    expect(r.recorde).toBe(1);
  });
});

describe('diasAntes ("Já estou há N dias")', () => {
  it('sem relato nenhum, os dias de antes já formam a sequência, o total e o recorde', () => {
    const r = resumoHabito(habito({ diasAntes: 12 }), [], HOJE);
    expect(r.sequenciaAtual).toBe(12);
    expect(r.totalLivres).toBe(12);
    expect(r.recorde).toBe(12);
  });

  it('soma na sequência enquanto não houver deslize', () => {
    const r = resumoHabito(habito({ diasAntes: 10 }), livres(1, 5), HOJE);
    expect(r.sequenciaAtual).toBe(15);
    expect(r.totalLivres).toBe(15);
    expect(r.recorde).toBe(15);
  });

  it('um deslize zera a sequência, mas os dias de antes continuam no total e no recorde', () => {
    const relatos = [...livres(1, 3), relato(dia(4), true), ...livres(5, 6)];
    const r = resumoHabito(habito({ diasAntes: 10 }), relatos, HOJE);
    expect(r.sequenciaAtual).toBe(2);
    expect(r.totalLivres).toBe(10 + 3 + 2);
    expect(r.recorde).toBe(13);
  });

  it('o recorde só passa dos dias de antes se uma sequência nova for maior', () => {
    const relatos = [relato(dia(1), true), ...livres(2, 20)];
    const r = resumoHabito(habito({ diasAntes: 5 }), relatos, HOJE);
    expect(r.sequenciaAtual).toBe(19);
    expect(r.recorde).toBe(19);
    expect(r.totalLivres).toBe(24);
  });

  it('deslize no primeiro dia: o total mantém os dias de antes e a sequência recomeça', () => {
    const r = resumoHabito(habito({ diasAntes: 7 }), [relato(dia(1), true)], HOJE);
    expect(r.sequenciaAtual).toBe(0);
    expect(r.totalLivres).toBe(7);
    expect(r.recorde).toBe(7);
  });

  it('valor ausente, zero, negativo ou fracionado é tratado como número inteiro de 0 para cima', () => {
    expect(diasAntesValidos(undefined)).toBe(0);
    expect(diasAntesValidos(0)).toBe(0);
    expect(diasAntesValidos(-3)).toBe(0);
    expect(diasAntesValidos(Number.NaN)).toBe(0);
    expect(diasAntesValidos(4.9)).toBe(4);
    expect(resumoHabito(habito({ diasAntes: -3 }), livres(1, 2), HOJE).sequenciaAtual).toBe(2);
  });
});
