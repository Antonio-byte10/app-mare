import type { Mensagem } from './tipos';

/** Mensagens mais recentes que vão para a IA (o resto da conversa fica só no celular). */
export const MAX_MENSAGENS_ENVIADAS = 30;

/** Limite de saída pedido aos provedores. Modelos que "pensam" gastam parte dele pensando. */
export const MAX_TOKENS_RESPOSTA = 2048;

/**
 * Deixa o histórico no formato que os três provedores aceitam: sem mensagens vazias, papéis
 * alternados (mensagens seguidas da mesma pessoa viram uma só) e começando por uma mensagem da pessoa.
 * Fica só com as últimas `maximo` mensagens.
 */
export function prepararHistorico(historico: Mensagem[], maximo = MAX_MENSAGENS_ENVIADAS): Mensagem[] {
  const recentes = historico.filter((m) => m.texto.trim() !== '').slice(-maximo);
  const saida: Mensagem[] = [];
  for (const m of recentes) {
    const ultimo = saida[saida.length - 1];
    if (ultimo && ultimo.papel === m.papel) ultimo.texto += '\n\n' + m.texto;
    else saida.push({ papel: m.papel, texto: m.texto });
  }
  while (saida.length > 0 && saida[0]!.papel !== 'usuario') saida.shift();
  return saida;
}
