import { describe, expect, it } from 'vitest';
import {
  chaveDaReflexao,
  compararSemanas,
  deveMostrarCartaoReflexao,
  diaMaisPesado,
  ehDiaDaReflexao,
  frasesDaReflexao,
  horaAproximada,
  horaMaisPesada,
  inicioConversaDaSemana,
  janelaAnterior,
  janelaDaSemana,
  nosDias,
  resumoDaSemana,
  semanaTemDados,
  seDoGatilho,
  type SemanaHabito,
} from './reflexao';
import type { Fissura, Habito, Recomeco, Relato, TipoHabito } from './tipos';

// Sexta-feira. A semana olhada é 20/11 (sexta) a 26/11 (quinta); a anterior, 13/11 a 19/11.
const HOJE = '2026-11-27';

const habito = (extra: Partial<Habito> = {}): Habito => ({
  id: 'h1',
  tipo: 'tabaco',
  apelido: 'Marlboro do Zé',
  cor: 'aqua',
  meta: { tipo: 'parar' },
  inicio: '2026-10-01',
  criadoEm: 0,
  ...extra,
});

const em = (dia: string, h = 12, m = 0) => {
  const [a, mes, d] = dia.split('-').map(Number);
  return new Date(a, mes - 1, d, h, m).getTime();
};

type OpcoesRelato = { vontade?: number; usou?: boolean; quantidade?: number; gatilhos?: string[]; habitoId?: string; estado?: 'livre' | 'dentroDaMeta' | 'deslize' };
const relato = (dia: string, o: OpcoesRelato = {}): Relato => ({
  dia,
  habitos: [
    {
      habitoId: o.habitoId ?? 'h1',
      vontade: o.vontade ?? 2,
      usou: o.usou ?? false,
      ...(o.quantidade !== undefined ? { quantidade: o.quantidade } : {}),
      ...(o.estado ? { estado: o.estado } : {}),
    },
  ],
  gatilhos: o.gatilhos ?? [],
  salvoEm: em(dia, 22),
});

const fissura = (dia: string, extra: Partial<Fissura> = {}, hora = 22): Fissura => ({
  id: dia + hora + JSON.stringify(extra),
  inicio: em(dia, hora),
  duracaoSeg: 300,
  venceu: true,
  habitoId: 'h1',
  ...extra,
});

const semana = (dias: string[], o: OpcoesRelato | ((dia: string, i: number) => OpcoesRelato) = {}) =>
  dias.map((d, i) => relato(d, typeof o === 'function' ? o(d, i) : o));

const DIAS_SEMANA = ['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26'];
const DIAS_ANTERIOR = ['2026-11-13', '2026-11-14', '2026-11-15', '2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19'];

const resumo = (relatos: Relato[], extras: { h?: Habito; fissuras?: Fissura[]; recomecos?: Recomeco[] } = {}) =>
  resumoDaSemana([extras.h ?? habito()], relatos, extras.fissuras ?? [], extras.recomecos ?? [], HOJE).habitos[0];

// Nada de linguagem que culpa ou que lembre "limpo/sujo".
const PROIBIDO = /limpo|sujo|recaíd|recaid|fracass|falh|culpa(d|r)|vergonha|doente|doença|tratamento|diagnóstico|remédio|medic/i;

describe('janelas da semana', () => {
  it('a semana são os 7 dias completos até ontem; a anterior, os 7 antes dela', () => {
    expect(janelaDaSemana(HOJE)).toEqual({ inicio: '2026-11-20', fim: '2026-11-26' });
    expect(janelaAnterior(HOJE)).toEqual({ inicio: '2026-11-13', fim: '2026-11-19' });
  });

  it('atravessa a virada de mês e de ano', () => {
    expect(janelaDaSemana('2027-01-03')).toEqual({ inicio: '2026-12-27', fim: '2027-01-02' });
    expect(janelaAnterior('2027-01-03')).toEqual({ inicio: '2026-12-20', fim: '2026-12-26' });
  });
});

