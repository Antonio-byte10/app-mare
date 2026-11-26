import { ErroIa } from './erros';
import { MAX_TOKENS_RESPOSTA } from './historico';
import type { EventoSse } from './sse';
import type { Interpretacao, Mensagem, PedidoHttp } from './tipos';

export const BASE_OPENAI = 'https://api.openai.com/v1';

export type ParamsPedido = { chave: string; modelo: string; sistema: string; historico: Mensagem[] };

/** API Responses com `store: false`: a conversa não fica guardada por 30 dias na OpenAI. */
export function montarPedido({ chave, modelo, sistema, historico }: ParamsPedido): PedidoHttp {
  return {
    url: `${BASE_OPENAI}/responses`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chave}` },
    body: JSON.stringify({
      model: modelo,
      instructions: sistema,
      input: historico.map((m) => ({ role: m.papel === 'usuario' ? 'user' : 'assistant', content: m.texto })),
      max_output_tokens: MAX_TOKENS_RESPOSTA,
      stream: true,
      store: false,
    }),
  };
}

type DadosOpenAi = {
  type?: unknown;
  delta?: unknown;
  error?: { code?: unknown; type?: unknown };
  response?: { error?: { code?: unknown; type?: unknown }; incomplete_details?: { reason?: unknown } };
};

/** Lê um evento do stream: `response.output_text.delta`, recusas e erros (`error`, `response.failed`). */
export function interpretar(evento: EventoSse): Interpretacao {
  let dados: DadosOpenAi;
  try {
    dados = JSON.parse(evento.dados) as DadosOpenAi;
  } catch {
    return {};
  }
  const tipo = typeof dados?.type === 'string' ? dados.type : evento.evento;
  if (tipo === 'response.output_text.delta' && typeof dados.delta === 'string') return { texto: dados.delta };
  if (tipo === 'response.refusal.delta' || tipo === 'response.refusal.done') return { recusa: true };
  if (tipo === 'response.incomplete' && dados.response?.incomplete_details?.reason === 'content_filter') return { recusa: true };
  if (tipo === 'error' || tipo === 'response.failed') {
    const erro = dados.error ?? dados.response?.error ?? {};
    const codigo = String(erro.code ?? erro.type ?? '');
    if (/invalid_api_key|authentication/.test(codigo)) throw new ErroIa('chave');
    if (/insufficient_quota|billing/.test(codigo)) throw new ErroIa('credito');
    if (/rate_limit/.test(codigo)) throw new ErroIa('limite');
    if (/model_not_found/.test(codigo)) throw new ErroIa('modelo');
    throw new ErroIa('sobrecarga');
  }
  return {};
}
