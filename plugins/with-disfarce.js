/**
 * Disfarce de nome e ícone (spec 7.1 e 12), só Android.
 *
 * O ícone que aparece no launcher pertence a um componente com intent MAIN/LAUNCHER. Aqui tiramos
 * esse intent da MainActivity e criamos um `activity-alias` para cada disfarce, cada um com o seu
 * rótulo e ícone. O alias "mare" nasce habilitado; os outros, desabilitados. O módulo nativo
 * local `modules/disfarce` liga um e desliga os outros em tempo de execução (sem matar o app).
 *
 * Os ícones vêm prontos de `plugins/disfarce/res` (gerados por `scripts/gerar-icones-disfarce.py`)
 * e são copiados para `android/app/src/main/res`. Nada em `android/` é editado à mão: este plugin
 * roda de novo a cada `expo prebuild`.
 *
 * A lista abaixo precisa ficar igual a `DISFARCES` em src/lib/preferencias.ts (há um teste) e a
 * `IDS` em modules/disfarce/.../DisfarceModule.kt.
 */
/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const { withAndroidManifest, withDangerousMod } = require('expo/config-plugins');

const DISFARCES = [
  { id: 'mare', nome: 'Maré' },
  { id: 'diario', nome: 'Diário' },
  { id: 'notas', nome: 'Notas' },
  { id: 'calma', nome: 'Calma' },
];
const PADRAO = 'mare';
const PREFIXO_ALIAS = '.Disfarce';

const nomeDoAlias = (id) => PREFIXO_ALIAS + id.charAt(0).toUpperCase() + id.slice(1);

const ehLauncher = (filtro) =>
  (filtro.category ?? []).some((c) => c.$?.['android:name'] === 'android.intent.category.LAUNCHER');

/** Transforma o manifesto (formato JSON do xml2js usado pelo Expo). Sem efeitos fora do objeto. */
function aplicarAliases(manifesto) {
  const app = manifesto.manifest.application?.[0];
  if (!app) throw new Error('with-disfarce: o manifesto não tem <application>.');
  const principal = (app.activity ?? []).find((a) => a.$['android:name'] === '.MainActivity');
  if (!principal) throw new Error('with-disfarce: MainActivity não encontrada no manifesto.');

  // O ícone do launcher passa a ser só dos aliases; os links (scheme "mare") continuam na MainActivity.
  principal['intent-filter'] = (principal['intent-filter'] ?? []).filter((f) => !ehLauncher(f));

  // Idempotente: tira aliases de execuções anteriores antes de recriar.
  const outros = (app['activity-alias'] ?? []).filter((a) => !a.$['android:name'].startsWith(PREFIXO_ALIAS));
  app['activity-alias'] = [
    ...outros,
    ...DISFARCES.map(({ id, nome }) => ({
      $: {
        'android:name': nomeDoAlias(id),
        'android:enabled': id === PADRAO ? 'true' : 'false',
        'android:exported': 'true',
        'android:targetActivity': '.MainActivity',
        'android:label': nome,
        'android:icon': `@mipmap/ic_disfarce_${id}`,
      },
      'intent-filter': [
        {
          action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
          category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
        },
      ],
    })),
  ];
  return manifesto;
}

function withDisfarce(config) {
  config = withAndroidManifest(config, (mod) => {
    mod.modResults = aplicarAliases(mod.modResults);
    return mod;
  });
  return withDangerousMod(config, [
    'android',
    (mod) => {
      const origem = path.join(__dirname, 'disfarce', 'res');
      const destino = path.join(mod.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res');
      if (!fs.existsSync(origem)) {
        throw new Error('with-disfarce: faltam os ícones em plugins/disfarce/res (rode scripts/gerar-icones-disfarce.py).');
      }
      fs.cpSync(origem, destino, { recursive: true, force: true });
      return mod;
    },
  ]);
}

module.exports = withDisfarce;
module.exports.DISFARCES = DISFARCES;
module.exports.aplicarAliases = aplicarAliases;
module.exports.nomeDoAlias = nomeDoAlias;
