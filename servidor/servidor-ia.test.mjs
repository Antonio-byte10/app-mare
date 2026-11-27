// Testes do servidor da conversa, com um `fetch` falso no lugar do provedor (sem rede).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { criarServico, eventosSse, ipDoCliente, tipoDeStatus, validarPedido } from './servidor-ia.mjs';

const TOKEN = 'codigo-de-acesso-com-mais-de-24-caracteres';
const abertos = [];

async function subir(opcoes = {}) {
  const registrar = vi.fn();
  const consultar = opcoes.consultar ?? vi.fn();
  const servidor = criarServico({ publico: true, token: TOKEN, chave: 'chave-secreta', esperar: async () => {}, registrar, consultar, ...opcoes });
  await new Promise((ok) => servidor.listen(0, '127.0.0.1', ok));
  abertos.push(servidor);
  const base = `http://127.0.0.1:${servidor.address().port}`;
  return { base, registrar, consultar };
}
afterEach(async () => {
  await Promise.all(abertos.splice(0).map((s) => new Promise((ok) => s.close(ok))));
});

const codificador = new TextEncoder();
/** Resposta SSE falsa; cada item de `pedacos` vira um pedaço do corpo (pode cortar no meio da linha). */
const sse = (pedacos, status = 200) =>
  new Response(
    new ReadableStream({
      start(c) {
        for (const p of pedacos) c.enqueue(codificador.encode(p));
        c.close();
      },
    }),
    { status, headers: { 'Content-Type': 'text/event-stream' } },
  );
const json = (status, corpo) => new Response(JSON.stringify(corpo), { status });

const pedidoValido = { sistema: 'Seja gentil.', historico: [{ papel: 'usuario', texto: 'Oi' }] };
const conversar = (base, corpo = pedidoValido, cabecalhos = {}) =>
  fetch(base + '/conversa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Mare': 'conversa', Authorization: `Bearer ${TOKEN}`, ...cabecalhos },
    body: typeof corpo === 'string' ? corpo : JSON.stringify(corpo),
  });

const GEMINI = [
  'data: {"candidates":[{"content":{"role":"model","parts":[{"text":"Olá, "}]}}]}\r\n\r\n',
  'data: {"candidates":[{"content":{"role":"model","parts":[{"text":"tudo bem?"}]},"finishReason":"STOP"}]}\r\n\r\n',
];

describe('/saude', () => {
  it('sem código válido só diz que está no ar', async () => {
    const { base } = await subir();
    const r = await fetch(base + '/saude');
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, autorizado: false });
  });

  it('com código válido informa provedor, modelo e se há chave', async () => {
    const { base } = await subir({ provedor: 'claude' });
    const r = await fetch(base + '/saude', { headers: { Authorization: `Bearer ${TOKEN}` } });
    expect(await r.json()).toEqual({ ok: true, autorizado: true, configurado: true, provedor: 'claude', modelo: 'claude-opus-5-5' });
  });

  it('sobe sem chave e sem token (o deploy não falha) e diz que não está configurado', async () => {
    const { base } = await subir({ chave: undefined, token: undefined, publico: false });
    const r = await fetch(base + '/saude');
    expect(await r.json()).toMatchObject({ ok: true, autorizado: true, configurado: false, modelo: 'gemini-3.5-flash-lite' });
  });

  it('em modo público sem APP_TOKEN ninguém é autorizado', async () => {
    const { base } = await subir({ token: undefined });
    const r = await fetch(base + '/saude', { headers: { Authorization: 'Bearer qualquer' } });
    expect(await r.json()).toEqual({ ok: true, autorizado: false });
  });
});