describe('resumoDaSemana: dias', () => {
  it('sem hábitos ou sem relatos: nada quebra e tudo é "sem relato"', () => {
    expect(resumoDaSemana([], [], [], [], HOJE).habitos).toEqual([]);
    const s = resumo([]);
    expect(s).toMatchObject({ livres: 0, dentroDaMeta: 0, deslizes: 0, relatados: 0, semRelato: 7, diasBons: 0, comparacao: 'semBase' });
    expect(s.vontadeMedia).toBeNull();
    expect(s.gatilhos).toEqual([]);
    expect(s.economia).toBeNull();
    expect(s.quantidade).toBeNull();
    expect(semanaTemDados(s)).toBe(false);
  });

  it('conta dias livres, deslizes e dias sem relato', () => {
    const s = resumo([
      relato('2026-11-20'),
      relato('2026-11-21'),
      relato('2026-11-22', { usou: true }),
      relato('2026-11-24'),
    ]);
    expect(s).toMatchObject({ livres: 3, deslizes: 1, dentroDaMeta: 0, relatados: 4, semRelato: 3, diasBons: 3 });
    expect(s.livres + s.dentroDaMeta + s.deslizes + s.semRelato).toBe(7);
  });

  it('ignora hoje, o que passou da janela e o que veio antes dela', () => {
    const s = resumo([relato(HOJE, { usou: true }), relato('2026-11-19', { usou: true }), relato('2026-11-26')]);
    expect(s).toMatchObject({ livres: 1, deslizes: 0, relatados: 1 });
  });

  it('só olha as entradas do próprio hábito', () => {
    const outro: Relato = { ...relato('2026-11-21'), habitos: [{ habitoId: 'h2', vontade: 9, usou: true }] };
    const s = resumo([relato('2026-11-20'), outro]);
    expect(s).toMatchObject({ livres: 1, deslizes: 0, relatados: 1, semRelato: 6 });
  });

  it('dias antes do início do hábito não contam como "sem relato"', () => {
    const s = resumo([relato('2026-11-24')], { h: habito({ inicio: '2026-11-23' }) });
    expect(s.semRelato).toBe(3); // 23, 25 e 26
    expect(s.relatados).toBe(1);
    // Hábito começado hoje: nenhuma semana a olhar.
    const novo = resumo([], { h: habito({ inicio: HOJE }) });
    expect(novo.semRelato).toBe(0);
    expect(novo.relatados).toBe(0);
  });

  it('usa o estado gravado no dia (a meta de então), não a meta de agora', () => {
    // Meta atual: parar. Mas o dia foi relatado como "dentro da meta" quando a meta era reduzir.
    const s = resumo([relato('2026-11-20', { usou: true, quantidade: 2, estado: 'dentroDaMeta' }), relato('2026-11-21', { usou: true, quantidade: 2 })]);
    expect(s).toMatchObject({ dentroDaMeta: 1, deslizes: 1, livres: 0 });
  });

  it('em reduzir: dentro do limite é "dentro da meta", acima é deslize, sem uso é livre', () => {
    const h = habito({ tipo: 'alcool', meta: { tipo: 'reduzir', maxPorDia: 2, unidade: 'doses' } });
    const s = resumo(
      [relato('2026-11-20'), relato('2026-11-21', { usou: true, quantidade: 2 }), relato('2026-11-22', { usou: true, quantidade: 5 }), relato('2026-11-23', { usou: true, quantidade: 1 })],
      { h },
    );
    expect(s).toMatchObject({ livres: 1, dentroDaMeta: 2, deslizes: 1, diasBons: 3, reduzir: true });
    expect(s.quantidade).toEqual({ total: 8, anterior: null, maxPorDia: 2, unidade: 'doses' });
  });

  it('com habitoId devolve só aquele hábito', () => {
    const hs = [habito(), habito({ id: 'h2', tipo: 'alcool' })];
    expect(resumoDaSemana(hs, [], [], [], HOJE).habitos.map((x) => x.habitoId)).toEqual(['h1', 'h2']);
    expect(resumoDaSemana(hs, [], [], [], HOJE, 'h2').habitos.map((x) => x.habitoId)).toEqual(['h2']);
    expect(resumoDaSemana(hs, [], [], [], HOJE, 'nao-existe').habitos).toEqual([]);
  });

  it('normaliza dados estranhos (vontade fora da escala) sem quebrar', () => {
    const r = relato('2026-11-20', { vontade: 99 });
    expect(resumo([r, relato('2026-11-21', { vontade: -4 })]).vontadeMedia).toBe(5);
  });
});

