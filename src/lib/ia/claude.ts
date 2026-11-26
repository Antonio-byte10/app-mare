import { ErroIa } from './erros';
import { MAX_TOKENS_RESPOSTA } from './historico';
import type { EventoSse } from './sse';
import type { Interpretacao, Mensagem, PedidoHttp } from './tipos';

export const BASE_CLAUDE = 'https://api.anthropic.com/v1';
export const VERSAO_ANTHROPIC = '2026-10-21';

export type ParamsPedido = { chave: string; modelo: string; sistema: string; historico: Mensagem[] };

/** Messages API em streaming. Sem temperature/top_p/top_k (400 na versão 2026-10-21) e sem "prefill". */
export function montarPedido({ chave, modelo, sistema, historico }: ParamsPedido): PedidoHttp {
  return {
    url: `${BASE_CLAUDE}/messages`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': chave, 'anthropic-version': VERSAO_ANTHROPIC },
    body: JSON.stringify({
      model: modelo,
      system: sistema,
      messages: historico.map((m) => ({ role: m.papel === 'usuario' ? 'user' : 'assistant', content: m.texto })),
      max_tokens: MAX_TOKENS_RESPOSTA,
      stream: true,
    }),
  };
}

type DadosClaude = {
  type?: unknown;
  delta?: { type?: unknown; text?: unknown; stop_reason?: unknown };
  error?: { type?: unknown; message?: unknown };
};

/** Lê um evento do stream: `content_block_delta` (text_delta), `stop_reason: "refusal"` e `error`. */
export function interpretar(evento: EventoSse): Interpretacao {
  let dados: DadosClaude;
  try {
    dados = JSON.parse(evento.dados) as DadosClaude;
  } catch {
    return {};
  }
  const tipo = typeof dados?.type === 'string' ? dados.type : evento.evento;
  if (tipo === 'content_block_delta' && dados.delta?.type === 'text_delta' && typeof dados.delta.text === 'string') {
    return { texto: dados.delta.text };
  }
  if (tipo === 'message_delta' && dados.delta?.stop_reason === 'refusal') return { recusa: true };
  if (tipo === 'error') {
    const t = String(dados.error?.type ?? '');
    const mensagem = String(dados.error?.message ?? '');
    if (/credit|billing/i.test(mensagem)) throw new ErroIa('credito');
    if (/authentication|permission/.test(t)) throw new ErroIa('chave');
    if (/rate_limit/.test(t)) throw new ErroIa('limite');
    if (/not_found/.test(t)) throw new ErroIa('modelo');
    if (/invalid_request/.test(t)) throw new ErroIa('pedido');
    // overloaded_error, api_error…
    throw new ErroIa('sobrecarga');
  }
  return {};
}
