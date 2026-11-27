import { describe, expect, it } from 'vitest';
import {
  aplicarMigracoes,
  aplicarHabito,
  aplicarRelato,
  aplicarRemocaoHabito,
  estadoInicial,
  mesclar,
  migrar,
  paraPersistir,
  VERSAO_ESTADO,
} from './estado';
import { resumoHabito } from './contador';
import { economia } from './marcos';
import type { Habito, Relato } from './tipos';

const habito = (id: string): Habito => ({
  id,
  tipo: 'tabaco',
  apelido: id,
  cor: 'aqua',
  meta: { tipo: 'parar' },
  inicio: '2026-01-01',
  criadoEm: 1,
});

const relato = (dia: string, ...ids: string[]): Relato => ({
  dia,
  habitos: ids.map((habitoId) => ({ habitoId, vontade: 3, usou: false })),
  gatilhos: [],
  salvoEm: 1,
});

describe('aplicarRelato', () => {
  it('substitui o relato do mesmo dia em vez de duplicar', () => {
    let e = aplicarRelato(estadoInicial(), relato('2026-02-01', 'a'));
    e = aplicarRelato(e, { ...relato('2026-02-01', 'a'), nota: 'novo' });
    expect(e.relatos).toHaveLength(1);
    expect(e.relatos[0].nota).toBe('novo');
  });

  it('normaliza a vontade 12 para 10', () => {
    const r = relato('2026-02-01', 'a');
    r.habitos[0].vontade = 12;
    const e = aplicarRelato(estadoInicial(), r);
    expect(e.relatos[0].habitos[0].vontade).toBe(10);
  });

  it('não altera o estado recebido', () => {
    const base = estadoInicial();
    aplicarRelato(base, relato('2026-02-01', 'a'));
    expect(base.relatos).toHaveLength(0);
  });
});

describe('aplicarHabito', () => {
  it('insere e depois substitui pelo id', () => {
    let e = aplicarHabito(estadoInicial(), habito('a'));
    e = aplicarHabito(e, { ...habito('a'), apelido: 'outro' });
    expect(e.habitos).toHaveLength(1);
    expect(e.habitos[0].apelido).toBe('outro');
  });
});

describe('aplicarRemocaoHabito', () => {
  it('apaga o hábito e as entradas dele, removendo relatos que ficarem vazios', () => {
    let e = estadoInicial();
    e = aplicarHabito(aplicarHabito(e, habito('a')), habito('b'));
    e = aplicarRelato(e, relato('2026-02-01', 'a'));
    e = aplicarRelato(e, relato('2026-02-02', 'a', 'b'));
    const depois = aplicarRemocaoHabito(e, 'a');
    expect(depois.habitos.map((h) => h.id)).toEqual(['b']);
    expect(depois.relatos).toHaveLength(1);
    expect(depois.relatos[0].dia).toBe('2026-02-02');
    expect(depois.relatos[0].habitos.map((x) => x.habitoId)).toEqual(['b']);
  });

  it('mantém o dia que tem humor, gatilhos ou nota, e solta planos e fissuras do hábito', () => {
    let e = aplicarHabito(aplicarHabito(estadoInicial(), habito('a')), habito('b'));
    e = aplicarRelato(e, { ...relato('2026-02-01', 'a'), nota: 'dia difícil' });
    e = aplicarRelato(e, { ...relato('2026-02-02', 'a'), gatilhos: ['Tédio'] });
    e = aplicarRelato(e, { ...relato('2026-02-03', 'a'), humor: 2 });
    e = aplicarRelato(e, relato('2026-02-04', 'a'));
    e = {
      ...e,
      planos: [
        { id: 'p1', se: 'x', entao: 'y', habitoId: 'a', criadoEm: 1 },
        { id: 'p2', se: 'x', entao: 'y', habitoId: 'b', criadoEm: 1 },
      ],
      fissuras: [{ id: 'f1', inicio: 1, duracaoSeg: 60, venceu: true, habitoId: 'a' }],
    };
    const depois = aplicarRemocaoHabito(e, 'a');
    expect(depois.relatos.map((r) => r.dia)).toEqual(['2026-02-01', '2026-02-02', '2026-02-03']);
    expect(depois.relatos.every((r) => r.habitos.length === 0)).toBe(true);
    expect(depois.planos.map((p) => p.habitoId)).toEqual([undefined, 'b']);
    expect(depois.fissuras[0].habitoId).toBeUndefined();
  });
});

