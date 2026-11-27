import { describe, expect, it } from 'vitest';
import {
  abrirBackup,
  aplicarRestauracao,
  criarBackup,
  FORMATO_BACKUP,
  nomeDoBackup,
  paraBackup,
  resumoDoBackup,
  senhaValida,
} from './backup';
import { deBase64, paraBase64 } from './bytes';
import { estadoInicial, VERSAO_ESTADO, type EstadoPersistido } from './estado';

// Parâmetros leves: o scrypt de verdade (N = 2^15) é lento demais para cada teste.
const LEVE = { N: 2 ** 10, r: 8, p: 1 };
let contador = 0;
const aleatorio = (n: number) => Uint8Array.from({ length: n }, (_, i) => (i * 13 + ++contador) % 256);
const SENHA = 'uma senha longa e calma';

function estadoDeExemplo(): EstadoPersistido {
  const e = estadoInicial();
  return {
    ...e,
    habitos: [
      { id: 'h1', tipo: 'tabaco', apelido: 'Cigarro 🌊', cor: 'aqua', meta: { tipo: 'parar' }, inicio: '2026-03-12', criadoEm: 1 },
      { id: 'h2', tipo: 'alcool', apelido: 'Álcool', cor: 'peri', meta: { tipo: 'parar' }, inicio: '2026-05-01', criadoEm: 2 },
    ],
    relatos: [
      { dia: '2026-04-02', habitos: [{ habitoId: 'h1', vontade: 3, usou: false }], gatilhos: [], nota: 'Dia calmo, ação lenta.', salvoEm: 5 },
      { dia: '2026-04-03', habitos: [{ habitoId: 'h1', vontade: 5, usou: false }], gatilhos: [], salvoEm: 6 },
    ],
    ajustes: {
      ...e.ajustes,
      habitoAtivo: 'h1',
      onboardingConcluido: true,
      ia: { provedor: 'claude', modo: 'servidor', modelo: 'm', endereco: 'https://x.onrender.com', avisoVisto: true },
      bloqueio: { ligado: true, biometria: true, aposMinutos: 5, ondaLivre: false },
      disfarce: 'notas',
      protegerTela: true,
      lembretes: { relato: { ligado: true, hora: '21:00' }, bomDia: { ligado: false, hora: '08:00' }, antesDaOnda: true, marcos: true },
    },
  };
}

const criar = (e = estadoDeExemplo(), senha = SENHA) =>
  criarBackup(e, senha, { aleatorio, parametros: LEVE, agora: new Date('2026-11-26T12:00:00') });

