import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { bytesAleatorios } from './aleatorio';
import { deBase64, paraBase64 } from './bytes';
import {
  cifrarFoto,
  decifrarFoto,
  dimensoesAlvo,
  ehJpeg,
  ErroFoto,
  MAX_BYTES_FOTO,
  MAX_LADO_FOTO,
  nomeDeFoto,
  nomeFotoValido,
  paraDataUriJpeg,
  QUALIDADE_JPEG,
  TAMANHO_CHAVE,
} from './fotosPuro';
import { semBloquear } from './useBloqueio';

export { ErroFoto, mensagemDoErroFoto } from './fotosPuro';

/**
 * Fotos dos "porquês". A pessoa escolhe uma imagem no seletor de fotos do Android (sem câmera e
 * sem pedir permissão de arquivos), a foto é reduzida (lado maior 1280 px, JPEG 0,8: o que também
 * tira os metadados, como o local) e vai cifrada com AES-256-GCM para a pasta privada do app.
 * A chave de 32 bytes é criada no primeiro uso e fica no cofre do aparelho. A foto nunca é
 * gravada sem cifra em lugar durável, nunca entra na galeria, e as cópias temporárias do seletor
 * e do redimensionador são apagadas logo depois. Módulo fino, fora dos testes (a parte pura está
 * em `fotosPuro.ts`). No navegador vale `fotos.web.ts`.
 */
const NOME_CHAVE = 'mare.fotos.key';

/** `false` no navegador (ver `fotos.web.ts`): a interface esconde "Adicionar foto". */
export const fotosDisponiveis = true;

const pasta = () => new Directory(Paths.document, 'porques');

/* ------------------------------------------------------------------ chave */

let criandoChave: Promise<Uint8Array | null> | null = null;

/** Lê a chave do cofre; com `criar`, cria uma se ainda não houver. `null` = sem chave (ou cofre fora do ar). */
async function chaveDasFotos(criar: boolean): Promise<Uint8Array | null> {
  try {
    const bruto = await SecureStore.getItemAsync(NOME_CHAVE);
    const chave = bruto ? deBase64(bruto) : null;
    if (chave?.length === TAMANHO_CHAVE) return chave;
    if (!criar) return null;
  } catch {
    return null;
  }
  // Duas fotos ao mesmo tempo não podem criar duas chaves.
  criandoChave ??= (async () => {
    try {
      const nova = bytesAleatorios(TAMANHO_CHAVE);
      await SecureStore.setItemAsync(NOME_CHAVE, paraBase64(nova));
      return nova;
    } catch {
      return null;
    } finally {
      criandoChave = null;
    }
  })();
  return criandoChave;
}

/* ---------------------------------------------------------------- arquivos */

/** Apaga um arquivo temporário, só se ele estiver na área de cache do app (nunca um arquivo da pessoa). */
function apagarTemporario(uri: string | undefined): void {
  if (!uri || !uri.startsWith(Paths.cache.uri)) return;
  try {
    const arquivo = new File(uri);
    if (arquivo.exists) arquivo.delete();
  } catch {
    // Já foi.
  }
}

/** Cifra `claro` com a chave das fotos e grava como `nome` na pasta privada. */
async function gravarCifrada(nome: string, claro: Uint8Array, chave: Uint8Array): Promise<void> {
  const cifrado = cifrarFoto(chave, bytesAleatorios(12), nome, claro);
  try {
    const dir = pasta();
    dir.create({ intermediates: true, idempotent: true });
    const arquivo = new File(dir, nome);
    arquivo.create({ overwrite: true });
    await arquivo.write(cifrado);
  } catch {
    // Não deixa meio arquivo para trás.
    await apagarFoto(nome);
    throw new ErroFoto('gravacao');
  }
}

