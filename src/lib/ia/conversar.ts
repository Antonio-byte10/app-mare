import { conversarCom, type ParamsConversa } from './nucleo';
import { buscarExpo } from './rede';
import { lerChave, lerCodigoServidor } from './segredos';
import type { ResultadoConversa } from './tipos';

export type { ParamsConversa } from './nucleo';

/**
 * Interface única da conversa: `conversar({ ajustes, historico, contexto, sinal, aoTexto })`.
 * Escolhe o provedor (ou o servidor do Render), aplica a instrução de sistema e devolve
 * `{ texto, fim: 'ok' | 'recusa' | 'erro', erro? }`; o erro já vem em uma frase gentil.
 * Este módulo só liga o núcleo (`nucleo.ts`, testado) ao `expo/fetch` e ao cofre do aparelho.
 */
export function conversar(params: ParamsConversa): Promise<ResultadoConversa> {
  return conversarCom(params, { buscar: buscarExpo, lerChave, lerCodigoServidor });
}