describe('backup cifrado', () => {
  it('ida e volta: abre com a mesma senha e devolve os dados', async () => {
    const original = estadoDeExemplo();
    const { conteudo } = await criar(original);
    const r = await abrirBackup(conteudo, SENHA);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.estado.habitos).toEqual(original.habitos);
    expect(r.estado.relatos).toEqual(original.relatos);
    expect(r.estado.ajustes.lembretes).toEqual(original.ajustes.lembretes);
    expect(r.resumo).toMatchObject({ habitos: 2, relatos: 2, desde: '2026-03-12' });
  });

  it('o arquivo não deixa nada legível e não leva o que é do aparelho', async () => {
    const { conteudo } = await criar();
    expect(conteudo).not.toContain('Cigarro');
    expect(conteudo).not.toContain('onrender');
    const arq = JSON.parse(conteudo);
    expect(arq).toMatchObject({ app: 'mare', formato: FORMATO_BACKUP, kdf: { nome: 'scrypt' }, cifra: { nome: 'aes-256-gcm' } });
    const r = await abrirBackup(conteudo, SENHA);
    expect(r.ok && r.estado.ajustes.ia).toBeUndefined();
    expect(r.ok && r.estado.ajustes.bloqueio).toBeUndefined();
    expect(r.ok && r.estado.ajustes.disfarce).toBeUndefined();
    expect(r.ok && r.estado.ajustes.protegerTela).toBeUndefined();
  });

  it('cada backup usa sal e nonce novos', async () => {
    const a = JSON.parse((await criar()).conteudo);
    const b = JSON.parse((await criar()).conteudo);
    expect(a.kdf.sal).not.toBe(b.kdf.sal);
    expect(a.cifra.nonce).not.toBe(b.cifra.nonce);
    expect(a.dados).not.toBe(b.dados);
  });

  it('senha errada não abre', async () => {
    const { conteudo } = await criar();
    expect(await abrirBackup(conteudo, SENHA + 'x')).toEqual({ ok: false, motivo: 'senha' });
    expect(await abrirBackup(conteudo, '')).toEqual({ ok: false, motivo: 'senha' });
  });

  it('arquivo adulterado não abre (dados, nonce, data e parâmetros)', async () => {
    const { conteudo } = await criar();
    const arq = JSON.parse(conteudo);

    const bytes = deBase64(arq.dados)!;
    bytes[5] ^= 1;
    expect(await abrirBackup(JSON.stringify({ ...arq, dados: paraBase64(bytes) }), SENHA)).toEqual({ ok: false, motivo: 'senha' });

    const nonce = deBase64(arq.cifra.nonce)!;
    nonce[0] ^= 1;
    expect(await abrirBackup(JSON.stringify({ ...arq, cifra: { ...arq.cifra, nonce: paraBase64(nonce) } }), SENHA)).toEqual({ ok: false, motivo: 'senha' });

    expect(await abrirBackup(JSON.stringify({ ...arq, criadoEm: '2020-01-01T00:00:00.000Z' }), SENHA)).toEqual({ ok: false, motivo: 'senha' });
    expect(await abrirBackup(JSON.stringify({ ...arq, kdf: { ...arq.kdf, p: 2 } }), SENHA)).toEqual({ ok: false, motivo: 'senha' });
  });

  it('arquivo cortado ou que não é do Maré é "formato"', async () => {
    const { conteudo } = await criar();
    expect(await abrirBackup(conteudo.slice(0, 80), SENHA)).toEqual({ ok: false, motivo: 'formato' });
    expect(await abrirBackup('olá', SENHA)).toEqual({ ok: false, motivo: 'formato' });
    expect(await abrirBackup('{"app":"outro","formato":1}', SENHA)).toEqual({ ok: false, motivo: 'formato' });
    const arq = JSON.parse(conteudo);
    expect(await abrirBackup(JSON.stringify({ ...arq, dados: '' }), SENHA)).toEqual({ ok: false, motivo: 'formato' });
  });

  it('recusa parâmetros de custo exagerado (arquivo malicioso)', async () => {
    const arq = JSON.parse((await criar()).conteudo);
    for (const kdf of [{ ...arq.kdf, N: 2 ** 22 }, { ...arq.kdf, N: 1000 }, { ...arq.kdf, r: 64 }, { ...arq.kdf, p: 50 }, { ...arq.kdf, nome: 'md5' }]) {
      expect(await abrirBackup(JSON.stringify({ ...arq, kdf }), SENHA)).toEqual({ ok: false, motivo: 'formato' });
    }
  });

  it('formato de arquivo mais novo vira "versao_futura"', async () => {
    const arq = JSON.parse((await criar()).conteudo);
    expect(await abrirBackup(JSON.stringify({ ...arq, formato: FORMATO_BACKUP + 1 }), SENHA)).toEqual({ ok: false, motivo: 'versao_futura' });
  });

  it('estado de versão mais nova dentro do arquivo vira "versao_futura"', async () => {
    // Monta um arquivo válido, mas cujo conteúdo diz ser de uma versão futura do estado.
    const { gcm } = await import('@noble/ciphers/aes.js');
    const { scryptAsync } = await import('@noble/hashes/scrypt.js');
    const { paraUtf8 } = await import('./bytes');
    const sal = aleatorio(16);
    const nonce = aleatorio(12);
    const cab = {
      app: 'mare' as const,
      formato: 1,
      criadoEm: '2026-11-26T12:00:00.000Z',
      kdf: { nome: 'scrypt' as const, ...LEVE, sal: paraBase64(sal) },
      cifra: { nome: 'aes-256-gcm' as const, nonce: paraBase64(nonce) },
    };
    const aad = paraUtf8(['mare-backup', 1, cab.criadoEm, 'scrypt', LEVE.N, LEVE.r, LEVE.p, cab.kdf.sal, 'aes-256-gcm', cab.cifra.nonce].join('|'));
    const chave = await scryptAsync(SENHA.normalize('NFC'), sal, { ...LEVE, dkLen: 32 });
    const aberto = paraUtf8(JSON.stringify({ versaoEstado: VERSAO_ESTADO + 1, estado: estadoDeExemplo() }));
    const arquivo = { ...cab, dados: paraBase64(gcm(chave, nonce, aad).encrypt(aberto)) };
    expect(await abrirBackup(JSON.stringify(arquivo), SENHA)).toEqual({ ok: false, motivo: 'versao_futura' });

    const aberto2 = paraUtf8(JSON.stringify({ versaoEstado: VERSAO_ESTADO, estado: 'lixo' }));
    const arquivo2 = { ...cab, dados: paraBase64(gcm(chave, nonce, aad).encrypt(aberto2)) };
    expect(await abrirBackup(JSON.stringify(arquivo2), SENHA)).toEqual({ ok: false, motivo: 'dados' });
  });

  it('recusa criar com senha curta', async () => {
    await expect(criar(estadoDeExemplo(), 'curta')).rejects.toThrow();
    expect(senhaValida('12345678')).toBe(true);
    expect(senhaValida('1234567')).toBe(false);
  });

  it('senha com acento funciona igual em qualquer forma de Unicode', async () => {
    const { conteudo } = await criar(estadoDeExemplo(), 'coração calmo');
    expect((await abrirBackup(conteudo, 'coração calmo'.normalize('NFD'))).ok).toBe(true);
  });

  it('avisa o progresso da derivação', async () => {
    const passos: number[] = [];
    await criarBackup(estadoDeExemplo(), SENHA, { aleatorio, parametros: LEVE, aoProgresso: (f) => passos.push(f) });
    expect(passos.length).toBeGreaterThan(0);
    expect(Math.max(...passos)).toBeLessThanOrEqual(1);
  });
});

