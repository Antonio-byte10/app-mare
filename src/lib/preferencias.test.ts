import { describe, expect, it } from 'vitest';
import { BLOQUEIO_PADRAO, LEMBRETES_PADRAO, bloqueioDe, disfarceDe, lembretesDe, nomeDisfarce, protegerTelaDe } from './preferencias';

describe('preferências do Plano 3', () => {
  it('sem nada salvo, usa os padrões', () => {
    expect(lembretesDe({})).toEqual(LEMBRETES_PADRAO);
    expect(bloqueioDe({})).toEqual(BLOQUEIO_PADRAO);
    expect(disfarceDe({})).toBe('mare');
    expect(nomeDisfarce({})).toBe('Maré');
  });

  it('campos inválidos caem no padrão, os válidos são mantidos', () => {
    const l = lembretesDe({ lembretes: { relato: { ligado: false, hora: '25:00' }, antesDaOnda: 'x' } as never });
    expect(l.relato).toEqual({ ligado: false, hora: '22:00' });
    expect(l.antesDaOnda).toBe(true);
    expect(bloqueioDe({ bloqueio: { ligado: true, biometria: false, aposMinutos: -3, ondaLivre: false } }).aposMinutos).toBe(1);
    expect(disfarceDe({ disfarce: 'banco' as never })).toBe('mare');
    expect(nomeDisfarce({ disfarce: 'diario' })).toBe('Diário');
  });

  it('ondaLivre só vale quando é exatamente true', () => {
    expect(bloqueioDe({ bloqueio: { ligado: true, biometria: true, aposMinutos: 1, ondaLivre: true } }).ondaLivre).toBe(true);
    expect(bloqueioDe({ bloqueio: { ligado: true, biometria: true, aposMinutos: 1 } as never }).ondaLivre).toBe(false);
  });

  it('telas protegidas acompanham o bloqueio quando não foram escolhidas', () => {
    expect(protegerTelaDe({})).toBe(false);
    expect(protegerTelaDe({ bloqueio: { ...BLOQUEIO_PADRAO, ligado: true } })).toBe(true);
    expect(protegerTelaDe({ protegerTela: false, bloqueio: { ...BLOQUEIO_PADRAO, ligado: true } })).toBe(false);
    expect(protegerTelaDe({ protegerTela: true })).toBe(true);
  });
});
