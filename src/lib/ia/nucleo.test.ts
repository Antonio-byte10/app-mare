import { describe, expect, it, vi } from 'vitest';
import type { AjustesIa } from '../tipos';
import { mensagemDoErro } from './erros';
import { MAX_CARACTERES_HISTORICO, MAX_CARACTERES_MENSAGEM, prepararHistorico } from './historico';
import { INSTRUCAO_SISTEMA, montarSistema } from './instrucoes';
import { conversarCom, type DependenciasConversa } from './nucleo';
import { enderecoValido, normalizarEndereco, testarServidor } from './servidor';
import type { Buscar, Mensagem, RespostaHttp } from './tipos';

const codificador = new TextEncoder();
const corpoDe = (pedacos: string[]) => {
  let i = 0;
  return {
    getReader: () => ({
      read: async () => (i < pedacos.length ? { done: false, value: codificador.encode(pedacos[i++]!) } : { done: true }),
    }),
  };
};
const resposta = (pedacos: string[], status = 200, texto = ''): RespostaHttp => ({
  ok: status >= 200 && status < 300,
  status,
  body: corpoDe(pedacos),
  text: async () => texto,
  json: async () => JSON.parse(texto),
});

const GEMINI = [
  'data: {"candidates":[{"content":{"parts":[{"text":"Oi, "}]}}]}\n\n',
  'data: {"candidates":[{"content":{"parts":[{"text":"estou aqui."}]},"finishReason":"STOP"}]}\n\n',
];

const direto = (provedor: AjustesIa['provedor'] = 'gemini'): AjustesIa => ({ provedor, modo: 'direto', modelo: 'm', avisoVisto: true });
const servidor: AjustesIa = {
  provedor: 'gemini',
  modo: 'servidor',
  modelo: 'm',
  endereco: 'https://mare-ia.onrender.com/',
  avisoVisto: true,
};
const historico: Mensagem[] = [{ papel: 'usuario', texto: 'Oi' }];

const deps = (buscar: Buscar, extra: Partial<DependenciasConversa> = {}): DependenciasConversa => ({
  buscar,
  lerChave: async () => 'chave-1',
  lerCodigoServidor: async () => 'codigo-1',
  ...extra,
});

