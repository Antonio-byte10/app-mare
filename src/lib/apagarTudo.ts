import { apagarTodosSegredos } from './ia/segredos';
import { recomecarDoZero } from './armazenamento';
import { limparArquivosTemporarios } from './arquivos';
import { apagarPin } from './cofrePin';
import { trocarDisfarce } from '../../modules/disfarce';
import { cancelarTodasNotificacoes } from './notificacoes';
import { useBloqueio } from './useBloqueio';
import { useMare } from '@/store';

/**
 * Apaga tudo o que o Maré guarda neste aparelho: o banco cifrado e a chave dele, o PIN, a chave
 * e o código da IA, os lembretes agendados e o disfarce do ícone (este por último). Depois disso o app volta ao
 * primeiro uso, sem bloqueio. Só chamar depois de a pessoa confirmar duas vezes.
 *
 * Cada etapa é tentada mesmo que a anterior falhe, para apagar o máximo possível; devolve o nome
 * das etapas que falharam (vazio = tudo apagado).
 */
export async function apagarTudo(): Promise<string[]> {
  const falhas: string[] = [];
  const tentar = async (nome: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch {
      falhas.push(nome);
    }
  };
  // O PIN e os segredos primeiro: se algo travar depois, o que é mais sensível já saiu.
  await tentar('PIN', apagarPin);
  await tentar('chaves da IA', apagarTodosSegredos);
  await tentar('lembretes', cancelarTodasNotificacoes);
  limparArquivosTemporarios();
  await tentar('banco de dados', async () => {
    await recomecarDoZero();
    // Reabre um banco novo e vazio: o estado em memória volta ao de quem acabou de instalar.
    await useMare.persist.rehydrate();
  });
  useBloqueio.getState().destravar();
  // O ícone por último: alguns launchers fecham o app ao trocar o ícone, e isso não pode
  // interromper a limpeza (com o app morto no meio, sobraria dado no aparelho).
  await tentar('disfarce', () => trocarDisfarce('mare'));
  return falhas;
}
