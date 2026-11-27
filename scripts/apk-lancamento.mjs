// Gera o APK de lançamento, assinado com a chave real (ver docs/assinatura.md), em dist/.
// Recusa gerar se a chave não estiver configurada: um APK de lançamento com a chave de debug
// não poderia ser atualizado depois pela versão certa.
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { androidEnv, run } from './android-env.mjs';

const root = join(import.meta.dirname, '..');
const win = process.platform === 'win32';
const { version, android } = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;

const propriedades = join(androidEnv().GRADLE_USER_HOME, 'gradle.properties');
const texto = existsSync(propriedades) ? readFileSync(propriedades, 'utf8') : '';
const valor = (nome) => new RegExp(`^\s*${nome}\s*=\s*(.+)$`, 'm').exec(texto)?.[1]?.trim();
const faltando = ['MARE_UPLOAD_STORE_FILE', 'MARE_UPLOAD_STORE_PASSWORD', 'MARE_UPLOAD_KEY_ALIAS', 'MARE_UPLOAD_KEY_PASSWORD'].filter((n) => !valor(n));
if (faltando.length > 0) {
  console.error(`\nFalta configurar a chave de lançamento em ${propriedades}: ${faltando.join(', ')}.\nVeja docs/assinatura.md.\n`);
  process.exit(1);
}
if (!existsSync(valor('MARE_UPLOAD_STORE_FILE'))) {
  console.error(`\nNão achei a chave em ${valor('MARE_UPLOAD_STORE_FILE')}. Veja docs/assinatura.md.\n`);
  process.exit(1);
}

console.log(`\nMaré ${version} (versionCode ${android.versionCode}): APK de lançamento\n`);
run('npx', ['expo', 'prebuild', '--platform', 'android', '--no-install'], { cwd: root });
run(join(root, 'android', win ? 'gradlew.bat' : 'gradlew'), ['assembleRelease', '-PreactNativeArchitectures=arm64-v8a,armeabi-v7a'], {
  cwd: join(root, 'android'),
});

const built = join(root, 'android/app/build/outputs/apk/release/app-release.apk');
mkdirSync(join(root, 'dist'), { recursive: true });
const out = join(root, 'dist', `mare-${version}.apk`);
copyFileSync(built, out);
const sha = createHash('sha256').update(readFileSync(out)).digest('hex');
console.log(`\nAPK pronto: ${out} (${(statSync(out).size / 1024 / 1024).toFixed(1)} MB)`);
console.log(`SHA-256: ${sha}  (cole na descrição da Release para quem quiser conferir)\n`);