describe('compararSemanas', () => {
  const c = (relatados: number, diasBons: number) => ({ relatados, diasBons });
  it('mais, menos e igual pela proporção de dias bons', () => {
    expect(compararSemanas(c(7, 7), c(7, 4))).toBe('mais');
    expect(compararSemanas(c(7, 4), c(7, 7))).toBe('menos');
    expect(compararSemanas(c(7, 5), c(7, 5))).toBe('igual');
    // Mesma proporção com menos relatos: igual (não parece pior por registrar menos).
    expect(compararSemanas(c(4, 4), c(7, 7))).toBe('igual');
  });

  it('sem base com menos de 2 relatos em uma das semanas', () => {
    expect(compararSemanas(c(1, 1), c(7, 3))).toBe('semBase');
    expect(compararSemanas(c(7, 3), c(1, 0))).toBe('semBase');
    expect(compararSemanas(c(0, 0), c(0, 0))).toBe('semBase');
  });

  it('diferença pequena (menos de 10 pontos) conta como igual', () => {
    expect(compararSemanas(c(30, 20), c(30, 19))).toBe('igual');
  });

  it('aparece no resumo, com os dias bons da semana anterior', () => {
    const relatos = [
      ...semana(DIAS_SEMANA),
      ...semana(DIAS_ANTERIOR, (_, i) => ({ usou: i < 3 })),
    ];
    const s = resumo(relatos);
    expect(s.comparacao).toBe('mais');
    expect(s.diasBonsAnterior).toBe(4);
    const pior = resumo([...semana(DIAS_SEMANA, (_, i) => ({ usou: i < 4 })), ...semana(DIAS_ANTERIOR)]);
    expect(pior.comparacao).toBe('menos');
    const igual = resumo([...semana(DIAS_SEMANA), ...semana(DIAS_ANTERIOR)]);
    expect(igual.comparacao).toBe('igual');
    expect(resumo(semana(DIAS_SEMANA)).comparacao).toBe('semBase');
    expect(resumo(semana(DIAS_SEMANA)).diasBonsAnterior).toBeNull();
  });
});

describe('resumoDaSemana: quantidade (reduzir)', () => {
  const h = habito({ tipo: 'alcool', meta: { tipo: 'reduzir', maxPorDia: 3, unidade: 'doses' } });

  it('soma a quantidade desta semana e da anterior', () => {
    const relatos = [
      ...semana(DIAS_SEMANA, (_, i) => (i < 4 ? { usou: true, quantidade: 2 } : {})),
      ...semana(DIAS_ANTERIOR, (_, i) => (i < 3 ? { usou: true, quantidade: 3 } : {})),
    ];
    const s = resumo(relatos, { h });
    expect(s.quantidade).toEqual({ total: 8, anterior: 9, maxPorDia: 3, unidade: 'doses' });
    expect(s.diasBons).toBe(7);
  });

  it('uso sem quantidade informada vale 0 na soma (e é deslize)', () => {
    const s = resumo([relato('2026-11-20', { usou: true })], { h });
    expect(s.quantidade?.total).toBe(0);
    expect(s.deslizes).toBe(1);
  });

  it('em parar, não há quantidade', () => {
    expect(resumo([relato('2026-11-20')]).quantidade).toBeNull();
  });
});

describe('resumoDaSemana: vontade, dia e hora mais pesados', () => {
  it('média da vontade da semana e da anterior', () => {
    const s = resumo([
      ...semana(DIAS_SEMANA.slice(0, 4), (_, i) => ({ vontade: [2, 4, 6, 8][i] })),
      ...semana(DIAS_ANTERIOR.slice(0, 2), (_, i) => ({ vontade: [1, 2][i] })),
    ]);
    expect(s.vontadeMedia).toBe(5);
    expect(s.vontadeMediaAnterior).toBe(1.5);
  });

  it('dia mais pesado: o de maior vontade, desde que alta e sem empate', () => {
    const vontades = (v: number[]) => v.map((vontade, i) => ({ dia: DIAS_SEMANA[i], vontade }));
    expect(diaMaisPesado(vontades([2, 3, 9, 4]))).toEqual({ dia: '2026-11-22', diaSemana: 0, vontade: 9 });
    expect(diaMaisPesado(vontades([2, 3, 4, 3]))).toBeNull(); // pico baixo
    expect(diaMaisPesado(vontades([9, 9, 3]))).toBeNull(); // empate no topo
    expect(diaMaisPesado(vontades([9, 2]))).toBeNull(); // poucos relatos
    expect(diaMaisPesado([])).toBeNull();
  });

  it('dia mais pesado entra no resumo com o dia da semana', () => {
    const s = resumo(semana(DIAS_SEMANA, (_, i) => ({ vontade: i === 6 ? 8 : 2 })));
    expect(s.diaPesado).toEqual({ dia: '2026-11-26', diaSemana: 4, vontade: 8 });
  });

  it('hora mais pesada: média circular das passagens pela Fissura, sem padrão não diz nada', () => {
    const noite = [fissura('2026-11-20', {}, 21), fissura('2026-11-22', {}, 22), fissura('2026-11-24', {}, 21)];
    const m = horaMaisPesada(noite);
    expect(m).not.toBeNull();
    expect(m as number).toBeGreaterThanOrEqual(21 * 60);
    expect(m as number).toBeLessThanOrEqual(22 * 60);
    // Perto da meia-noite: 23:50 e 00:10 dão meia-noite.
    const virada = [fissura('2026-11-20', { inicio: em('2026-11-20', 23, 50) }), fissura('2026-11-21', { inicio: em('2026-11-21', 0, 10) }), fissura('2026-11-22', { inicio: em('2026-11-22', 0, 0) })];
    expect(horaMaisPesada(virada)).toBe(0);
    expect(horaMaisPesada([fissura('2026-11-20', {}, 21), fissura('2026-11-21', {}, 22)])).toBeNull(); // poucas
    expect(horaMaisPesada([fissura('2026-11-20', {}, 3), fissura('2026-11-21', {}, 11), fissura('2026-11-22', {}, 19)])).toBeNull(); // espalhadas
    expect(horaMaisPesada([])).toBeNull();
  });

  it('no resumo, só as passagens da semana e do hábito entram na hora', () => {
    const fissuras = [
      fissura('2026-11-20', {}, 21),
      fissura('2026-11-22', {}, 21),
      fissura('2026-11-25', {}, 21),
      fissura('2026-11-19', {}, 9), // semana anterior
      fissura('2026-11-21', { habitoId: 'h2' }, 9), // outro hábito
    ];
    const s = resumo([], { fissuras });
    expect(s.horaPesada).toBe(21 * 60);
  });
});