describe('mudar a meta não reescreve o passado', () => {
  const reduzir: Habito = {
    ...habito('r'),
    meta: { tipo: 'reduzir', maxPorDia: 3, unidade: 'cigarros' },
    unidadesPorDia: 10,
    custoPorDiaCentavos: 1000,
  };
  const comQuantidade = (dia: string, quantidade: number): Relato => ({
    dia,
    habitos: [{ habitoId: 'r', vontade: 3, usou: true, quantidade }],
    gatilhos: [],
    salvoEm: 1,
  });
  const dias = ['2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05'];

  it('relatos novos guardam o estado do dia', () => {
    const e = aplicarRelato(aplicarHabito(estadoInicial(), reduzir), comQuantidade('2026-01-01', 2));
    expect(e.relatos[0].habitos[0].estado).toBe('dentroDaMeta');
  });

  it('sequência e economia continuam iguais depois de trocar para "parar" ou baixar o limite', () => {
    let e = aplicarHabito(estadoInicial(), reduzir);
    for (const d of dias) e = aplicarRelato(e, comQuantidade(d, 2));
    const antes = resumoHabito(reduzir, e.relatos, '2026-01-05');
    const economiaAntes = economia(reduzir, e.relatos, '2026-01-05');
    expect(antes.sequenciaAtual).toBe(5);

    for (const nova of [{ tipo: 'parar' } as const, { tipo: 'reduzir', maxPorDia: 1, unidade: 'cigarros' } as const]) {
      const editado = { ...reduzir, meta: nova };
      const depois = aplicarHabito(e, editado);
      expect(resumoHabito(editado, depois.relatos, '2026-01-05').sequenciaAtual).toBe(5);
      expect(resumoHabito(editado, depois.relatos, '2026-01-05').recorde).toBe(antes.recorde);
      if (nova.tipo === 'reduzir') expect(economia(editado, depois.relatos, '2026-01-05')).toEqual(economiaAntes);
    }
  });

  it('relatos antigos sem estado gravado são congelados com a meta antiga ao trocar a meta', () => {
    let e = aplicarHabito(estadoInicial(), reduzir);
    e = { ...e, relatos: dias.map((d) => comQuantidade(d, 2)) }; // como vinham de versões antigas
    const editado = { ...reduzir, meta: { tipo: 'parar' } as const };
    const depois = aplicarHabito(e, editado);
    expect(depois.relatos.every((r) => r.habitos[0].estado === 'dentroDaMeta')).toBe(true);
    expect(resumoHabito(editado, depois.relatos, '2026-01-05').sequenciaAtual).toBe(5);
  });

  it('depois da troca, um dia novo é avaliado com a meta nova', () => {
    let e = aplicarHabito(estadoInicial(), reduzir);
    e = aplicarRelato(e, comQuantidade('2026-01-01', 2));
    const editado = { ...reduzir, meta: { tipo: 'parar' } as const };
    e = aplicarRelato(aplicarHabito(e, editado), comQuantidade('2026-01-02', 2));
    expect(e.relatos.map((r) => r.habitos[0].estado)).toEqual(['dentroDaMeta', 'deslize']);
  });
});

