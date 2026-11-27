/**
 * Conversões de bytes sem depender de `btoa`, `TextEncoder` ou `Buffer`, que variam entre o
 * Hermes, o navegador e o Node. Usadas pelo backup e pelo PIN.
 */

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const INVERSO: Record<string, number> = Object.fromEntries([...ALFABETO].map((c, i) => [c, i]));

/** Base64 padrão, com `=` no final. */
export function paraBase64(bytes: Uint8Array): string {
  const partes: string[] = [];
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!;
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    partes.push(
      ALFABETO[(n >> 18) & 63]! + ALFABETO[(n >> 12) & 63]! + (b === undefined ? '=' : ALFABETO[(n >> 6) & 63]!) + (c === undefined ? '=' : ALFABETO[n & 63]!),
    );
  }
  return partes.join('');
}

/** Lê Base64 padrão. Devolve `null` se o texto não for Base64 válido. */
export function deBase64(texto: string): Uint8Array | null {
  if (texto.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(texto)) return null;
  const preenchimento = texto.endsWith('==') ? 2 : texto.endsWith('=') ? 1 : 0;
  const saida = new Uint8Array((texto.length / 4) * 3 - preenchimento);
  let o = 0;
  for (let i = 0; i < texto.length; i += 4) {
    const v = [0, 1, 2, 3].map((k) => INVERSO[texto[i + k]!] ?? 0);
    const n = (v[0]! << 18) | (v[1]! << 12) | (v[2]! << 6) | v[3]!;
    if (o < saida.length) saida[o++] = (n >> 16) & 255;
    if (o < saida.length) saida[o++] = (n >> 8) & 255;
    if (o < saida.length) saida[o++] = n & 255;
  }
  return saida;
}

/** Texto em UTF-8. Surrogates soltos viram U+FFFD, como no `TextEncoder`. */
export function paraUtf8(texto: string): Uint8Array {
  const bytes: number[] = [];
  for (let i = 0; i < texto.length; i += 1) {
    let c = texto.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < texto.length) {
      const baixo = texto.charCodeAt(i + 1);
      if (baixo >= 0xdc00 && baixo <= 0xdfff) {
        c = 0x10000 + ((c - 0xd800) << 10) + (baixo - 0xdc00);
        i += 1;
      }
    }
    if (c >= 0xd800 && c <= 0xdfff) c = 0xfffd;
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return Uint8Array.from(bytes);
}

/** UTF-8 para texto. Devolve `null` se os bytes não forem UTF-8 válido. */
export function deUtf8(bytes: Uint8Array): string | null {
  const unidades: number[] = [];
  let i = 0;
  while (i < bytes.length) {
    const b = bytes[i]!;
    let extra = 0;
    let c = 0;
    if (b < 0x80) c = b;
    else if (b >= 0xc2 && b < 0xe0) {
      extra = 1;
      c = b & 0x1f;
    } else if (b >= 0xe0 && b < 0xf0) {
      extra = 2;
      c = b & 0x0f;
    } else if (b >= 0xf0 && b < 0xf5) {
      extra = 3;
      c = b & 0x07;
    } else return null;
    for (let k = 1; k <= extra; k += 1) {
      const cont = bytes[i + k];
      if (cont === undefined || (cont & 0xc0) !== 0x80) return null;
      c = (c << 6) | (cont & 0x3f);
    }
    if ((extra === 2 && c < 0x800) || (extra === 3 && c < 0x10000) || c > 0x10ffff || (c >= 0xd800 && c <= 0xdfff)) return null;
    if (c >= 0x10000) {
      const v = c - 0x10000;
      unidades.push(0xd800 + (v >> 10), 0xdc00 + (v & 0x3ff));
    } else unidades.push(c);
    i += extra + 1;
  }
  // Em blocos, para não estourar a pilha em textos grandes.
  const partes: string[] = [];
  for (let k = 0; k < unidades.length; k += 8192) partes.push(String.fromCharCode(...unidades.slice(k, k + 8192)));
  return partes.join('');
}

/** Comparação em tempo constante (não para no primeiro byte diferente). */
export function iguaisConstante(a: Uint8Array, b: Uint8Array): boolean {
  let dif = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i += 1) dif |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return dif === 0;
}
