import { describe, expect, it } from 'vitest';
import {
  URL_VERSOES,
  compararVersoes,
  escolherMaisNova,
  lerVersao,
  procurarAtualizacao,
  type BuscarVersoes,
} from './atualizacao';

const cmp = (a: string, b: string) => compararVersoes(lerVersao(a)!, lerVersao(b)!);

describe('lerVersao', () => {
  it('aceita com e sem "v"', () => {
    expect(lerVersao('v0.4.0')).toEqual({ major: 0, minor: 4, patch: 0, pre: [] });
    expect(lerVersao('0.4.0')).toEqual({ major: 0, minor: 4, patch: 0, pre: [] });
  });
  it('lê pré-lançamento', () => {
    expect(lerVersao('v1.0.0-beta.1')).toEqual({ major: 1, minor: 0, patch: 0, pre: ['beta', '1'] });
  });
  it('recusa o que não é versão', () => {
    for (const t of ['', 'latest', 'v1', 'v1.2', 'v1.2.x', '01.2.3', 'v1.0.0-']) expect(lerVersao(t)).toBeNull();
  });
});

describe('compararVersoes', () => {
  it('compara números, não texto', () => {
    expect(cmp('0.10.0', '0.9.0')).toBeGreaterThan(0);
    expect(cmp('1.0.0', '0.99.99')).toBeGreaterThan(0);
    expect(cmp('0.4.1', '0.4.0')).toBeGreaterThan(0);
    expect(cmp('0.4.0', '0.4.0')).toBe(0);
    expect(cmp('0.3.9', '0.4.0')).toBeLessThan(0);
  });
  it('pré-lançamento vem antes da versão final', () => {
    expect(cmp('1.0.0-beta.1', '1.0.0')).toBeLessThan(0);
    expect(cmp('1.0.0', '1.0.0-rc.1')).toBeGreaterThan(0);
  });
  it('ordena pré-lançamentos entre si', () => {
    expect(cmp('1.0.0-beta.2', '1.0.0-beta.1')).toBeGreaterThan(0);
    expect(cmp('1.0.0-beta.10', '1.0.0-beta.2')).toBeGreaterThan(0);
    expect(cmp('1.0.0-rc.1', '1.0.0-beta.9')).toBeGreaterThan(0);
    expect(cmp('1.0.0-beta', '1.0.0-beta.1')).toBeLessThan(0);
    expect(cmp('1.0.0-1', '1.0.0-beta')).toBeLessThan(0);
  });
  it('um pré-lançamento de versão maior vence a final menor', () => {
    expect(cmp('1.0.0-beta.1', '0.4.0')).toBeGreaterThan(0);
  });
});

const lancamento = (tag: string, extra: Record<string, unknown> = {}) => ({
  tag_name: tag,
  html_url: `https://github.com/Antonio-byte10/app-mare/releases/tag/${tag}`,
  draft: false,
  prerelease: false,
  ...extra,
});

describe('escolherMaisNova', () => {
  it('pega a de maior versão, não a primeira da lista', () => {
    const r = escolherMaisNova([lancamento('v0.4.0'), lancamento('v0.10.0'), lancamento('v0.9.0')]);
    expect(r?.versao).toBe('0.10.0');
    expect(r?.url).toContain('v0.10.0');
  });
  it('considera betas marcados como pré-lançamento', () => {
    const r = escolherMaisNova([lancamento('v0.4.0'), lancamento('v1.0.0-beta.1', { prerelease: true })]);
    expect(r?.versao).toBe('1.0.0-beta.1');
  });
  it('ignora rascunhos e etiquetas que não são versão', () => {
    const r = escolherMaisNova([lancamento('v9.0.0', { draft: true }), lancamento('nightly'), lancamento('v0.5.0')]);
    expect(r?.versao).toBe('0.5.0');
  });
  it('ignora links fora do GitHub', () => {
    expect(escolherMaisNova([{ tag_name: 'v2.0.0', html_url: 'https://exemplo.com/x' }])).toBeNull();
  });
  it('lista vazia ou formato errado dá null', () => {
    expect(escolherMaisNova([])).toBeNull();
    expect(escolherMaisNova({})).toBeNull();
    expect(escolherMaisNova([null, 3, { tag_name: 4 }])).toBeNull();
  });
});

