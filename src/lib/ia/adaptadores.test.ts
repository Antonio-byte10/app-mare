import { describe, expect, it } from 'vitest';
import * as claude from './claude';
import { ErroIa, type TipoErroIa } from './erros';
import { executarFluxo } from './fluxo';
import * as gemini from './gemini';
import * as openai from './openai';
import { criarLeitorSse, type EventoSse } from './sse';
import type { Buscar, Interpretacao, Mensagem, RespostaHttp } from './tipos';

const codificador = new TextEncoder();

/** Resposta falsa em streaming: cada item de `pedacos` chega separado (pode cortar no meio da linha). */
function resposta(pedacos: string[], status = 200, corpoErro = ''): RespostaHttp {
  let i = 0;
  return {
    ok: status >= 200 && status < 300,
    status,
    body: {
      getReader: () => ({
        read: async () => (i < pedacos.length ? { done: false, value: codificador.encode(pedacos[i++]!) } : { done: true }),
      }),
    },
    text: async () => corpoErro,
    json: async () => JSON.parse(corpoErro),
  };
}
const buscarCom = (r: RespostaHttp | Error): Buscar => async () => {
  if (r instanceof Error) throw r;
  return r;
};

/** Divide um texto SSE em pedaços de `n` caracteres, para testar cortes no meio da linha. */
const cortar = (texto: string, n: number) => Array.from({ length: Math.ceil(texto.length / n) }, (_, i) => texto.slice(i * n, i * n + n));

// --- Respostas gravadas (formato real de cada provedor) ---

const GEMINI_OK =
  'data: {"candidates":[{"content":{"parts":[{"text":"Faz sentido "}],"role":"model"},"index":0}],"usageMetadata":{"promptTokenCount":9}}\r\n\r\n' +
  'data: {"candidates":[{"content":{"parts":[{"text":"sentir isso."}],"role":"model"},"finishReason":"STOP","index":0}]}\r\n\r\n';

const GEMINI_PENSAMENTO =
  'data: {"candidates":[{"content":{"parts":[{"text":"Vou pensar...","thought":true},{"text":"Oi!"}],"role":"model"}}]}\r\n\r\n';

const GEMINI_SAFETY = 'data: {"candidates":[{"finishReason":"SAFETY","index":0}]}\r\n\r\n';
const GEMINI_BLOQUEIO = 'data: {"promptFeedback":{"blockReason":"PROHIBITED_CONTENT"}}\r\n\r\n';

const OPENAI_OK =
  'event: response.created\ndata: {"type":"response.created","response":{"id":"resp_1","status":"in_progress"}}\n\n' +
  'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","item_id":"msg_1","delta":"Estou "}\n\n' +
  'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","item_id":"msg_1","delta":"aqui com você."}\n\n' +
  'event: response.output_text.done\ndata: {"type":"response.output_text.done","text":"Estou aqui com você."}\n\n' +
  'event: response.completed\ndata: {"type":"response.completed","response":{"status":"completed"}}\n\n';

const OPENAI_RECUSA =
  'event: response.refusal.delta\ndata: {"type":"response.refusal.delta","delta":"Não posso ajudar."}\n\n' +
  'event: response.refusal.done\ndata: {"type":"response.refusal.done","refusal":"Não posso ajudar."}\n\n';

const OPENAI_ERRO_COTA =
  'event: error\ndata: {"type":"error","error":{"type":"insufficient_quota","code":"insufficient_quota","message":"You exceeded your current quota"}}\n\n';

const CLAUDE_OK =
  'event: message_start\ndata: {"type":"message_start","message":{"id":"msg_1","role":"assistant","content":[]}}\n\n' +
  'event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n\n' +
  'event: ping\ndata: {"type":"ping"}\n\n' +
  'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Respire "}}\n\n' +
  'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"comigo."}}\n\n' +
  'event: content_block_stop\ndata: {"type":"content_block_stop","index":0}\n\n' +
  'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}\n\n' +
  'event: message_stop\ndata: {"type":"message_stop"}\n\n';

const CLAUDE_RECUSA =
  'event: message_start\ndata: {"type":"message_start","message":{"id":"msg_2","content":[]}}\n\n' +
  'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"refusal"}}\n\n' +
  'event: message_stop\ndata: {"type":"message_stop"}\n\n';

const CLAUDE_SOBRECARGA =
  'event: error\ndata: {"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}\n\n';

const historico: Mensagem[] = [
  { papel: 'usuario', texto: 'Oi' },
  { papel: 'ia', texto: 'Olá' },
  { papel: 'usuario', texto: 'Estou com vontade' },
];
const base = { chave: 'k-123', modelo: 'modelo-x', sistema: 'Seja gentil.', historico };