describe('conversarCom (modo direto)', () => {
  it('Gemini 3.5 Flash Lite no limite: tenta o 3.1 Flash Lite com a mesma pergunta', async () => {
    const buscar = vi.fn<Buscar>(async (url) =>
      url.includes('gemini-3.5-flash-lite') ? resposta([], 429, '{"error":{"code":429,"message":"quota"}}') : resposta(GEMINI),
    );
    const ajustes = { ...direto(), modelo: 'gemini-3.5-flash-lite' };
    const r = await conversarCom({ ajustes, historico }, deps(buscar));
    expect(r).toEqual({ texto: 'Oi, estou aqui.', fim: 'ok' });
    expect(buscar.mock.calls.map((c) => c[0].match(/models\/([^:]+)/)?.[1])).toEqual([
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
    ]);
  });

  it('o 3.1 escolhido também tem o 3.5 de reserva; chave recusada não troca', async () => {
    const limite = vi.fn<Buscar>(async (url) => (url.includes('gemini-3.1-flash-lite') ? resposta([], 503) : resposta(GEMINI)));
    const r = await conversarCom({ ajustes: { ...direto(), modelo: 'gemini-3.1-flash-lite' }, historico }, deps(limite));
    expect(r.fim).toBe('ok');
    const chave = vi.fn<Buscar>(async () => resposta([], 401));
    const r2 = await conversarCom({ ajustes: { ...direto(), modelo: 'gemini-3.5-flash-lite' }, historico }, deps(chave));
    expect(r2).toMatchObject({ fim: 'erro', tipoErro: 'chave' });
    expect(chave).toHaveBeenCalledTimes(1);
  });

  it('outros modelos não têm reserva', async () => {
    const buscar = vi.fn<Buscar>(async () => resposta([], 429));
    const r = await conversarCom({ ajustes: direto(), historico }, deps(buscar));
    expect(r).toMatchObject({ fim: 'erro', tipoErro: 'limite' });
    expect(buscar).toHaveBeenCalledTimes(1);
  });

  it('devolve o texto, chama aoTexto com o acumulado e usa a instrução de sistema com o contexto', async () => {
    const buscar = vi.fn<Buscar>(async () => resposta(GEMINI));
    const vistos: string[] = [];
    const r = await conversarCom(
      { ajustes: direto(), historico, contexto: '- Hábito: álcool.', aoTexto: (t) => vistos.push(t) },
      deps(buscar),
    );
    expect(r).toEqual({ texto: 'Oi, estou aqui.', fim: 'ok' });
    expect(vistos).toEqual(['Oi, ', 'Oi, estou aqui.']);
    const corpo = JSON.parse(buscar.mock.calls[0]![1].body!);
    expect(corpo.systemInstruction.parts[0].text).toBe(montarSistema('- Hábito: álcool.'));
    expect(corpo.systemInstruction.parts[0].text).toContain(INSTRUCAO_SISTEMA);
  });

  it('manda no máximo as últimas 30 mensagens, começando por uma da pessoa', async () => {
    const buscar = vi.fn<Buscar>(async () => resposta(GEMINI));
    const longo: Mensagem[] = Array.from({ length: 46 }, (_, i) => ({ papel: i % 2 === 0 ? 'usuario' : 'ia', texto: `m${i}` }));
    longo.push({ papel: 'usuario', texto: 'ultima' });
    await conversarCom({ ajustes: direto(), historico: longo }, deps(buscar));
    const contents = JSON.parse(buscar.mock.calls[0]![1].body!).contents;
    expect(contents.length).toBeLessThanOrEqual(30);
    expect(contents[0].role).toBe('user');
    expect(contents.at(-1).parts[0].text).toBe('ultima');
  });

  it('sem chave guardada: erro gentil de chave, sem chamar a rede', async () => {
    const buscar = vi.fn<Buscar>();
    const r = await conversarCom({ ajustes: direto(), historico }, deps(buscar, { lerChave: async () => null }));
    expect(r).toMatchObject({ fim: 'erro', erro: mensagemDoErro('chave') });
    expect(buscar).not.toHaveBeenCalled();
  });

  it('chave inválida (401): erro gentil, sem texto técnico', async () => {
    const r = await conversarCom({ ajustes: direto('claude'), historico }, deps(async () => resposta([], 401, '{"error":"x"}')));
    expect(r.fim).toBe('erro');
    expect(r.erro).toBe(mensagemDoErro('chave'));
    expect(r.erro).not.toMatch(/401|HTTP|json|error/i);
    expect(r.oferecerRespiro).toBe(true);
  });

  it('sem internet: erro de rede gentil', async () => {
    const r = await conversarCom(
      { ajustes: direto(), historico },
      deps(async () => {
        throw new TypeError('Network request failed');
      }),
    );
    expect(r).toMatchObject({ fim: 'erro', erro: mensagemDoErro('rede') });
  });

  it('SAFETY: fim "recusa" com mensagem gentil', async () => {
    const r = await conversarCom(
      { ajustes: direto(), historico },
      deps(async () => resposta(['data: {"candidates":[{"finishReason":"SAFETY"}]}\n\n'])),
    );
    expect(r).toMatchObject({ fim: 'recusa', erro: mensagemDoErro('recusa'), texto: '' });
  });

  it('resposta sem texto: erro "vazio"', async () => {
    const r = await conversarCom({ ajustes: direto(), historico }, deps(async () => resposta([])));
    expect(r).toMatchObject({ fim: 'erro', erro: mensagemDoErro('vazio') });
  });

  it('histórico vazio não chama a rede', async () => {
    const buscar = vi.fn<Buscar>();
    const r = await conversarCom({ ajustes: direto(), historico: [{ papel: 'ia', texto: 'sozinha' }] }, deps(buscar));
    expect(r.fim).toBe('erro');
    expect(buscar).not.toHaveBeenCalled();
  });

  it('estoura o prazo: erro de tempo', async () => {
    const buscar: Buscar = (_url, init) =>
      new Promise((_ok, falha) => {
        init.signal?.addEventListener('abort', () => falha(Object.assign(new Error('abortado'), { name: 'AbortError' })));
      });
    const r = await conversarCom({ ajustes: direto(), historico }, deps(buscar, { prazoDiretoMs: 20 }));
    expect(r).toMatchObject({ fim: 'erro', erro: mensagemDoErro('tempo') });
  });

  it('cancelar pelo sinal interrompe a conversa', async () => {
    const buscar: Buscar = (_url, init) =>
      new Promise((_ok, falha) => {
        const abortar = () => falha(Object.assign(new Error('abortado'), { name: 'AbortError' }));
        if (init.signal?.aborted) abortar();
        else init.signal?.addEventListener('abort', abortar);
      });
    const controle = new AbortController();
    const promessa = conversarCom({ ajustes: direto(), historico, sinal: controle.signal }, deps(buscar));
    controle.abort();
    expect((await promessa).fim).toBe('erro');
  });
});

