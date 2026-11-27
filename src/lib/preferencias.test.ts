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

  it('reflexão semanal: padrão ligado às 19:00; ausente, inválida ou salva é lida com segurança', () => {
    expect(LEMBRETES_PADRAO.reflexao).toEqual({ ligado: true, hora: '19:00' });
    // Quem salvou lembretes antes da reflexão existir (sem o campo) recebe o padrão.
    const antigo = { relato: { ligado: false, hora: '21:00' }, bomDia: { ligado: true, hora: '07:30' }, antesDaOnda: false, marcos: false };
    expect(lembretesDe({ lembretes: antigo }).reflexao).toEqual({ ligado: true, hora: '19:00' });
    expect(lembretesDe({ lembretes: antigo }).relato).toEqual({ ligado: false, hora: '21:00' });
    expect(lembretesDe({ lembretes: { ...antigo, reflexao: { ligado: false, hora: '20:15' } } }).reflexao).toEqual({ ligado: false, hora: '20:15' });
    expect(lembretesDe({ lembretes: { ...antigo, reflexao: { ligado: 'sim', hora: '99:99' } } as never }).reflexao).toEqual({ ligado: true, hora: '19:00' });
    expect(lembretesDe({ lembretes: { ...antigo, reflexao: 'x' } as never }).reflexao).toEqual({ ligado: true, hora: '19:00' });
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
