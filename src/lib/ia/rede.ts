import { fetch as fetchExpo } from 'expo/fetch';
import type { Buscar } from './tipos';

/**
 * `fetch` do Expo: no celular lê a resposta em streaming (`body.getReader()`), o que deixa o texto
 * aparecer aos poucos. No navegador é o `fetch` do próprio navegador (pode falhar por CORS: a
 * conversa mostra a mensagem gentil). Módulo fino, fora dos testes, porque importa `expo/fetch`.
 */
export const buscarExpo: Buscar = (url, init) => fetchExpo(url, init);
