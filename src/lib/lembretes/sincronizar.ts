/**
 * Deixa os lembretes agendados conforme o plano. Uma execução por vez; pedidos que chegam durante
 * uma execução se juntam em um só (vale o mais recente). Sem permissão, cancela tudo e não pede nada:
 * quem pede é a tela de Lembretes, com explicação.
 */
import { aplicarPlano, cancelarTudo, lembretesDisponiveis, lerPermissao } from './agendador';
import { planejarLembretes, type EntradaPlano } from './plano';

export type EntradaSincronia = Omit<EntradaPlano, 'agora'>;

let rodando = false;
let proxima: EntradaSincronia | null = null;

async function executar(e: EntradaSincronia): Promise<void> {
  if ((await lerPermissao()) !== 'concedida') {
    await cancelarTudo();
    return;
  }
  await aplicarPlano(planejarLembretes({ ...e, agora: Date.now() }));
}

export async function sincronizarLembretes(e: EntradaSincronia): Promise<void> {
  if (!lembretesDisponiveis) return;
  proxima = e;
  if (rodando) return;
  rodando = true;
  try {
    while (proxima) {
      const atual = proxima;
      proxima = null;
      try {
        await executar(atual);
      } catch {
        // Falha ao agendar não pode derrubar o app; a próxima mudança tenta de novo.
      }
    }
  } finally {
    rodando = false;
  }
}

type Ouvinte = () => void;
const ouvintes = new Set<Ouvinte>();

/** A tela de Lembretes pede um novo agendamento (ex.: a permissão acabou de ser dada). */
export function pedirReagendamento(): void {
  ouvintes.forEach((fn) => fn());
}

export function aoPedirReagendamento(fn: Ouvinte): () => void {
  ouvintes.add(fn);
  return () => {
    ouvintes.delete(fn);
  };
}