describe('resumoDaSemana: ondas, recomeços e gatilhos', () => {
  it('conta ondas vencidas da semana e do hábito (sem hábito vale para todos)', () => {
    const fissuras = [
      fissura('2026-11-20'),
      fissura('2026-11-21', { venceu: false }),
      fissura('2026-11-22', { habitoId: undefined }),
      fissura('2026-11-23', { habitoId: 'h2' }),
      fissura('2026-11-19'), // fora da semana
      fissura(HOJE), // hoje não entra
    ];
    expect(resumo([], { fissuras }).fissurasVencidas).toBe(2);
  });

  it('conta recomeços feitos para deslizes da semana, só do hábito', () => {
    const rec = (dia: string, habitoId = 'h1'): Recomeco => ({ id: dia + habitoId, dia, habitoId, gatilhos: [], halt: [], salvoEm: 0 });
    const s = resumo([], { recomecos: [rec('2026-11-21'), rec('2026-11-25'), rec('2026-11-10'), rec('2026-11-22', 'h2')] });
    expect(s.recomecos).toBe(2);
  });

  it('os 3 gatilhos que mais apareceram, só da semana', () => {
    const relatos = [
      relato('2026-11-20', { gatilhos: ['Tédio', 'Estresse'] }),
      relato('2026-11-21', { gatilhos: ['tédio'] }),
      relato('2026-11-22', { gatilhos: ['Ansiedade'] }),
      relato('2026-11-23', { gatilhos: ['Solidão'] }),
      relato('2026-11-10', { gatilhos: ['Festa ou evento', 'Festa ou evento'] }), // antes da semana
    ];
    const fissuras = [fissura('2026-11-24', { gatilhos: ['tedio', 'cansaco'] }), fissura('2026-11-05', { gatilhos: ['fome'] })];
    const g = resumo(relatos, { fissuras }).gatilhos;
    expect(g).toHaveLength(3);
    expect(g[0]).toMatchObject({ chave: 'tedio', total: 3 });
    expect(g.map((x) => x.rotulo)).not.toContain('Festa ou evento');
    expect(g.map((x) => x.rotulo)).not.toContain('Fome');
  });

  it('gatilhos do relato de outro hábito não entram', () => {
    const outro = relato('2026-11-20', { habitoId: 'h2', gatilhos: ['Tédio'] });
    expect(resumo([outro]).gatilhos).toEqual([]);
  });
});