async function rodar(
  adaptador: { interpretar: (e: EventoSse) => Interpretacao },
  pedacos: string[],
  status = 200,
  corpoErro = '',
) {
  const acumulados: string[] = [];
  const r = await executarFluxo({
    buscar: buscarCom(resposta(pedacos, status, corpoErro)),
    pedido: { url: 'https://x', method: 'POST', headers: {} },
    interpretar: adaptador.interpretar,
    aoTexto: (t) => acumulados.push(t),
  });
  return { ...r, acumulados };
}

async function tipoDoErro(promessa: Promise<unknown>): Promise<TipoErroIa> {
  try {
    await promessa;
  } catch (e) {
    expect(e).toBeInstanceOf(ErroIa);
    return (e as ErroIa).tipo;
  }
  throw new Error('deveria ter lançado ErroIa');
}

describe('Gemini', () => {
  it('monta o pedido: endpoint SSE, chave no cabeçalho, papéis user/model e sem temperature', () => {
    const p = gemini.montarPedido(base);
    expect(p.url).toBe('https://generativelanguage.googleapis.com/v1beta/models/modelo-x:streamGenerateContent?alt=sse');
    expect(p.method).toBe('POST');
    expect(p.headers['x-goog-api-key']).toBe('k-123');
    expect(p.url).not.toContain('k-123');
    const corpo = JSON.parse(p.body!);
    expect(corpo.systemInstruction).toEqual({ parts: [{ text: 'Seja gentil.' }] });
    expect(corpo.contents).toEqual([
      { role: 'user', parts: [{ text: 'Oi' }] },
      { role: 'model', parts: [{ text: 'Olá' }] },
      { role: 'user', parts: [{ text: 'Estou com vontade' }] },
    ]);
    expect(corpo.generationConfig.maxOutputTokens).toBeGreaterThan(0);
    expect(JSON.stringify(corpo)).not.toMatch(/temperature|topP|topK/);
  });

  it('lê o stream aos poucos, mesmo cortado no meio das linhas', async () => {
    for (const n of [7, 50, 1000]) {
      const r = await rodar(gemini, cortar(GEMINI_OK, n));
      expect(r.texto).toBe('Faz sentido sentir isso.');
      expect(r.recusa).toBe(false);
    }
    const r = await rodar(gemini, [GEMINI_OK]);
    expect(r.acumulados).toEqual(['Faz sentido ', 'Faz sentido sentir isso.']);
  });

  it('ignora partes de raciocínio (thought)', async () => {
    expect((await rodar(gemini, [GEMINI_PENSAMENTO])).texto).toBe('Oi!');
  });

  it('SAFETY e bloqueio do pedido viram recusa', async () => {
    expect((await rodar(gemini, [GEMINI_SAFETY])).recusa).toBe(true);
    expect((await rodar(gemini, [GEMINI_BLOQUEIO])).recusa).toBe(true);
  });

  it('MAX_TOKENS não é recusa', async () => {
    const r = await rodar(gemini, ['data: {"candidates":[{"content":{"parts":[{"text":"corta"}]},"finishReason":"MAX_TOKENS"}]}\n\n']);
    expect(r).toMatchObject({ texto: 'corta', recusa: false });
  });

  it('erro dentro do stream vira ErroIa', async () => {
    const tipo = await tipoDoErro(rodar(gemini, ['data: {"error":{"code":429,"message":"Resource exhausted"}}\n\n']));
    expect(tipo).toBe('limite');
  });
});

describe('OpenAI', () => {
  it('monta o pedido: Responses API, store:false, instructions, input e sem temperature', () => {
    const p = openai.montarPedido(base);
    expect(p.url).toBe('https://api.openai.com/v1/responses');
    expect(p.headers.Authorization).toBe('Bearer k-123');
    const corpo = JSON.parse(p.body!);
    expect(corpo).toMatchObject({ model: 'modelo-x', instructions: 'Seja gentil.', stream: true, store: false });
    expect(corpo.input[1]).toEqual({ role: 'assistant', content: 'Olá' });
    expect(corpo.max_output_tokens).toBeGreaterThan(0);
    expect(corpo).not.toHaveProperty('temperature');
  });

  it('lê os deltas de response.output_text.delta e ignora o resto', async () => {
    for (const n of [5, 80, 5000]) {
      const r = await rodar(openai, cortar(OPENAI_OK, n));
      expect(r).toMatchObject({ texto: 'Estou aqui com você.', recusa: false });
    }
  });

  it('refusal vira recusa, sem repassar o texto da recusa como resposta', async () => {
    const r = await rodar(openai, [OPENAI_RECUSA]);
    expect(r.recusa).toBe(true);
    expect(r.texto).toBe('');
  });

  it('erro de cota vira "credito"', async () => {
    expect(await tipoDoErro(rodar(openai, [OPENAI_ERRO_COTA]))).toBe('credito');
  });
});

