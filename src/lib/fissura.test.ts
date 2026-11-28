import { describe, expect, it } from 'vitest';
import {
  avancoDeslize,
  contarFissurasVencidas,
  deveRegistrarAoFechar,
  duracaoTexto,
  ESPERA_SEG,
  faseAncora,
  falarTempo,
  formatarContagem,
  montarFissura,
  PASSOS_ATERRAMENTO,
  proximoPassoAterramento,
  segundosRestantes,
  sortearPorque,
} from './fissura';
import type { Fissura, Porque } from './tipos';

const porque = (id: string): Porque => ({ id, texto: id, criadoEm: 0 });

describe('formatarContagem', () => {
  it('mostra minutos e segundos', () => {
    expect(formatarContagem(180)).toBe('3:00');
    expect(formatarContagem(161)).toBe('2:41');
    expect(formatarContagem(9)).toBe('0:09');
  });
  it('nunca fica negativo', () => {
    expect(formatarContagem(-4)).toBe('0:00');
  });
});

describe('duracaoTexto', () => {
  it('arredonda para minutos, no mínimo 1', () => {
    expect(duracaoTexto(360)).toBe('6 min');
    expect(duracaoTexto(20)).toBe('1 min');
    expect(duracaoTexto(200)).toBe('3 min');
  });
});

describe('sortearPorque', () => {
  it('sem porquês devolve undefined', () => {
    expect(sortearPorque([])).toBeUndefined();
  });
  it('usa o sorteador e nunca passa do fim da lista', () => {
    const lista = [porque('a'), porque('b'), porque('c')];
    expect(sortearPorque(lista, () => 0)?.id).toBe('a');
    expect(sortearPorque(lista, () => 0.5)?.id).toBe('b');
    expect(sortearPorque(lista, () => 0.999)?.id).toBe('c');
    expect(sortearPorque(lista, () => 1)?.id).toBe('c');
  });
});

describe('contarFissurasVencidas', () => {
  const f = (id: string, venceu: boolean, habitoId?: string): Fissura => ({ id, inicio: 0, duracaoSeg: 0, venceu, habitoId });
  const lista = [f('1', true, 'a'), f('2', true, 'b'), f('3', false, 'a'), f('4', true)];
  it('conta todas as vencidas sem filtro', () => {
    expect(contarFissurasVencidas(lista)).toBe(3);
  });
  it('com hábito, conta as dele e as sem hábito', () => {
    expect(contarFissurasVencidas(lista, 'a')).toBe(2);
    expect(contarFissurasVencidas(lista, 'b')).toBe(2);
  });
});

describe('montarFissura', () => {
  it('calcula a duração em segundos e limita a vontade de 0 a 10', () => {
    const r = montarFissura({ id: 'x', inicio: 1000, agora: 361_000, venceu: true, vontadeAntes: 14, vontadeDepois: -2 });
    expect(r).toEqual({ id: 'x', inicio: 1000, duracaoSeg: 360, venceu: true, vontadeAntes: 10, vontadeDepois: 0 });
  });
  it('omite o que está vazio e apara o texto', () => {
    const r = montarFissura({ id: 'x', inicio: 0, agora: 5000, venceu: false, ajudou: '   ', habitoId: '' });
    expect(r).toEqual({ id: 'x', inicio: 0, duracaoSeg: 5, venceu: false });
    expect(montarFissura({ id: 'x', inicio: 0, agora: 0, venceu: true, ajudou: '  água gelada ' }).ajudou).toBe('água gelada');
  });
  it('relógio andando para trás não gera duração negativa', () => {
    expect(montarFissura({ id: 'x', inicio: 9000, agora: 1000, venceu: false }).duracaoSeg).toBe(0);
  });
});

describe('montarFissura com gatilhos', () => {
  it('guarda só os ids conhecidos, sem repetir, e omite quando vazio', () => {
    const r = montarFissura({ id: 'x', inicio: 0, agora: 0, venceu: true, gatilhos: ['celular', 'fome', 'nada', 'fome'] });
    expect(r.gatilhos).toEqual(['fome', 'celular']);
    expect('gatilhos' in montarFissura({ id: 'x', inicio: 0, agora: 0, venceu: true, gatilhos: [] })).toBe(false);
    expect('gatilhos' in montarFissura({ id: 'x', inicio: 0, agora: 0, venceu: true, gatilhos: ['nada'] })).toBe(false);
  });
});

