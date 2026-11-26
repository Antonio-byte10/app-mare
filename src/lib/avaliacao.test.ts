import { describe, expect, it } from 'vitest';
import { QUESTIONARIOS } from '../conteudo/avaliacao';
import {
  calcularResultados,
  chaveResposta,
  compararNiveis,
  completoPara,
  emparelhar,
  montarFila,
  nivelDe,
  pontuar,
  textoEvolucao,
  textoSugestaoProfissional,
  ultimaAvaliacao,
  type Respostas,
} from './avaliacao';
import type { Avaliacao, Habito, ResultadoAvaliacao, TipoHabito } from './tipos';

const habito = (tipo: TipoHabito, id: string = tipo, apelido: string = tipo): Habito => ({
  id,
  tipo,
  apelido,
  cor: 'aqua',
  meta: { tipo: 'parar' },
  inicio: '2026-11-01',
  criadoEm: 0,
});

/** Responde todas as perguntas do hábito escolhendo sempre a opção de `posicao` (ou a última). */
function responder(h: Habito, escolha: 'primeira' | 'ultima' | number[]): Respostas {
  const r: Respostas = {};
  QUESTIONARIOS[h.tipo].perguntas.forEach((p, i) => {
    r[chaveResposta(h.id, p.id)] =
      escolha === 'primeira' ? 0 : escolha === 'ultima' ? p.opcoes.length - 1 : escolha[i];
  });
  return r;
}

describe('questionários', () => {
  it('têm o número de itens e o máximo dos instrumentos originais', () => {
    expect(QUESTIONARIOS.alcool.perguntas).toHaveLength(3);
    expect(QUESTIONARIOS.tabaco.perguntas).toHaveLength(6);
    expect(QUESTIONARIOS.sexual.perguntas).toHaveLength(5);
  });

  it('a soma dos maiores pontos de cada pergunta é o máximo declarado', () => {
    for (const q of Object.values(QUESTIONARIOS)) {
      const soma = q.perguntas.reduce((s, p) => s + Math.max(...p.opcoes.map((o) => o.pontos)), 0);
      expect(soma, q.nome).toBe(q.maximo);
    }
  });

  it('toda pergunta tem ao menos 2 opções, id único e fonte citada', () => {
    const ids = new Set<string>();
    for (const q of Object.values(QUESTIONARIOS)) {
      expect(q.fonte.length).toBeGreaterThan(20);
      for (const p of q.perguntas) {
        expect(p.opcoes.length).toBeGreaterThanOrEqual(2);
        expect(ids.has(p.id)).toBe(false);
        ids.add(p.id);
      }
    }
  });
});

describe('nivelDe', () => {
  it('AUDIT-C: 0-3 leve, 4-7 moderada, 8-12 alta', () => {
    expect([0, 3].map((p) => nivelDe('alcool', p))).toEqual(['leve', 'leve']);
    expect([4, 7].map((p) => nivelDe('alcool', p))).toEqual(['moderada', 'moderada']);
    expect([8, 12].map((p) => nivelDe('alcool', p))).toEqual(['alta', 'alta']);
  });
  it('Fagerström e BPS: 0-3 leve, 4-6 moderada, 7-10 alta', () => {
    for (const tipo of ['tabaco', 'sexual'] as const) {
      expect([0, 3].map((p) => nivelDe(tipo, p))).toEqual(['leve', 'leve']);
      expect([4, 6].map((p) => nivelDe(tipo, p))).toEqual(['moderada', 'moderada']);
      expect([7, 10].map((p) => nivelDe(tipo, p))).toEqual(['alta', 'alta']);
    }
  });
});

describe('montarFila', () => {
  it('junta as perguntas de cada hábito na ordem escolhida', () => {
    const fila = montarFila([habito('alcool'), habito('tabaco')]);
    expect(fila).toHaveLength(3 + 6);
    expect(fila[0].habito.tipo).toBe('alcool');
    expect(fila[3].habito.tipo).toBe('tabaco');
    expect(new Set(fila.map((i) => i.chave)).size).toBe(9);
  });
  it('sem hábitos, fila vazia', () => {
    expect(montarFila([])).toEqual([]);
  });
});