describe('resumoDaSemana: economia', () => {
  it('só o que foi economizado dentro da semana', () => {
    const h = habito({ custoPorDiaCentavos: 2000, unidadesPorDia: 10 });
    const relatos = [
      ...semana(DIAS_ANTERIOR), // 7 dias livres antes da janela: não entram
      relato('2026-11-20'),
      relato('2026-11-21'),
      relato('2026-11-22', { usou: true }),
      relato('2026-11-23'),
    ];
    expect(resumo(relatos, { h }).economia).toEqual({ centavos: 6000, unidades: 30 });
  });

  it('em reduzir, conta a diferença entre o habitual e o usado', () => {
    const h = habito({ tipo: 'alcool', meta: { tipo: 'reduzir', maxPorDia: 4, unidade: 'doses' }, custoPorDiaCentavos: 4000, unidadesPorDia: 8 });
    const relatos = [relato('2026-11-20'), relato('2026-11-21', { usou: true, quantidade: 3 }), relato('2026-11-22', { usou: true, quantidade: 9 })];
    expect(resumo(relatos, { h }).economia).toEqual({ centavos: 4000 + 2500, unidades: 8 + 5 });
  });

  it('sem custo nem unidades, ou sem nada economizado: null', () => {
    expect(resumo(semana(DIAS_SEMANA)).economia).toBeNull();
    const h = habito({ custoPorDiaCentavos: 2000 });
    expect(resumo(semana(DIAS_SEMANA, { usou: true }), { h }).economia).toBeNull();
    // Reduzir sem unidades por dia: sem base para a conta.
    const r = habito({ meta: { tipo: 'reduzir', maxPorDia: 3, unidade: 'x' }, custoPorDiaCentavos: 2000 });
    expect(resumo(semana(DIAS_SEMANA), { h: r }).economia).toBeNull();
  });
});

// Constrói uma semana "à mão" para testar só as frases.
const base = (extra: Partial<SemanaHabito> = {}): SemanaHabito => ({
  habitoId: 'h1',
  tipo: 'tabaco',
  reduzir: false,
  janela: janelaDaSemana(HOJE),
  livres: 7,
  dentroDaMeta: 0,
  deslizes: 0,
  semRelato: 0,
  relatados: 7,
  diasBons: 7,
  comparacao: 'semBase',
  diasBonsAnterior: null,
  quantidade: null,
  vontadeMedia: 3,
  vontadeMediaAnterior: null,
  diaPesado: null,
  horaPesada: null,
  fissurasVencidas: 0,
  recomecos: 0,
  gatilhos: [],
  economia: null,
  ...extra,
});

const TIPOS: TipoHabito[] = ['tabaco', 'alcool', 'sexual'];

