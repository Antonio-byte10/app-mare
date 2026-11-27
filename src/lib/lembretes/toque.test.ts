import { describe, expect, it } from 'vitest';
import { rotaDaNotificacao, rotaRelato } from './toque';

describe('rotaDaNotificacao', () => {
  it('aceita as rotas do app', () => {
    expect(rotaDaNotificacao({ rota: '/' })).toBe('/');
    expect(rotaDaNotificacao({ rota: '/fissura' })).toBe('/fissura');
    expect(rotaDaNotificacao({ rota: '/marcos' })).toBe('/marcos');
    expect(rotaDaNotificacao({ rota: rotaRelato('2026-11-26') })).toBe('/relato/2026-11-26');
  });

  it('recusa o que não for rota conhecida', () => {
    expect(rotaDaNotificacao(undefined)).toBeNull();
    expect(rotaDaNotificacao(null)).toBeNull();
    expect(rotaDaNotificacao('/fissura')).toBeNull();
    expect(rotaDaNotificacao({})).toBeNull();
    expect(rotaDaNotificacao({ rota: 42 })).toBeNull();
    expect(rotaDaNotificacao({ rota: '/ia' })).toBeNull();
    expect(rotaDaNotificacao({ rota: 'https://exemplo.com' })).toBeNull();
    expect(rotaDaNotificacao({ rota: '/relato/2026-13-45' })).toBeNull();
    expect(rotaDaNotificacao({ rota: '/relato/../ia' })).toBeNull();
  });
});
