import { describe, expect, it } from 'vitest';
import { RECURSOS } from './apoio';
import { ARTIGOS, GRUPOS, artigoPorId } from './biblioteca';

describe('biblioteca', () => {
  it('ids únicos e todos os grupos usados existem', () => {
    expect(new Set(ARTIGOS.map((a) => a.id)).size).toBe(ARTIGOS.length);
    for (const a of ARTIGOS) expect(GRUPOS).toContain(a.grupo);
  });

  it('todo artigo tem pelo menos uma fonte com link https', () => {
    for (const a of ARTIGOS) {
      expect(a.fontes.length, a.id).toBeGreaterThan(0);
      for (const f of a.fontes) {
        expect(f.titulo.length, a.id).toBeGreaterThan(5);
        expect(f.url, a.id).toMatch(/^https:\/\//);
      }
    }
  });

  it('tem os assuntos pedidos no escopo', () => {
    for (const id of [
      'por-que-acontece',
      'surfar-a-fissura',
      'deslize-nao-e-recaida',
      'abstinencia-tabaco',
      'abstinencia-alcool',
      'abstinencia-sexual',
      'terapias',
      'remedios',
      'ajuda-no-sus',
    ]) {
      expect(artigoPorId(id), id).toBeDefined();
    }
  });

  it('a abstinência do álcool traz o alerta de risco e o SAMU', () => {
    const a = artigoPorId('abstinencia-alcool');
    const avisos = a?.blocos.filter((b) => b.tipo === 'aviso').map((b) => (b.tipo === 'aviso' ? b.texto : '')) ?? [];
    expect(avisos.join(' ')).toMatch(/não pare de uma vez/);
    expect(avisos.join(' ')).toMatch(/192/);
  });

  it('não recomenda nem dosa remédio: sem dose, miligramas e nomes de remédio', () => {
    const texto = JSON.stringify(ARTIGOS.map((a) => a.blocos));
    expect(texto).not.toMatch(/\b\d+\s?mg\b/i);
    expect(texto).not.toMatch(/naltrexona|acamprosato|dissulfiram|bupropiona|vareniclina|citisina|topiramato|baclofeno|semaglutida/i);
  });

  it('terapias aparecem como convite a conversar com o psicólogo', () => {
    const a = artigoPorId('terapias');
    const texto = JSON.stringify(a?.blocos);
    expect((texto.match(/Vale conversar com seu psicólogo/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });

  it('o texto segue o guia de voz: sem rótulos como "alcoólatra" ou "viciado"', () => {
    const texto = JSON.stringify(ARTIGOS);
    expect(texto).not.toMatch(/alcoólatra|viciado|fracasso/i);
  });
});

describe('apoio', () => {
  it('ids únicos; todo recurso tem telefone, link ou nota', () => {
    expect(new Set(RECURSOS.map((r) => r.id)).size).toBe(RECURSOS.length);
    for (const r of RECURSOS) expect(r.telefone || r.url || r.nota, r.id).toBeTruthy();
  });

  it('links são https e telefones só têm dígitos', () => {
    for (const r of RECURSOS) {
      if (r.url) expect(r.url, r.id).toMatch(/^https:\/\//);
      if (r.telefone) expect(r.telefone, r.id).toMatch(/^\d{3,11}$/);
    }
  });

  it('traz os recursos pedidos e os números certos', () => {
    const por = (id: string) => RECURSOS.find((r) => r.id === id);
    expect(por('cvv')?.telefone).toBe('188');
    expect(por('samu')?.telefone).toBe('192');
    expect(por('disque-saude')?.telefone).toBe('136');
    for (const id of ['ubs', 'caps-ad', 'aa', 'al-anon', 'na', 'dasa', 'amor-exigente']) expect(por(id), id).toBeDefined();
  });
});
