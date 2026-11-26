import { describe, expect, it, vi } from 'vitest';
import { mensagemDoErro } from './erros';
import { listarModelos, MODELO_PADRAO, modelosDaResposta, pedidoListarModelos } from './modelos';
import type { Buscar, RespostaHttp } from './tipos';

const GEMINI = {
  models: [
    { name: 'models/gemini-3.5-flash-lite', displayName: 'Gemini 3.5 Flash-Lite', supportedGenerationMethods: ['generateContent', 'countTokens'] },
    { name: 'models/gemini-4-hydrogen', displayName: 'Gemini 4 Hydrogen', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-embedding-001', displayName: 'Embedding', supportedGenerationMethods: ['embedContent'] },
    { name: 'models/gemini-3.5-flash-image', displayName: 'Imagem', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemini-3.5-flash-tts', displayName: 'Voz', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/gemma-3-27b-it', displayName: 'Gemma', supportedGenerationMethods: ['generateContent'] },
    { name: 'models/imagen-4', displayName: 'Imagen', supportedGenerationMethods: ['predict'] },
    { name: 'models/aqa', displayName: 'AQA', supportedGenerationMethods: ['generateAnswer'] },
  ],
};

const OPENAI = {
  data: [
    { id: 'gpt-5.5' },
    { id: 'gpt-6.2-astra' },
    { id: 'gpt-5.5-2026-03-01' },
    { id: 'o4-mini' },
    { id: 'text-embedding-4-large' },
    { id: 'whisper-2' },
    { id: 'gpt-image-2' },
    { id: 'dall-e-4' },
    { id: 'gpt-5.5-audio' },
    { id: 'gpt-realtime-2' },
    { id: 'gpt-5.5-codex' },
    { id: 'omni-moderation-latest' },
    { id: 'tts-2' },
  ],
};

const CLAUDE = {
  data: [
    { id: 'claude-haiku-5-5', display_name: 'Claude Haiku 5.5', type: 'model' },
    { id: 'claude-opus-5-5', display_name: 'Claude Opus 5.5', type: 'model' },
    { id: 'outro-modelo', display_name: 'Outro', type: 'model' },
  ],
  has_more: false,
};

describe('modelosDaResposta', () => {
  it('Gemini: só modelos de chat com generateContent, sem prefixo "models/", padrão primeiro', () => {
    const ids = modelosDaResposta('gemini', GEMINI).map((m) => m.id);
    expect(ids).toEqual(['gemini-3.5-flash-lite', 'gemini-4-hydrogen']);
    expect(modelosDaResposta('gemini', GEMINI)[0]!.nome).toBe('Gemini 3.5 Flash-Lite');
  });

  it('OpenAI: só modelos de texto, sem versões datadas, voz, imagem, vetores e moderação', () => {
    expect(modelosDaResposta('openai', OPENAI).map((m) => m.id)).toEqual(['gpt-5.5', 'o4-mini', 'gpt-6.2-astra']);
  });

  it('Claude: só claude-*, com o nome de exibição', () => {
    const m = modelosDaResposta('claude', CLAUDE);
    expect(m.map((x) => x.id)).toEqual(['claude-opus-5-5', 'claude-haiku-5-5']);
    expect(m[1]!.nome).toBe('Claude Haiku 5.5');
  });

  it('formatos inesperados viram lista vazia', () => {
    expect(modelosDaResposta('gemini', null)).toEqual([]);
    expect(modelosDaResposta('openai', { data: 'x' })).toEqual([]);
    expect(modelosDaResposta('claude', { data: [null, 1, {}] })).toEqual([]);
  });

  it('o padrão sugerido de cada provedor é o da documentação', () => {
    expect(MODELO_PADRAO).toEqual({ gemini: 'gemini-3.5-flash-lite', openai: 'gpt-5.5', claude: 'claude-opus-5-5' });
  });
});

describe('pedidoListarModelos', () => {
  it('usa o endpoint e a autenticação de cada provedor, sem chave na URL', () => {
    const g = pedidoListarModelos('gemini', 'k');
    expect(g.url).toContain('https://generativelanguage.googleapis.com/v1beta/models');
    expect(g.url).not.toContain('k=');
    expect(g.headers['x-goog-api-key']).toBe('k');
    expect(pedidoListarModelos('openai', 'k')).toMatchObject({ url: 'https://api.openai.com/v1/models', headers: { Authorization: 'Bearer k' } });
    const c = pedidoListarModelos('claude', 'k');
    expect(c.url).toContain('https://api.anthropic.com/v1/models');
    expect(c.headers).toMatchObject({ 'x-api-key': 'k', 'anthropic-version': '2026-10-21' });
  });
});

describe('listarModelos', () => {
  const ok = (dados: unknown): RespostaHttp => ({
    ok: true,
    status: 200,
    body: null,
    text: async () => JSON.stringify(dados),
    json: async () => dados,
  });
  const erro = (status: number, texto = ''): RespostaHttp => ({ ok: false, status, body: null, text: async () => texto, json: async () => ({}) });

  it('devolve a lista e tira espaços da chave colada', async () => {
    const buscar = vi.fn<Buscar>(async () => ok(CLAUDE));
    const modelos = await listarModelos({ provedor: 'claude', chave: '  sk-ant  \n', buscar });
    expect(modelos).toHaveLength(2);
    expect(buscar.mock.calls[0]![1].headers).toMatchObject({ 'x-api-key': 'sk-ant' });
  });

  it('chave inválida lança erro de chave; sem internet, de rede; lista vazia, de modelo', async () => {
    await expect(listarModelos({ provedor: 'openai', chave: 'x', buscar: async () => erro(401) })).rejects.toMatchObject({ tipo: 'chave' });
    await expect(
      listarModelos({
        provedor: 'openai',
        chave: 'x',
        buscar: async () => {
          throw new TypeError('x');
        },
      }),
    ).rejects.toMatchObject({ tipo: 'rede' });
    await expect(listarModelos({ provedor: 'gemini', chave: 'x', buscar: async () => ok({ models: [] }) })).rejects.toMatchObject({ tipo: 'modelo' });
    expect(mensagemDoErro('modelo')).toBeTruthy();
  });
});
