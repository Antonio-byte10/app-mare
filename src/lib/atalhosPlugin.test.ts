import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

// O plugin é CommonJS (o Expo o carrega no prebuild); aqui só conferimos o que ele gera.
const exigir = createRequire(import.meta.url);
const plugin = exigir('../../plugins/with-atalhos.js') as {
  aplicarAtalho: (m: any) => any;
  xmlDosAtalhos: (pacote: string) => string;
};
const disfarce = exigir('../../plugins/with-disfarce.js') as {
  aplicarAliases: (m: any) => any;
  DISFARCES: { id: string }[];
};

const manifesto = () => ({
  manifest: { application: [{ activity: [{ $: { 'android:name': '.MainActivity' } }] }] },
});

const comAliases = () => disfarce.aplicarAliases(manifesto());
const metaDe = (alias: any) => (alias['meta-data'] ?? []).filter((m: any) => m.$['android:name'] === 'android.app.shortcuts');

describe('plugin do atalho "Onda agora"', () => {
  it('prende o atalho só ao alias padrão; os disfarçados ficam sem', () => {
    const aliases = plugin.aplicarAtalho(comAliases()).manifest.application[0]['activity-alias'];
    for (const a of aliases) {
      const eh = a.$['android:name'] === '.DisfarceMare';
      expect(metaDe(a)).toHaveLength(eh ? 1 : 0);
    }
    const mare = aliases.find((a: any) => a.$['android:name'] === '.DisfarceMare');
    expect(metaDe(mare)[0].$['android:resource']).toBe('@xml/shortcuts');
  });

  it('é idempotente', () => {
    const uma = plugin.aplicarAtalho(comAliases());
    const duas = plugin.aplicarAtalho(uma);
    const mare = duas.manifest.application[0]['activity-alias'].find((a: any) => a.$['android:name'] === '.DisfarceMare');
    expect(metaDe(mare)).toHaveLength(1);
  });

  it('falha alto se o disfarce ainda não criou os aliases (ordem errada no app.json)', () => {
    expect(() => plugin.aplicarAtalho(manifesto())).toThrow(/ANTES/);
  });

  it('o XML abre /fissura na MainActivity do pacote', () => {
    const xml = plugin.xmlDosAtalhos('com.mare.app');
    expect(xml).toContain('android:data="mare:///fissura"');
    expect(xml).toContain('android:targetClass="com.mare.app.MainActivity"');
    expect(xml).toContain('android:shortcutId="onda_agora"');
  });
});
