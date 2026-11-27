import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { MAX_CARACTERES_BACKUP } from './backup';
import { semBloquear } from './useBloqueio';

/**
 * Arquivos do backup no celular: grava na área temporária e abre o "compartilhar" do Android;
 * para restaurar, abre o seletor de arquivos. Módulo fino, fora dos testes. No navegador vale
 * `arquivos.web.ts`. Ambos usam `semBloquear`, para que a ida e volta à tela do sistema não
 * tranque o app no meio da tarefa.
 */

const ehBackup = (nome: string) => /^mare-backup-.*\.mare$/.test(nome);

/** Apaga backups que ficaram na área temporária (o conteúdo é cifrado, mas não precisa sobrar). */
export function limparArquivosTemporarios(): void {
  try {
    for (const item of Paths.cache.list()) {
      if (item instanceof File && ehBackup(item.name)) item.delete();
    }
  } catch {
    // Nada a limpar.
  }
}

/** Abre o "compartilhar" com o arquivo. `false` se o aparelho não tem como compartilhar. */
export async function guardarArquivo(nome: string, conteudo: string): Promise<boolean> {
  limparArquivosTemporarios();
  const arquivo = new File(Paths.cache, nome);
  arquivo.create({ overwrite: true });
  arquivo.write(conteudo);
  if (!(await Sharing.isAvailableAsync())) return false;
  await semBloquear(() =>
    Sharing.shareAsync(arquivo.uri, { mimeType: 'application/octet-stream', dialogTitle: 'Guardar o backup do Maré' }),
  );
  return true;
}

/** Deixa a pessoa escolher um arquivo e devolve o texto dele. `null` se cancelou ou é grande demais. */
export async function escolherArquivo(): Promise<{ nome: string; texto: string } | 'grande' | null> {
  const r = await semBloquear(() => DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false }));
  const item = r.canceled ? undefined : r.assets[0];
  if (!item) return null;
  if (item.size !== undefined && item.size > MAX_CARACTERES_BACKUP) return 'grande';
  const arquivo = new File(item.uri);
  try {
    const texto = await arquivo.text();
    return texto.length > MAX_CARACTERES_BACKUP ? 'grande' : { nome: item.name, texto };
  } finally {
    // A cópia do seletor também sai da área temporária.
    try {
      arquivo.delete();
    } catch {
      // Já foi.
    }
  }
}
