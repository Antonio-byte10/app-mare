// Monta o ambiente do Android (Java 21, SDK, Gradle) e roda o comando recebido nele.
// Uso: node scripts/android-env.mjs npx expo run:android
// Pasta das ferramentas: MARE_ANDROID_DIR (padrão D:/android).
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const win = process.platform === 'win32';
const tools = process.env.MARE_ANDROID_DIR ?? 'D:/android';

export function androidEnv() {
  const env = {
    ...process.env,
    JAVA_HOME: join(tools, 'jdk21'),
    ANDROID_HOME: join(tools, 'sdk'),
    ANDROID_SDK_ROOT: join(tools, 'sdk'),
    // Fora da pasta do usuário: espaço no caminho ("Antonio Vinas") quebra o build nativo.
    GRADLE_USER_HOME: join(tools, 'gradle'),
    // O Java cria sockets locais na pasta TEMP; no Windows isso falha ("Invalid argument: connect").
    JAVA_TOOL_OPTIONS: `-Djdk.net.unixdomain.tmpdir=${join(tools, 'tmp')}`,
  };
  env.PATH = [
    join(env.JAVA_HOME, 'bin'),
    join(env.ANDROID_HOME, 'platform-tools'),
    process.env.PATH,
  ].join(delimiter);
  mkdirSync(join(tools, 'tmp'), { recursive: true });
  return env;
}

// No Windows, .bat/.cmd só rodam pelo shell.
export function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { env: androidEnv(), stdio: 'inherit', shell: win, ...opts });
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cmd, ...args] = process.argv.slice(2);
  if (!cmd) {
    console.error('Uso: node scripts/android-env.mjs <comando> [argumentos]');
    process.exit(2);
  }
  run(cmd, args);
}
