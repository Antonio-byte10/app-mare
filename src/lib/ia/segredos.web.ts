import type { Provedor } from './tipos';

/**
 * Versão do navegador (só para desenvolvimento): o expo-secure-store não existe no web, então as
 * chaves ficam apenas em memória e somem ao recarregar a página. Nada vai para localStorage.
 */
const memoria = new Map<string, string>();

export const lerChave = async (provedor: Provedor) => memoria.get(`chave.${provedor}`) ?? null;
export const lerCodigoServidor = async () => memoria.get('codigo.servidor') ?? null;

export const gravarChave = async (provedor: Provedor, valor: string) => {
  memoria.set(`chave.${provedor}`, valor.trim());
};
export const gravarCodigoServidor = async (valor: string) => {
  memoria.set('codigo.servidor', valor.trim());
};

export async function apagarTodosSegredos(): Promise<void> {
  memoria.clear();
}
