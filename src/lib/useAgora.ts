import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const MINUTO = 60_000;

/**
 * Instante atual, renovado a cada minuto e quando o app volta ao primeiro plano.
 * Assim "hoje" e a saudação acompanham a virada do dia com o app aberto.
 */
export function useAgora(): number {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const atualizar = () => setAgora(Date.now());
    const intervalo = setInterval(atualizar, MINUTO);
    const assinatura = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') atualizar();
    });
    return () => {
      clearInterval(intervalo);
      assinatura.remove();
    };
  }, []);
  return agora;
}
