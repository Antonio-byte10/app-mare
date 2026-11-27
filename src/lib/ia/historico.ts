import type { Mensagem } from './tipos';

/** Mensagens mais recentes que vão para a IA (o resto da conversa fica só no celular). */
export const MAX_MENSAGENS_ENVIADAS = 30;

/**
 * Limite de saída pedido aos provedores. Modelos que "pensam" gastam parte dele pensando: com
 * 2048 alguns chegavam ao fim do limite sem escrever nada.
 */
export const MAX_TOKENS_RESPOSTA = 4096;

/**
 * Tamanho máximo de uma mensagem e do histórico inteiro, em caracteres. O servidor do Render recusa
 * mensagens acima de 8000 caracteres e pedidos acima de 64 KB: sem estes cortes, uma conversa longa
 * ficaria recusada para sempre até a pessoa apagá-la.
 */
export const MAX_CARACTERES_MENSAGEM = 6000;
export const MAX_CARACTERES_HISTORICO = 24000;

/**
 * Deixa o histórico no formato que os três provedores aceitam: sem mensagens vazias, papéis
 * alternados (mensagens seguidas da mesma pessoa viram uma só) e começando por uma mensagem da pessoa.
 * Fica só com as últimas `maximo` mensagens e corta o que passar dos limites de tamanho (cada
 * mensagem guarda o fim, que é o mais recente; o histórico perde as mais antigas).
 */
export function prepararHistorico(historico: Mensagem[], maximo = MAX_MENSAGENS_ENVIADAS): Mensagem[] {
  const recentes = historico.filter((m) => m.texto.trim() !== '').slice(-maximo);
  const saida: Mensagem[] = [];
  for (const m of recentes) {
    const ultimo = saida[saida.length - 1];
    if (ultimo && ultimo.papel === m.papel) ultimo.texto += '\n\n' + m.texto;
    else saida.push({ papel: m.papel, texto: m.texto });
  }
  for (const m of saida) if (m.texto.length > MAX_CARACTERES_MENSAGEM) m.texto = '…' + m.texto.slice(-MAX_CARACTERES_MENSAGEM);
  let total = saida.reduce((soma, m) => soma + m.texto.length, 0);
  while (saida.length > 1 && total > MAX_CARACTERES_HISTORICO) total -= saida.shift()!.texto.length;
  while (saida.length > 0 && saida[0]!.papel !== 'usuario') saida.shift();
  return saida;
}