describe('conversarCom (modo servidor)', () => {
  it('manda sistema e histórico ao /conversa com o código e lê texto puro', async () => {
    const buscar = vi.fn<Buscar>(async () => resposta(['Olá, ', 'tudo bem?']));
    const r = await conversarCom({ ajustes: servidor, historico }, deps(buscar));
    expect(r).toEqual({ texto: 'Olá, tudo bem?', fim: 'ok' });
    const [url, init] = buscar.mock.calls[0]!;
    expect(url).toBe('https://mare-ia.onrender.com/conversa');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer codigo-1', 'X-Mare': 'conversa', 'Content-Type': 'application/json' });
    const corpo = JSON.parse(init.body!);
    expect(corpo.historico).toEqual(historico);
    expect(corpo.sistema).toContain(INSTRUCAO_SISTEMA);
    expect(Object.keys(corpo).sort()).toEqual(['historico', 'sistema']);
  });

  it('usa o "tipo" que o servidor devolve', async () => {
    const r = await conversarCom(
      { ajustes: servidor, historico },
      deps(async () => resposta([], 503, '{"erro":"sem chave","tipo":"servidorConfig"}')),
    );
    expect(r.erro).toBe(mensagemDoErro('servidorConfig'));
    expect(r.oferecerRespiro).toBe(false);
  });

  it('401 do servidor: código não confere; 422 recusa', async () => {
    const a = await conversarCom({ ajustes: servidor, historico }, deps(async () => resposta([], 401, '{"erro":"x","tipo":"codigo"}')));
    expect(a.erro).toBe(mensagemDoErro('codigo'));
    const b = await conversarCom({ ajustes: servidor, historico }, deps(async () => resposta([], 422, '{"erro":"x","tipo":"recusa"}')));
    expect(b.fim).toBe('recusa');
  });

  it('página de erro do Render enquanto acorda (HTML) vira sobrecarga, não texto técnico', async () => {
    const r = await conversarCom({ ajustes: servidor, historico }, deps(async () => resposta([], 502, '<html>Bad Gateway</html>')));
    expect(r.fim).toBe('erro');
    expect(r.erro).toBe(mensagemDoErro('sobrecarga'));
  });

  it('sem código guardado: erro de código', async () => {
    const buscar = vi.fn<Buscar>();
    const r = await conversarCom({ ajustes: servidor, historico }, deps(buscar, { lerCodigoServidor: async () => null }));
    expect(r.erro).toBe(mensagemDoErro('codigo'));
    expect(buscar).not.toHaveBeenCalled();
  });
});

