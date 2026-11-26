import type { LeitorBytes } from './tipos';

export interface EventoSse {
  /** Nome do evento (`event:`); vazio quando não veio. */
  evento: string;
  /** Linhas `data:` juntas com "\n". */
  dados: string;
}

export interface LeitorSse {
  /** Entrega mais um pedaço de texto da resposta (pode estar cortado no meio de uma linha). */
  empurrar(texto: string): void;
  /** Fim da resposta: entrega o último evento, se ficou algum sem a linha em branco final. */
  terminar(): void;
}

const TERMINADOR = /\r\n|\n|\r/;

/**
 * Leitor incremental de Server-Sent Events. Linhas `event:` e `data:`, comentários (`:`) ignorados,
 * eventos separados por linha em branco; aceita `\n`, `\r\n` e `\r`, e pedaços cortados em qualquer ponto.
 */
export function criarLeitorSse(aoEvento: (e: EventoSse) => void): LeitorSse {
  let resto = '';
  let evento = '';
  let dados: string[] = [];

  const linha = (texto: string) => {
    if (texto === '') {
      if (dados.length > 0) aoEvento({ evento, dados: dados.join('\n') });
      evento = '';
      dados = [];
      return;
    }
    if (texto.startsWith(':')) return;
    const i = texto.indexOf(':');
    const campo = i < 0 ? texto : texto.slice(0, i);
    let valor = i < 0 ? '' : texto.slice(i + 1);
    if (valor.startsWith(' ')) valor = valor.slice(1);
    if (campo === 'event') evento = valor;
    else if (campo === 'data') dados.push(valor);
  };

  const consumir = (fim: boolean) => {
    for (;;) {
      const m = TERMINADOR.exec(resto);
      if (!m) return;
      // Um "\r" no fim pode ser o começo de "\r\n": espera o próximo pedaço.
      if (m[0] === '\r' && m.index === resto.length - 1 && !fim) return;
      const texto = resto.slice(0, m.index);
      resto = resto.slice(m.index + m[0].length);
      linha(texto);
    }
  };

  return {
    empurrar(texto) {
      resto += texto;
      consumir(false);
    },
    terminar() {
      consumir(true);
      if (resto) linha(resto);
      resto = '';
      linha('');
    },
  };
}

async function cancelar(leitor: LeitorBytes, sinal: AbortSignal): Promise<never> {
  await leitor.cancel?.().catch(() => undefined);
  throw sinal.reason ?? new Error('cancelado');
}

/** Lê o corpo de uma resposta SSE até o fim, chamando `aoEvento` a cada evento completo. */
export async function lerSse(leitor: LeitorBytes, aoEvento: (e: EventoSse) => void, sinal?: AbortSignal): Promise<void> {
  const decodificador = new TextDecoder();
  const sse = criarLeitorSse(aoEvento);
  for (;;) {
    if (sinal?.aborted) return cancelar(leitor, sinal);
    const { done, value } = await leitor.read();
    if (done) break;
    if (value) sse.empurrar(decodificador.decode(value, { stream: true }));
  }
  sse.empurrar(decodificador.decode());
  sse.terminar();
}

/** Lê um corpo de texto puro (o servidor do Render) e chama `aoPedaco` a cada pedaço de texto. */
export async function lerTexto(leitor: LeitorBytes, aoPedaco: (texto: string) => void, sinal?: AbortSignal): Promise<void> {
  const decodificador = new TextDecoder();
  for (;;) {
    if (sinal?.aborted) return cancelar(leitor, sinal);
    const { done, value } = await leitor.read();
    if (done) break;
    if (value) {
      const texto = decodificador.decode(value, { stream: true });
      if (texto) aoPedaco(texto);
    }
  }
  const resto = decodificador.decode();
  if (resto) aoPedaco(resto);
}
