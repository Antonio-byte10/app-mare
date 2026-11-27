import { describe, expect, it } from 'vitest';
import { contarGatilhos, limparGatilhosFissura, normalizarGatilho, rotuloGatilho } from './gatilhos';
import type { Fissura, Relato } from './tipos';

const HOJE = '2026-11-27';
// Meio-dia local do dia: longe da virada de data, em qualquer fuso.
const em = (dia: string) => new Date(dia + 'T12:00:00').getTime();

const fissura = (dia: string, gatilhos?: string[]): Fissura => ({ id: dia + String(gatilhos), inicio: em(dia), duracaoSeg: 200, venceu: true, gatilhos });
const relato = (dia: string, gatilhos: string[]): Relato => ({ dia, habitos: [], gatilhos, salvoEm: 0 });

describe('normalizarGatilho', () => {
  it('tira acento, caixa e espaços sobrando', () => {
    expect(normalizarGatilho('  Tédio ')).toBe('tedio');
    expect(normalizarGatilho('SOLIDÃO')).toBe('solidao');
    expect(normalizarGatilho('Celular   à noite')).toBe('celular a noite');
  });
});

describe('limparGatilhosFissura', () => {
  it('mantém só ids conhecidos, sem repetir, na ordem da lista', () => {
    expect(limparGatilhosFissura(['celular', 'fome', 'xyz', 'fome'])).toEqual(['fome', 'celular']);
    expect(limparGatilhosFissura(undefined)).toEqual([]);
  });
});

describe('rotuloGatilho', () => {
  it('devolve o rótulo, ou o próprio id se não existe', () => {
    expect(rotuloGatilho('solidao')).toBe('Solidão');
    expect(rotuloGatilho('celular')).toBe('Celular/telas');
    expect(rotuloGatilho('antigo')).toBe('antigo');
  });
});

describe('contarGatilhos', () => {
  it('sem dados devolve lista vazia', () => {
    expect(contarGatilhos({ fissuras: [], relatos: [], hoje: HOJE })).toEqual([]);
    expect(contarGatilhos({ fissuras: [fissura('2026-11-20')], relatos: [relato('2026-11-20', [])], hoje: HOJE })).toEqual([]);
  });

  it('soma os gatilhos da fissura e do relato e devolve os 3 maiores', () => {
    const r = contarGatilhos({
      fissuras: [fissura('2026-11-26', ['tedio', 'fome']), fissura('2026-11-25', ['tedio']), fissura('2026-11-24', ['raiva'])],
      relatos: [relato('2026-11-26', ['Tédio', 'Estresse']), relato('2026-11-23', ['Estresse', 'Fome'])],
      hoje: HOJE,
    });
    expect(r.map((g) => [g.chave, g.rotulo, g.total])).toEqual([
      ['tedio', 'Tédio', 3],
      ['estresse', 'Estresse', 2],
      ['fome', 'Fome', 2],
    ]);
  });

  it('casa o texto livre do relato com o id, sem ligar para caixa e acento', () => {
    const r = contarGatilhos({ fissuras: [fissura('2026-11-26', ['solidao'])], relatos: [relato('2026-11-26', ['SOLIDAO', ' cansaço '])], hoje: HOJE });
    expect(r.find((g) => g.chave === 'solidao')).toEqual({ chave: 'solidao', rotulo: 'Solidão', total: 2 });
    expect(r.find((g) => g.chave === 'cansaco')?.rotulo).toBe('Cansaço');
  });

  it('conta o que não casa pelo próprio texto (juntando variações de caixa)', () => {
    const r = contarGatilhos({
      fissuras: [],
      relatos: [relato('2026-11-26', ['Celular à noite']), relato('2026-11-25', ['celular à noite']), relato('2026-11-24', ['Discussão'])],
      hoje: HOJE,
    });
    expect(r).toEqual([
      { chave: 'celular a noite', rotulo: 'Celular à noite', total: 2 },
      { chave: 'discussao', rotulo: 'Discussão', total: 1 },
    ]);
  });

  it('conta uma vez por fissura e por relato, mesmo com repetição', () => {
    const r = contarGatilhos({
      fissuras: [fissura('2026-11-26', ['fome', 'fome'])],
      relatos: [relato('2026-11-26', ['Fome', 'fome', 'Ansiedade', 'ansiedade'])],
      hoje: HOJE,
    });
    expect(r.map((g) => [g.chave, g.total])).toEqual([
      ['fome', 2],
      ['ansiedade', 1],
    ]);
  });

  it('só olha os últimos 30 dias, contando hoje', () => {
    const r = contarGatilhos({
      fissuras: [fissura('2026-10-29', ['fome']), fissura('2026-10-28', ['raiva']), fissura('2026-11-28', ['lugar'])],
      relatos: [relato('2026-10-28', ['Tédio'])],
      hoje: HOJE,
    });
    // 2026-10-29 é o 30º dia (hoje + 29 anteriores); 28/10 já saiu e o futuro não conta.
    expect(r.map((g) => g.chave)).toEqual(['fome']);
  });

  it('empate fica em ordem alfabética e respeita o limite', () => {
    const r = contarGatilhos({
      fissuras: [fissura('2026-11-26', ['tedio', 'raiva', 'fome', 'lugar'])],
      relatos: [],
      hoje: HOJE,
      limite: 3,
    });
    expect(r.map((g) => g.rotulo)).toEqual(['Fome', 'Raiva', 'Tédio']);
    expect(contarGatilhos({ fissuras: [fissura('2026-11-26', ['fome'])], relatos: [], hoje: HOJE, limite: 0 })).toEqual([]);
  });

  it('ignora ids de fissura que não existem mais e textos vazios do relato', () => {
    const r = contarGatilhos({ fissuras: [fissura('2026-11-26', ['sumiu'])], relatos: [relato('2026-11-26', ['  ', ''])], hoje: HOJE });
    expect(r).toEqual([]);
  });
});