describe('segurança', () => {
  it('recusa /conversa em modo público sem APP_TOKEN, com mensagem clara', async () => {
    const { base } = await subir({ token: undefined });
    const r = await conversar(base);
    expect(r.status).toBe(503);
    expect((await r.json()).erro).toContain('APP_TOKEN');
  });

  it('recusa código errado e bloqueia o IP depois de 10 tentativas erradas', async () => {
    const { base } = await subir();
    for (let i = 0; i < 10; i++) {
      const r = await conversar(base, pedidoValido, { Authorization: 'Bearer errado' });
      expect(r.status).toBe(401);
    }
    // Agora nem o código certo passa (janela de 15 minutos).
    const r = await conversar(base);
    expect(r.status).toBe(429);
  });

  it('não conta como tentativa errada quem não manda código', async () => {
    const { base } = await subir();
    for (let i = 0; i < 12; i++) await fetch(base + '/saude');
    const r = await conversar(base, pedidoValido, { Authorization: '' });
    expect(r.status).toBe(401);
    const ok = await fetch(base + '/saude', { headers: { Authorization: `Bearer ${TOKEN}` } });
    expect((await ok.json()).autorizado).toBe(true);
  });

  it('sem IA_CHAVE responde 503 pedindo para configurar', async () => {
    const { base } = await subir({ chave: undefined });
    const r = await conversar(base);
    expect(r.status).toBe(503);
    expect((await r.json()).erro).toContain('IA_CHAVE');
  });

  it('exige JSON e o cabeçalho X-Mare', async () => {
    const { base } = await subir();
    expect((await conversar(base, pedidoValido, { 'X-Mare': 'outra' })).status).toBe(415);
    expect((await conversar(base, pedidoValido, { 'Content-Type': 'text/plain' })).status).toBe(415);
  });

  it('valida o corpo: tamanho, quantidade de mensagens, papéis e última mensagem', async () => {
    const { base, consultar } = await subir();
    expect((await conversar(base, 'isto não é json')).status).toBe(400);
    expect((await conversar(base, { sistema: 'x', historico: [] })).status).toBe(400);
    expect((await conversar(base, { sistema: 'x', historico: [{ papel: 'sistema', texto: 'oi' }] })).status).toBe(400);
    expect((await conversar(base, { sistema: 'x', historico: [{ papel: 'ia', texto: 'oi' }] })).status).toBe(400);
    const muitas = Array.from({ length: 61 }, (_, i) => ({ papel: i % 2 ? 'ia' : 'usuario', texto: 'a' }));
    expect((await conversar(base, { sistema: 'x', historico: muitas })).status).toBe(400);
    const grande = { sistema: 'x', historico: [{ papel: 'usuario', texto: 'a'.repeat(70 * 1024) }] };
    expect((await conversar(base, grande)).status).toBe(413);
    expect(consultar).not.toHaveBeenCalled();
  });

  it('aceita exatamente 60 mensagens', async () => {
    const consultar = vi.fn(async () => sse(GEMINI));
    const { base } = await subir({ consultar });
    const historico = Array.from({ length: 60 }, (_, i) => ({ papel: i % 2 ? 'ia' : 'usuario', texto: 'a' }));
    historico[59] = { papel: 'usuario', texto: 'fim' };
    historico[58] = { papel: 'ia', texto: 'meio' };
    expect((await conversar(base, { sistema: 'x', historico })).status).toBe(200);
  });

  it('não aceita outro host do navegador nem outra origem', async () => {
    const { base } = await subir();
    const r = await fetch(base + '/saude', { headers: { Origin: 'https://site-qualquer.com' } });
    expect(r.status).toBe(403);
  });

  it('nunca registra o conteúdo da conversa nem a chave', async () => {
    const consultar = vi.fn(async () => json(401, { error: { message: 'chave-secreta inválida' } }));
    const { base, registrar } = await subir({ consultar });
    await conversar(base, { sistema: 'instrucao secreta', historico: [{ papel: 'usuario', texto: 'texto muito pessoal' }] });
    const logs = JSON.stringify(registrar.mock.calls);
    expect(logs).not.toContain('texto muito pessoal');
    expect(logs).not.toContain('chave-secreta');
    expect(logs).not.toContain('instrucao secreta');
  });
});

