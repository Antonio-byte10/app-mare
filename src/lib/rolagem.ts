import { createContext, useCallback, useContext, useEffect, useRef, type ComponentRef } from 'react';
import type { ScrollView } from 'react-native';

/**
 * Rola a tela até o fim. Quem tem um ScrollView oferece isto aos filhos; o `CartaoCrise` usa para
 * aparecer inteiro na tela assim que surge, em vez de ficar escondido abaixo do campo.
 */
export const RolarAoFim = createContext<(() => void) | null>(null);

/** Ref para o ScrollView e a função que rola até o fim dele. */
export function useRolarAoFim() {
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  const rolar = useCallback(() => ref.current?.scrollToEnd({ animated: true }), []);
  return { ref, rolar };
}

/** Quando `ativo` passa a ser verdadeiro, rola o ScrollView mais próximo até o fim. */
export function useRolarAoAparecer(ativo: boolean) {
  const rolar = useContext(RolarAoFim);
  useEffect(() => {
    if (!ativo || !rolar) return;
    // Espera o cartão entrar no layout antes de rolar.
    const t = setTimeout(rolar, 120);
    return () => clearTimeout(t);
  }, [ativo, rolar]);
}
