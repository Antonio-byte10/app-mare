import { lerRegistroPin, serializarRegistroPin, type RegistroPin } from './pin';

/**
 * Versão do navegador (só para desenvolvimento): o expo-secure-store não existe no web. Só o hash
 * com sal vai para o localStorage, nunca o PIN.
 */
const NOME = 'mare.bloqueio.pin';

export async function lerPin(): Promise<RegistroPin | null | 'erro'> {
  try {
    return lerRegistroPin(localStorage.getItem(NOME));
  } catch {
    return 'erro';
  }
}

export const gravarPin = async (r: RegistroPin) => {
  localStorage.setItem(NOME, serializarRegistroPin(r));
};

export async function apagarPin(): Promise<void> {
  try {
    localStorage.removeItem(NOME);
  } catch {
    // Sem localStorage: não há o que apagar.
  }
}
