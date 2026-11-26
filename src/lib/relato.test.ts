import { describe, expect, it } from 'vitest';
import {
  alternarGatilho,
  aplicarMudanca,
  erroQuantidade,
  habitoAberto,
  habitoComErro,
  habitosDoDia,
  montarRelato,
  perguntaUso,
  rascunhoInicial,
  resumoLinha,
  type Rascunho,
} from './relato';
import type { Habito, Relato } from './tipos';

const base = { cor: 'aqua', criadoEm: 0 } as const;
const fumo: Habito = { ...base, id: 'a', tipo: 'tabaco', apelido: 'Fôlego', meta: { tipo: 'parar' }, inicio: '2026-11-01' };
const vinho: Habito = {
  ...base,
  id: 'b',
  tipo: 'alcool',
  apelido: 'Calmaria',
  cor: 'peri',
  meta: { tipo: 'reduzir', maxPorDia: 2, unidade: 'doses' },
  inicio: '2026-11-10',
};
const futuro: Habito = { ...fumo, id: 'c', apelido: 'Foco', tipo: 'sexual', inicio: '2026-12-01' };

const r = (p: Partial<Rascunho> = {}): Rascunho => ({ respondido: true, vontade: 0, usou: false, quantidade: '', ...p });

describe('habitosDoDia', () => {
  it('só traz hábitos que já começaram no dia', () => {
    expect(habitosDoDia([fumo, vinho, futuro], '2026-11-26').map((h) => h.id)).toEqual(['a', 'b']);
    expect(habitosDoDia([fumo, vinho], '2026-11-10').map((h) => h.id)).toEqual(['a', 'b']);
    expect(habitosDoDia([fumo, vinho], '2026-11-09').map((h) => h.id)).toEqual(['a']);
  });
});

describe('perguntaUso', () => {
  it('muda por tipo', () => {
    expect(perguntaUso('tabaco')).toBe('Você fumou hoje?');
    expect(perguntaUso('alcool')).toBe('Você bebeu hoje?');
    expect(perguntaUso('sexual')).toBe('Você usou hoje?');
  });
});

describe('rascunhoInicial / habitoAberto', () => {
  it('sem relato: nada respondido, vontade 0, não usou; abre o primeiro', () => {
    const ativos = [fumo, vinho];
    const rs = rascunhoInicial(ativos);
    expect(rs.a).toEqual({ respondido: false, vontade: 0, usou: false, quantidade: '' });
    expect(habitoAberto(ativos, rs)).toBe('a');
  });
  it('carrega o relato salvo e abre o primeiro respondido; o que falta continua recolhido', () => {
    const ativos = [fumo, vinho];
    const salvo: Relato = {
      dia: '2026-11-25',
      habitos: [{ habitoId: 'a', vontade: 4, usou: true }],
      gatilhos: [],
      salvoEm: 1,
    };
    const rs = rascunhoInicial(ativos, salvo);
    expect(rs.a).toEqual({ respondido: true, vontade: 4, usou: true, quantidade: '' });
    expect(rs.b.respondido).toBe(false);
    expect(habitoAberto(ativos, rs)).toBe('a');
    const soB = rascunhoInicial(ativos, { ...salvo, habitos: [{ habitoId: 'b', vontade: 1, usou: false }] });
    expect(habitoAberto(ativos, soB)).toBe('b');
  });
  it('tudo respondido: abre o primeiro; quantidade vira texto', () => {
    const ativos = [vinho];
    const rs = rascunhoInicial(ativos, {
      dia: 'd',
      habitos: [{ habitoId: 'b', vontade: 7, usou: true, quantidade: 3 }],
      gatilhos: [],
      salvoEm: 1,
    });
    expect(rs.b.quantidade).toBe('3');
    expect(habitoAberto(ativos, rs)).toBe('b');
  });
  it('sem hábitos: nada aberto', () => {
    expect(habitoAberto([], {})).toBeUndefined();
  });
});

describe('erroQuantidade', () => {
  it('só exige quantidade ao reduzir e usar', () => {
    expect(erroQuantidade(fumo, r({ usou: true }))).toBeUndefined();
    expect(erroQuantidade(vinho, r({ usou: false }))).toBeUndefined();
    expect(erroQuantidade(vinho, r({ usou: true }))).toBeTruthy();
    expect(erroQuantidade(vinho, r({ usou: true, quantidade: '0' }))).toBeTruthy();
    expect(erroQuantidade(vinho, r({ usou: true, quantidade: '1,5' }))).toBeTruthy();
    expect(erroQuantidade(vinho, r({ usou: true, quantidade: '2' }))).toBeUndefined();
  });
  it('ignora hábito que não foi respondido', () => {
    expect(erroQuantidade(vinho, r({ respondido: false, usou: true }))).toBeUndefined();
  });
});

