import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

/**
 * Faz o botão voltar do Android desfazer um passo interno da tela (por exemplo, a pergunta
 * anterior da avaliação) em vez de sair dela. Com `ativo` falso, o voltar segue o caminho normal.
 * Só vale enquanto a tela está em foco.
 */
export function useVoltarInterno(ativo: boolean, aoVoltar: () => void): void {
  const ref = useRef(aoVoltar);
  useEffect(() => {
    ref.current = aoVoltar;
  });
  useFocusEffect(
    useCallback(() => {
      if (!ativo) return undefined;
      const assinatura = BackHandler.addEventListener('hardwareBackPress', () => {
        ref.current();
        return true;
      });
      return () => assinatura.remove();
    }, [ativo]),
  );
}
