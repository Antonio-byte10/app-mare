import { describe, expect, it } from 'vitest';
import {
  escolherSugestao,
  habitoAtivoDe,
  heroContador,
  moeda,
  rotuloSequencia,
  saudacao,
  textoEconomia,
  textoFaltam,
  textoPendente,
} from './inicio';
import type { Habito, Relato } from './tipos';

const HOJE = '2026-11-26';

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

describe('saudacao', () => {
  it('bom dia até 11h59', () => {
    expect(saudacao(0)).toBe('Bom dia');
    expect(saudacao(11)).toBe('Bom dia');
  });
  it('boa tarde de 12h até 17h59', () => {
    expect(saudacao(12)).toBe('Boa tarde');
    expect(saudacao(17)).toBe('Boa tarde');
  });
  it('boa noite a partir das 18h', () => {
    expect(saudacao(18)).toBe('Boa noite');
    expect(saudacao(23)).toBe('Boa noite');
  });
});

describe('textoPendente', () => {
  it('ontem pendente: "Relato de ontem", leva para ontem', () => {
    const t = textoPendente({ pendentes: ['2026-11-25'], hojeRespondido: false }, HOJE);
    expect(t).toMatchObject({ titulo: 'Relato de ontem', dia: '2026-11-25' });
  });

  it('ontem pendente tem prioridade sobre hoje sem resposta', () => {
    const t = textoPendente({ pendentes: ['2026-11-25'], hojeRespondido: true }, HOJE);
    expect(t?.titulo).toBe('Relato de ontem');
  });

  it('sem atrasados e hoje sem resposta: "Relato de hoje"', () => {
    const t = textoPendente({ pendentes: [], hojeRespondido: false }, HOJE);
    expect(t).toMatchObject({ titulo: 'Relato de hoje', dia: HOJE });
  });

  it('tudo em dia: nada a mostrar', () => {
    expect(textoPendente({ pendentes: [], hojeRespondido: true }, HOJE)).toBeNull();
  });

  it('mais de um pendente: convite sem cobrança e destino é o mais antigo', () => {
    const t = textoPendente({ pendentes: ['2026-11-23', '2026-11-24', '2026-11-25'], hojeRespondido: false }, HOJE);
    expect(t).toMatchObject({ titulo: 'Quer completar os últimos dias? Sem pressa.', dia: '2026-11-23' });
  });

  it('um pendente mais antigo que ontem: usa a data e leva para ele', () => {
    const t = textoPendente({ pendentes: ['2026-11-23'], hojeRespondido: true }, HOJE);
    expect(t?.titulo).toBe('Relato de 23 de novembro');
    expect(t?.dia).toBe('2026-11-23');
  });
});

describe('textoFaltam', () => {
  it('plural e nome do marco', () => {
    expect(textoFaltam({ dias: 14, faltam: 2 })).toEqual({ antes: 'faltam ', destaque: '2 dias', depois: ' para 2 semanas' });
  });
  it('singular', () => {
    expect(textoFaltam({ dias: 7, faltam: 1 })).toEqual({ antes: 'falta ', destaque: '1 dia', depois: ' para 1 semana' });
  });
  it('primeiro marco: só o nome, sem "falta 1 dia para 24 horas"', () => {
    const t = textoFaltam({ dias: 1, faltam: 1 });
    expect(t.antes + t.destaque + t.depois).toBe('próximo marco: 24 horas');
  });
  it('sem próximo marco', () => {
    const t = textoFaltam(null);
    expect(t.antes + t.destaque + t.depois).toBe('Todos os marcos alcançados');
  });
});

