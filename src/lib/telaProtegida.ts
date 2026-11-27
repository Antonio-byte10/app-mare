import { Platform } from 'react-native';

const CHAVE = 'mare.privacidade';

/**
 * Telas protegidas: no Android, FLAG_SECURE (expo-screen-capture). Bloqueia capturas e gravações
 * de tela e esconde o app na lista de apps recentes. Falha em silêncio; no navegador não faz nada.
 * Módulo fino, fora dos testes.
 */
export async function aplicarTelaProtegida(ligado: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const ScreenCapture = await import('expo-screen-capture');
    if (ligado) await ScreenCapture.preventScreenCaptureAsync(CHAVE);
    else await ScreenCapture.allowScreenCaptureAsync(CHAVE);
  } catch {
    // Sem suporte neste aparelho.
  }
}
