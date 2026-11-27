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

/** Conteúdo de res/xml/shortcuts.xml. `pacote` é o applicationId (a MainActivity vive nele). */
function xmlDosAtalhos(pacote) {
  return `<?xml version="1.0" encoding="utf-8"?>
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
  <shortcut
    android:shortcutId="onda_agora"
    android:enabled="true"
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
      const pasta = path.join(mod.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(pasta, { recursive: true });
      fs.writeFileSync(path.join(pasta, `${RECURSO}.xml`), xmlDosAtalhos(pacote));
      return mod;
    },
  ]);
}

module.exports = withAtalhos;
module.exports.aplicarAtalho = aplicarAtalho;
module.exports.xmlDosAtalhos = xmlDosAtalhos;
