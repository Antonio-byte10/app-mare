import { MAX_CARACTERES_BACKUP } from './backup';

/** Versão do navegador (só para desenvolvimento): baixa o arquivo e escolhe com um <input type="file">. */

export function limparArquivosTemporarios(): void {}

export async function guardarArquivo(nome: string, conteudo: string): Promise<boolean> {
  const url = URL.createObjectURL(new Blob([conteudo], { type: 'application/octet-stream' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}

export function escolherArquivo(): Promise<{ nome: string; texto: string } | 'grande' | null> {
  return new Promise((resolver) => {
    const campo = document.createElement('input');
    campo.type = 'file';
    campo.accept = '.mare,application/octet-stream';
    campo.onchange = async () => {
      const arquivo = campo.files?.[0];
      if (!arquivo) return resolver(null);
      if (arquivo.size > MAX_CARACTERES_BACKUP) return resolver('grande');
      resolver({ nome: arquivo.name, texto: await arquivo.text() });
    };
    campo.oncancel = () => resolver(null);
    campo.click();
  });
}
