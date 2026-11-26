import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/** Volta uma tela; se não há para onde voltar (link direto), vai para o Início. */
export function useVoltar() {
  const router = useRouter();
  return useCallback(() => (router.canGoBack() ? router.back() : router.replace('/')), [router]);
}
