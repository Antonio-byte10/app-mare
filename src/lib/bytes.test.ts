import { describe, expect, it } from 'vitest';
import { deBase64, deUtf8, iguaisConstante, paraBase64, paraUtf8 } from './bytes';

describe('base64', () => {
  it('bate com o Buffer do Node em tamanhos diferentes', () => {
    for (const n of [0, 1, 2, 3, 4, 5, 100, 1001]) {
      const b = Uint8Array.from({ length: n }, (_, i) => (i * 37 + 11) % 256);
      expect(paraBase64(b)).toBe(Buffer.from(b).toString('base64'));
      expect(Array.from(deBase64(paraBase64(b))!)).toEqual(Array.from(b));
    }
  });
  it('recusa texto que não é base64', () => {
    expect(deBase64('abc')).toBeNull();
    expect(deBase64('ab!d')).toBeNull();
    expect(deBase64('=abc')).toBeNull();
  });
});

describe('utf-8', () => {
  it('ida e volta com acentos e emoji', () => {
    const t = 'Maré, calma. Ação 🌊 日本';
    expect(Array.from(paraUtf8(t))).toEqual(Array.from(Buffer.from(t, 'utf8')));
    expect(deUtf8(paraUtf8(t))).toBe(t);
  });
  it('recusa bytes inválidos', () => {
    expect(deUtf8(Uint8Array.of(0xff))).toBeNull();
    expect(deUtf8(Uint8Array.of(0xe2, 0x82))).toBeNull();
    expect(deUtf8(Uint8Array.of(0xc0, 0x80))).toBeNull();
  });
  it('texto grande não estoura a pilha', () => {
    const t = 'a'.repeat(300_000);
    expect(deUtf8(paraUtf8(t))).toBe(t);
  });
});

describe('iguaisConstante', () => {
  it('compara conteúdo e tamanho', () => {
    expect(iguaisConstante(Uint8Array.of(1, 2), Uint8Array.of(1, 2))).toBe(true);
    expect(iguaisConstante(Uint8Array.of(1, 2), Uint8Array.of(1, 3))).toBe(false);
    expect(iguaisConstante(Uint8Array.of(1, 2), Uint8Array.of(1, 2, 0))).toBe(false);
  });
});
