/**
 * Atalho "Onda agora" ao segurar o ícone do app (Android, atalho estático do launcher).
 *
 * Abre `mare:///fissura`. Com o bloqueio ligado, o app pede o PIN antes (o link só escolhe a tela;
 * quem tranca é o GuardaPrivacidade), e a onda livre da tela de bloqueio continua sendo opção à parte.
 *
 * Convive com o disfarce (plugins/with-disfarce.js): o ícone do launcher pertence aos aliases
 * `.Disfarce*`, e atalhos estáticos precisam estar presos ao componente do launcher. Só o alias padrão
 * (`.DisfarceMare`) ganha o atalho. Os disfarçados (Diário, Notas, Calma) ficam SEM atalho de propósito:
 * um "Onda agora" ao segurar o ícone entregaria o que o disfarce esconde. Como o alias só nasce no
 * with-disfarce, este plugin precisa vir ANTES dele em `app.json`: o Expo roda os mods do último
 * plugin para o primeiro, então este roda depois e encontra o alias já criado.
 *
 * `android/` não é editado à mão: o plugin roda de novo a cada `expo prebuild`.
 */
const fs = require('node:fs');
const path = require('node:path');
const { AndroidConfig, withAndroidManifest, withDangerousMod, withStringsXml } = require('expo/config-plugins');

const ALIAS_PADRAO = '.DisfarceMare';
const RECURSO = 'shortcuts';
const META = 'android.app.shortcuts';
const ROTULO_CURTO = 'atalho_onda_agora';
const ROTULO_LONGO = 'atalho_onda_agora_longo';
const LINK = 'mare:///fissura';
const ICONE = 'atalho_onda';

/*
 * Ícone do atalho: duas ondas (o mesmo traço do botão "Onda" da barra) em azul-escuro sobre um
 * círculo claro, como os atalhos dos apps do sistema. A partir do Android 8 é um ícone adaptativo
 * (o launcher recorta no formato dele); antes disso, um vetor com o círculo já desenhado.
 * Coordenadas numa grade de 108 (o tamanho do ícone adaptativo; o miolo visível tem ~72).
 */
const COR_FUNDO = '#DDF3F7';
const COR_TRACO = '#1E3A78';
const ONDAS = ['M32,47 q5.5,-6 11,0 t11,0 t11,0 t11,0', 'M32,61 q5.5,-6 11,0 t11,0 t11,0 t11,0'];
const tracos = () =>
  ONDAS.map(
    (d) =>
      `  <path android:pathData="${d}" android:strokeColor="${COR_TRACO}" android:strokeWidth="5" android:strokeLineCap="round" android:strokeLineJoin="round" android:fillColor="#00000000" />`,
  ).join('\n');
const CIRCULO = `  <path android:pathData="M54,10 a44,44 0 1,0 0.01,0 z" android:fillColor="${COR_FUNDO}" />\n`;
const vetor = (fundo) => `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">
${fundo ? CIRCULO : ''}${tracos()}
</vector>
`;
/** Arquivos de res/ do ícone do atalho ('pasta/arquivo' -> conteúdo). */
const DESENHOS_ICONE = {
  [`drawable/${ICONE}.xml`]: vetor(true),
  [`drawable/${ICONE}_glifo.xml`]: vetor(false),
  [`drawable-anydpi-v26/${ICONE}.xml`]: `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/${ICONE}_fundo" />
  <foreground android:drawable="@drawable/${ICONE}_glifo" />
</adaptive-icon>
`,
  [`values/${ICONE}_cores.xml`]: `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <color name="${ICONE}_fundo">${COR_FUNDO}</color>
</resources>
`,
};

/** Conteúdo de res/xml/shortcuts.xml. `pacote` é o applicationId (a MainActivity vive nele). */
function xmlDosAtalhos(pacote) {
  return `<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
  <shortcut
    android:shortcutId="onda_agora"
    android:enabled="true"
    android:icon="@drawable/${ICONE}"
    android:shortcutShortLabel="@string/${ROTULO_CURTO}"
    android:shortcutLongLabel="@string/${ROTULO_LONGO}">
    <intent
      android:action="android.intent.action.VIEW"
      android:data="${LINK}"
      android:targetPackage="${pacote}"
      android:targetClass="${pacote}.MainActivity" />
  </shortcut>
</shortcuts>
`;
}

/** Prende o atalho ao alias padrão. Idempotente; lança se o with-disfarce ainda não criou o alias. */
function aplicarAtalho(manifesto) {
  const app = manifesto.manifest.application?.[0];
  const alias = (app?.['activity-alias'] ?? []).find((a) => a.$['android:name'] === ALIAS_PADRAO);
  if (!alias) {
    throw new Error('with-atalhos: alias ' + ALIAS_PADRAO + ' não encontrado. Liste "./plugins/with-atalhos" ANTES de "./plugins/with-disfarce" em app.json.');
  }
  const outros = (alias['meta-data'] ?? []).filter((m) => m.$['android:name'] !== META);
  alias['meta-data'] = [...outros, { $: { 'android:name': META, 'android:resource': `@xml/${RECURSO}` } }];
  return manifesto;
}

function withAtalhos(config) {
  config = withAndroidManifest(config, (mod) => {
    mod.modResults = aplicarAtalho(mod.modResults);
    return mod;
  });
  config = withStringsXml(config, (mod) => {
    mod.modResults = AndroidConfig.Strings.setStringItem(
      [
        { $: { name: ROTULO_CURTO }, _: 'Onda agora' },
        { $: { name: ROTULO_LONGO }, _: 'Onda agora: estou com vontade' },
      ],
      mod.modResults,
    );
    return mod;
  });
  return withDangerousMod(config, [
    'android',
    (mod) => {
      const pacote = mod.android?.package;
      if (!pacote) throw new Error('with-atalhos: falta android.package no app.json.');
      const res = path.join(mod.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res');
      for (const [pasta, arquivo, conteudo] of [
        ['xml', `${RECURSO}.xml`, xmlDosAtalhos(pacote)],
        ...Object.entries(DESENHOS_ICONE).map(([chave, xml]) => [...chave.split('/'), xml]),
      ]) {
        fs.mkdirSync(path.join(res, pasta), { recursive: true });
        fs.writeFileSync(path.join(res, pasta, arquivo), conteudo);
      }
      return mod;
    },
  ]);
}

module.exports = withAtalhos;
module.exports.aplicarAtalho = aplicarAtalho;
module.exports.xmlDosAtalhos = xmlDosAtalhos;
module.exports.DESENHOS_ICONE = DESENHOS_ICONE;
