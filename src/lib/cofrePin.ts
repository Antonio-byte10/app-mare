import * as SecureStore from 'expo-secure-store';
import { lerRegistroPin, serializarRegistroPin, type RegistroPin } from './pin';

/**
 * O registro do PIN (hash, sal e contador de erros) fica no cofre do aparelho, nunca no banco do
 * app nem em backup. Módulo fino, fora dos testes. No navegador vale `cofrePin.web.ts`.
 */
const NOME = 'mare.bloqueio.pin';

/** `null` = não há PIN guardado; `'erro'` = o cofre não respondeu (não é o mesmo que não ter PIN). */
export async function lerPin(): Promise<RegistroPin | null | 'erro'> {
  try {
    const bruto = await SecureStore.getItemAsync(NOME);
    if (!bruto) return null;
    // Existe registro, mas ilegível: é erro, não "sem PIN". `null` aqui desligaria o bloqueio sozinho.
    return lerRegistroPin(bruto) ?? 'erro';
  } catch {
    return 'erro';
  }
}

/** Grava; lança se o cofre recusar (a tela avisa que não conseguiu guardar). */
export const gravarPin = (r: RegistroPin) => SecureStore.setItemAsync(NOME, serializarRegistroPin(r));

export async function apagarPin(): Promise<void> {
  await SecureStore.deleteItemAsync(NOME).catch(() => undefined);
}