describe('Claude', () => {
  it('monta o pedido: anthropic-version 2026-10-21, system, messages e sem temperature', () => {
    const p = claude.montarPedido(base);
    expect(p.url).toBe('https://api.anthropic.com/v1/messages');
    expect(p.headers['x-api-key']).toBe('k-123');
    expect(p.headers['anthropic-version']).toBe('2026-10-21');
    const corpo = JSON.parse(p.body!);
    expect(corpo).toMatchObject({ model: 'modelo-x', system: 'Seja gentil.', stream: true });
    expect(corpo.messages[0]).toEqual({ role: 'user', content: 'Oi' });
    expect(corpo.max_tokens).toBeGreaterThan(0);
    expect(JSON.stringify(corpo)).not.toMatch(/temperature|top_p|top_k/);
    // Sem "prefill": a última mensagem é da pessoa.
    expect(corpo.messages.at(-1).role).toBe('user');
  });

  it('lê content_block_delta/text_delta, ignorando ping e os outros eventos', async () => {
    for (const n of [3, 64, 5000]) {
      const r = await rodar(claude, cortar(CLAUDE_OK, n));
      expect(r).toMatchObject({ texto: 'Respire comigo.', recusa: false });
    }
  });

  it('stop_reason refusal vira recusa', async () => {
    expect((await rodar(claude, [CLAUDE_RECUSA])).recusa).toBe(true);
  });

  it('overloaded_error no stream vira "sobrecarga"', async () => {
    expect(await tipoDoErro(rodar(claude, [CLAUDE_SOBRECARGA]))).toBe('sobrecarga');
  });
});

describe('erros HTTP (todos os provedores)', () => {
  const casos: [number, string, TipoErroIa][] = [
    [401, '{"error":{"message":"invalid x-api-key"}}', 'chave'],
    [403, '{"error":{"message":"permission denied"}}', 'chave'],
    [404, '{"error":{"message":"model not found"}}', 'modelo'],
    [429, '{"error":{"message":"Too many requests"}}', 'limite'],
    [429, '{"error":{"code":"insufficient_quota","message":"You exceeded your current quota"}}', 'credito'],
    [400, '{"error":{"message":"Your credit balance is too low to access the API"}}', 'credito'],
    [400, '{"error":{"code":400,"message":"API key not valid. Please pass a valid API key.","status":"INVALID_ARGUMENT"}}', 'chave'],
    [400, '{"error":{"message":"bad request"}}', 'pedido'],
    [500, '{}', 'sobrecarga'],
    [503, '{}', 'sobrecarga'],
    [529, '{"error":{"type":"overloaded_error"}}', 'sobrecarga'],
  ];
  for (const [status, corpo, esperado] of casos) {
    it(`HTTP ${status} ${corpo.slice(0, 30)} vira "${esperado}"`, async () => {
      for (const adaptador of [gemini, openai, claude]) {
        expect(await tipoDoErro(rodar(adaptador, [], status, corpo))).toBe(esperado);
      }
    });
  }

  it('falha de rede vira "rede"', async () => {
    const p = executarFluxo({
      buscar: buscarCom(new TypeError('Network request failed')),
      pedido: { url: 'https://x', method: 'POST', headers: {} },
      interpretar: gemini.interpretar,
    });
    expect(await tipoDoErro(p)).toBe('rede');
  });

  it('sem corpo em streaming, lê o texto inteiro', async () => {
    const r = await executarFluxo({
      buscar: async () => ({ ok: true, status: 200, body: null, text: async () => OPENAI_OK, json: async () => ({}) }),
      pedido: { url: 'https://x', method: 'POST', headers: {} },
      interpretar: openai.interpretar,
    });
    expect(r.texto).toBe('Estou aqui com você.');
  });

  it('JSON quebrado em um evento é ignorado em vez de derrubar a conversa', () => {
    const leitor = criarLeitorSse(() => undefined);
    leitor.terminar();
    expect(gemini.interpretar({ evento: '', dados: '{quebrado' })).toEqual({});
    expect(openai.interpretar({ evento: '', dados: 'nope' })).toEqual({});
    expect(claude.interpretar({ evento: '', dados: '' })).toEqual({});
  });
});
