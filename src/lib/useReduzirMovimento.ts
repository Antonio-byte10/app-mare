import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** `true` quando o aparelho pede "reduzir movimento"; acompanha mudanças enquanto montado. */
export function useReduzirMovimento(): boolean {
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => {
    let ativo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (ativo) setReduzir(v);
      })
      .catch(() => undefined);
    const assinatura = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduzir);
    return () => {
      ativo = false;
      assinatura.remove();
    };
  }, []);
  return reduzir;
}
