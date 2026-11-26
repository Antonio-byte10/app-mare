import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as SQLite from 'expo-sqlite';
import type { StateStorage } from 'zustand/middleware';
import { NOME_CHAVE, obterChave, type Cofre } from './chave';
import { protegerArmazenamento } from './protegido';

const NOME_BANCO = 'mare.db';

const cofre: Cofre = {
  ler: (nome) => SecureStore.getItemAsync(nome),
  gravar: (nome, valor) => SecureStore.setItemAsync(nome, valor),
};

/** 32 bytes aleatórios em hexadecimal (64 caracteres). */
function gerarChave(): string {
  return Array.from(Crypto.getRandomBytes(32), (b) => b.toString(16).padStart(2, '0')).join('');
}

let recomecou = false;

/** `true` depois de abrir quando a chave tinha sumido e o banco antigo foi apagado. */
export function recomecouDoZero(): boolean {
  return recomecou;
}

function arquivoDoBanco(): File {
  return new File(`file://${SQLite.defaultDatabaseDirectory}/${NOME_BANCO}`);
}

let conexao: SQLite.SQLiteDatabase | undefined;

async function abrir(): Promise<SQLite.SQLiteDatabase> {
  const resultado = await obterChave(cofre, arquivoDoBanco().exists, gerarChave);
  recomecou = resultado.recomecou;
  // Sem a chave antiga o banco existente não abre mais: apaga e começa outro.
  if (resultado.recomecou) await SQLite.deleteDatabaseAsync(NOME_BANCO);

  // A chave é hexadecimal gerada por nós; o formato x'...' é a chave crua do SQLCipher.
  if (!/^[0-9a-f]+$/.test(resultado.chave)) throw new Error('Chave do banco em formato inesperado.');
  const db = await SQLite.openDatabaseAsync(NOME_BANCO);
  // O PRAGMA key precisa ser o primeiro comando da conexão.
  await db.execAsync(`PRAGMA key = "x'${resultado.chave}'"`);
  // Sem SQLCipher no binário o PRAGMA key é ignorado em silêncio e o banco ficaria aberto.
  const cifra = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
  if (!cifra?.cipher_version) {
    await db.closeAsync();
    throw new Error('SQLCipher indisponível: o banco não seria criptografado.');
  }
  try {
    // Com a chave errada é aqui que aparece "file is not a database".
    await db.execAsync('CREATE TABLE IF NOT EXISTS kv (chave TEXT PRIMARY KEY NOT NULL, valor TEXT)');
  } catch (erro) {
    await db.closeAsync().catch(() => undefined);
    throw erro;
  }
  conexao = db;
  return db;
}

async function abrirArmazenamento(): Promise<StateStorage> {
  const db = await abrir();
  return {
    getItem: async (nome) => {
      const linha = await db.getFirstAsync<{ valor: string }>('SELECT valor FROM kv WHERE chave = ?', nome);
      return linha?.valor ?? null;
    },
    setItem: async (nome, valor) => {
      await db.runAsync('INSERT OR REPLACE INTO kv (chave, valor) VALUES (?, ?)', nome, valor);
    },
    removeItem: async (nome) => {
      await db.runAsync('DELETE FROM kv WHERE chave = ?', nome);
    },
  };
}

const protegido = protegerArmazenamento(abrirArmazenamento);

/**
 * Armazenamento do zustand sobre um banco SQLCipher; a chave fica no cofre do aparelho.
 * Se o banco não abrir, a leitura devolve `null` e as escritas são ignoradas (ver `falhaAoAbrir`).
 */
export function criarArmazenamento(): StateStorage {
  return protegido.storage;
}

/** `true` se o banco existe mas não abriu com a chave atual. Os dados antigos não foram tocados. */
export function falhaAoAbrir(): boolean {
  return protegido.falhou();
}

/**
 * Apaga o banco e a chave. Só deve ser chamada por uma ação explícita da pessoa.
 * Depois, `useMare.persist.rehydrate()` abre um banco novo.
 */
export async function recomecarDoZero(): Promise<void> {
  const aberta = conexao;
  conexao = undefined;
  await aberta?.closeAsync().catch(() => undefined);
  if (arquivoDoBanco().exists) await SQLite.deleteDatabaseAsync(NOME_BANCO);
  await SecureStore.deleteItemAsync(NOME_CHAVE);
  recomecou = false;
  protegido.reiniciar();
}
