import { ErroIa, tipoDeStatus } from './erros';
import { MAX_TOKENS_RESPOSTA } from './historico';
import type { EventoSse } from './sse';
import type { Interpretacao, Mensagem, PedidoHttp } from './tipos';

export const BASE_GEMINI = 'https://generativelanguage.googleapis.com/v1beta';

export type ParamsPedido = { chave: string; modelo: string; sistema: string; historico: Mensagem[] };

/** `streamGenerateContent?alt=sse`: sem temperature/topP/topK (ignorados nos modelos novos). */
export function montarPedido({ chave, modelo, sistema, historico }: ParamsPedido): PedidoHttp {
  return {
    url: `${BASE_GEMINI}/models/${encodeURIComponent(modelo)}:streamGenerateContent?alt=sse`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: sistema }] },
      contents: historico.map((m) => ({ role: m.papel === 'usuario' ? 'user' : 'model', parts: [{ text: m.texto }] })),
      generationConfig: { maxOutputTokens: MAX_TOKENS_RESPOSTA },
    }),
  };
}

type PecaGemini = { text?: unknown; thought?: unknown };
type DadosGemini = {
  error?: { code?: unknown; message?: unknown };
  promptFeedback?: { blockReason?: unknown };
  candidates?: { content?: { parts?: PecaGemini[] }; finishReason?: unknown }[];
};

const FIM_BLOQUEADO = /SAFETY|PROHIBITED|BLOCKLIST|SPII/;

/** Lê um evento do stream: o texto de cada parte e o fim por segurança (`SAFETY`) ou bloqueio do pedido. */
export function interpretar(evento: EventoSse): Interpretacao {
  let dados: DadosGemini;
  try {
    dados = JSON.parse(evento.dados) as DadosGemini;
  } catch {
    return {};
  }
  if (dados?.error) throw new ErroIa(tipoDeStatus(Number(dados.error.code) || 500, String(dados.error.message ?? '')));
  const saida: Interpretacao = {};
  if (dados?.promptFeedback?.blockReason) saida.recusa = true;
  const candidato = dados?.candidates?.[0];
  // Partes marcadas como "thought" são o raciocínio do modelo: não são para a pessoa.
  const texto = (candidato?.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === 'string')
    .map((p) => p.text as string)
    .join('');
  if (texto) saida.texto = texto;
  const fim = candidato?.finishReason;
  if (typeof fim === 'string' && FIM_BLOQUEADO.test(fim)) saida.recusa = true;
  return saida;
}
