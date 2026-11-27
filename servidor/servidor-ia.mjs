// Servidor opcional da conversa do Maré (Render). Só módulos do Node 22, sem dependências.
// Recebe o histórico já preparado pelo app, chama o provedor de IA com a chave que fica aqui
// e devolve o texto em streaming. Nunca registra o conteúdo das conversas nem a chave.
import { Buffer } from 'node:buffer';
import { createHash, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

export const MODELOS_PADRAO = {
  gemini: 'gemini-3.5-flash-lite',
  openai: 'gpt-5.5',
  claude: 'claude-opus-5-5',
};
/** Par de reserva do Gemini: limites do plano gratuito são por modelo (ver src/lib/ia/modelos.ts). */
export const RESERVAS = {
  'gemini-3.5-flash-lite': 'gemini-3.1-flash-lite',
  'gemini-3.1-flash-lite': 'gemini-3.5-flash-lite',
};
const VERSAO_ANTHROPIC = '2026-10-21';
/** Limite de saída. Modelos que "pensam" gastam parte dele pensando, por isso não é pequeno. */
const MAX_TOKENS = 4096;

const LIMITE_CORPO = 64 * 1024;
const LIMITE_MENSAGENS = 60;
const LIMITE_TEXTO = 8000;
const LIMITE_SISTEMA = 16000;
const SIMULTANEAS = 4;
const PRAZO_PROVEDOR_MS = 90_000;
const JANELA_MS = 15 * 60_000;
const TENTATIVAS_ERRADAS = 10;

/** Compara o código de acesso sem vazar o tamanho nem o conteúdo pelo tempo de resposta. */
const resumo = (texto) => createHash('sha256').update(texto).digest();
const autorizado = (cabecalho, token) =>
  typeof cabecalho === 'string' && cabecalho.startsWith('Bearer ') && timingSafeEqual(resumo(cabecalho.slice(7)), resumo(token));

const esperarPadrao = (ms) => new Promise((ok) => setTimeout(ok, ms));

/** Erro do provedor já traduzido: `tipo` é o mesmo vocabulário que o app entende. */
class ErroProvedor extends Error {
  constructor(tipo, status, mensagem) {
    super(mensagem);
    this.tipo = tipo;
    this.status = status;
  }
}

const MENSAGENS = {
  chave: [502, 'A chave de IA configurada no servidor foi recusada pelo provedor.'],
  credito: [402, 'A conta de IA configurada no servidor está sem crédito ou chegou ao limite.'],
  limite: [429, 'A IA está recebendo pedidos demais agora. Tente de novo em instantes.'],
  modelo: [502, 'O modelo configurado no servidor não está disponível. Confira IA_MODELO.'],
  sobrecarga: [503, 'A IA está sobrecarregada agora. Tente de novo em alguns instantes.'],
  recusa: [422, 'A IA não conseguiu responder a esta mensagem.'],
  pedido: [502, 'A IA não aceitou o pedido. Tente de novo em instantes.'],
  tempo: [504, 'A IA demorou demais para responder. Tente de novo.'],
};
const erroDoTipo = (tipo) => new ErroProvedor(tipo, MENSAGENS[tipo][0], MENSAGENS[tipo][1]);

/** Traduz o status HTTP do provedor (e uma pista do corpo) para um tipo de erro. */
export function tipoDeStatus(status, corpo = '') {
  // O Gemini responde 400 (e não 401) para chave inválida.
  if (/api[ _-]?key not valid|API_KEY_INVALID|invalid[ _-]?(x-)?api[ _-]?key/i.test(corpo)) return 'chave';
  // 429 é quase sempre "devagar" (o Gemini gratuito tem limite por minuto e diz "quota" na mensagem).
  // Só é falta de crédito quando o provedor diz isso: sem saldo (OpenAI) ou limite do dia esgotado.
  if (status === 429) return /insufficient_quota|credit balance|PerDay|per day|daily/i.test(corpo) ? 'credito' : 'limite';
  if (status !== 401 && /credit|quota|billing|insufficient|exceeded your current/i.test(corpo)) return 'credito';
  if (status === 401 || status === 403) return 'chave';
  if (status === 404) return 'modelo';
  if (status === 429) return 'limite';
  if (status >= 500) return 'sobrecarga';
  return 'pedido';
}

// --- Leitor de SSE (incremental, aguenta pedaços cortados no meio da linha) ---

/** Lê o corpo de uma resposta SSE e devolve `{ evento, dados }` a cada evento completo. */
export async function* eventosSse(corpo) {
  const decodificador = new TextDecoder();
  let resto = '';
  let evento = '';
  let dados = [];
  const terminador = /\r\n|\n|\r/;
  // Devolve o evento pronto quando a linha é vazia; senão acumula o campo.
  const linha = (texto) => {
    if (texto === '') {
      const pronto = dados.length ? { evento, dados: dados.join('\n') } : null;
      evento = '';
      dados = [];
      return pronto;
    }
    if (texto.startsWith(':')) return null; // comentário/keep-alive
    const i = texto.indexOf(':');
    const campo = i < 0 ? texto : texto.slice(0, i);
    let valor = i < 0 ? '' : texto.slice(i + 1);
    if (valor.startsWith(' ')) valor = valor.slice(1);
    if (campo === 'event') evento = valor;
    else if (campo === 'data') dados.push(valor);
    return null;
  };
  const consumir = function* (fim) {
    for (;;) {
      const m = terminador.exec(resto);
      if (!m) return;
      // Um "\r" no fim do texto pode ser o começo de um "\r\n": espera o próximo pedaço.
      if (m[0] === '\r' && m.index === resto.length - 1 && !fim) return;
      const pronto = linha(resto.slice(0, m.index));
      resto = resto.slice(m.index + m[0].length);
      if (pronto) yield pronto;
    }
  };
  for await (const pedaco of corpo) {
    resto += decodificador.decode(pedaco, { stream: true });
    yield* consumir(false);
  }
  resto += decodificador.decode();
  yield* consumir(true);
  if (resto) {
    const pronto = linha(resto);
    if (pronto) yield pronto;
  }
  const ultimo = linha('');
  if (ultimo) yield ultimo;
}

// --- Provedores: pedido e leitura de eventos ---

const juntarMesmoPapel = (historico) => {
  const saida = [];
  for (const m of historico) {
    const ultimo = saida[saida.length - 1];
    if (ultimo && ultimo.papel === m.papel) ultimo.texto += '\n\n' + m.texto;
    else saida.push({ papel: m.papel, texto: m.texto });
  }
  while (saida.length && saida[0].papel !== 'usuario') saida.shift();
  return saida;
};

const lerJson = (texto) => {
  try {
    return JSON.parse(texto);
  } catch {
    return undefined;
  }
};

export const PROVEDORES = {
  gemini: {
    pedido: ({ chave, modelo, sistema, historico }) => ({
      url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:streamGenerateContent?alt=sse`,
      cabecalhos: { 'Content-Type': 'application/json', 'x-goog-api-key': chave },
      // Sem temperature/topP/topK: são ignorados nos modelos novos.
      corpo: {
        systemInstruction: { parts: [{ text: sistema }] },
        contents: historico.map((m) => ({ role: m.papel === 'usuario' ? 'user' : 'model', parts: [{ text: m.texto }] })),
        generationConfig: { maxOutputTokens: MAX_TOKENS },
      },
    }),
    evento: (e) => {
      const d = lerJson(e.dados);
      if (!d) return {};
      if (d.error) throw erroDoTipo(tipoDeStatus(Number(d.error.code) || 500, String(d.error.message ?? '')));
      const saida = {};
      if (d.promptFeedback?.blockReason) saida.recusa = true;
      const candidato = d.candidates?.[0];
      const texto = (candidato?.content?.parts ?? [])
        .filter((p) => !p.thought && typeof p.text === 'string')
        .map((p) => p.text)
        .join('');
      if (texto) saida.texto = texto;
      const fim = candidato?.finishReason;
      if (fim && /SAFETY|PROHIBITED|BLOCKLIST|SPII/.test(fim)) saida.recusa = true;
      return saida;
    },
  },
  openai: {
    pedido: ({ chave, modelo, sistema, historico }) => ({
      url: 'https://api.openai.com/v1/responses',
      cabecalhos: { 'Content-Type': 'application/json', Authorization: `Bearer ${chave}` },
      corpo: {
        model: modelo,
        instructions: sistema,
        input: historico.map((m) => ({ role: m.papel === 'usuario' ? 'user' : 'assistant', content: m.texto })),
        max_output_tokens: MAX_TOKENS,
        stream: true,
        // Não deixa a conversa guardada por 30 dias na OpenAI.
        store: false,
      },
    }),
    evento: (e) => {
      const d = lerJson(e.dados);
      if (!d) return {};
      const tipo = d.type ?? e.evento;
      if (tipo === 'response.output_text.delta' && typeof d.delta === 'string') return { texto: d.delta };
      if (tipo === 'response.refusal.delta' || tipo === 'response.refusal.done') return { recusa: true };
      if (tipo === 'response.incomplete' && d.response?.incomplete_details?.reason === 'content_filter') return { recusa: true };
      if (tipo === 'error' || tipo === 'response.failed') {
        const erro = d.error ?? d.response?.error ?? {};
        const codigo = String(erro.code ?? erro.type ?? '');
        if (/invalid_api_key|authentication/.test(codigo)) throw erroDoTipo('chave');
        if (/insufficient_quota|billing/.test(codigo)) throw erroDoTipo('credito');
        if (/rate_limit/.test(codigo)) throw erroDoTipo('limite');
        if (/model_not_found/.test(codigo)) throw erroDoTipo('modelo');
        throw erroDoTipo('sobrecarga');
      }
      return {};
    },
  },
  claude: {
    pedido: ({ chave, modelo, sistema, historico }) => ({
      url: 'https://api.anthropic.com/v1/messages',
      cabecalhos: { 'Content-Type': 'application/json', 'x-api-key': chave, 'anthropic-version': VERSAO_ANTHROPIC },
      // Sem temperature/top_p/top_k: a versão 2026-10-21 responde 400.
      corpo: {
        model: modelo,
        system: sistema,
        messages: historico.map((m) => ({ role: m.papel === 'usuario' ? 'user' : 'assistant', content: m.texto })),
        max_tokens: MAX_TOKENS,
        stream: true,
      },
    }),
    evento: (e) => {
      const d = lerJson(e.dados);
      if (!d) return {};
      const tipo = d.type ?? e.evento;
      if (tipo === 'content_block_delta' && d.delta?.type === 'text_delta' && typeof d.delta.text === 'string') return { texto: d.delta.text };
      if (tipo === 'message_delta' && d.delta?.stop_reason === 'refusal') return { recusa: true };
      if (tipo === 'error') {
        const t = String(d.error?.type ?? '');
        const m = String(d.error?.message ?? '');
        if (/credit|billing/i.test(m)) throw erroDoTipo('credito');
        if (/authentication|permission/.test(t)) throw erroDoTipo('chave');
        if (/rate_limit/.test(t)) throw erroDoTipo('limite');
        if (/not_found/.test(t)) throw erroDoTipo('modelo');
        if (/invalid_request/.test(t)) throw erroDoTipo('pedido');
        throw erroDoTipo('sobrecarga');
      }
      return {};
    },
  },
};

const IP_PRIVADO = /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|f[cd][0-9a-f]{2}:|fe80:)/i;

/**
 * IP de quem chamou, para contar tentativas com código errado. O começo de X-Forwarded-For é
 * escrito pelo próprio cliente (dá para inventar um a cada pedido); o fim é escrito pelos proxies.
 * Por isso vale o último endereço público da lista, lido da direita para a esquerda.
 */
export function ipDoCliente(encaminhado, remoto = '', cloudflare = '') {
  // O Render fica atrás da Cloudflare, que escreve CF-Connecting-IP com o IP real (o cliente não
  // consegue trocá-lo). Sem ele, cai na leitura de X-Forwarded-For abaixo.
  const cf = String(cloudflare ?? '').trim();
  if (cf) return cf;
  const lista = String(encaminhado ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  for (let i = lista.length - 1; i >= 0; i--) if (!IP_PRIVADO.test(lista[i])) return lista[i];
  return lista[0] || remoto || '';
}

/** Valida o corpo de /conversa. Devolve `{ sistema, historico }` ou `null`. */
export function validarPedido(dados) {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return null;
  const { sistema, historico } = dados;
  if (typeof sistema !== 'string' || !sistema.trim() || sistema.length > LIMITE_SISTEMA) return null;
  if (!Array.isArray(historico) || historico.length === 0 || historico.length > LIMITE_MENSAGENS) return null;
  for (const m of historico) {
    if (!m || (m.papel !== 'usuario' && m.papel !== 'ia')) return null;
    if (typeof m.texto !== 'string' || !m.texto.trim() || m.texto.length > LIMITE_TEXTO) return null;
  }
  const limpo = juntarMesmoPapel(historico);
  if (limpo.length === 0 || limpo[limpo.length - 1].papel !== 'usuario') return null;
  return { sistema, historico: limpo };
}

/**
 * Cria o servidor HTTP.
 * - `publico` (o Render define PORT): aceita qualquer host, mas exige `APP_TOKEN` para /conversa.
 * - Sem `publico`: só atende o próprio computador (loopback); o código é opcional.
 * O servidor sobe mesmo sem `token` ou `chave`: assim o deploy não falha antes de colar as variáveis.
 */
export function criarServico({
  provedor = 'gemini',
  chave,
  modelo,
  token,
  modeloReserva,
  publico = false,
  consultar = fetch,
  esperar = esperarPadrao,
  registrar = console.warn,
} = {}) {
  const adaptador = PROVEDORES[provedor];
  const modeloFinal = modelo || MODELOS_PADRAO[provedor];
  // IA_MODELO_RESERVA="nenhum" desliga a troca automática.
  const reservaFinal = modeloReserva === 'nenhum' ? undefined : modeloReserva || (provedor === 'gemini' ? RESERVAS[modeloFinal] : undefined);
  const configurado = Boolean(adaptador && chave);
  let emUso = 0;
  // Tentativas com código errado por IP: depois de 10 em 15 minutos, recusa sem nem comparar.
  const erros = new Map();
  const bloqueado = (ip) => {
    const e = erros.get(ip);
    return Boolean(e && Date.now() - e.inicio < JANELA_MS && e.vezes >= TENTATIVAS_ERRADAS);
  };
  const falhou = (ip) => {
    const e = erros.get(ip);
    if (!e || Date.now() - e.inicio >= JANELA_MS) erros.set(ip, { inicio: Date.now(), vezes: 1 });
    else e.vezes++;
    // Limite de memória sem apagar o bloqueio de todo mundo: tira primeiro o que já venceu,
    // depois os registros mais antigos (o Map guarda a ordem de inserção).
    if (erros.size > 5000) {
      for (const [chaveIp, registro] of erros) if (Date.now() - registro.inicio >= JANELA_MS) erros.delete(chaveIp);
      for (const chaveIp of erros.keys()) {
        if (erros.size <= 4000) break;
        erros.delete(chaveIp);
      }
    }
  };

  const servidor = createServer(async (req, res) => {
    const enviar = (status, dados) => {
      if (res.headersSent) return res.end();
      res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      return res.end(JSON.stringify(dados));
    };
    const ip = ipDoCliente(req.headers['x-forwarded-for'], req.socket.remoteAddress, req.headers['cf-connecting-ip']);
    // Fora do Render, só o próprio computador.
    if (!publico && !/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(req.headers.host ?? '')) return enviar(403, {});
    // Navegadores só podem chamar a partir do app aberto em localhost; o app nativo não manda Origin.
    const origin = req.headers.origin;
    if (origin && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return enviar(403, {});
    if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Mare, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
      return enviar(204, {});
    }
    const saude = req.url === '/saude' && req.method === 'GET';
    const conversa = req.url === '/conversa';
    if (!saude && !conversa) return enviar(404, {});

    // Em modo público sem APP_TOKEN (ou com um curto demais, fácil de adivinhar), ninguém é autorizado.
    if (conversa && publico && (!token || token.length < 24)) {
      return enviar(503, {
        erro: token ? 'O APP_TOKEN do servidor é curto demais: use 24 caracteres ou mais.' : 'O servidor está sem APP_TOKEN. Defina o código de acesso no painel do Render.',
        tipo: 'servidorConfig',
      });
    }
    if (token && bloqueado(ip)) {
      return enviar(429, { erro: 'Muitas tentativas com código errado. Aguarde 15 minutos.', tipo: 'tentativas' });
    }
    const enviado = req.headers.authorization;
    const liberado = token ? autorizado(enviado, token) : !publico;
    // Só conta como tentativa quem mandou algum código; a verificação de saúde do Render não manda.
    if (token && !liberado && enviado) falhou(ip);
    // Verificação de saúde e botão "Testar conexão". Sem código válido, só diz "estou no ar".
    if (saude) {
      return enviar(200, liberado ? { ok: true, autorizado: true, configurado, provedor, modelo: modeloFinal, reserva: reservaFinal ?? null } : { ok: true, autorizado: false });
    }
    if (!liberado) return enviar(401, { erro: 'Código de acesso recusado.', tipo: 'codigo' });
    if (req.method !== 'POST' || !/^application\/json/.test(req.headers['content-type'] ?? '') || req.headers['x-mare'] !== 'conversa') {
      return enviar(415, {});
    }
    if (!configurado) {
      const erro = adaptador ? 'O servidor está sem IA_CHAVE: configure IA_CHAVE no painel do Render.' : 'IA_PROVEDOR inválido: use gemini, openai ou claude.';
      return enviar(503, { erro, tipo: 'servidorConfig' });
    }
    if (emUso >= SIMULTANEAS) return enviar(429, { erro: 'O servidor está ocupado agora. Tente de novo em instantes.', tipo: 'limite' });

    emUso++;
    const controle = new AbortController();
    // Se o app desistir (ou a internet cair), para de gastar a chave.
    res.on('close', () => controle.abort());
    const sinal = AbortSignal.any([controle.signal, AbortSignal.timeout(PRAZO_PROVEDOR_MS)]);
    try {
      let tamanho = 0;
      const partes = [];
      for await (const parte of req) {
        tamanho += parte.length;
        if (tamanho > LIMITE_CORPO) return enviar(413, { erro: 'Pedido grande demais.', tipo: 'pedido' });
        partes.push(parte);
      }
      const pedido = validarPedido(lerJson(Buffer.concat(partes).toString('utf8')));
      if (!pedido) return enviar(400, { erro: 'Pedido inválido.', tipo: 'pedido' });

      const chamarCom = (m) => {
        const { url, cabecalhos, corpo } = adaptador.pedido({ chave, modelo: m, ...pedido });
        return consultar(url, { method: 'POST', headers: cabecalhos, body: JSON.stringify(corpo), signal: sinal });
      };
      const chamar = () => chamarCom(modeloFinal);
      // Provedor sobrecarregado (500/503) costuma passar em segundos: tenta de novo antes do primeiro byte.
      let resposta = await chamar();
      for (let extra = 2, espera = 1500; extra > 0 && (resposta.status === 503 || resposta.status === 500); extra--, espera *= 2) {
        registrar(`Provedor ocupado (HTTP ${resposta.status}), tentando de novo`);
        await resposta.body?.cancel().catch(() => undefined);
        await esperar(espera);
        resposta = await chamar();
      }
      if (!resposta.ok && reservaFinal) {
        // No limite (do minuto ou do dia) ou fora do ar: a mesma pergunta vai para o modelo de reserva.
        const pista = (await resposta.text().catch(() => '')).slice(0, 600);
        const tipo = tipoDeStatus(resposta.status, pista);
        if (['limite', 'credito', 'modelo', 'sobrecarga'].includes(tipo)) {
          registrar(`Modelo principal indisponível (${tipo}), usando o de reserva`);
          resposta = await chamarCom(reservaFinal);
        } else {
          resposta = new Response(pista, { status: resposta.status });
        }
      }
      if (!resposta.ok) {
        // Só o código e a pista do erro, nunca a chave nem o conteúdo enviado.
        const pista = (await resposta.text().catch(() => '')).slice(0, 600);
        const erro = erroDoTipo(tipoDeStatus(resposta.status, pista));
        registrar(`Provedor recusou: HTTP ${resposta.status} (${erro.tipo})`);
        return enviar(erro.status, { erro: erro.message, tipo: erro.tipo });
      }

      // Só abre a resposta quando chega o primeiro texto: até lá ainda dá para devolver um erro claro.
      let recusa = false;
      let comecou = false;
      for await (const e of eventosSse(resposta.body)) {
        const r = adaptador.evento(e);
        if (r.recusa) recusa = true;
        if (!r.texto) continue;
        if (!comecou) {
          comecou = true;
          res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            'X-Accel-Buffering': 'no',
          });
        }
        res.write(r.texto);
      }
      if (!comecou) {
        const erro = erroDoTipo(recusa ? 'recusa' : 'sobrecarga');
        return enviar(erro.status, { erro: erro.message, tipo: erro.tipo });
      }
      res.end();
    } catch (e) {
      const erro = e instanceof ErroProvedor ? e : erroDoTipo(sinal.aborted && !controle.signal.aborted ? 'tempo' : 'sobrecarga');
      registrar(`Falha ao consultar o provedor: ${erro.tipo}`);
      // Já começou a mandar texto: derruba a conexão, para o app não tomar a resposta cortada por completa.
      if (res.headersSent) res.destroy();
      else enviar(erro.status, { erro: erro.message, tipo: erro.tipo });
    } finally {
      emUso--;
    }
  });
  // Conexões lentas de propósito não prendem o servidor.
  servidor.headersTimeout = 15_000;
  servidor.requestTimeout = 120_000;
  // O proxy do Render reaproveita conexões por mais tempo que os 5 s padrão do Node: com o padrão,
  // o primeiro pedido depois de uma pausa às vezes cai numa conexão já fechada (502 esporádico).
  servidor.keepAliveTimeout = 120_000;
  return servidor;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // Espaços e quebras de linha vêm junto quando se cola a chave no painel.
  const limpar = (nome) => process.env[nome]?.trim().replace(/^["']|["']$/g, '');
  const provedor = (limpar('IA_PROVEDOR') || 'gemini').toLowerCase();
  const chave = limpar('IA_CHAVE');
  const token = limpar('APP_TOKEN');
  const PORT = process.env.PORT;
  // O Render define PORT: aí o serviço fica público e só atende /conversa com código de acesso.
  const publico = Boolean(PORT);
  if (!PROVEDORES[provedor]) console.warn('IA_PROVEDOR inválido: use gemini, openai ou claude.');
  if (!chave) console.warn('IA_CHAVE não definida: a conversa fica indisponível até você configurá-la.');
  if (publico && !token) console.warn('APP_TOKEN não definido: a conversa fica recusada até você definir o código de acesso.');
  if (token && token.length < 24) console.warn('APP_TOKEN curto: a conversa fica recusada até ter 24 caracteres ou mais.');
  // Um erro inesperado não derruba o servidor sem deixar rastro (o conteúdo nunca vai para o log).
  process.on('unhandledRejection', (e) => console.warn('Erro inesperado:', e instanceof Error ? e.name : typeof e));
  const porta = Number(PORT) || 8787;
  const host = publico ? '0.0.0.0' : '127.0.0.1';
  criarServico({
    provedor,
    chave,
    modelo: limpar('IA_MODELO') || undefined,
    modeloReserva: limpar('IA_MODELO_RESERVA') || undefined,
    token: token || undefined,
    publico,
  }).listen(porta, host, () =>
    console.log(`Maré IA disponível em ${host}:${porta}`),
  );
}