describe('frasesDaReflexao', () => {
  it('poucos relatos: só um convite gentil, com o vocabulário do hábito', () => {
    const f = frasesDaReflexao(base({ relatados: 1, livres: 1, semRelato: 6 }), 'tabaco');
    expect(f).toHaveLength(1);
    expect(f[0]).toMatch(/fôlego/);
    expect(frasesDaReflexao(base({ relatados: 0, livres: 0, semRelato: 7 }), 'alcool')[0]).toMatch(/noites/);
    expect(frasesDaReflexao(base({ relatados: 0, livres: 0, semRelato: 7 }), 'sexual')[0]).toMatch(/tempo e a sua atenção/);
  });

  it('semana sem deslizes: celebra, com o vocabulário de cada hábito', () => {
    expect(frasesDaReflexao(base(), 'tabaco')[0]).toMatch(/sem deslizes.*fôlego/);
    expect(frasesDaReflexao(base({ tipo: 'alcool' }), 'alcool')[0]).toMatch(/sem deslizes.*noites/);
    expect(frasesDaReflexao(base({ tipo: 'sexual' }), 'sexual')[0]).toMatch(/seu tempo e da sua atenção/);
  });

  it('um deslize é informação, não veredito', () => {
    for (const tipo of TIPOS) {
      const f = frasesDaReflexao(base({ tipo, livres: 6, deslizes: 1, diasBons: 6 }), tipo);
      expect(f[0]).toMatch(/A semana teve um deslize/);
      expect(f[0]).toMatch(/informação, não um veredito/);
      expect(f[0]).toMatch(/O que ele te ensina/);
    }
  });

  it('vários deslizes: ainda informação, e diz quantos', () => {
    const f = frasesDaReflexao(base({ livres: 4, deslizes: 3, diasBons: 4 }));
    expect(f[0]).toMatch(/3 deslizes/);
    expect(f[0]).toMatch(/não quem você é/);
  });

  it('semana pesada (mais da metade com deslize): celebra o esforço de registrar', () => {
    for (const tipo of TIPOS) {
      const f = frasesDaReflexao(base({ tipo, livres: 2, deslizes: 5, diasBons: 2 }), tipo);
      expect(f[0]).toMatch(/Foi uma semana (de noites )?difíc/);
      expect(f[0]).toMatch(/registrou 7 dias/);
      expect(f[0]).toMatch(/cuidar de você/);
    }
  });

  it('semana pesada com ondas vencidas: reconhece o esforço', () => {
    const f = frasesDaReflexao(base({ livres: 2, deslizes: 5, diasBons: 2, fissurasVencidas: 3 }));
    expect(f.join(' ')).toMatch(/enfrentou 3 ondas de vontade e passou por elas/);
    expect(frasesDaReflexao(base({ fissurasVencidas: 1 })).join(' ')).toMatch(/1 onda de vontade e passou por ela\./);
  });

  it('comparação com a semana anterior', () => {
    expect(frasesDaReflexao(base({ comparacao: 'mais' })).join(' ')).toMatch(/mais dias livres do que na semana passada/);
    expect(frasesDaReflexao(base({ comparacao: 'menos', livres: 4, deslizes: 3, diasBons: 4 })).join(' ')).toMatch(/menos dias livres.*Semanas oscilam/);
    expect(frasesDaReflexao(base({ comparacao: 'igual' })).join(' ')).toMatch(/constância também é conquista/);
    expect(frasesDaReflexao(base({ comparacao: 'semBase' })).join(' ')).not.toMatch(/semana passada|anterior/);
  });

  it('em reduzir, fala de dias dentro da meta e compara as quantidades', () => {
    const q = { total: 6, anterior: 10, maxPorDia: 3, unidade: 'doses' };
    const f = frasesDaReflexao(base({ tipo: 'alcool', reduzir: true, comparacao: 'mais', quantidade: q, dentroDaMeta: 7, livres: 0 })).join(' ');
    expect(f).toMatch(/mais dias dentro da meta/);
    expect(f).toMatch(/Você usou 6 doses no total, menos que os 10 da semana passada/);
    const mais = frasesDaReflexao(base({ reduzir: true, quantidade: { ...q, total: 12 } })).join(' ');
    expect(mais).toMatch(/Foram 12 doses.*um pouco mais que os 10/);
    expect(mais).toMatch(/sem pressa/);
    // Quantidade igual ou sem base: nada a comentar sobre ela.
    expect(frasesDaReflexao(base({ reduzir: true, quantidade: { ...q, total: 10 } })).join(' ')).not.toMatch(/doses/);
    expect(frasesDaReflexao(base({ reduzir: true, quantidade: { ...q, anterior: null } })).join(' ')).not.toMatch(/doses/);
  });

  it('vontade média: comenta quando mudou pelo menos 1 ponto', () => {
    expect(frasesDaReflexao(base({ vontadeMedia: 3, vontadeMediaAnterior: 5 })).join(' ')).toMatch(/vontade média ficou mais baixa/);
    expect(frasesDaReflexao(base({ vontadeMedia: 6, vontadeMediaAnterior: 4 })).join(' ')).toMatch(/vontade média foi mais alta/);
    expect(frasesDaReflexao(base({ vontadeMedia: 4, vontadeMediaAnterior: 4.5 })).join(' ')).not.toMatch(/vontade média/);
  });

  it('esforço de registrar quando nada mais se aplica', () => {
    expect(frasesDaReflexao(base({ relatados: 6, livres: 6, semRelato: 1 })).join(' ')).toMatch(/registrou 6 dias/);
    expect(frasesDaReflexao(base({ recomecos: 1 })).join(' ')).toMatch(/parou para olhar com cuidado um deslize/);
  });

  it('sugestão ligada ao gatilho que mais puxou a onda', () => {
    const g = [{ chave: 'tedio', rotulo: 'Tédio', total: 4 }];
    const f = frasesDaReflexao(base({ gatilhos: g }));
    expect(f.join(' ')).toMatch(/O que mais puxou a onda foi tédio\. Que tal um plano “se-então”/);
  });

  it('sem gatilho, sugere se preparar para o dia ou o horário mais pesado', () => {
    const dia = frasesDaReflexao(base({ diaPesado: { dia: '2026-11-21', diaSemana: 6, vontade: 8 } })).join(' ');
    expect(dia).toMatch(/aos sábados/);
    const hora = frasesDaReflexao(base({ horaPesada: 21 * 60 + 30 })).join(' ');
    expect(hora).toMatch(/por volta das 22h/);
    // O gatilho tem prioridade sobre o dia.
    const g = [{ chave: 'fome', rotulo: 'Fome', total: 2 }];
    expect(frasesDaReflexao(base({ gatilhos: g, diaPesado: { dia: '2026-11-21', diaSemana: 6, vontade: 8 } })).join(' ')).not.toMatch(/sábados/);
  });

  it('sempre entre 2 e 4 frases (ou 1 convite) e sem linguagem que culpa, em qualquer combinação', () => {
    const g = [{ chave: 'tedio', rotulo: 'Tédio', total: 4 }];
    for (const tipo of TIPOS) {
      for (const deslizes of [0, 1, 2, 5, 7]) {
        for (const comparacao of ['mais', 'menos', 'igual', 'semBase'] as const) {
          for (const rico of [false, true]) {
            const s = base({
              tipo,
              deslizes,
              livres: 7 - deslizes,
              diasBons: 7 - deslizes,
              comparacao,
              ...(rico
                ? {
                    gatilhos: g,
                    fissurasVencidas: 2,
                    recomecos: 1,
                    vontadeMedia: 3,
                    vontadeMediaAnterior: 6,
                    diaPesado: { dia: '2026-11-20', diaSemana: 5, vontade: 9 },
                    horaPesada: 22 * 60,
                  }
                : {}),
            });
            const f = frasesDaReflexao(s, tipo);
            expect(f.length).toBeGreaterThanOrEqual(2);
            expect(f.length).toBeLessThanOrEqual(4);
            expect(new Set(f).size).toBe(f.length);
            for (const frase of f) expect(frase, frase).not.toMatch(PROIBIDO);
          }
        }
      }
    }
  });

  it('o mínimo de 2 frases vale até quando quase nada se aplica', () => {
    const f = frasesDaReflexao(base({ relatados: 3, livres: 3, diasBons: 3, semRelato: 4, vontadeMedia: null }));
    expect(f.length).toBeGreaterThanOrEqual(2);
  });

  it('o vocabulário sexual é neutro, sem nada explícito', () => {
    const todas = TIPOS.flatMap((t) => [
      ...frasesDaReflexao(base({ tipo: t, relatados: 0, livres: 0 }), 'sexual'),
      ...frasesDaReflexao(base({ tipo: t }), 'sexual'),
      ...frasesDaReflexao(base({ tipo: t, deslizes: 1, livres: 6 }), 'sexual'),
      ...frasesDaReflexao(base({ tipo: t, deslizes: 5, livres: 2 }), 'sexual'),
    ]).join(' ');
    expect(todas).not.toMatch(/porn|sexo|sexual|masturb|nu[ds]|explícit|fumar|cigarro|beber|álcool|bebida/i);
  });

  it('usa o tipo do próprio resumo quando não é passado', () => {
    expect(frasesDaReflexao(base({ tipo: 'alcool' }))[0]).toMatch(/noites/);
  });
});