describe('migrar', () => {
  it('versão futura devolve null (nunca o estado vazio) e não lança erro', () => {
    expect(migrar({ versao: 3, habitos: [habito('a')], relatos: [] }, VERSAO_ESTADO + 1)).toBeNull();
    expect(migrar({ versao: 1, habitos: [habito('a')] }, 99)).toBeNull();
  });

  it('versão inválida (0, negativa, fracionária) também devolve null', () => {
    for (const v of [0, -1, 1.5, Number.NaN]) expect(migrar(estadoInicial(), v)).toBeNull();
  });

  it('estado inválido na versão atual devolve o estado inicial, sem lançar erro', () => {
    expect(migrar(null, 1)).toEqual(estadoInicial());
    expect(migrar('lixo', 1)).toEqual(estadoInicial());
    expect(migrar({ habitos: 'x' }, 1)).toEqual(estadoInicial());
  });

  it('estado válido da versão atual é mantido', () => {
    const e = aplicarRelato(aplicarHabito(estadoInicial(), habito('a')), relato('2026-02-01', 'a'));
    expect(migrar(e, VERSAO_ESTADO)).toEqual(e);
  });

  it('versão 1 com hábitos vira versão 2 sem repetir o primeiro uso', () => {
    const v1 = { versao: 1, habitos: [habito('a')], relatos: [], ajustes: { ocultarNumeros: true } };
    const m = migrar(v1, 1);
    expect(m?.versao).toBe(2);
    expect(m?.ajustes).toEqual({ ocultarNumeros: true, onboardingConcluido: true, contatosEmergencia: true });
    expect(m?.porques).toEqual([]);
    expect(m?.conversa).toEqual([]);
  });

  it('versão 1 ganha a lista de contatos de confiança vazia', () => {
    const m = migrar({ versao: 1, habitos: [], relatos: [], ajustes: {} }, 1);
    expect(m?.contatos).toEqual([]);
  });

  it('estado da versão 2 salvo antes de existirem os contatos ganha a lista vazia, sem perder o resto', () => {
    const { contatos: _semContatos, ...semContatos } = aplicarHabito(estadoInicial(), habito('a'));
    void _semContatos;
    const m = migrar(semContatos, VERSAO_ESTADO);
    expect(m?.contatos).toEqual([]);
    expect(m?.habitos.map((h) => h.id)).toEqual(['a']);
  });

  it('contatos salvos são mantidos', () => {
    const contatos = [{ id: 'c1', nome: 'Ana', telefone: '(11) 99999-0000', criadoEm: 1 }];
    expect(migrar({ ...estadoInicial(), contatos }, VERSAO_ESTADO)?.contatos).toEqual(contatos);
  });

  it('contatos fora do formato (não é lista) viram lista vazia', () => {
    expect(migrar({ ...estadoInicial(), contatos: 'x' }, VERSAO_ESTADO)?.contatos).toEqual([]);
  });

  it('versão 1 sem hábitos passa pelo primeiro uso', () => {
    const m = migrar({ versao: 1, habitos: [], relatos: [], ajustes: { ocultarNumeros: false } }, 1);
    expect(m?.ajustes.onboardingConcluido).toBe(false);
  });

  it('campo extra na raiz sobrevive', () => {
    const e = { ...estadoInicial(), futuroCampo: { x: 1 } };
    expect(migrar(e, VERSAO_ESTADO)).toEqual(e);
  });

  it('campo extra em ajustes sobrevive; os conhecidos são validados', () => {
    const e = {
      ...estadoInicial(),
      ajustes: { ocultarNumeros: 'sim', habitoAtivo: 7, tema: 'escuro', ia: { provedor: 'x' } },
    };
    expect(migrar(e, VERSAO_ESTADO)?.ajustes).toEqual({
      ocultarNumeros: false,
      onboardingConcluido: false,
      contatosEmergencia: true,
      tema: 'escuro',
    });
  });

  it('IA válida é mantida', () => {
    const ia = { provedor: 'gemini', modo: 'direto', modelo: 'm', avisoVisto: true } as const;
    const e = { ...estadoInicial(), ajustes: { ...estadoInicial().ajustes, ia } };
    expect(migrar(e, VERSAO_ESTADO)?.ajustes.ia).toEqual(ia);
  });
});

describe('aplicarMigracoes', () => {
  const tabela = {
    1: (e: Record<string, unknown>) => ({ ...e, passou1: true }),
    2: (e: Record<string, unknown>) => ({ ...e, passou2: e.passou1 === true }),
  };
  it('encadeia as versões em ordem, só as que faltam', () => {
    expect(aplicarMigracoes({}, 1, 3, tabela)).toEqual({ passou1: true, passou2: true });
    expect(aplicarMigracoes({}, 2, 3, tabela)).toEqual({ passou2: false });
  });
  it('na versão de destino não muda nada', () => {
    expect(aplicarMigracoes({ a: 1 }, 3, 3, tabela)).toEqual({ a: 1 });
  });
  it('versão sem migração definida segue adiante sem mudar', () => {
    expect(aplicarMigracoes({ a: 1 }, 1, 3, {})).toEqual({ a: 1 });
  });
});

describe('mesclar (merge do store)', () => {
  const atual = { ...estadoInicial(), avisoRecomeco: true };
  it('o salvo vale por cima do atual e os campos fora do formato são descartados', () => {
    const salvo = aplicarHabito(estadoInicial(), habito('a'));
    const r = mesclar({ ...salvo, extra: 1 }, atual);
    expect(r?.habitos.map((h) => h.id)).toEqual(['a']);
    expect(r?.avisoRecomeco).toBe(true);
    expect((r as Record<string, unknown>).extra).toBe(1);
  });
  it('sem nada salvo, mantém o estado inicial', () => {
    expect(mesclar(undefined, atual)?.habitos).toEqual([]);
  });
});

describe('paraPersistir (partialize do store)', () => {
  it('tira funções e flags de sessão e mantém campos extras', () => {
    const e = {
      ...aplicarHabito(estadoInicial(), habito('a')),
      avisoRecomeco: true,
      erroArmazenamento: false,
      salvarHabito: () => undefined,
      futuroCampo: 'fica',
    };
    const p = paraPersistir(e, ['avisoRecomeco', 'erroArmazenamento']);
    expect(Object.keys(p).sort()).toEqual([
      'ajustes',
      'avaliacoes',
      'contatos',
      'conversa',
      'fissuras',
      'futuroCampo',
      'habitos',
      'planos',
      'porques',
      'recomecos',
      'relatos',
      'versao',
    ]);
    expect(p.habitos).toHaveLength(1);
  });
});
