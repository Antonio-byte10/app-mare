import { comoErroIa, ErroIa, pistaDoCorpo, tipoDeStatus } from './erros';
import { criarLeitorSse, lerSse, type EventoSse } from './sse';
import type { Buscar, Interpretacao, PedidoHttp } from './tipos';

export type ResultadoFluxo = { texto: string; recusa: boolean };

/**
 * Faz o pedido a um provedor e lê o stream SSE até o fim. `interpretar` traduz cada evento do
 * provedor; `aoTexto` recebe o texto acumulado a cada novo pedaço. Lança `ErroIa` em qualquer falha.
 */
export async function executarFluxo(opcoes: {
  buscar: Buscar;
  pedido: PedidoHttp;
  interpretar: (e: EventoSse) => Interpretacao;
  sinal?: AbortSignal;
  aoTexto?: (acumulado: string) => void;
}): Promise<ResultadoFluxo> {
  const { buscar, pedido, interpretar, sinal, aoTexto } = opcoes;
  let texto = '';
  let recusa = false;
  const aoEvento = (e: EventoSse) => {
    const r = interpretar(e);
    if (r.recusa) recusa = true;
    if (r.texto) {
      texto += r.texto;
      aoTexto?.(texto);
    }
  };

  let resposta;
  try {
    resposta = await buscar(pedido.url, { method: pedido.method, headers: pedido.headers, body: pedido.body, signal: sinal });
  } catch (e) {
    throw comoErroIa(e);
  }
  if (!resposta.ok) throw new ErroIa(tipoDeStatus(resposta.status, await pistaDoCorpo(resposta)));

  const corpo = resposta.body;
  try {
    if (corpo) {
      await lerSse(corpo.getReader(), aoEvento, sinal);
    } else {
      // Sem streaming nesta plataforma: lê tudo de uma vez.
      const leitor = criarLeitorSse(aoEvento);
      leitor.empurrar(await resposta.text());
      leitor.terminar();
    }
  } catch (e) {
    throw comoErroIa(e);
  }
  return { texto, recusa };
}
