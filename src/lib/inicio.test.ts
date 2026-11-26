import { describe, expect, it } from 'vitest';
import {
  habitoAtivoDe,
  moeda,
  rotuloSequencia,
  saudacao,
  textoEconomia,
  textoFaltam,
  textoPendente,
} from './inicio';
import type { Habito } from './tipos';

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

  it('mais de um pendente: "N relatos para pôr em dia" e destino é o mais antigo', () => {
    const t = textoPendente({ pendentes: ['2026-11-23', '2026-11-24', '2026-11-25'], hojeRespondido: false }, HOJE);
    expect(t).toMatchObject({ titulo: '3 relatos para pôr em dia', dia: '2026-11-23' });
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
  it('sem próximo marco', () => {
    const t = textoFaltam(null);
    expect(t.antes + t.destaque + t.depois).toBe('Todos os marcos alcançados');
  });
});

describe('economia e moeda', () => {
  it('moeda em reais do Brasil', () => {
    expect(moeda(18600).replace(/\s/g, ' ')).toBe('R$ 186,00');
  });
  it('sem custo mostra o traço', () => {
    expect(textoEconomia(habito(), 10)).toBe('—');
    expect(textoEconomia(habito({ custoPorDiaCentavos: 0 }), 10)).toBe('—');
  });
  it('com custo multiplica pelo total de dias livres', () => {
    expect(textoEconomia(habito({ custoPorDiaCentavos: 450 }), 41).replace(/\s/g, ' ')).toBe('R$ 184,50');
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
