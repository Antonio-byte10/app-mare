/** No navegador não há notificações locais: tudo aqui é inerte. A tela avisa que o recurso é do celular. */
import type { Notificacao } from './plano';
import type { Permissao } from './agendador.tipos';

export type { Permissao } from './agendador.tipos';

export const lembretesDisponiveis = false;

export async function configurarNotificacoes(): Promise<void> {}

export async function lerPermissao(): Promise<Permissao> {
  return 'indisponivel';
}

export async function pedirPermissao(): Promise<Permissao> {
  return 'indisponivel';
}

export async function aplicarPlano(_plano: Notificacao[]): Promise<void> {}

export async function cancelarTudo(): Promise<void> {}

export function escutarToques(_aoTocar: (data: unknown) => void): () => void {
  return () => undefined;
}
