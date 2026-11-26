import * as Haptics from 'expo-haptics';

/**
 * Vibração leve na virada da respiração. Falha em silêncio: aparelho sem vibrador, navegador
 * sem suporte ou vibração desligada no sistema não podem quebrar a tela.
 */
export function vibrarLeve(): void {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  } catch {
    // Sem háptica neste ambiente.
  }
}

/** Vibração de confirmação (ao chegar em "Você atravessou a onda"). */
export function vibrarSucesso(): void {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  } catch {
    // Sem háptica neste ambiente.
  }
}
