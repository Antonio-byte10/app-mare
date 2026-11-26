import * as SecureStore from 'expo-secure-store';
import type { Provedor } from './tipos';

/**
 * Chave de cada provedor e código do servidor ficam no cofre do aparelho (expo-secure-store),
 * nunca no estado do app nem em backup. Todas as funções engolem erros: sem cofre, vira "não tem".
 * Módulo fino, fora dos testes. No navegador vale `segredos.web.ts`, que guarda só em memória.
 */
const NOME_CHAVE: Record<Provedor, string> = {
  gemini: 'mare.ia.chave.gemini',
  openai: 'mare.ia.chave.openai',
  claude: 'mare.ia.chave.claude',
};
const NOME_CODIGO = 'mare.ia.codigo.servidor';

const ler = async (nome: string): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(nome);
  } catch {
    return null;
  }
};

export const lerChave = (provedor: Provedor) => ler(NOME_CHAVE[provedor]);
export const lerCodigoServidor = () => ler(NOME_CODIGO);

/** Grava; lança se o cofre recusar (a tela avisa que não conseguiu guardar). */
export const gravarChave = (provedor: Provedor, valor: string) => SecureStore.setItemAsync(NOME_CHAVE[provedor], valor.trim());
export const gravarCodigoServidor = (valor: string) => SecureStore.setItemAsync(NOME_CODIGO, valor.trim());

export async function apagarTodosSegredos(): Promise<void> {
  const nomes = [...Object.values(NOME_CHAVE), NOME_CODIGO];
  await Promise.all(nomes.map((n) => SecureStore.deleteItemAsync(n).catch(() => undefined)));
}