describe('testarServidor', () => {
  const saude = (dados: unknown, status = 200): Buscar => async () => resposta([], status, JSON.stringify(dados));
  const op = { endereco: 'https://mare-ia.onrender.com', codigo: 'c' };

  it('valida o endereço: só HTTPS', async () => {
    expect(enderecoValido('https://mare-ia.onrender.com')).toBe(true);
    expect(enderecoValido('  https://mare-ia.onrender.com/ ')).toBe(true);
    expect(enderecoValido('http://mare-ia.onrender.com')).toBe(false);
    expect(enderecoValido('mare-ia.onrender.com')).toBe(false);
    expect(enderecoValido('https://')).toBe(false);
    expect(normalizarEndereco(' https://x.onrender.com// ')).toBe('https://x.onrender.com');
    const r = await testarServidor({ buscar: vi.fn(), endereco: 'http://x', codigo: 'c' });
    expect(r.ok).toBe(false);
    expect(r.mensagem).toContain('https://');
  });

  it('conexão ok informa provedor e modelo', async () => {
    const r = await testarServidor({
      ...op,
      buscar: saude({ ok: true, autorizado: true, configurado: true, provedor: 'gemini', modelo: 'gemini-3.5-flash-lite' }),
    });
    expect(r).toMatchObject({ ok: true, provedor: 'gemini', modelo: 'gemini-3.5-flash-lite' });
  });

  it('código não confere', async () => {
    const r = await testarServidor({ ...op, buscar: saude({ ok: true, autorizado: false }) });
    expect(r.ok).toBe(false);
    expect(r.mensagem).toContain('código de acesso não confere');
  });

  it('sem IA_CHAVE no servidor', async () => {
    const r = await testarServidor({ ...op, buscar: saude({ ok: true, autorizado: true, configurado: false }) });
    expect(r.mensagem).toContain('IA_CHAVE');
  });

  it('servidor ainda acordando (502) e endereço que não é do Maré', async () => {
    expect((await testarServidor({ ...op, buscar: saude({}, 502) })).mensagem).toContain('1 minuto para acordar');
    expect((await testarServidor({ ...op, buscar: saude({ qualquer: 1 }) })).mensagem).toContain('não parece ser um servidor do Maré');
  });

  it('sem internet ou demora: mensagem com o aviso do servidor gratuito', async () => {
    const r = await testarServidor({
      ...op,
      buscar: async () => {
        throw new TypeError('falhou');
      },
    });
    expect(r.ok).toBe(false);
    expect(r.mensagem).toContain('1 minuto para acordar');
  });

  it('não manda código quando o campo está vazio', async () => {
    const buscar = vi.fn<Buscar>(saude({ ok: true, autorizado: false }));
    await testarServidor({ buscar, endereco: op.endereco, codigo: ' ' });
    expect(buscar.mock.calls[0]![1].headers).toEqual({});
  });
});

describe('prepararHistorico', () => {
  it('junta mensagens seguidas, tira vazias e começa pela pessoa', () => {
    const h = prepararHistorico([
      { papel: 'ia', texto: 'solta' },
      { papel: 'usuario', texto: 'a' },
      { papel: 'usuario', texto: '  ' },
      { papel: 'usuario', texto: 'b' },
      { papel: 'ia', texto: 'c' },
    ]);
    expect(h).toEqual([
      { papel: 'usuario', texto: 'a\n\nb' },
      { papel: 'ia', texto: 'c' },
    ]);
  });
  it('corta mensagens enormes e larga as mais antigas para caber no limite do servidor', () => {
    const longa = (p: 'usuario' | 'ia', letra: string) => ({ papel: p, texto: letra.repeat(9000) });
    const h = prepararHistorico([longa('usuario', 'a'), longa('ia', 'b'), longa('usuario', 'c'), longa('ia', 'd'), longa('usuario', 'e')]);
    for (const m of h) expect(m.texto.length).toBeLessThanOrEqual(MAX_CARACTERES_MENSAGEM + 1);
    expect(h.reduce((s, m) => s + m.texto.length, 0)).toBeLessThanOrEqual(MAX_CARACTERES_HISTORICO + h.length);
    expect(h[0]!.papel).toBe('usuario');
    expect(h[h.length - 1]!.texto.endsWith('e')).toBe(true);
  });
});

describe('instrução de sistema', () => {
  it('traz os limites combinados na spec 8.4', () => {
    expect(INSTRUCAO_SISTEMA).toMatch(/Entrevista Motivacional/);
    expect(INSTRUCAO_SISTEMA).toMatch(/Nunca oriente dose, troca/);
    expect(INSTRUCAO_SISTEMA).toMatch(/psicólogo ou médico/);
    expect(INSTRUCAO_SISTEMA).toMatch(/188/);
    expect(INSTRUCAO_SISTEMA).toMatch(/192/);
    expect(INSTRUCAO_SISTEMA).toMatch(/inteligência artificial/);
    expect(INSTRUCAO_SISTEMA).toMatch(/Curtas/);
  });
});
