import { describe, expect, it } from 'vitest';
import { FRASES_BOM_DIA, fraseDoDia, TEXTO_ANTES_DA_ONDA, TEXTO_MARCO, TEXTO_RELATO } from './lembretes';

const TODOS = [TEXTO_RELATO, TEXTO_ANTES_DA_ONDA, TEXTO_MARCO, ...FRASES_BOM_DIA];

// Nada que cite hábito, substância, contagem de dias, o nome do app ou o disfarce.
const PROIBIDO =
  /cigarr|fum(a|o|e|ar)|tabac|álcool|alcool|beb(i|e|a|er)|bebid|sexo|sexual|porn|vício|vicio|sobri|recaíd|recaid|\bsem\b|\d+\s*dias|\bdias\b|hábito|habito|maré|mare\b|diário|diario|craving|abstin/i;

describe('textos dos lembretes', () => {
  it('nenhum texto cita o hábito, a substância ou contagem de dias', () => {
    for (const t of TODOS) expect(t, t).not.toMatch(PROIBIDO);
  });

  it('são curtos o bastante para a notificação', () => {
    for (const t of TODOS) expect(t.length, t).toBeLessThanOrEqual(90);
  });

  it('há frases de sobra e sem repetição', () => {
    expect(FRASES_BOM_DIA.length).toBeGreaterThanOrEqual(15);
    expect(new Set(FRASES_BOM_DIA).size).toBe(FRASES_BOM_DIA.length);
  });
});

describe('fraseDoDia', () => {
  it('é estável: o mesmo dia dá sempre a mesma frase', () => {
    expect(fraseDoDia('2026-11-26')).toBe(fraseDoDia('2026-11-26'));
  });

  it('dois dias seguidos nunca repetem a frase', () => {
    let dia = new Date(Date.UTC(2026, 0, 1));
    for (let i = 0; i < 120; i++) {
      const hoje = dia.toISOString().slice(0, 10);
      const amanha = new Date(dia.getTime() + 86_400_000).toISOString().slice(0, 10);
      expect(fraseDoDia(hoje)).not.toBe(fraseDoDia(amanha));
      dia = new Date(dia.getTime() + 86_400_000);
    }
  });

  it('sempre devolve uma das frases', () => {
    expect(FRASES_BOM_DIA).toContain(fraseDoDia('2027-02-28'));
  });
});
