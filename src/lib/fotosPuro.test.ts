import { describe, expect, it } from 'vitest';
import {
  cifrarFoto,
  decifrarFoto,
  dimensoesAlvo,
  ehJpeg,
  ErroFoto,
  MENSAGEM_ERRO_FOTO,
  mensagemDoErroFoto,
  nomeDeFoto,
  nomeFotoValido,
  nomesDeFotos,
  paraDataUriJpeg,
  removerFotosAusentes,
} from './fotosPuro';
import type { Porque } from './tipos';

const chave = Uint8Array.from({ length: 32 }, (_, i) => i + 1);
const nonce = Uint8Array.from({ length: 12 }, (_, i) => 100 + i);
const NOME = '11111111-2222-4333-8444-555555555555.bin';
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70, 0, 1, 2, 3]);

describe('cifrarFoto / decifrarFoto', () => {
  it('vai e volta', () => {
    const cifrado = cifrarFoto(chave, nonce, NOME, jpeg);
    expect(cifrado[0]).toBe(1);
    expect(Array.from(cifrado.slice(1, 13))).toEqual(Array.from(nonce));
    expect(cifrado.length).toBe(1 + 12 + jpeg.length + 16);
    expect(decifrarFoto(chave, NOME, cifrado)).toEqual(jpeg);
  });

  it('o arquivo cifrado não começa como um JPEG', () => {
    expect(ehJpeg(cifrarFoto(chave, nonce, NOME, jpeg))).toBe(false);
  });

  it('chave errada, arquivo alterado ou nome trocado não abrem', () => {
    const cifrado = cifrarFoto(chave, nonce, NOME, jpeg);
    const outra = Uint8Array.from(chave, (b) => b ^ 1);
    expect(decifrarFoto(outra, NOME, cifrado)).toBeNull();
    const mexido = Uint8Array.from(cifrado);
    mexido[20] ^= 1;
    expect(decifrarFoto(chave, NOME, mexido)).toBeNull();
    expect(decifrarFoto(chave, 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.bin', cifrado)).toBeNull();
  });

  it('recusa versão desconhecida, arquivo curto e chave de tamanho errado', () => {
    const cifrado = cifrarFoto(chave, nonce, NOME, jpeg);
    expect(decifrarFoto(chave, NOME, Uint8Array.from([2, ...cifrado.slice(1)]))).toBeNull();
    expect(decifrarFoto(chave, NOME, cifrado.slice(0, 20))).toBeNull();
    expect(decifrarFoto(new Uint8Array(16), NOME, cifrado)).toBeNull();
    expect(() => cifrarFoto(new Uint8Array(16), nonce, NOME, jpeg)).toThrow();
    expect(() => cifrarFoto(chave, new Uint8Array(8), NOME, jpeg)).toThrow();
  });

  it('nonces diferentes dão arquivos diferentes para a mesma foto', () => {
    const outro = Uint8Array.from(nonce, (b) => b + 1);
    expect(cifrarFoto(chave, nonce, NOME, jpeg)).not.toEqual(cifrarFoto(chave, outro, NOME, jpeg));
  });
});

describe('nomes de arquivo', () => {
  it('só aceita <uuid>.bin', () => {
    expect(nomeFotoValido(NOME)).toBe(true);
    expect(nomeFotoValido(nomeDeFoto('ABCDEF01-2222-4333-8444-555555555555'))).toBe(true);
    for (const ruim of ['', 'foto.bin', '../x.bin', `../${NOME}`, `${NOME}/..`, 'a/b.bin', `${NOME}.jpg`, 42, undefined, null]) {
      expect(nomeFotoValido(ruim)).toBe(false);
    }
  });
});

describe('dimensoesAlvo', () => {
  it('reduz o maior lado a 1280, mantendo a proporção', () => {
    expect(dimensoesAlvo(4000, 3000)).toEqual({ width: 1280 });
    expect(dimensoesAlvo(3000, 4000)).toEqual({ height: 1280 });
    expect(dimensoesAlvo(2000, 2000)).toEqual({ width: 1280 });
  });
  it('não mexe no que já cabe, nem em medidas desconhecidas', () => {
    expect(dimensoesAlvo(1280, 720)).toBeNull();
    expect(dimensoesAlvo(800, 600)).toBeNull();
    expect(dimensoesAlvo(0, 0)).toBeNull();
    expect(dimensoesAlvo(Number.NaN, 100)).toBeNull();
  });
});

describe('ehJpeg e data URI', () => {
  it('reconhece o início de um JPEG', () => {
    expect(ehJpeg(jpeg)).toBe(true);
    expect(ehJpeg(Uint8Array.from([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
    expect(ehJpeg(new Uint8Array(0))).toBe(false);
  });
  it('monta a data URI', () => {
    expect(paraDataUriJpeg(Uint8Array.from([0xff, 0xd8, 0xff]))).toBe('data:image/jpeg;base64,/9j/');
  });
});

describe('erros', () => {
  it('cada motivo tem mensagem calma, e erro desconhecido cai na da imagem', () => {
    expect(mensagemDoErroFoto(new ErroFoto('cofre'))).toBe(MENSAGEM_ERRO_FOTO.cofre);
    expect(mensagemDoErroFoto(new Error('x'))).toBe(MENSAGEM_ERRO_FOTO.imagem);
  });
});

describe('porquês e fotos', () => {
  const A = NOME;
  const B = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.bin';
  const porques: Porque[] = [
    { id: '1', texto: 'Meu filho', criadoEm: 1, foto: A },
    { id: '2', texto: '', criadoEm: 2, foto: B },
    { id: '3', texto: 'Saúde', criadoEm: 3 },
    { id: '4', texto: 'Outro', criadoEm: 4, foto: A },
  ];

  it('lista os nomes sem repetir', () => {
    expect(nomesDeFotos(porques)).toEqual([A, B]);
  });

  it('tira a foto que não está disponível; sem texto, o porquê some', () => {
    expect(removerFotosAusentes(porques, new Set([A]))).toEqual([porques[0], porques[2], porques[3]]);
    expect(removerFotosAusentes(porques, new Set([A, B]))).toEqual(porques);
    expect(removerFotosAusentes(porques, new Set())).toEqual([
      { id: '1', texto: 'Meu filho', criadoEm: 1 },
      porques[2],
      { id: '4', texto: 'Outro', criadoEm: 4 },
    ]);
  });
});
