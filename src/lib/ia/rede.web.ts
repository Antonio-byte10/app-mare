import type { Buscar } from './tipos';

/**
 * No navegador, `expo/fetch` é só o `fetch` do próprio navegador. Chamamos `globalThis.fetch` na hora
 * do pedido (e não uma cópia guardada ao carregar) para o desenvolvimento poder interceptá-lo.
 * A chamada real a um provedor pode falhar por CORS: a conversa mostra a mensagem gentil.
 */
export const buscarExpo: Buscar = (url, init) => globalThis.fetch(url, init);