describe('horaAproximada e nosDias', () => {
  it('arredonda para a hora cheia e acerta o artigo', () => {
    expect(horaAproximada(21 * 60 + 20)).toBe('por volta das 21h');
    expect(horaAproximada(21 * 60 + 40)).toBe('por volta das 22h');
    expect(horaAproximada(60)).toBe('por volta da 1h');
    expect(horaAproximada(0)).toBe('por volta da meia-noite');
    expect(horaAproximada(23 * 60 + 50)).toBe('por volta da meia-noite');
  });

  it('"aos" para sábado e domingo, "às" para os outros', () => {
    expect(nosDias(0)).toBe('aos domingos');
    expect(nosDias(6)).toBe('aos sábados');
    expect(nosDias(5)).toBe('às sextas');
    expect(nosDias(1)).toBe('às segundas');
  });
});

describe('seDoGatilho', () => {
  it('frase de plano para os gatilhos de um toque e para os do relato', () => {
    expect(seDoGatilho({ chave: 'tedio', rotulo: 'Tédio', total: 2 })).toBe('eu sentir tédio');
    expect(seDoGatilho({ chave: 'celular', rotulo: 'Celular/telas', total: 2 })).toBe('eu estiver com o celular na mão');
  });

  it('gatilho livre cai na sugestão do recomeço, sem quebrar', () => {
    expect(seDoGatilho({ chave: 'discussao', rotulo: 'Discussão', total: 1 })).toBe('eu tiver uma discussão');
    expect(seDoGatilho({ chave: 'prova', rotulo: 'Prova na faculdade', total: 1 })).toBe('acontecer: prova na faculdade');
  });
});

