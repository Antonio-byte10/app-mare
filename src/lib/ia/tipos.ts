import type { ProvedorIa } from '../tipos';
import type { TipoErroIa } from './erros';

export type Provedor = ProvedorIa;

/** Uma mensagem da conversa, no formato que vai para a IA. */
export type Mensagem = { papel: 'usuario' | 'ia'; texto: string };

/** Como a conversa terminou: resposta normal, recusa do provedor ou erro (sem texto técnico). */
export type FimConversa = 'ok' | 'recusa' | 'erro';

export type ResultadoConversa = {
  /** O que chegou da IA (pode estar incompleto quando `fim` não é 'ok'). */
  texto: string;
  fim: FimConversa;
  /** Mensagem gentil, pronta para mostrar. Só existe quando `fim` não é 'ok'. */
  erro?: string;
  /** Quando houve erro: se vale mostrar o botão "Respirar agora" junto da mensagem. */
  oferecerRespiro?: boolean;
  /** Quando houve erro: o tipo, para a tela oferecer o caminho certo (ex.: abrir os ajustes de IA). */
  tipoErro?: TipoErroIa;
};

/** Leitor de bytes de um corpo de resposta (o `ReadableStreamDefaultReader` do fetch). */
export interface LeitorBytes {
  read(): Promise<{ done: boolean; value?: Uint8Array }>;
  cancel?(): Promise<void>;
}

/** O pedaço de `Response` que a biblioteca usa. Assim os testes injetam um fetch falso. */
export interface RespostaHttp {
  ok: boolean;
  status: number;
  body: { getReader(): LeitorBytes } | null;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

/** Um pedido HTTP já montado (URL, cabeçalhos e corpo), pronto para o `fetch`. */
export interface PedidoHttp {
  url: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  body?: string;
}

/** Função de fetch injetável: no app é o `fetch` de `expo/fetch` (streaming); nos testes, um falso. */
export type Buscar = (
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal },
) => Promise<RespostaHttp>;

/** Modelo de chat que o provedor oferece. */
export type ModeloIa = { id: string; nome: string };

/** O que um adaptador entende de cada evento SSE do provedor. */
export type Interpretacao = {
  /** Texto novo da resposta. */
  texto?: string;
  /** O provedor se recusou a responder (SAFETY, refusal…). */
  recusa?: boolean;
};
