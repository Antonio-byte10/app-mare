import { comoErroIa, ehTipoErroIa, ErroIa, pistaDoCorpo, tipoDeStatus, type TipoErroIa } from './erros';
import { lerTexto } from './sse';
import type { Buscar, Mensagem, RespostaHttp } from './tipos';

/** Cliente do servidor opcional do Render (servidor/servidor-ia.mjs). */

/** Só HTTPS sai do aparelho. Aceita o endereço com ou sem caminho, sem espaços. */
export function enderecoValido(endereco: string): boolean {
  return /^https:\/\/[^\s/?#]+(\/[^\s?#]*)?$/.test(endereco.trim());
}

/** Tira espaços e barras do fim: "https://x.onrender.com/" vira "https://x.onrender.com". */
export function normalizarEndereco(endereco: string): string {
  return endereco.trim().replace(/\/+$/, '');
}

const cabecalhoCodigo = (codigo: string): Record<string, string> => ({ Authorization: `Bearer ${codigo.trim()}` });

/** Traduz a resposta de erro do servidor: usa o `tipo` que ele manda e, sem isso, o status HTTP. */
async function erroDoServidor(resposta: RespostaHttp): Promise<ErroIa> {
  const texto = await pistaDoCorpo(resposta);
  let tipo: TipoErroIa | undefined;
  try {
    const dados = JSON.parse(texto) as { tipo?: unknown };
    if (ehTipoErroIa(dados?.tipo)) tipo = dados.tipo;
  } catch {
    // Corpo que não é JSON (ex.: página de erro do Render enquanto o servidor acorda).
  }
  if (!tipo) {
    if (resposta.status === 401) tipo = 'codigo';
    else if (resposta.status === 503 && !texto.includes('"erro"')) tipo = 'sobrecarga';
    else tipo = tipoDeStatus(resposta.status);
  }
  return new ErroIa(tipo);
}

/** Conversa pelo servidor: manda `{ sistema, historico }` e lê a resposta em texto puro, em streaming. */
export async function conversarServidor(opcoes: {
  buscar: Buscar;
  endereco: string;
  codigo: string;
  sistema: string;
  historico: Mensagem[];
  sinal?: AbortSignal;
  aoTexto?: (acumulado: string) => void;
}): Promise<{ texto: string; recusa: boolean }> {
  const { buscar, endereco, codigo, sistema, historico, sinal, aoTexto } = opcoes;
  let resposta: RespostaHttp;
  try {
    resposta = await buscar(`${normalizarEndereco(endereco)}/conversa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Mare': 'conversa', ...cabecalhoCodigo(codigo) },
      body: JSON.stringify({ sistema, historico }),
      signal: sinal,
    });
  } catch (e) {
    throw comoErroIa(e);
  }
  if (!resposta.ok) throw await erroDoServidor(resposta);

  let texto = '';
  const acumular = (pedaco: string) => {
    texto += pedaco;
    aoTexto?.(texto);
  };
  try {
    if (resposta.body) await lerTexto(resposta.body.getReader(), acumular, sinal);
    else acumular(await resposta.text());
  } catch (e) {
    throw comoErroIa(e);
  }
  return { texto, recusa: false };
}

export type ResultadoTeste = {
  ok: boolean;
  /** Uma frase pronta para mostrar. */
  mensagem: string;
  provedor?: string;
  modelo?: string;
};

export const AVISO_ACORDANDO = 'O servidor gratuito leva até 1 minuto para acordar.';

/** Botão "Testar conexão": diz em uma frase o que está faltando. */
export async function testarServidor(opcoes: {
  buscar: Buscar;
  endereco: string;
  codigo: string;
  sinal?: AbortSignal;
}): Promise<ResultadoTeste> {
  const { buscar, endereco, codigo, sinal } = opcoes;
  if (!enderecoValido(endereco)) {
    return { ok: false, mensagem: 'Use um endereço que comece com https://, como https://mare-ia.onrender.com.' };
  }
  try {
    const resposta = await buscar(`${normalizarEndereco(endereco)}/saude`, {
      method: 'GET',
      headers: codigo.trim() ? cabecalhoCodigo(codigo) : {},
      signal: sinal,
    });
    if (resposta.status === 429) return { ok: false, mensagem: 'O servidor bloqueou novas tentativas por um tempo. Tente de novo em 15 minutos.' };
    const dados = (await resposta.json().catch(() => null)) as {
      ok?: unknown;
      autorizado?: unknown;
      configurado?: unknown;
      provedor?: unknown;
      modelo?: unknown;
    } | null;
    if (!resposta.ok || dados?.ok !== true) {
      // O Render responde 502/503 com uma página de erro enquanto o servidor ainda acorda.
      if (resposta.status >= 500) return { ok: false, mensagem: `O servidor ainda está acordando. ${AVISO_ACORDANDO} Tente de novo em instantes.` };
      return { ok: false, mensagem: 'O endereço respondeu, mas não parece ser um servidor do Maré.' };
    }
    if (dados.autorizado !== true) {
      return { ok: false, mensagem: 'Servidor encontrado, mas o código de acesso não confere.' };
    }
    if (dados.configurado !== true) {
      return { ok: false, mensagem: 'Servidor encontrado e código certo, mas falta configurar a IA_CHAVE no painel do Render.' };
    }
    const provedor = typeof dados.provedor === 'string' ? dados.provedor : undefined;
    const modelo = typeof dados.modelo === 'string' ? dados.modelo : undefined;
    return { ok: true, mensagem: 'Conexão funcionando.', provedor, modelo };
  } catch (e) {
    const erro = comoErroIa(e);
    if (erro.tipo === 'tempo' || sinal?.aborted) {
      return { ok: false, mensagem: `O servidor demorou demais. ${AVISO_ACORDANDO} Tente de novo em 1 minuto.` };
    }
    return {
      ok: false,
      mensagem: `Não consegui falar com o servidor. Confira o endereço e a internet. ${AVISO_ACORDANDO}`,
    };
  }
}
