/**
 * Situação da permissão de notificações:
 * - `concedida`: pode agendar;
 * - `pendente`: ainda dá para pedir (explique antes, depois peça);
 * - `negada`: só pelas configurações do aparelho;
 * - `indisponivel`: sem suporte (navegador).
 */
export type Permissao = 'concedida' | 'pendente' | 'negada' | 'indisponivel';