const resposta =
  (status: number, corpo: unknown): BuscarVersoes =>
  async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => corpo,
  });

describe('procurarAtualizacao', () => {
  it('pede /releases com per_page=10 e o cabeçalho do GitHub', async () => {
    let visto: { url: string; accept?: string } | undefined;
    await procurarAtualizacao('0.4.0', async (url, init) => {
      visto = { url, accept: init.headers.Accept };
      return { ok: true, status: 200, json: async () => [] };
    });
    expect(visto).toEqual({ url: URL_VERSOES, accept: 'application/vnd.github+json' });
    expect(URL_VERSOES).toContain('/releases?per_page=10');
    expect(URL_VERSOES).not.toContain('/latest');
  });
  it('mesma versão: está atualizado', async () => {
    expect(await procurarAtualizacao('0.4.0', resposta(200, [lancamento('v0.4.0')]))).toEqual({ tipo: 'atual', instalada: '0.4.0' });
  });
  it('instalada mais nova que a publicada: está atualizado', async () => {
    expect((await procurarAtualizacao('0.5.0', resposta(200, [lancamento('v0.4.0')]))).tipo).toBe('atual');
  });
  it('versão maior publicada: avisa', async () => {
    const r = await procurarAtualizacao('0.4.0', resposta(200, [lancamento('v0.4.0'), lancamento('v0.5.0')]));
    expect(r).toEqual({ tipo: 'nova', versao: '0.5.0', url: 'https://github.com/Antonio-byte10/app-mare/releases/tag/v0.5.0' });
  });
  it('quem está em beta vê a versão final', async () => {
    expect((await procurarAtualizacao('1.0.0-beta.1', resposta(200, [lancamento('v1.0.0')]))).tipo).toBe('nova');
  });
  it('quem está na final não é levado de volta ao beta', async () => {
    expect((await procurarAtualizacao('1.0.0', resposta(200, [lancamento('v1.0.0-beta.2')]))).tipo).toBe('atual');
  });
  it('sem internet', async () => {
    const falha: BuscarVersoes = async () => {
      throw new TypeError('Network request failed');
    };
    expect(await procurarAtualizacao('0.4.0', falha)).toEqual({ tipo: 'erro', motivo: 'rede' });
  });
  it('limite de pedidos (403 e 429)', async () => {
    expect(await procurarAtualizacao('0.4.0', resposta(403, {}))).toEqual({ tipo: 'erro', motivo: 'limite' });
    expect(await procurarAtualizacao('0.4.0', resposta(429, {}))).toEqual({ tipo: 'erro', motivo: 'limite' });
  });
  it('outros erros HTTP', async () => {
    expect(await procurarAtualizacao('0.4.0', resposta(500, {}))).toEqual({ tipo: 'erro', motivo: 'http' });
    expect(await procurarAtualizacao('0.4.0', resposta(404, {}))).toEqual({ tipo: 'erro', motivo: 'http' });
  });
  it('corpo que não é lista ou não é JSON', async () => {
    expect(await procurarAtualizacao('0.4.0', resposta(200, { message: 'x' }))).toEqual({ tipo: 'erro', motivo: 'formato' });
    const quebrado: BuscarVersoes = async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('x');
      },
    });
    expect(await procurarAtualizacao('0.4.0', quebrado)).toEqual({ tipo: 'erro', motivo: 'formato' });
  });
  it('nenhuma versão publicada', async () => {
    expect(await procurarAtualizacao('0.4.0', resposta(200, []))).toEqual({ tipo: 'erro', motivo: 'sem_versoes' });
  });
  it('versão instalada inválida', async () => {
    expect(await procurarAtualizacao('abc', resposta(200, []))).toEqual({ tipo: 'erro', motivo: 'formato' });
  });
  it('demora demais: aborta e trata como rede', async () => {
    const lento: BuscarVersoes = (_url, init) =>
      new Promise((_ok, falha) => init.signal.addEventListener('abort', () => falha(new Error('abortado'))));
    expect(await procurarAtualizacao('0.4.0', lento, 10)).toEqual({ tipo: 'erro', motivo: 'rede' });
  });
});
