/**
 * Fotos dos porquês: a parte pura (cifrar, decifrar, nomes, tamanhos). Escolher, gravar e ler
 * arquivos fica em `fotos.ts`.
 *
 * Cifra: AES-256-GCM (@noble/ciphers) com nonce aleatório de 12 bytes por foto e uma chave de
 * 32 bytes que mora no cofre do aparelho. O nome do arquivo entra como dado associado (AAD): um
 * arquivo trocado de nome, ou copiado para o lugar de outro, não abre.
 *
 * Formato do arquivo `.bin`: `[versão: 1 byte][nonce: 12 bytes][texto cifrado + etiqueta GCM]`.
 */
import { gcm } from '@noble/ciphers/aes.js';
import { paraBase64, paraUtf8 } from './bytes';
import type { Porque } from './tipos';

/** Maior lado da foto guardada, em pixels. */
export const MAX_LADO_FOTO = 1280;
/** Qualidade do JPEG guardado (0 a 1). */
export const QUALIDADE_JPEG = 0.8;
export const TAMANHO_CHAVE = 32;
const VERSAO_ARQUIVO = 1;
const TAMANHO_NONCE = 12;
const TAMANHO_ETIQUETA = 16;
/** Tamanho máximo aceito para uma foto já redimensionada (guarda contra arquivo absurdo). */
export const MAX_BYTES_FOTO = 8 * 1024 * 1024;

/** Nome de um arquivo de foto: `<uuid v4 em minúsculas>.bin`. Só isso é aceito, em qualquer caminho. */
const PADRAO_NOME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.bin$/;
export const nomeFotoValido = (nome: unknown): nome is string => typeof nome === 'string' && PADRAO_NOME.test(nome);
export const nomeDeFoto = (uuid: string) => `${uuid.toLowerCase()}.bin`;

export type MotivoErroFoto =
  /** Não consegui abrir ou preparar a imagem escolhida. */
  | 'imagem'
  /** O cofre do aparelho não deixou criar ou ler a chave. */
  | 'cofre'
  /** Não consegui gravar o arquivo cifrado. */
  | 'gravacao';

/** Erro tipado: a tela troca o `motivo` por uma mensagem calma (`MENSAGEM_ERRO_FOTO`). */
export class ErroFoto extends Error {
  readonly motivo: MotivoErroFoto;
  constructor(motivo: MotivoErroFoto) {
    super(`erro de foto: ${motivo}`);
    this.name = 'ErroFoto';
    this.motivo = motivo;
  }
}

export const MENSAGEM_ERRO_FOTO: Record<MotivoErroFoto, string> = {
  imagem: 'Não consegui abrir essa foto. Tente escolher outra.',
  cofre: 'Não consegui guardar a foto com segurança agora. Tente de novo.',
  gravacao: 'Não consegui guardar a foto agora. Veja se há espaço no celular e tente de novo.',
};

/** Mensagem para qualquer erro vindo de `escolherFoto`. */
export const mensagemDoErroFoto = (e: unknown): string =>
  e instanceof ErroFoto ? MENSAGEM_ERRO_FOTO[e.motivo] : MENSAGEM_ERRO_FOTO.imagem;

/**
 * Tamanho final para que o maior lado não passe de `max`, mantendo a proporção.
 * `null` se a imagem já cabe (ou se as medidas são desconhecidas).
 */
export function dimensoesAlvo(largura: number, altura: number, max: number = MAX_LADO_FOTO): { width: number } | { height: number } | null {
  if (!(largura > 0) || !(altura > 0) || Math.max(largura, altura) <= max) return null;
  return largura >= altura ? { width: max } : { height: max };
}

/** `true` se os bytes começam como um JPEG (FF D8 FF). */
export const ehJpeg = (b: Uint8Array) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;

const cabecalhoAutenticado = (nome: string) => paraUtf8(`mare-foto|${VERSAO_ARQUIVO}|${nome}`);

/** Cifra os bytes de uma foto com a chave. `nonce` precisa ser aleatório e novo a cada chamada. */
export function cifrarFoto(chave: Uint8Array, nonce: Uint8Array, nome: string, claro: Uint8Array): Uint8Array {
  if (chave.length !== TAMANHO_CHAVE || nonce.length !== TAMANHO_NONCE) throw new Error('Chave ou nonce com tamanho errado.');
  const cifrado = gcm(chave, nonce, cabecalhoAutenticado(nome)).encrypt(claro);
  const saida = new Uint8Array(1 + TAMANHO_NONCE + cifrado.length);
  saida[0] = VERSAO_ARQUIVO;
  saida.set(nonce, 1);
  saida.set(cifrado, 1 + TAMANHO_NONCE);
  return saida;
}

/** Decifra o conteúdo de um arquivo de foto. `null` se a chave, o nome ou o arquivo não baterem. */
export function decifrarFoto(chave: Uint8Array, nome: string, arquivo: Uint8Array): Uint8Array | null {
  if (chave.length !== TAMANHO_CHAVE || arquivo.length < 1 + TAMANHO_NONCE + TAMANHO_ETIQUETA) return null;
  if (arquivo[0] !== VERSAO_ARQUIVO) return null;
  try {
    const nonce = arquivo.slice(1, 1 + TAMANHO_NONCE);
    return gcm(chave, nonce, cabecalhoAutenticado(nome)).decrypt(arquivo.slice(1 + TAMANHO_NONCE));
  } catch {
    return null;
  }
}

/** `data:image/jpeg;base64,...`, pronto para o `source` de uma `Image`. */
export const paraDataUriJpeg = (bytes: Uint8Array) => `data:image/jpeg;base64,${paraBase64(bytes)}`;

/** Os nomes de foto usados pelos porquês (sem repetir). */
export const nomesDeFotos = (porques: Porque[]): string[] => [
  ...new Set(porques.flatMap((p) => (typeof p?.foto === 'string' ? [p.foto] : []))),
];

/**
 * Tira a foto dos porquês cujo arquivo não está entre os `disponiveis` (ou tem nome inválido).
 * Um porquê que era só a foto e ficou sem nada some; os que têm texto ficam só com o texto.
 */
export function removerFotosAusentes(porques: Porque[], disponiveis: ReadonlySet<string>): Porque[] {
  return porques.flatMap((p) => {
    // Dados de backup não são de confiança: o que não é objeto passa como está (o resto do app já lida com isso).
    if (typeof p !== 'object' || p === null || p.foto === undefined || (nomeFotoValido(p.foto) && disponiveis.has(p.foto))) return [p];
    const { foto: _foto, ...resto } = p;
    return typeof resto.texto === 'string' && resto.texto.trim() !== '' ? [resto] : [];
  });
}