/** Os bytes (já decifrados, só em memória) da foto. `null` se não existe, não abre ou a chave não bate. */
async function lerBytes(nome: string): Promise<Uint8Array | null> {
  if (!nomeFotoValido(nome)) return null;
  try {
    const arquivo = new File(pasta(), nome);
    if (!arquivo.exists) return null;
    const chave = await chaveDasFotos(false);
    if (!chave) return null;
    return decifrarFoto(chave, nome, await arquivo.bytes());
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------------- API */

/**
 * Abre o seletor de fotos, reduz a imagem, cifra e guarda. Devolve o nome do arquivo cifrado
 * (para `Porque.foto`), ou `null` se a pessoa desistiu. Lança `ErroFoto` se algo der errado.
 */
export async function escolherFoto(): Promise<string | null> {
  let escolha: ImagePicker.ImagePickerResult;
  try {
    // Só a biblioteca (nada de câmera). `semBloquear`: a ida ao seletor não pode trancar o app.
    escolha = await semBloquear(() =>
      ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        allowsMultipleSelection: false,
        quality: 1,
        exif: false,
        base64: false,
      }),
    );
  } catch {
    throw new ErroFoto('imagem');
  }
  const item = escolha.canceled ? undefined : escolha.assets[0];
  if (!item) return null;

  const temporarios: (string | undefined)[] = [item.uri];
  let claro: Uint8Array | undefined;
  try {
    let imagem = await ImageManipulator.manipulate(item.uri, { maxWidth: MAX_LADO_FOTO, maxHeight: MAX_LADO_FOTO }).renderAsync();
    const alvo = dimensoesAlvo(imagem.width, imagem.height);
    if (alvo) imagem = await ImageManipulator.manipulate(imagem).resize(alvo).renderAsync();
    const salva = await imagem.saveAsync({ format: SaveFormat.JPEG, compress: QUALIDADE_JPEG });
    temporarios.push(salva.uri);
    try {
      imagem.release();
    } catch {
      // Só libera memória.
    }
    claro = await new File(salva.uri).bytes();
    if (!ehJpeg(claro) || claro.length > MAX_BYTES_FOTO) throw new ErroFoto('imagem');
  } catch (e) {
    throw e instanceof ErroFoto ? e : new ErroFoto('imagem');
  } finally {
    temporarios.forEach(apagarTemporario);
  }

  try {
    const chave = await chaveDasFotos(true);
    if (!chave) throw new ErroFoto('cofre');
    const nome = nomeDeFoto(randomUUID());
    await gravarCifrada(nome, claro, chave);
    return nome;
  } finally {
    claro.fill(0);
  }
}

/** Decifra na memória e devolve `data:image/jpeg;base64,...`. `null` se não deu (arquivo ou chave perdidos). */
export async function lerFotoComoDataUri(nome: string): Promise<string | null> {
  const bytes = await lerBytes(nome);
  if (!bytes) return null;
  const uri = paraDataUriJpeg(bytes);
  bytes.fill(0);
  return uri;
}

/** Apaga o arquivo da foto. Não reclama se ele já não existia. */
export async function apagarFoto(nome: string): Promise<void> {
  if (!nomeFotoValido(nome)) return;
  try {
    const arquivo = new File(pasta(), nome);
    if (arquivo.exists) arquivo.delete();
  } catch {
    // Nada a apagar.
  }
}

/** Apaga todas as fotos (a pasta inteira). Lança se a pasta existe e não deu para apagar. */
export async function apagarTodasAsFotos(): Promise<void> {
  const dir = pasta();
  if (dir.exists) dir.delete();
}

/** Apaga a chave das fotos do cofre. Sem ela, qualquer arquivo de foto que sobrar não abre mais. */
export async function apagarChaveDasFotos(): Promise<void> {
  await SecureStore.deleteItemAsync(NOME_CHAVE);
}

/** Apaga as fotos que nenhum porquê usa mais (sobras de formulário aberto e fechado, por exemplo). */
export async function apagarFotosSemDono(emUso: readonly string[]): Promise<void> {
  try {
    const dir = pasta();
    if (!dir.exists) return;
    const usados = new Set(emUso);
    for (const item of dir.list()) {
      if (item instanceof File && !usados.has(item.name)) item.delete();
    }
  } catch {
    // Limpeza de conveniência: se não der agora, dá na próxima.
  }
}

/* ------------------------------------------------------------------ backup */

/**
 * Para o backup: cada foto decifrada em Base64 (JPEG já reduzido), indexada pelo nome do arquivo.
 * `falhas` conta as que não deu para ler (ficam de fora do backup).
 */
export async function empacotarFotos(nomes: readonly string[]): Promise<{ fotos: Record<string, string>; falhas: number }> {
  const fotos: Record<string, string> = {};
  let falhas = 0;
  for (const nome of nomes) {
    const bytes = await lerBytes(nome);
    if (bytes) {
      fotos[nome] = paraBase64(bytes);
      bytes.fill(0);
    } else falhas += 1;
  }
  return { fotos, falhas };
}

/**
 * Ao restaurar um backup: cifra de novo cada foto com a chave deste aparelho e grava. Devolve os
 * nomes que ficaram gravados. Nomes ou dados inválidos são ignorados.
 */
export async function restaurarFotos(fotos: Readonly<Record<string, string>>): Promise<Set<string>> {
  const gravadas = new Set<string>();
  const entradas = Object.entries(fotos).filter(([nome]) => nomeFotoValido(nome));
  if (entradas.length === 0) return gravadas;
  const chave = await chaveDasFotos(true);
  if (!chave) return gravadas;
  for (const [nome, base64] of entradas) {
    const bytes = deBase64(base64);
    if (!bytes || !ehJpeg(bytes) || bytes.length > MAX_BYTES_FOTO) continue;
    try {
      await gravarCifrada(nome, bytes, chave);
      gravadas.add(nome);
    } catch {
      // Esta foto fica de fora; as outras seguem.
    } finally {
      bytes.fill(0);
    }
  }
  return gravadas;
}
