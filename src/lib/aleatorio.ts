import * as Crypto from 'expo-crypto';

/** Bytes aleatórios do sistema (sal do PIN, sal e nonce do backup). Módulo fino, fora dos testes. */
export const bytesAleatorios = (n: number): Uint8Array => Crypto.getRandomBytes(n);
