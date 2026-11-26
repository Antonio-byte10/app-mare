import { BASE_CLAUDE, VERSAO_ANTHROPIC } from './claude';
import { comoErroIa, ErroIa, pistaDoCorpo, tipoDeStatus } from './erros';
import { BASE_GEMINI } from './gemini';
import { BASE_OPENAI } from './openai';
import type { Buscar, ModeloIa, PedidoHttp, Provedor } from './tipos';

/** Modelo sugerido de cada provedor (docs/02-provedores-ia.md). A pessoa pode trocar. */
export const MODELO_PADRAO: Record<Provedor, string> = {
  gemini: 'gemini-3.5-flash-lite',
  openai: 'gpt-5.5',
  claude: 'claude-opus-5-5',
};

export const NOME_PROVEDOR: Record<Provedor, string> = {
  gemini: 'Gemini',
  openai: 'ChatGPT',
  claude: 'Claude',
};

export function pedidoListarModelos(provedor: Provedor, chave: string): PedidoHttp {
  switch (provedor) {
    case 'gemini':
      return { url: `${BASE_GEMINI}/models?pageSize=200`, method: 'GET', headers: { 'x-goog-api-key': chave } };
    case 'openai':
      return { url: `${BASE_OPENAI}/models`, method: 'GET', headers: { Authorization: `Bearer ${chave}` } };
    case 'claude':
      return {
        url: `${BASE_CLAUDE}/models?limit=100`,
        method: 'GET',
        headers: { 'x-api-key': chave, 'anthropic-version': VERSAO_ANTHROPIC },
      };
  }
}

const ehObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

// Modelos que não conversam por texto (imagem, voz, vetores…) ou que não aceitam instrução de sistema.
const NAO_CHAT_GEMINI = /embed|imagen|veo|tts|audio|image|live|aqa|robotics|computer-use|learnlm|gemma|lyria|banana|nano/i;
const NAO_CHAT_OPENAI =
  /embedding|whisper|tts|dall-e|image|audio|realtime|transcribe|moderation|search|codex|instruct|davinci|babbage|sora|computer-use|deep-research|-\d{4}-\d{2}-\d{2}$/i;

/** Lê a resposta de listagem de cada provedor e fica só com modelos de chat/texto. */
export function modelosDaResposta(provedor: Provedor, dados: unknown): ModeloIa[] {
  const lista = ehObjeto(dados) ? (provedor === 'gemini' ? dados.models : dados.data) : undefined;
  if (!Array.isArray(lista)) return [];
  const modelos: ModeloIa[] = [];
  for (const item of lista) {
    if (!ehObjeto(item)) continue;
    if (provedor === 'gemini') {
      const id = typeof item.name === 'string' ? item.name.replace(/^models\//, '') : '';
      const metodos = Array.isArray(item.supportedGenerationMethods) ? item.supportedGenerationMethods : [];
      if (!id.startsWith('gemini') || NAO_CHAT_GEMINI.test(id) || !metodos.includes('generateContent')) continue;
      modelos.push({ id, nome: typeof item.displayName === 'string' && item.displayName ? item.displayName : id });
    } else {
      const id = typeof item.id === 'string' ? item.id : '';
      if (provedor === 'openai') {
        if (!/^(gpt-|chatgpt-|o\d)/.test(id) || NAO_CHAT_OPENAI.test(id)) continue;
        modelos.push({ id, nome: id });
      } else {
        if (!id.startsWith('claude')) continue;
        modelos.push({ id, nome: typeof item.display_name === 'string' && item.display_name ? item.display_name : id });
      }
    }
  }
  return ordenarModelos(provedor, modelos);
}

/** Sem repetidos, o padrão sugerido primeiro e o resto do mais novo (nome maior) para o mais antigo. */
export function ordenarModelos(provedor: Provedor, modelos: ModeloIa[]): ModeloIa[] {
  const unicos = [...new Map(modelos.map((m) => [m.id, m])).values()];
  const padrao = MODELO_PADRAO[provedor];
  return unicos.sort((a, b) => {
    if (a.id === padrao) return -1;
    if (b.id === padrao) return 1;
    return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
  });
}

/**
 * "Testar chave": lista os modelos do provedor com a chave da pessoa. Chave inválida, sem crédito ou
 * sem internet viram `ErroIa`. Lista vazia (chave boa, mas sem modelo de chat) também é erro de modelo.
 */
export async function listarModelos(opcoes: {
  provedor: Provedor;
  chave: string;
  buscar: Buscar;
  sinal?: AbortSignal;
}): Promise<ModeloIa[]> {
  const { provedor, chave, buscar, sinal } = opcoes;
  const pedido = pedidoListarModelos(provedor, chave.trim());
  let resposta;
  try {
    resposta = await buscar(pedido.url, { method: pedido.method, headers: pedido.headers, signal: sinal });
  } catch (e) {
    throw comoErroIa(e);
  }
  if (!resposta.ok) throw new ErroIa(tipoDeStatus(resposta.status, await pistaDoCorpo(resposta)));
  let dados: unknown;
  try {
    dados = await resposta.json();
  } catch {
    throw new ErroIa('desconhecido');
  }
  const modelos = modelosDaResposta(provedor, dados);
  if (modelos.length === 0) throw new ErroIa('modelo');
  return modelos;
}
