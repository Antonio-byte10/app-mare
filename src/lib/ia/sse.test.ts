import { describe, expect, it } from 'vitest';
import { criarLeitorSse, lerSse, lerTexto, type EventoSse } from './sse';
import type { LeitorBytes } from './tipos';

const codificador = new TextEncoder();

/** Leitor de bytes falso: cada item vira um pedaço (como a rede entrega). */
function leitorDe(pedacos: (string | Uint8Array)[]): LeitorBytes & { cancelado: boolean } {
  let i = 0;
  return {
    cancelado: false,
    async read() {
      if (i >= pedacos.length) return { done: true };
      const p = pedacos[i++]!;
      return { done: false, value: typeof p === 'string' ? codificador.encode(p) : p };
    },
    async cancel() {
      this.cancelado = true;
    },
  };
}

function coletar(texto: string, tamanho: number): EventoSse[] {
  const eventos: EventoSse[] = [];
  const leitor = criarLeitorSse((e) => eventos.push(e));
  for (let i = 0; i < texto.length; i += tamanho) leitor.empurrar(texto.slice(i, i + tamanho));
  leitor.terminar();
  return eventos;
}

const FLUXO = 'event: a\ndata: {"x":1}\n\n: keep-alive\n\ndata: dois\ndata: linhas\n\nevent: b\ndata: fim\n\n';
const ESPERADO: EventoSse[] = [
  { evento: 'a', dados: '{"x":1}' },
  { evento: '', dados: 'dois\nlinhas' },
  { evento: 'b', dados: 'fim' },
];

describe('leitor SSE', () => {
  it('lê eventos com event: e data:, junta várias linhas data e ignora comentários', () => {
    expect(coletar(FLUXO, FLUXO.length)).toEqual(ESPERADO);
  });

  it('dá o mesmo resultado cortando o texto em qualquer tamanho de pedaço', () => {
    for (let tamanho = 1; tamanho <= 12; tamanho++) expect(coletar(FLUXO, tamanho)).toEqual(ESPERADO);
  });

  it('aceita \\r\\n e \\r, mesmo quando \\r e \\n chegam em pedaços diferentes', () => {
    const texto = FLUXO.replace(/\n/g, '\r\n');
    for (let tamanho = 1; tamanho <= 9; tamanho++) expect(coletar(texto, tamanho)).toEqual(ESPERADO);
    expect(coletar(FLUXO.replace(/\n/g, '\r'), 5)).toEqual(ESPERADO);
  });

  it('entrega o último evento mesmo sem a linha em branco final', () => {
    expect(coletar('data: ultimo', 100)).toEqual([{ evento: '', dados: 'ultimo' }]);
  });

  it('tira só um espaço depois dos dois pontos e aceita campo sem espaço', () => {
    expect(coletar('data:sem espaço\n\ndata:  dois espaços\n\n', 100)).toEqual([
      { evento: '', dados: 'sem espaço' },
      { evento: '', dados: ' dois espaços' },
    ]);
  });

  it('não entrega evento sem dados', () => {
    expect(coletar('event: so-nome\n\n', 100)).toEqual([]);
  });
});

describe('lerSse', () => {
  it('decodifica UTF-8 mesmo quando um caractere é cortado entre pedaços', async () => {
    const bytes = codificador.encode('data: {"t":"coração ação"}\n\n');
    // Corta no meio de "ç" (2 bytes).
    const corte = bytes.indexOf(0xc3) + 1;
    const eventos: EventoSse[] = [];
    await lerSse(leitorDe([bytes.slice(0, corte), bytes.slice(corte)]), (e) => eventos.push(e));
    expect(eventos).toEqual([{ evento: '', dados: '{"t":"coração ação"}' }]);
  });

  it('para e cancela o leitor quando o sinal é abortado', async () => {
    const controle = new AbortController();
    controle.abort();
    const leitor = leitorDe(['data: x\n\n']);
    await expect(lerSse(leitor, () => undefined, controle.signal)).rejects.toBeDefined();
    expect(leitor.cancelado).toBe(true);
  });
});

describe('lerTexto', () => {
  it('entrega cada pedaço de texto e junta o resto do UTF-8', async () => {
    const bytes = codificador.encode('Olá, não está só');
    const corte = bytes.indexOf(0xc3) + 1;
    const pedacos: string[] = [];
    await lerTexto(leitorDe([bytes.slice(0, corte), bytes.slice(corte)]), (p) => pedacos.push(p));
    expect(pedacos.join('')).toBe('Olá, não está só');
  });
});
