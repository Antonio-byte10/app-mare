// Gera um APK de teste (assinado com a chave de debug do modelo do Expo) em dist/.
// Não usa nenhuma chave de assinatura real: serve só para instalar e testar no aparelho.
import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { run } from './android-env.mjs';

const root = join(import.meta.dirname, '..');
const win = process.platform === 'win32';
const { version } = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')).expo;

console.log(`\nMaré ${version}: APK de teste\n`);

// android/ é gerado e ignorado pelo git; nunca editar à mão.
run('npx', ['expo', 'prebuild', '--platform', 'android', '--no-install'], { cwd: root });
run(join(root, 'android', win ? 'gradlew.bat' : 'gradlew'), ['assembleRelease', '-PreactNativeArchitectures=arm64-v8a,armeabi-v7a'], {
  cwd: join(root, 'android'),
});

const built = join(root, 'android/app/build/outputs/apk/release/app-release.apk');
const dist = join(root, 'dist');
mkdirSync(dist, { recursive: true });
const out = join(dist, `mare-${version}-teste.apk`);
copyFileSync(built, out);
console.log(`\nAPK pronto: ${out} (${(statSync(out).size / 1024 / 1024).toFixed(1)} MB)\n`);
