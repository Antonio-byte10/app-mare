import { describe, expect, it } from 'vitest';
import {
  celulaTocavel,
  deslocarMes,
  estadoCelula,
  gradeDoMes,
  limitarMes,
  mesDe,
  podeIrParaMes,
  textoPico,
  tituloMes,
  totalRelatosNaJanela,
} from './calendario';
import type { Relato } from './tipos';

describe('tituloMes', () => {
  it('escreve o mês em pt-BR', () => {
    expect(tituloMes('2026-11')).toBe('Novembro 2026');
    expect(tituloMes('2026-03')).toBe('Março 2026');
    expect(tituloMes('2027-01')).toBe('Janeiro 2027');
  });
});

describe('deslocarMes', () => {
  it('anda para frente e para trás, virando o ano', () => {
    expect(deslocarMes('2026-11', 1)).toBe('2026-12');
    expect(deslocarMes('2026-12', 1)).toBe('2027-01');
    expect(deslocarMes('2026-01', -1)).toBe('2025-12');
    expect(deslocarMes('2026-11', -11)).toBe('2025-12');
  });
});

describe('gradeDoMes', () => {
  it('novembro de 2026 começa no domingo: sem células vazias antes', () => {
    const g = gradeDoMes('2026-11');
    expect(g[0]).toBe('2026-11-01');
    expect(g).toHaveLength(30);
    expect(g[29]).toBe('2026-11-30');
  });
  it('fevereiro de 2026 começa no domingo e tem 28 dias', () => {
    const g = gradeDoMes('2026-02');
    expect(g[0]).toBe('2026-02-01');
    expect(g).toHaveLength(28);
  });
  it('mês que não começa no domingo ganha células vazias (dezembro de 2026 começa numa terça)', () => {
    const g = gradeDoMes('2026-12');
    expect(g.slice(0, 3)).toEqual([null, null, '2026-12-01']);
    expect(g).toHaveLength(2 + 31);
  });
  it('fevereiro bissexto tem 29 dias (2028 começa numa terça)', () => {
    const g = gradeDoMes('2028-02');
    expect(g.filter(Boolean)).toHaveLength(29);
    expect(g.indexOf('2028-02-01')).toBe(2);
  });
});

describe('estadoCelula', () => {
  const ctx = {
    estados: { '2026-11-20': 'livre', '2026-11-21': 'deslize', '2026-11-22': 'dentroDaMeta' } as const,
    inicio: '2026-11-10',
    hoje: '2026-11-26',
  };
  it('mostra o estado do relato', () => {
    expect(estadoCelula('2026-11-20', ctx)).toBe('livre');
    expect(estadoCelula('2026-11-21', ctx)).toBe('deslize');
    expect(estadoCelula('2026-11-22', ctx)).toBe('dentroDaMeta');
  });
  it('dia passado sem relato desde o início é "sem relato", mesmo com mais de 7 dias', () => {
    expect(estadoCelula('2026-11-23', ctx)).toBe('semRelato');
    expect(estadoCelula('2026-11-10', ctx)).toBe('semRelato');
  });
  it('hoje sem relato é "hoje"; com relato mostra o estado do relato', () => {
    expect(estadoCelula('2026-11-26', ctx)).toBe('hoje');
    expect(estadoCelula('2026-11-26', { ...ctx, estados: { '2026-11-26': 'livre' } })).toBe('livre');
  });
  it('depois de hoje é futuro, antes do início é antes', () => {
    expect(estadoCelula('2026-11-27', ctx)).toBe('futuro');
    expect(estadoCelula('2026-11-09', ctx)).toBe('antes');
  });
  it('início no futuro: nada é tocável', () => {
    const c = { estados: {}, inicio: '2026-12-01', hoje: '2026-11-26' };
    expect(estadoCelula('2026-11-26', c)).toBe('antes');
    expect(estadoCelula('2026-12-01', c)).toBe('futuro');
  });
});

describe('celulaTocavel', () => {
  it('futuro e antes do início não abrem relato', () => {
    expect(celulaTocavel('futuro')).toBe(false);
    expect(celulaTocavel('antes')).toBe(false);
    expect(celulaTocavel('semRelato')).toBe(true);
    expect(celulaTocavel('hoje')).toBe(true);
    expect(celulaTocavel('deslize')).toBe(true);
  });
});

describe('navegação entre meses', () => {
  const limites = { inicio: '2026-09-14', hoje: '2026-11-26' };
  it('não passa do mês atual nem do mês do início', () => {
    expect(limitarMes('2026-12', limites)).toBe('2026-11');
    expect(limitarMes('2026-08', limites)).toBe('2026-09');
    expect(limitarMes('2026-10', limites)).toBe('2026-10');
  });
  it('as setas só andam dentro do intervalo', () => {
    expect(podeIrParaMes('2026-11', 1, limites)).toBe(false);
    expect(podeIrParaMes('2026-11', -1, limites)).toBe(true);
    expect(podeIrParaMes('2026-09', -1, limites)).toBe(false);
    expect(podeIrParaMes('2026-09', 1, limites)).toBe(true);
  });
  it('hábito que começa no mês atual: nenhuma seta anda', () => {
    const l = { inicio: '2026-11-05', hoje: '2026-11-26' };
    expect(podeIrParaMes('2026-11', -1, l)).toBe(false);
    expect(podeIrParaMes('2026-11', 1, l)).toBe(false);
  });
  it('início no futuro: fica no mês atual', () => {
    expect(limitarMes('2026-12', { inicio: '2026-12-01', hoje: '2026-11-26' })).toBe('2026-11');
  });
  it('mesDe pega o mês de um dia', () => {
    expect(mesDe('2026-11-26')).toBe('2026-11');
  });
});

describe('totalRelatosNaJanela', () => {
  const relato = (dia: string, habitoId = 'h1'): Relato => ({
    dia,
    habitos: [{ habitoId, vontade: 3, usou: false }],
    gatilhos: [],
    salvoEm: 0,
  });
  it('conta só os relatos do hábito nas últimas 8 semanas', () => {
    const relatos = [
      relato('2026-11-26'),
      relato('2026-10-02'), // 55 dias antes de hoje: dentro
      relato('2026-10-01'), // 56 dias antes: fora
      relato('2026-11-20', 'h2'),
    ];
    expect(totalRelatosNaJanela(relatos, 'h1', '2026-11-26')).toBe(2);
  });
});

describe('textoPico', () => {
  it('sem pico, não há texto', () => {
    expect(textoPico(null)).toBeNull();
  });
  it('usa "às" para dias femininos e "aos" para domingos e sábados', () => {
    expect(textoPico(5)).toEqual({ antes: 'Suas vontades sobem às ', destaque: 'sextas', depois: '.' });
    expect(textoPico(1)?.antes).toBe('Suas vontades sobem às ');
    expect(textoPico(0)).toEqual({ antes: 'Suas vontades sobem aos ', destaque: 'domingos', depois: '.' });
    expect(textoPico(6)?.antes).toBe('Suas vontades sobem aos ');
  });
});