describe('inicioConversaDaSemana', () => {
  it('resume só números agregados, sem apelido, notas nem gatilhos digitados à mão', () => {
    const relatos = [
      relato('2026-11-20', { vontade: 4, gatilhos: ['Tédio', 'Briga com a Marina'] }),
      relato('2026-11-21', { vontade: 5, usou: true, gatilhos: ['Briga com a Marina'] }),
      { ...relato('2026-11-22', { vontade: 3, gatilhos: ['Briga com a Marina'] }), nota: 'segredo importante' },
    ];
    const s = resumo(relatos, { fissuras: [fissura('2026-11-23', { gatilhos: ['tedio'] })] });
    const t = inicioConversaDaSemana(s);
    expect(t).toMatch(/2 dias livres/);
    expect(t).toMatch(/1 dia com deslize/);
    expect(t).toMatch(/4 dias sem relato/);
    expect(t).toMatch(/vontade média foi 4 de 10/);
    expect(t).toMatch(/1 onda de vontade/);
    expect(t).toMatch(/o que mais pesou: tédio/i);
    expect(t).not.toMatch(/Marlboro|Zé|Marina|segredo|briga/i);
    expect(t.length).toBeLessThan(600);
  });

  it('só cita "dentro da meta" em hábitos de reduzir e a comparação quando há base', () => {
    const parar = inicioConversaDaSemana(base({ comparacao: 'mais' }));
    expect(parar).not.toMatch(/dentro da meta/);
    expect(parar).toMatch(/Foi melhor que a semana anterior/);
    const reduzir = inicioConversaDaSemana(base({ reduzir: true, dentroDaMeta: 3, livres: 4, comparacao: 'menos' }));
    expect(reduzir).toMatch(/3 dias dentro da meta/);
    expect(reduzir).toMatch(/mais difícil que a semana anterior/);
    expect(inicioConversaDaSemana(base({ comparacao: 'semBase' }))).not.toMatch(/semana anterior/);
  });

  it('sem culpa, e não cita o hábito nem a substância', () => {
    for (const tipo of TIPOS) {
      const t = inicioConversaDaSemana(base({ tipo, deslizes: 2, livres: 5 }));
      expect(t).toMatch(/sem me culpar/);
      expect(t).not.toMatch(/cigarro|fum|beb|álcool|sexo|porn|sexual/i);
      expect(t).not.toMatch(/limpo|sujo|recaíd|recaid|fracass/i);
    }
  });

  it('singular e plural', () => {
    const t = inicioConversaDaSemana(base({ livres: 1, deslizes: 1, semRelato: 1, relatados: 2, fissurasVencidas: 0, vontadeMedia: null }));
    expect(t).toMatch(/1 dia livre, 1 dia com deslize, 1 dia sem relato/);
  });
});

describe('cartão "Sua semana" do Início', () => {
  it('a chave da semana é o domingo mais recente: domingo e segunda dão a mesma', () => {
    expect(chaveDaReflexao('2026-11-29')).toBe('2026-11-29'); // domingo
    expect(chaveDaReflexao('2026-11-30')).toBe('2026-11-29'); // segunda
    expect(chaveDaReflexao('2026-12-05')).toBe('2026-11-29'); // sábado seguinte
    expect(chaveDaReflexao('2026-12-06')).toBe('2026-12-06');
  });

  it('só domingo e segunda são dias da reflexão', () => {
    expect(['2026-11-29', '2026-11-30'].every(ehDiaDaReflexao)).toBe(true);
    expect(['2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-05'].some(ehDiaDaReflexao)).toBe(false);
  });

  const com = (hoje: string) => resumoDaSemana([habito()], semana(['2026-11-24', '2026-11-25', '2026-11-26']), [], [], hoje);

  it('aparece no domingo e na segunda com dados, enquanto não foi aberta', () => {
    const hoje = '2026-11-29';
    expect(deveMostrarCartaoReflexao(hoje, undefined, com(hoje))).toBe(true);
    expect(deveMostrarCartaoReflexao('2026-11-30', '2026-11-22', com('2026-11-30'))).toBe(true); // aberta na semana passada
  });

  it('some depois de aberta (também na segunda), em outros dias e sem dados', () => {
    const hoje = '2026-11-29';
    expect(deveMostrarCartaoReflexao(hoje, chaveDaReflexao(hoje), com(hoje))).toBe(false);
    expect(deveMostrarCartaoReflexao('2026-11-30', chaveDaReflexao(hoje), com('2026-11-30'))).toBe(false);
    expect(deveMostrarCartaoReflexao('2026-12-02', undefined, com('2026-12-02'))).toBe(false);
    expect(deveMostrarCartaoReflexao(hoje, undefined, resumoDaSemana([habito()], [relato('2026-11-26')], [], [], hoje))).toBe(false);
    expect(deveMostrarCartaoReflexao(hoje, undefined, resumoDaSemana([], [], [], [], hoje))).toBe(false);
  });
});