describe('montarRelato', () => {
  const ativos = [fumo, vinho];
  const comum = { dia: '2026-11-26', agora: 99, humor: undefined, gatilhos: [], nota: '' };

  it('inclui só os hábitos respondidos', () => {
    const rel = montarRelato({ ...comum, ativos, rascunhos: { a: r({ vontade: 6 }), b: r({ respondido: false }) } });
    expect(rel).toEqual({
      dia: '2026-11-26',
      habitos: [{ habitoId: 'a', vontade: 6, usou: false }],
      humor: undefined,
      gatilhos: [],
      nota: undefined,
      salvoEm: 99,
    });
  });
  it('quantidade só em hábito de reduzir que usou', () => {
    const rel = montarRelato({
      ...comum,
      ativos,
      rascunhos: { a: r({ usou: true, quantidade: '5' }), b: r({ usou: true, quantidade: ' 3 ', vontade: 8 }) },
    });
    expect(rel.habitos).toEqual([
      { habitoId: 'a', vontade: 0, usou: true },
      { habitoId: 'b', vontade: 8, usou: true, quantidade: 3 },
    ]);
  });
  it('reduzir sem usar descarta a quantidade digitada', () => {
    const rel = montarRelato({ ...comum, ativos, rascunhos: { a: r(), b: r({ usou: false, quantidade: '4' }) } });
    expect(rel.habitos[1]).toEqual({ habitoId: 'b', vontade: 0, usou: false });
  });
  it('humor, gatilhos e nota (aparada; vazia vira undefined)', () => {
    const rel = montarRelato({
      ...comum,
      ativos,
      rascunhos: { a: r(), b: r() },
      humor: 4,
      gatilhos: ['Tédio'],
      nota: '  dia puxado  ',
    });
    expect(rel.humor).toBe(4);
    expect(rel.gatilhos).toEqual(['Tédio']);
    expect(rel.nota).toBe('dia puxado');
  });
  it('mantém entradas de hábitos que não estão ativos no dia', () => {
    const existente: Relato = {
      dia: '2026-11-26',
      habitos: [
        { habitoId: 'zzz', vontade: 2, usou: false },
        { habitoId: 'a', vontade: 9, usou: true },
      ],
      gatilhos: [],
      salvoEm: 1,
    };
    const rel = montarRelato({ ...comum, ativos, rascunhos: { a: r({ vontade: 1 }) }, existente });
    expect(rel.habitos).toEqual([
      { habitoId: 'a', vontade: 1, usou: false },
      { habitoId: 'zzz', vontade: 2, usou: false },
    ]);
  });
});

describe('resumoLinha', () => {
  it('descreve o hábito recolhido', () => {
    expect(resumoLinha(fumo, r({ respondido: false }))).toBe('responder');
    expect(resumoLinha(fumo, r({ vontade: 2 }))).toBe('vontade 2 · não usou');
    expect(resumoLinha(fumo, r({ vontade: 5, usou: true }))).toBe('vontade 5 · usou');
    expect(resumoLinha(vinho, r({ vontade: 3, usou: true, quantidade: '2' }))).toBe('vontade 3 · 2 doses');
    expect(resumoLinha(vinho, r({ usou: true }))).toBe('vontade 0 · falta a quantidade');
  });
});

describe('alternarGatilho', () => {
  it('liga e desliga sem mutar', () => {
    const a = ['Tédio'];
    expect(alternarGatilho(a, 'Solidão')).toEqual(['Tédio', 'Solidão']);
    expect(alternarGatilho(a, 'Tédio')).toEqual([]);
    expect(a).toEqual(['Tédio']);
  });
});

describe('aplicarMudanca', () => {
  const ativos = [fumo, vinho];
  const comum = { dia: '2026-11-26', agora: 1, humor: undefined, gatilhos: [], nota: '' };

  it('hábito aberto sem mexer continua fora do relato', () => {
    const rs = rascunhoInicial(ativos);
    rs.a = { ...rs.a, respondido: true }; // o que abre expandido já conta
    // "Calmaria" foi aberto só para olhar: nenhuma mudança, nada gravado.
    const rel = montarRelato({ ...comum, ativos, rascunhos: rs });
    expect(rel.habitos.map((x) => x.habitoId)).toEqual(['a']);
  });
  it('a primeira mudança (vontade, uso ou quantidade) inclui o hábito', () => {
    for (const mudanca of [{ vontade: 3 }, { usou: false }, { usou: true, quantidade: '2' }, { quantidade: '1' }]) {
      const rs = aplicarMudanca(rascunhoInicial(ativos), 'b', mudanca);
      expect(rs.b.respondido).toBe(true);
      expect(rs.a.respondido).toBe(false);
      expect(montarRelato({ ...comum, ativos, rascunhos: rs }).habitos.map((x) => x.habitoId)).toEqual(['b']);
    }
  });
  it('não muta o original e mantém o que já estava salvo como respondido', () => {
    const original = rascunhoInicial(ativos, { dia: 'd', habitos: [{ habitoId: 'a', vontade: 4, usou: true }], gatilhos: [], salvoEm: 1 });
    const rs = aplicarMudanca(original, 'a', { vontade: 5 });
    expect(original.a.vontade).toBe(4);
    expect(rs.a).toEqual({ respondido: true, vontade: 5, usou: true, quantidade: '' });
    expect(rs.b.respondido).toBe(false);
  });
});

describe('habitoComErro', () => {
  it('acha o primeiro hábito respondido sem quantidade', () => {
    const ativos = [fumo, vinho];
    expect(habitoComErro(ativos, { a: r(), b: r({ usou: true }) })?.id).toBe('b');
    expect(habitoComErro(ativos, { a: r(), b: r({ usou: true, quantidade: '2' }) })).toBeUndefined();
    expect(habitoComErro(ativos, { a: r(), b: r({ respondido: false, usou: true }) })).toBeUndefined();
  });
});