describe('streaming por provedor', () => {
  it('Gemini: manda o pedido certo e devolve o texto aos poucos', async () => {
    const consultar = vi.fn(async () => sse(GEMINI));
    const { base } = await subir({ consultar, modelo: 'gemini-teste' });
    const r = await conversar(base, {
      sistema: 'Seja gentil.',
      historico: [
        { papel: 'usuario', texto: 'Oi' },
        { papel: 'ia', texto: 'Olá' },
        { papel: 'usuario', texto: 'Tudo?' },
      ],
    });
    expect(r.status).toBe(200);
    expect(r.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(await r.text()).toBe('Olá, tudo bem?');
    const [url, init] = consultar.mock.calls[0];
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-teste:streamGenerateContent?alt=sse');
    expect(init.headers['x-goog-api-key']).toBe('chave-secreta');
    const corpo = JSON.parse(init.body);
    expect(corpo.systemInstruction.parts[0].text).toBe('Seja gentil.');
    expect(corpo.contents.map((c) => c.role)).toEqual(['user', 'model', 'user']);
    expect(corpo.generationConfig).not.toHaveProperty('temperature');
  });

  it('Gemini: ignora o texto de "pensamento" e aguenta pedaços cortados no meio da linha', async () => {
    const consultar = vi.fn(async () =>
      sse([
        'data: {"candidates":[{"content":{"parts":[{"text":"pensando","thought":true}]}}]}\n\nda',
        'ta: {"candidates":[{"content":{"parts":[{"text":"Resp',
        'osta"}]}}]}\n\n',
      ]),
    );
    const { base } = await subir({ consultar });
    expect(await (await conversar(base)).text()).toBe('Resposta');
  });

  it('OpenAI: usa a API Responses com store:false e lê os deltas', async () => {
    const consultar = vi.fn(async () =>
      sse([
        'event: response.created\ndata: {"type":"response.created"}\n\n',
        'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"Bom "}\n\n',
        'event: response.output_text.delta\ndata: {"type":"response.output_text.delta","delta":"dia"}\n\n',
        'event: response.completed\ndata: {"type":"response.completed"}\n\n',
      ]),
    );
    const { base } = await subir({ consultar, provedor: 'openai' });
    expect(await (await conversar(base)).text()).toBe('Bom dia');
    const [url, init] = consultar.mock.calls[0];
    expect(url).toBe('https://api.openai.com/v1/responses');
    expect(init.headers.Authorization).toBe('Bearer chave-secreta');
    const corpo = JSON.parse(init.body);
    expect(corpo).toMatchObject({ model: 'gpt-5.5', instructions: 'Seja gentil.', stream: true, store: false });
    expect(corpo.input).toEqual([{ role: 'user', content: 'Oi' }]);
    expect(corpo).not.toHaveProperty('temperature');
  });

  it('Claude: manda anthropic-version 2026-10-21, sem temperature, e lê text_delta', async () => {
    const consultar = vi.fn(async () =>
      sse([
        'event: message_start\ndata: {"type":"message_start"}\n\n',
        'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"Estou "}}\n\n',
        'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"aqui."}}\n\n',
        'event: message_stop\ndata: {"type":"message_stop"}\n\n',
      ]),
    );
    const { base } = await subir({ consultar, provedor: 'claude' });
    expect(await (await conversar(base)).text()).toBe('Estou aqui.');
    const [url, init] = consultar.mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.headers['x-api-key']).toBe('chave-secreta');
    expect(init.headers['anthropic-version']).toBe('2026-10-21');
    const corpo = JSON.parse(init.body);
    expect(corpo).toMatchObject({ model: 'claude-opus-5-5', system: 'Seja gentil.', stream: true });
    expect(corpo).not.toHaveProperty('temperature');
  });

  it('junta mensagens seguidas do mesmo papel e descarta respostas no começo', async () => {
    const consultar = vi.fn(async () => sse(GEMINI));
    const { base } = await subir({ consultar });
    await conversar(base, {
      sistema: 'x',
      historico: [
        { papel: 'ia', texto: 'perdida' },
        { papel: 'usuario', texto: 'a' },
        { papel: 'usuario', texto: 'b' },
      ],
    });
    const corpo = JSON.parse(consultar.mock.calls[0][1].body);
    expect(corpo.contents).toEqual([{ role: 'user', parts: [{ text: 'a\n\nb' }] }]);
  });
});