describe('nome, resumo e restauração', () => {
  it('nome do arquivo com a data local', () => {
    expect(nomeDoBackup(new Date('2026-11-26T12:00:00'))).toBe('mare-backup-2026-11-26.mare');
  });

  it('resumo sem dados', () => {
    expect(resumoDoBackup(estadoInicial(), 'x')).toEqual({ habitos: 0, relatos: 0, criadoEm: 'x' });
  });

  it('paraBackup tira só o que é do aparelho', () => {
    const e = estadoDeExemplo();
    const b = paraBackup(e);
    expect(Object.keys(b.ajustes)).not.toContain('bloqueio');
    expect(b.ajustes.lembretes).toBeDefined();
    expect(b.habitos).toBe(e.habitos);
  });

  it('restaurar mantém IA, bloqueio, disfarce e telas protegidas do aparelho', () => {
    const atual = estadoDeExemplo();
    const doBackup = estadoInicial();
    doBackup.habitos = [{ ...estadoDeExemplo().habitos[0]!, id: 'novo' }];
    doBackup.ajustes = { ...doBackup.ajustes, habitoAtivo: 'sumiu', ocultarNumeros: true };
    const r = aplicarRestauracao(atual, doBackup);
    expect(r.habitos).toEqual(doBackup.habitos);
    expect(r.ajustes.ia).toEqual(atual.ajustes.ia);
    expect(r.ajustes.bloqueio).toEqual(atual.ajustes.bloqueio);
    expect(r.ajustes.disfarce).toBe('notas');
    expect(r.ajustes.protegerTela).toBe(true);
    expect(r.ajustes.ocultarNumeros).toBe(true);
    expect(r.ajustes.onboardingConcluido).toBe(true);
    expect(r.ajustes.habitoAtivo).toBeUndefined();
    expect('habitoAtivo' in r.ajustes).toBe(false);
  });

  it('restaurar num aparelho sem bloqueio não inventa bloqueio', () => {
    const atual = estadoInicial();
    const r = aplicarRestauracao(atual, estadoDeExemplo());
    expect(r.ajustes.bloqueio).toBeUndefined();
    expect('bloqueio' in r.ajustes).toBe(false);
  });

  describe('fotos dos porquês', () => {
    const NOME_A = '11111111-2222-4333-8444-555555555555.bin';
    const NOME_B = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee.bin';
    const JPEG = paraBase64(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]));
    const comPorques = (porques: EstadoPersistido['porques']): EstadoPersistido => ({ ...estadoDeExemplo(), porques });

    it('vão dentro da parte cifrada e voltam ao abrir', async () => {
      const e = comPorques([{ id: 'p1', texto: '', criadoEm: 1, foto: NOME_A }]);
      const { conteudo } = await criarBackup(e, SENHA, { aleatorio, parametros: LEVE, fotos: { [NOME_A]: JPEG } });
      expect(conteudo).not.toContain(JPEG);
      const r = await abrirBackup(conteudo, SENHA);
      expect(r.ok && r.fotos).toEqual({ [NOME_A]: JPEG });
      expect(r.ok && r.estado.porques).toEqual(e.porques);
    });

    it('backup sem fotos (ou antigo) abre com fotos vazias', async () => {
      const { conteudo } = await criar();
      const r = await abrirBackup(conteudo, SENHA);
      expect(r.ok && r.fotos).toEqual({});
    });

    it('porquê com foto que não veio no backup fica só com o texto; sem texto, some', async () => {
      const e = comPorques([
        { id: 'p1', texto: 'Meu filho', criadoEm: 1, foto: NOME_A },
        { id: 'p2', texto: '', criadoEm: 2, foto: NOME_B },
        { id: 'p3', texto: 'Saúde', criadoEm: 3 },
        { id: 'p4', texto: '', criadoEm: 4, foto: '11111111-2222-4333-8444-666666666666.bin' },
      ]);
      const { conteudo } = await criarBackup(e, SENHA, { aleatorio, parametros: LEVE, fotos: { [NOME_B]: JPEG } });
      const r = await abrirBackup(conteudo, SENHA);
      expect(r.ok && r.estado.porques).toEqual([
        { id: 'p1', texto: 'Meu filho', criadoEm: 1 },
        { id: 'p2', texto: '', criadoEm: 2, foto: NOME_B },
        { id: 'p3', texto: 'Saúde', criadoEm: 3 },
      ]);
    });

    it('ignora nomes fora do padrão (nada de caminhos) e dados que não são Base64', async () => {
      const e = comPorques([{ id: 'p1', texto: 'x', criadoEm: 1, foto: '../../banco.bin' }]);
      const fotos = { '../../banco.bin': JPEG, [NOME_A]: 'isto não é base64!', [NOME_B]: JPEG };
      const { conteudo } = await criarBackup(e, SENHA, { aleatorio, parametros: LEVE, fotos });
      const r = await abrirBackup(conteudo, SENHA);
      expect(r.ok && r.fotos).toEqual({ [NOME_B]: JPEG });
      expect(r.ok && r.estado.porques).toEqual([{ id: 'p1', texto: 'x', criadoEm: 1 }]);
    });
  });
});
