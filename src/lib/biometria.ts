import * as LocalAuthentication from 'expo-local-authentication';
import { semBloquear } from './useBloqueio';

/**
 * Digital ou rosto do aparelho (expo-local-authentication). O PIN é sempre a reserva, então o
 * fallback do sistema (padrão/senha do celular) fica desligado. Falha em silêncio: sem hardware,
 * sem cadastro ou no navegador, vira "indisponível". Módulo fino, fora dos testes.
 */
export async function biometriaDisponivel(): Promise<boolean> {
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
}

/** `true` só se a pessoa foi reconhecida. Cancelar, errar ou falhar devolve `false`. */
export async function autenticarBiometria(mensagem: string): Promise<boolean> {
  try {
    // A janela de digital do sistema pode mandar o app para segundo plano: não conta como sair.
    const r = await semBloquear(() =>
      LocalAuthentication.authenticateAsync({
        promptMessage: mensagem,
        cancelLabel: 'Usar o PIN',
        disableDeviceFallback: true,
      }),
    );
    return r.success;
  } catch {
    return false;
  }
}
