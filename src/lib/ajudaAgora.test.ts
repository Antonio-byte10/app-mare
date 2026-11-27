import { describe, expect, it } from 'vitest';
import { saidasDeApoio } from './ajudaAgora';
import type { Contato } from './tipos';

const c = (id: string, nome: string, telefone = '(11) 98888-7777'): Contato => ({ id, nome, telefone, criadoEm: 0 });
const base = { contatos: [c('2', 'Zé'), c('1', 'Ana')], emergencia: true, daTrancada: false };

describe('saidasDeApoio', () => {
  it('contatos de confiança primeiro (em ordem alfabética), depois o CVV', () => {
    const r = saidasDeApoio({ ...base, tipoHabito: 'tabaco' });
    expect(r.map((s) => s.titulo)).toEqual(['Ligar para Ana', 'Ligar para Zé', 'Ligar para o CVV · 188']);
    expect(r[0].telefone).toBe('11988887777');
  });

  it('o SAMU só aparece para o álcool', () => {
    expect(saidasDeApoio({ ...base, tipoHabito: 'alcool' }).map((s) => s.id)).toEqual(['1', '2', 'cvv', 'samu']);
    expect(saidasDeApoio({ ...base, tipoHabito: 'sexual' }).map((s) => s.id)).not.toContain('samu');
    expect(saidasDeApoio({ ...base, tipoHabito: undefined }).map((s) => s.id)).not.toContain('samu');
  });

  it('com "Contatos de emergência" desligado, só os contatos de confiança', () => {
    const r = saidasDeApoio({ ...base, tipoHabito: 'alcool', emergencia: false });
    expect(r.map((s) => s.tipo)).toEqual(['contato', 'contato']);
  });

  it('pela tela de bloqueio não lista nomes, mas mantém o CVV', () => {
    const r = saidasDeApoio({ ...base, tipoHabito: 'tabaco', daTrancada: true });
    expect(r.map((s) => s.id)).toEqual(['cvv']);
    expect(JSON.stringify(r)).not.toMatch(/Ana|Zé/);
  });

  it('limita os contatos a 3 e fica vazio sem nada para mostrar', () => {
    const muitos = ['a', 'b', 'c', 'd', 'e'].map((x) => c(x, x));
    expect(saidasDeApoio({ ...base, contatos: muitos, emergencia: false }).map((s) => s.id)).toEqual(['a', 'b', 'c']);
    expect(saidasDeApoio({ contatos: [], emergencia: false, daTrancada: false })).toEqual([]);
  });
});
