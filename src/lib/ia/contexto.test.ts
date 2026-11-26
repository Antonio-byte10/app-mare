import { describe, expect, it } from 'vitest';
import type { Habito, Relato } from '../tipos';
import { montarContexto } from './contexto';

const habito: Habito = {
  id: 'h1',
  tipo: 'alcool',
  apelido: 'Calmaria da Joana',
  cor: 'aqua',
  meta: { tipo: 'parar' },
  inicio: '2026-11-10',
  criadoEm: 0,
};

const relato = (dia: string, gatilhos: string[], nota?: string): Relato => ({
  dia,
  habitos: [{ habitoId: 'h1', vontade: 3, usou: false }],
  gatilhos,
  nota,
  salvoEm: 0,
});

describe('montarContexto', () => {
  it('sem hábito, não há contexto', () => {
    expect(montarContexto(undefined, [], '2026-11-25')).toBe('');
  });

  it('descreve o hábito em termos neutros, a meta e a sequência atual', () => {
    const relatos = [relato('2026-11-23', ['Ansiedade']), relato('2026-11-24', ['Ansiedade', 'Tédio']), relato('2026-11-25', [])];
    const c = montarContexto(habito, relatos, '2026-11-25');
    expect(c).toContain('álcool');
    expect(c).toContain('parar por completo');
    expect(c).toContain('3 dias seguidos sem usar');
    expect(c).toContain('Ansiedade, Tédio');
  });

  it('NUNCA inclui apelido do hábito nem notas livres', () => {
    const c = montarContexto(habito, [relato('2026-11-25', ['Estresse'], 'Falei com a Maria 11 99999-0000')], '2026-11-25');
    expect(c).not.toContain('Joana');
    expect(c).not.toContain('Calmaria');
    expect(c).not.toContain('Maria');
    expect(c).not.toContain('99999');
  });

  it('meta de reduzir e tipos neutros', () => {
    const reduzir: Habito = { ...habito, tipo: 'tabaco', meta: { tipo: 'reduzir', maxPorDia: 5, unidade: 'cigarros' } };
    const c = montarContexto(reduzir, [], '2026-11-25');
    expect(c).toContain('no máximo 5 cigarros por dia');
    expect(c).toContain('tabaco');
    expect(montarContexto({ ...habito, tipo: 'sexual' }, [], '2026-11-25')).toContain('comportamento sexual');
  });

  it('considera só os 7 relatos mais recentes e sem sequência diz que é um novo começo', () => {
    const antigos = Array.from({ length: 10 }, (_, i) => relato(`2026-11-${String(10 + i).padStart(2, '0')}`, ['Antigo']));
    const recentes = Array.from({ length: 7 }, (_, i) => relato(`2026-12-${String(1 + i).padStart(2, '0')}`, ['Recente']));
    const c = montarContexto(habito, [...antigos, ...recentes], '2026-12-07');
    expect(c).toContain('Recente');
    expect(c).not.toContain('Antigo');
    expect(montarContexto(habito, [], '2026-11-25')).toContain('novo começo');
  });
});