describe('erros e recusas', () => {
  it('tenta de novo em 503 antes do primeiro byte', async () => {
    const consultar = vi
      .fn()
      .mockResolvedValueOnce(json(503, { error: {} }))
      .mockResolvedValueOnce(json(500, { error: {} }))
      .mockResolvedValueOnce(sse(GEMINI));
    const { base } = await subir({ consultar });
    const r = await conversar(base);
    expect(r.status).toBe(200);
    expect(await r.text()).toBe('Olá, tudo bem?');
    expect(consultar).toHaveBeenCalledTimes(3);
  });

  it('desiste depois das tentativas e devolve mensagem de sobrecarga', async () => {
    const consultar = vi.fn(async () => json(503, { error: {} }));
    const { base } = await subir({ consultar });
    const r = await conversar(base);
    expect(r.status).toBe(503);
    expect(await r.json()).toMatchObject({ tipo: 'sobrecarga' });
    expect(consultar).toHaveBeenCalledTimes(3);
  });

  it.each([
    [401, 'chave'],
    [403, 'chave'],
    [404, 'modelo'],
    [429, 'limite'],
    [400, 'pedido'],
  ])('traduz HTTP %i do provedor para o tipo %s', async (status, tipo) => {
    const consultar = vi.fn(async () => json(status, { error: { message: 'x' } }));
    const { base } = await subir({ consultar });
    const r = await conversar(base);
    expect((await r.json()).tipo).toBe(tipo);
  });

  it('reconhece falta de crédito', async () => {
    const consultar = vi.fn(async () => json(400, { error: { message: 'Your credit balance is too low' } }));
    const { base } = await subir({ consultar, provedor: 'claude' });
    expect((await (await conversar(base)).json()).tipo).toBe('credito');
  });

  it('SAFETY sem nenhum texto vira recusa (422) em vez de resposta vazia', async () => {
    const consultar = vi.fn(async () => sse(['data: {"candidates":[{"finishReason":"SAFETY"}]}\n\n']));
    const { base } = await subir({ consultar });
    const r = await conversar(base);
    expect(r.status).toBe(422);
    expect((await r.json()).tipo).toBe('recusa');
  });

  it('recusa do Claude (stop_reason refusal) sem texto vira recusa', async () => {
    const consultar = vi.fn(async () =>
      sse(['event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"refusal"}}\n\n']),
    );
    const { base } = await subir({ consultar, provedor: 'claude' });
    expect((await (await conversar(base)).json()).tipo).toBe('recusa');
  });

  it('erro dentro do stream antes do texto vira resposta de erro', async () => {
    const consultar = vi.fn(async () =>
      sse(['event: error\ndata: {"type":"error","error":{"type":"overloaded_error","message":"Overloaded"}}\n\n']),
    );
    const { base } = await subir({ consultar, provedor: 'claude' });
    const r = await conversar(base);
    expect(r.status).toBe(503);
    expect((await r.json()).tipo).toBe('sobrecarga');
  });

  it('falha de rede com o provedor vira sobrecarga, sem vazar detalhes', async () => {
    const consultar = vi.fn(async () => {
      throw new TypeError('fetch failed: chave-secreta');
    });
    const { base } = await subir({ consultar });
    const r = await conversar(base);
    const texto = await r.text();
    expect(r.status).toBe(503);
    expect(texto).not.toContain('chave-secreta');
  });
});

describe('funções puras', () => {
  it('ipDoCliente: o cliente não escolhe o próprio IP mandando X-Forwarded-For', () => {
    expect(ipDoCliente('1.1.1.1, 203.0.113.9', '10.0.0.2')).toBe('203.0.113.9');
    expect(ipDoCliente('9.9.9.9, 203.0.113.9, 10.1.2.3', '10.0.0.2')).toBe('203.0.113.9');
    expect(ipDoCliente('203.0.113.9')).toBe('203.0.113.9');
    expect(ipDoCliente(undefined, '127.0.0.1')).toBe('127.0.0.1');
    expect(ipDoCliente('10.0.0.5, 192.168.0.1', 'x')).toBe('10.0.0.5');
  });

  it('tipoDeStatus', () => {
    expect(tipoDeStatus(401)).toBe('chave');
    expect(tipoDeStatus(429, '{"error":{"code":"insufficient_quota","message":"You exceeded your current quota"}}')).toBe('credito');
    // Gemini gratuito: limite por minuto também diz "quota", mas é só esperar.
    expect(tipoDeStatus(429, 'You exceeded your current quota. quotaId: GenerateRequestsPerMinutePerProjectPerModel-FreeTier')).toBe('limite');
    expect(tipoDeStatus(429, 'You exceeded your current quota. quotaId: GenerateRequestsPerDayPerProjectPerModel-FreeTier')).toBe('credito');
    expect(tipoDeStatus(529)).toBe('sobrecarga');
    expect(tipoDeStatus(400)).toBe('pedido');
    expect(tipoDeStatus(400, '{"error":{"message":"API key not valid. Please pass a valid API key."}}')).toBe('chave');
  });

  it('validarPedido normaliza o histórico', () => {
    expect(validarPedido(null)).toBeNull();
    expect(validarPedido({ sistema: ' ', historico: [] })).toBeNull();
    expect(validarPedido(pedidoValido)).toEqual(pedidoValido);
  });

  it('eventosSse junta linhas "data" e aceita \\r\\n separado entre pedaços', async () => {
    const corpo = (async function* () {
      yield codificador.encode('event: a\r');
      yield codificador.encode('\ndata: um\r\ndata: dois\r\n\r\n: comentário\n\nda');
      yield codificador.encode('ta: fim');
    })();
    const eventos = [];
    for await (const e of eventosSse(corpo)) eventos.push(e);
    expect(eventos).toEqual([
      { evento: 'a', dados: 'um\ndois' },
      { evento: '', dados: 'fim' },
    ]);
  });
});