describe('pontuar e calcularResultados', () => {
  it('somar tudo na primeira opção dá 0, na última dá o máximo', () => {
    for (const tipo of ['alcool', 'tabaco', 'sexual'] as const) {
      const h = habito(tipo);
      expect(pontuar(h, responder(h, 'primeira'))).toBe(0);
      expect(pontuar(h, responder(h, 'ultima'))).toBe(QUESTIONARIOS[tipo].maximo);
    }
  });

  it('exemplo do AUDIT-C: 2-3 vezes por semana, 3 ou 4 doses, todo mês = 3 + 1 + 2 = 6 (moderada)', () => {
    const h = habito('alcool');
    const r = calcularResultados([h], responder(h, [3, 1, 2]));
    expect(r).toEqual([{ habitoId: 'alcool', tipo: 'alcool', pontos: 6, maximo: 12, nivel: 'moderada' }]);
  });

  it('exemplo do Fagerström: em até 5 min (3) + sim (1) + primeiro (1) + 21 a 30 (2) + sim (1) + não (0) = 8 (alta)', () => {
    const h = habito('tabaco');
    const r = calcularResultados([h], responder(h, [3, 1, 1, 2, 1, 0]));
    expect(r[0].pontos).toBe(8);
    expect(r[0].nivel).toBe('alta');
  });

  it('só entram os hábitos respondidos por inteiro', () => {
    const a = habito('alcool');
    const t = habito('tabaco');
    const respostas = { ...responder(a, 'ultima'), [chaveResposta(t.id, 'ftnd1')]: 0 };
    expect(completoPara(a, respostas)).toBe(true);
    expect(completoPara(t, respostas)).toBe(false);
    expect(calcularResultados([a, t], respostas).map((x) => x.habitoId)).toEqual(['alcool']);
  });

  it('dois hábitos do mesmo tipo têm resultados separados', () => {
    const a = habito('alcool', 'a1');
    const b = habito('alcool', 'a2');
    const respostas = { ...responder(a, 'primeira'), ...responder(b, 'ultima') };
    const r = calcularResultados([a, b], respostas);
    expect(r.map((x) => x.nivel)).toEqual(['leve', 'alta']);
  });
});

describe('evolução', () => {
  it('compara níveis', () => {
    expect(compararNiveis('alta', 'moderada')).toBe('mais-leve');
    expect(compararNiveis('leve', 'leve')).toBe('igual');
    expect(compararNiveis('leve', 'alta')).toBe('mais-alta');
  });

  it('as frases nunca cobram nem usam tom de fracasso', () => {
    expect(textoEvolucao('alta', 'leve')).toMatch(/passo/);
    expect(textoEvolucao('leve', 'leve')).toMatch(/Mudar leva tempo/);
    expect(textoEvolucao('leve', 'alta')).toMatch(/não precisa passar por isso sozinho/);
  });

  const resultado = (habitoId: string, nivel: ResultadoAvaliacao['nivel']): ResultadoAvaliacao => ({
    habitoId,
    tipo: 'alcool',
    pontos: 0,
    maximo: 12,
    nivel,
  });

  it('emparelha o resultado de agora com o anterior do mesmo hábito', () => {
    const anterior: Avaliacao = { id: 'x', feitaEm: 1, resultados: [resultado('a', 'alta')] };
    const pares = emparelhar([resultado('a', 'moderada'), resultado('b', 'leve')], anterior);
    expect(pares[0].anterior?.nivel).toBe('alta');
    expect(pares[1].anterior).toBeUndefined();
    expect(emparelhar([resultado('a', 'leve')], undefined)[0].anterior).toBeUndefined();
  });

  it('a última avaliação é a de feitaEm mais recente', () => {
    const lista: Avaliacao[] = [
      { id: '1', feitaEm: 5, resultados: [] },
      { id: '2', feitaEm: 9, resultados: [] },
      { id: '3', feitaEm: 7, resultados: [] },
    ];
    expect(ultimaAvaliacao(lista)?.id).toBe('2');
    expect(ultimaAvaliacao([])).toBeUndefined();
  });
});

describe('textoSugestaoProfissional', () => {
  const hs = [habito('sexual', 's', 'Foco'), habito('alcool', 'a', 'Calmaria'), habito('tabaco', 't', 'Fôlego')];
  const r = (habitoId: string, nivel: ResultadoAvaliacao['nivel']): ResultadoAvaliacao => ({
    habitoId,
    tipo: 'tabaco',
    pontos: 0,
    maximo: 10,
    nivel,
  });

  it('sem nível alto não sugere nada', () => {
    expect(textoSugestaoProfissional([r('s', 'moderada'), r('a', 'leve')], hs)).toBeNull();
  });
  it('um hábito alto: texto do mockup', () => {
    expect(textoSugestaoProfissional([r('s', 'alta'), r('a', 'leve')], hs)).toBe(
      'Para o Foco, conversar com um psicólogo costuma ajudar bastante. Em Aprender você vê como encontrar um, inclusive pelo SUS.',
    );
  });
  it('mais de um alto: nomeia todos', () => {
    expect(textoSugestaoProfissional([r('s', 'alta'), r('a', 'alta'), r('t', 'alta')], hs)).toMatch(
      /^Para os hábitos Foco, Calmaria e Fôlego,/,
    );
  });
});
