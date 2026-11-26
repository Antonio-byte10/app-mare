import type { TipoCrise } from '@/lib/crise';

type Props = { tipo: TipoCrise; aoFechar?: () => void };

/**
 * Cartão acolhedor com CVV 188 / SAMU 192, mostrado quando `detectarCrise` encontra sinais de risco.
 * Respeita a opção "Contatos de emergência" (desligada: não mostra nada). Implementação: Plano 2.
 */
export function CartaoCrise(props: Props) {
  void props;
  return null;
}