describe('segundosRestantes', () => {
  it('conta pelo relógio e arredonda para cima, sem passar de zero', () => {
    expect(segundosRestantes(10_000, 0)).toBe(10);
    expect(segundosRestantes(10_000, 400)).toBe(10);
    expect(segundosRestantes(10_000, 9_001)).toBe(1);
    expect(segundosRestantes(10_000, 10_000)).toBe(0);
    expect(segundosRestantes(10_000, 90_000)).toBe(0);
  });
  it('voltar do segundo plano depois de 4 min com 10 min de espera mostra 6 min', () => {
    const fim = 1_000_000 + ESPERA_SEG * 1000;
    expect(segundosRestantes(fim, 1_000_000 + 240_000)).toBe(360);
  });
});

describe('falarTempo', () => {
  it('lê o tempo por extenso, no singular quando for 1', () => {
    expect(falarTempo(432)).toBe('7 minutos e 12 segundos');
    expect(falarTempo(61)).toBe('1 minuto e 1 segundo');
    expect(falarTempo(600)).toBe('10 minutos');
    expect(falarTempo(45)).toBe('45 segundos');
    expect(falarTempo(-3)).toBe('0 segundos');
  });
});

describe('deveRegistrarAoFechar', () => {
  it('abrir e fechar na hora não registra', () => {
    expect(deveRegistrarAoFechar(1, 3)).toBe(false);
  });
  it('registra se passou do primeiro passo ou ficou um pouco', () => {
    expect(deveRegistrarAoFechar(1, 25)).toBe(true);
    expect(deveRegistrarAoFechar(2, 2)).toBe(true);
    expect(deveRegistrarAoFechar(3, 0)).toBe(true);
  });
});

describe('faseAncora', () => {
  it('segue 4 s de inspirar e 6 s de soltar, em ciclos', () => {
    expect(faseAncora(0)).toBe('inspire');
    expect(faseAncora(3999)).toBe('inspire');
    expect(faseAncora(4000)).toBe('solte');
    expect(faseAncora(9999)).toBe('solte');
    expect(faseAncora(10000)).toBe('inspire');
    expect(faseAncora(25000)).toBe('solte');
  });
  it('tempo negativo conta como o começo', () => {
    expect(faseAncora(-500)).toBe('inspire');
  });
});

describe('aterramento 5-4-3-2-1', () => {
  it('tem 5 passos de 5 até 1', () => {
    expect(PASSOS_ATERRAMENTO.map((p) => p.total)).toEqual([5, 4, 3, 2, 1]);
  });
  it('avança toques dentro do passo e passa ao próximo ao completar', () => {
    expect(proximoPassoAterramento(0, 0)).toEqual({ indice: 0, toques: 1, mudouPasso: false, concluido: false });
    expect(proximoPassoAterramento(0, 4)).toEqual({ indice: 1, toques: 0, mudouPasso: true, concluido: false });
    expect(proximoPassoAterramento(4, 0)).toEqual({ indice: 4, toques: 1, mudouPasso: false, concluido: true });
  });
});

describe('avancoDeslize', () => {
  it('movimento lento avança sem aviso de velocidade', () => {
    const r = avancoDeslize(4, 50); // 80 dp/s
    expect(r.rapido).toBe(false);
    expect(r.delta).toBeGreaterThan(0);
  });
  it('dedo parado não avança nem volta', () => {
    expect(avancoDeslize(0, 50)).toEqual({ delta: 0, rapido: false });
    expect(avancoDeslize(0.1, 100)).toEqual({ delta: 0, rapido: false });
  });
  it('movimento rápido pede mais calma e recua um pouco sem travar', () => {
    const r = avancoDeslize(40, 50); // 800 dp/s
    expect(r.rapido).toBe(true);
    expect(r.delta).toBeLessThan(0);
  });
});