describe('economia e moeda', () => {
  it('moeda em reais do Brasil', () => {
    expect(moeda(18600).replace(/\s/g, ' ')).toBe('R$ 186,00');
  });
  const livres = (n: number): Relato[] =>
    Array.from({ length: n }, (_, i) => ({
      dia: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
      habitos: [{ habitoId: 'h1', vontade: 0, usou: false }],
      gatilhos: [],
      salvoEm: 0,
    }));
  it('sem custo mostra o traço', () => {
    expect(textoEconomia(habito(), livres(10), HOJE)).toBe('—');
    expect(textoEconomia(habito({ custoPorDiaCentavos: 0 }), livres(10), HOJE)).toBe('—');
  });
  it('com custo multiplica pelos dias livres dos relatos', () => {
    const h = habito({ id: 'h1', inicio: '2026-01-01', custoPorDiaCentavos: 450 });
    expect(textoEconomia(h, livres(41), HOJE).replace(/\s/g, ' ')).toBe('R$ 184,50');
  });
  it('reduzir: dia dentro da meta economiza só a diferença', () => {
    const h = habito({
      id: 'h1',
      inicio: '2026-01-01',
      meta: { tipo: 'reduzir', maxPorDia: 5, unidade: 'cigarros' },
      custoPorDiaCentavos: 1000,
      unidadesPorDia: 10,
    });
    const relatos: Relato[] = livres(4).map((r) => ({ ...r, habitos: [{ habitoId: 'h1', vontade: 0, usou: true, quantidade: 5 }] }));
    // 4 dias x 5 cigarros a menos = metade do custo por dia
    expect(textoEconomia(h, relatos, HOJE).replace(/\s/g, ' ')).toBe('R$ 20,00');
  });
  it('reduzir sem unidades por dia mostra o traço', () => {
    const h = habito({ id: 'h1', inicio: '2026-01-01', meta: { tipo: 'reduzir', maxPorDia: 5, unidade: 'cigarros' }, custoPorDiaCentavos: 1000 });
    expect(textoEconomia(h, livres(4), HOJE)).toBe('—');
  });
});

describe('habitoAtivoDe', () => {
  const a = habito({ id: 'a' });
  const b = habito({ id: 'b' });
  it('usa o salvo', () => expect(habitoAtivoDe([a, b], 'b')).toBe(b));
  it('sem id ou com hábito removido: o primeiro', () => {
    expect(habitoAtivoDe([a, b], undefined)).toBe(a);
    expect(habitoAtivoDe([a, b], 'removido')).toBe(a);
  });
  it('sem hábitos: undefined', () => expect(habitoAtivoDe([], 'a')).toBeUndefined());
});

describe('rotuloSequencia', () => {
  it('singular só para 1', () => {
    expect(rotuloSequencia(1)).toBe('dia seguido');
    expect(rotuloSequencia(0)).toBe('dias seguidos');
    expect(rotuloSequencia(12)).toBe('dias seguidos');
  });
});

describe('heroContador', () => {
  it('sequência em andamento: mostra os dias seguidos', () => {
    expect(heroContador(5, 9)).toEqual({ valor: 5, rotulo: 'dias seguidos', recomecando: false });
    expect(heroContador(1, 1)).toMatchObject({ valor: 1, rotulo: 'dia seguido', recomecando: false });
  });

  it('depois de um deslize, com dias no total: o herói é o total e há uma nota de apoio', () => {
    expect(heroContador(0, 12)).toEqual({
      valor: 12,
      rotulo: 'dias no total',
      nota: 'Recomeçando hoje. Seus dias continuam contando.',
      recomecando: true,
    });
    expect(heroContador(0, 1).rotulo).toBe('dia no total');
  });

  it('começo de tudo (sem dias livres): mantém "0 dias seguidos"', () => {
    expect(heroContador(0, 0)).toEqual({ valor: 0, rotulo: 'dias seguidos', recomecando: false });
  });
});

describe('escolherSugestao', () => {
  const nada = { avisoRecomeco: false, dicaOnda: false, pendente: false, reflexao: false, backup: false };

  it('sem nada a sugerir: null', () => {
    expect(escolherSugestao(nada)).toBeNull();
  });

  it('só uma por vez, na ordem recomeço > dica da onda > pendente > reflexão > backup', () => {
    const tudo = { avisoRecomeco: true, dicaOnda: true, pendente: true, reflexao: true, backup: true };
    expect(escolherSugestao(tudo)).toBe('recomeco');
    expect(escolherSugestao({ ...tudo, avisoRecomeco: false })).toBe('dica-onda');
    expect(escolherSugestao({ ...tudo, avisoRecomeco: false, dicaOnda: false })).toBe('pendente');
    expect(escolherSugestao({ ...nada, reflexao: true, backup: true })).toBe('reflexao');
    expect(escolherSugestao({ ...nada, backup: true })).toBe('backup');
  });
});
