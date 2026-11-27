/**
 * Assinatura do APK de lançamento, sem nenhum segredo no repositório.
 *
 * A chave (keystore) e as senhas ficam no `gradle.properties` da pasta do Gradle de quem gera o APK
 * (aqui, `D:/android/gradle/gradle.properties`, ver scripts/android-env.mjs), nunca no repositório:
 *   MARE_UPLOAD_STORE_FILE=C:/caminho/para/mare-lancamento.keystore
 *   MARE_UPLOAD_STORE_PASSWORD=...
 *   MARE_UPLOAD_KEY_ALIAS=mare
 *   MARE_UPLOAD_KEY_PASSWORD=...
 * Com elas, o build "release" assina com essa chave. Sem elas, continua com a chave de debug do
 * modelo (o APK de teste). Ver docs/assinatura.md. Roda a cada `expo prebuild`; `android/` não é
 * editado à mão.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const MARCA = '// mare: assinatura de lançamento';

const BLOCO_RELEASE = `
        ${MARCA}
        if (findProperty('MARE_UPLOAD_STORE_FILE')) {
            release {
                storeFile file(findProperty('MARE_UPLOAD_STORE_FILE'))
                storePassword findProperty('MARE_UPLOAD_STORE_PASSWORD')
                keyAlias findProperty('MARE_UPLOAD_KEY_ALIAS')
                keyPassword findProperty('MARE_UPLOAD_KEY_PASSWORD')
            }
        }`;

/** Transforma o texto do app/build.gradle. Idempotente; lança se o modelo do Expo mudar de forma. */
function aplicarAssinatura(gradle) {
  if (gradle.includes(MARCA)) return gradle;
  const abertura = /signingConfigs\s*\{\s*\n(\s*)debug\s*\{[^}]*\}/;
  if (!abertura.test(gradle)) throw new Error('with-assinatura: não achei signingConfigs { debug { ... } } no build.gradle.');
  let novo = gradle.replace(abertura, (bloco) => bloco + BLOCO_RELEASE);
  const usoRelease = /(release\s*\{[^}]*?)signingConfig signingConfigs\.debug/;
  if (!usoRelease.test(novo)) throw new Error('with-assinatura: não achei o signingConfig do buildType release.');
  novo = novo.replace(
    usoRelease,
    "$1signingConfig findProperty('MARE_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug",
  );
  return novo;
}

const withAssinatura = (config) =>
  withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') throw new Error('with-assinatura: esperava build.gradle em Groovy.');
    mod.modResults.contents = aplicarAssinatura(mod.modResults.contents);
    return mod;
  });

module.exports = withAssinatura;
module.exports.aplicarAssinatura = aplicarAssinatura;
