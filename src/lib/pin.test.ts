import { describe, expect, it } from 'vitest';
import {
  conferirPin,
  criarRegistroPin,
  ERROS_LIVRES,
  esperaDaFalha,
  lerRegistroPin,
  pinValido,
  restanteDaEspera,
  serializarRegistroPin,
  tentarPin,
  type RegistroPin,
} from './pin';

const aleatorio = (n: number) => Uint8Array.from({ length: n }, (_, i) => (i * 7 + 3) % 256);
const ITER = 50; // rápido nos testes

describe('pinValido', () => {
  it('aceita só de 4 a 6 dígitos', () => {
    expect(pinValido('1234')).toBe(true);
    expect(pinValido('123456')).toBe(true);
    expect(pinValido('123')).toBe(false);
    expect(pinValido('1234567')).toBe(false);
    expect(pinValido('12a4')).toBe(false);
    expect(pinValido('12 4')).toBe(false);
    expect(pinValido('')).toBe(false);
  });
});

describe('registro do PIN', () => {
  it('guarda hash e sal, nunca o PIN', async () => {
    const r = await criarRegistroPin('4821', aleatorio, ITER);
    const texto = serializarRegistroPin(r);
    expect(texto).not.toContain('4821');
    expect(r.tamanho).toBe(4);
    expect(r.falhas).toBe(0);
  });
  it('confere o PIN certo e recusa o errado', async () => {
    const r = await criarRegistroPin('4821', aleatorio, ITER);
    expect(await conferirPin('4821', r)).toBe(true);
    expect(await conferirPin('4822', r)).toBe(false);
    expect(await conferirPin('482', r)).toBe(false);
  });
  it('sais diferentes dão hashes diferentes para o mesmo PIN', async () => {
    const a = await criarRegistroPin('4821', aleatorio, ITER);
    const b = await criarRegistroPin('4821', (n) => new Uint8Array(n).fill(9), ITER);
    expect(a.hash).not.toBe(b.hash);
  });
  it('recusa criar com PIN inválido', async () => {
    await expect(criarRegistroPin('12', aleatorio, ITER)).rejects.toThrow();
  });
  it('lê de volta o que foi serializado e rejeita lixo', async () => {
    const r = await criarRegistroPin('123456', aleatorio, ITER);
    expect(lerRegistroPin(serializarRegistroPin(r))).toEqual(r);
    expect(lerRegistroPin(null)).toBeNull();
    expect(lerRegistroPin('não é json')).toBeNull();
    expect(lerRegistroPin('{"v":1}')).toBeNull();
    expect(lerRegistroPin(JSON.stringify({ ...r, tamanho: 9 }))).toBeNull();
    expect(lerRegistroPin(JSON.stringify({ ...r, falhas: -1 }))).toBeNull();
    expect(lerRegistroPin(JSON.stringify({ ...r, sal: 'curto' }))).toBeNull();
  });
});

describe('espera entre tentativas', () => {
  it('cresce depois de 4 erros livres', () => {
    expect([1, 2, 3, 4].map(esperaDaFalha)).toEqual([0, 0, 0, 0]);
    expect([5, 6, 7, 8, 20].map(esperaDaFalha)).toEqual([30, 60, 300, 900, 900]);
  });

  it('o quinto erro seguido abre 30 s de espera e o acerto zera', async () => {
    let r: RegistroPin = await criarRegistroPin('4821', aleatorio, ITER);
    const agora = 1_000_000;
    for (let i = 1; i <= ERROS_LIVRES; i += 1) {
      const t = await tentarPin('0000', r, agora);
      expect(t.resultado).toBe('errado');
      r = t.registro;
      expect(restanteDaEspera(r, agora)).toBe(0);
    }
    const quinto = await tentarPin('0000', r, agora);
    expect(quinto.resultado).toBe('errado');
    r = quinto.registro;
    expect(restanteDaEspera(r, agora)).toBe(30_000);
    // Durante a espera nem o PIN certo é conferido.
    const durante = await tentarPin('4821', r, agora + 10_000);
    expect(durante.resultado).toBe('espera');
    expect(durante.registro).toEqual(r);
    // Passada a espera, o PIN certo abre e zera o contador.
    const depois = await tentarPin('4821', r, agora + 30_001);
    expect(depois.resultado).toBe('ok');
    expect(depois.registro.falhas).toBe(0);
    expect(depois.registro.bloqueadoAte).toBe(0);
  });

  it('relógio que volta para trás não prende a pessoa além da espera máxima', () => {
    const r = { falhas: 5, bloqueadoAte: 9_999_999_999_999 };
    expect(restanteDaEspera(r, 1_000)).toBe(30_000);
  });
});
