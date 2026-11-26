/** Onde a chave do banco fica guardada. No app é o expo-secure-store; nos testes, um cofre em memória. */
export interface Cofre {
  ler(nome: string): Promise<string | null>;
  gravar(nome: string, valor: string): Promise<void>;
}

export const NOME_CHAVE = 'mare.db.key';

/**
 * Devolve a chave do banco. Se o cofre não tem chave, gera uma nova e grava.
 * Se nesse caso o arquivo do banco já existia, ele não abre mais com a chave nova:
 * `recomecou` fica `true` para o chamador apagar o arquivo antigo e avisar a pessoa.
 */
export async function obterChave(
  cofre: Cofre,
  bancoExiste: boolean,
  gerar: () => string,
): Promise<{ chave: string; recomecou: boolean }> {
  const existente = await cofre.ler(NOME_CHAVE);
  if (existente) return { chave: existente, recomecou: false };
  const chave = gerar();
  await cofre.gravar(NOME_CHAVE, chave);
  return { chave, recomecou: bancoExiste };
}
