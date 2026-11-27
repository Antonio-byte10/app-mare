import { describe, expect, it } from 'vitest';
import {
  contarFissurasVencidas,
  deveRegistrarAoFechar,
  duracaoTexto,
  ESPERA_SEG,
  falarTempo,
  formatarContagem,
  montarFissura,
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
