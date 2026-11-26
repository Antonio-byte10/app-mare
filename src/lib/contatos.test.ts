import { describe, expect, it } from 'vitest';
import { contatosPorNome, normalizarTelefone, telefoneValido, urlLigar, validarContato } from './contatos';

describe('normalizarTelefone', () => {
  it('deixa só dígitos', () => {
    expect(normalizarTelefone('(11) 98888-7777')).toBe('11988887777');
  });
  it('mantém o + inicial', () => {
    expect(normalizarTelefone('+55 11 98888-7777')).toBe('+5511988887777');
  });
});

describe('telefoneValido', () => {
  it('aceita de 8 a 13 dígitos', () => {
    expect(telefoneValido('3229-3611')).toBe(true);
    expect(telefoneValido('(11) 98888-7777')).toBe(true);
    expect(telefoneValido('+55 11 98888-7777')).toBe(true);
  });
  it('recusa curto, longo e vazio', () => {
    expect(telefoneValido('123')).toBe(false);
    expect(telefoneValido('1234567890123456')).toBe(false);
    expect(telefoneValido('')).toBe(false);
    expect(telefoneValido('abc')).toBe(false);
  });
});

describe('validarContato', () => {
  it('apara o nome e mantém o telefone como digitado', () => {
    expect(validarContato('  Ana ', '(11) 98888-7777')).toEqual({ nome: 'Ana', telefone: '(11) 98888-7777' });
  });
  it('explica o que falta', () => {
    expect('erro' in validarContato('', '11988887777')).toBe(true);
    expect('erro' in validarContato('Ana', '12')).toBe(true);
    expect('erro' in validarContato('a'.repeat(41), '11988887777')).toBe(true);
  });
});

describe('urlLigar e ordem', () => {
  it('monta o tel:', () => {
    expect(urlLigar('(11) 98888-7777')).toBe('tel:11988887777');
  });
  it('ordena por nome, com acento', () => {
    const c = (nome: string) => ({ id: nome, nome, telefone: '1', criadoEm: 0 });
    expect(contatosPorNome([c('Zé'), c('Ângela'), c('Bia')]).map((x) => x.nome)).toEqual(['Ângela', 'Bia', 'Zé']);
  });
});
