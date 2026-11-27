/**
 * Versão do navegador (só para desenvolvimento): não guarda foto nenhuma. No navegador não há
 * pasta privada nem cofre para cifrar com segurança, então o recurso fica desligado:
 * `escolherFoto` devolve `null` (como se a pessoa tivesse desistido) e as demais não fazem nada.
 * A API é a mesma de `fotos.ts`.
 */
export { ErroFoto, mensagemDoErroFoto } from './fotosPuro';

export const fotosDisponiveis = false;

export async function escolherFoto(): Promise<string | null> {
  return null;
}

export async function lerFotoComoDataUri(_nome: string): Promise<string | null> {
  return null;
}

export async function apagarFoto(_nome: string): Promise<void> {}

export async function apagarTodasAsFotos(): Promise<void> {}

export async function apagarChaveDasFotos(): Promise<void> {}

export async function apagarFotosSemDono(_emUso: readonly string[]): Promise<void> {}

export async function empacotarFotos(nomes: readonly string[]): Promise<{ fotos: Record<string, string>; falhas: number }> {
  return { fotos: {}, falhas: nomes.length };
}

export async function restaurarFotos(_fotos: Readonly<Record<string, string>>): Promise<Set<string>> {
  return new Set();
}
