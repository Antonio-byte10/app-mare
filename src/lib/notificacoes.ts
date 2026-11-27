import { Platform } from 'react-native';

/**
 * Cancela todos os lembretes agendados (usado ao apagar tudo). Módulo fino e isolado: o
 * expo-notifications só é carregado no celular e qualquer falha é engolida, porque apagar os
 * dados não pode travar por causa de um lembrete.
 */
export async function cancelarTodasNotificacoes(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Notificacoes = await import('expo-notifications');
    await Notificacoes.cancelAllScheduledNotificationsAsync();
  } catch {
    // Sem permissão ou sem o módulo: não há o que cancelar.
  }
}
