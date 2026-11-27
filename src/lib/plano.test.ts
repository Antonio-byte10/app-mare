import { describe, expect, it } from 'vitest';
import {
  acoesDoPlano,
  descreverPorque,
  frasePlano,
  maisNovosPrimeiro,
  MAX_PORQUE,
  sugestoesLivres,
  validarPlano,
  validarPorque,
  validarPorqueOuFoto,
} from './plano';
import type { PlanoSeEntao } from './tipos';

describe('validarPorque', () => {
  it('apara e aceita texto', () => {
    expect(validarPorque('  Ver meu filho crescer ').valor).toBe('Ver meu filho crescer');
  });
  it('recusa vazio e texto longo demais', () => {
    expect(validarPorque('   ').erro).toBeTruthy();
    expect(validarPorque('a'.repeat(MAX_PORQUE + 1)).erro).toBeTruthy();
  });
});

describe('validarPlano', () => {
  it('apara e tira pontuação do fim', () => {
    expect(validarPlano(' eu sentir ansiedade, ', 'respirar fundo.')).toEqual({ se: 'eu sentir ansiedade', entao: 'respirar fundo' });
  });
  it('exige as duas partes', () => {
    expect('erro' in validarPlano('', 'x')).toBe(true);
    expect('erro' in validarPlano('x', '  ')).toBe(true);
  });
  it('recusa parte longa demais', () => {
    expect('erro' in validarPlano('a'.repeat(200), 'x')).toBe(true);
  });
});

describe('frasePlano', () => {
  it('monta a frase', () => {
    expect(frasePlano({ se: 'eu sentir tédio', entao: 'caminhar' })).toBe('Se eu sentir tédio, então caminhar.');
  });
});

describe('listas', () => {
  const plano = (id: string, criadoEm: number, habitoId?: string): PlanoSeEntao => ({ id, se: 's', entao: 'e', habitoId, criadoEm });
  it('ordena do mais novo para o mais antigo sem alterar a original', () => {
    const base = [plano('a', 1), plano('b', 3), plano('c', 2)];
    expect(maisNovosPrimeiro(base).map((p) => p.id)).toEqual(['b', 'c', 'a']);
    expect(base.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });
  it('ações do plano: as do hábito e as gerais', () => {
    const lista = [plano('a', 1, 'h1'), plano('b', 2, 'h2'), plano('c', 3)];
    expect(acoesDoPlano(lista, 'h1').map((p) => p.id)).toEqual(['c', 'a']);
    expect(acoesDoPlano(lista).map((p) => p.id)).toEqual(['c', 'b', 'a']);
  });
  it('sugestões já usadas somem da lista', () => {
    expect(sugestoesLivres(['Tomar um banho', 'caminhar'], ['tomar um banho '])).toEqual(['caminhar']);
  });
});

describe('validarPorqueOuFoto', () => {
  it('com foto, o texto pode ficar vazio', () => {
    expect(validarPorqueOuFoto('   ', true)).toEqual({ valor: '' });
    expect(validarPorqueOuFoto(' Meu filho ', true).valor).toBe('Meu filho');
  });
  it('sem foto, pede texto (ou foto)', () => {
    expect(validarPorqueOuFoto('  ', false).erro).toContain('foto');
    expect(validarPorqueOuFoto('Meu filho', false).valor).toBe('Meu filho');
  });
  it('o limite de caracteres vale com ou sem foto', () => {
    expect(validarPorqueOuFoto('a'.repeat(MAX_PORQUE + 1), true).erro).toBeTruthy();
  });
});

describe('descreverPorque', () => {
  it('usa o texto, ou "foto" quando é só a imagem', () => {
    expect(descreverPorque({ texto: 'Meu filho' })).toBe('Meu filho');
    expect(descreverPorque({ texto: '', foto: 'x.bin' })).toBe('foto');
    expect(descreverPorque({ texto: '  ' })).toBe('');
  });
});
