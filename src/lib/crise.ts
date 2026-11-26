/**
 * Detecção de crise SEM IA (spec 7.3): padrões em português para risco de suicídio/autolesão,
 * intoxicação/overdose e abstinência alcoólica grave. Roda em todo texto que a pessoa escreve.
 * Implementação completa: Plano 2.
 */
export type TipoCrise = 'suicidio' | 'intoxicacao' | 'abstinencia';

export function detectarCrise(texto: string): TipoCrise | null {
  void texto;
  return null;
}
