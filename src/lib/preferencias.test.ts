import { describe, expect, it } from 'vitest';
import { BLOQUEIO_PADRAO, LEMBRETES_PADRAO, bloqueioDe, disfarceDe, lembretesDe, nomeDisfarce } from './preferencias';

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
    expect(bloqueioDe({ bloqueio: { ligado: true, biometria: false, aposMinutos: -3 } }).aposMinutos).toBe(1);
    expect(disfarceDe({ disfarce: 'banco' as never })).toBe('mare');
    expect(nomeDisfarce({ disfarce: 'diario' })).toBe('Diário');
  });
});
