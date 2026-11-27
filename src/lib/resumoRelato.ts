/** Frase curta com o que o relato vai gravar, para ninguém salvar sem saber o que está marcado. */
import { erroQuantidade, type Rascunhos } from './relato';
import type { Habito } from './tipos';

/**
 * "Hoje: sem uso, vontade 0". Só entram os hábitos já respondidos (os outros ficam de fora do
 * relato). Com mais de um hábito, cada trecho leva o apelido: "Hoje: Fôlego sem uso, vontade 0 · Foco usou, vontade 4".
 * Na meta reduzir, a quantidade aparece quando já está válida. `null` se nada foi respondido.
 */
export function resumoDoRelato(ativos: Habito[], rascunhos: Rascunhos, ehHoje: boolean): string | null {
  const respondidos = ativos.filter((h) => rascunhos[h.id]?.respondido);
  if (respondidos.length === 0) return null;
  const trechos = respondidos.map((h) => {
    const r = rascunhos[h.id];
    let uso = r.usou ? 'usou' : 'sem uso';
    if (r.usou && h.meta.tipo === 'reduzir' && !erroQuantidade(h, r)) uso = `usou ${r.quantidade.trim()} ${h.meta.unidade}`;
    const base = `${uso}, vontade ${r.vontade}`;
    return ativos.length > 1 ? `${h.apelido} ${base}` : base;
  });
  return `${ehHoje ? 'Hoje' : 'Nesse dia'}: ${trechos.join(' · ')}`;
}
