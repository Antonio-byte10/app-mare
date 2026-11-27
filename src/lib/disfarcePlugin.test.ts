import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { DISFARCES } from './preferencias';

// O plugin é CommonJS (o Expo o carrega no prebuild); aqui só conferimos o que ele gera.
const exigir = createRequire(import.meta.url);
const plugin = exigir('../../plugins/with-disfarce.js') as {
  DISFARCES: { id: string; nome: string }[];
  aplicarAliases: (m: any) => any;
  nomeDoAlias: (id: string) => string;
};

const launcher = {
  action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
  category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
};
const link = {
  action: [{ $: { 'android:name': 'android.intent.action.VIEW' } }],
  category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
  data: [{ $: { 'android:scheme': 'mare' } }],
};

const manifesto = () => ({
  manifest: {
    application: [{ activity: [{ $: { 'android:name': '.MainActivity' }, 'intent-filter': [launcher, link] }] }],
  },
});

describe('plugin do disfarce', () => {
  it('a lista do plugin é igual à do app (ids e nomes)', () => {
    expect(plugin.DISFARCES).toEqual(DISFARCES.map(({ id, nome }) => ({ id, nome })));
  });

  it('tira o launcher da MainActivity e mantém o link', () => {
    const app = plugin.aplicarAliases(manifesto()).manifest.application[0];
    expect(app.activity[0]['intent-filter']).toEqual([link]);
  });

  it('cria um alias por disfarce, só o "mare" habilitado', () => {
    const aliases = plugin.aplicarAliases(manifesto()).manifest.application[0]['activity-alias'];
    expect(aliases).toHaveLength(DISFARCES.length);
    for (const a of aliases) {
      const id = DISFARCES.find((d) => plugin.nomeDoAlias(d.id) === a.$['android:name'])!.id;
      expect(a.$['android:enabled']).toBe(id === 'mare' ? 'true' : 'false');
      expect(a.$['android:exported']).toBe('true');
      expect(a.$['android:targetActivity']).toBe('.MainActivity');
      expect(a.$['android:icon']).toBe(`@mipmap/ic_disfarce_${id}`);
      expect(a.$['android:label']).toBe(DISFARCES.find((d) => d.id === id)!.nome);
      expect(a['intent-filter']).toEqual([{ action: launcher.action, category: launcher.category }]);
    }
  });

  it('rodar duas vezes não duplica nada', () => {
    const uma = plugin.aplicarAliases(manifesto());
    const duas = plugin.aplicarAliases(plugin.aplicarAliases(manifesto()));
    expect(duas).toEqual(uma);
  });

  it('o nome do alias bate com o que o Kotlin monta', () => {
    expect(plugin.nomeDoAlias('diario')).toBe('.DisfarceDiario');
  });
});
