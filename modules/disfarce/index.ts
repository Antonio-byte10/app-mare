import { Platform, requireOptionalNativeModule } from 'expo';

/** Lado nativo (Kotlin, `DisfarceModule.kt`): liga um `activity-alias` e desliga os outros. */
interface DisfarceNativo {
  atual(): string;
  definir(id: string): Promise<void>;
}

/** `null` no navegador, no Expo Go e em builds sem o módulo: aí a escolha só é guardada. */
const nativo = Platform.OS === 'android' ? requireOptionalNativeModule<DisfarceNativo>('Disfarce') : null;

/** `true` se este app consegue mesmo trocar o nome e o ícone. */
export const disfarceDisponivel = () => nativo !== null;

/** Id do disfarce habilitado no launcher, ou `null` se não dá para saber. */
export function disfarceAtivo(): string | null {
  try {
    return nativo ? nativo.atual() : null;
  } catch {
    return null;
  }
}

/** Troca o ícone e o nome. Lança se o sistema recusar; sem o módulo nativo, não faz nada. */
export async function trocarDisfarce(id: string): Promise<void> {
  if (nativo) await nativo.definir(id);
}
