import { resumoHabito } from '../contador';
import type { Habito, Relato, TipoHabito } from '../tipos';

/** O hábito em termos neutros: nunca o apelido que a pessoa deu. */
const TERMOS: Record<TipoHabito, string> = {
  tabaco: 'tabaco (cigarro)',
  alcool: 'álcool',
  sexual: 'um comportamento sexual que a pessoa quer controlar',
};

const RELATOS_CONSIDERADOS = 7;
const MAX_GATILHOS = 5;

const plural = (n: number, singular: string, mais: string) => `${n} ${n === 1 ? singular : mais}`;
const limpar = (texto: string, max: number) => texto.replace(/\s+/g, ' ').trim().slice(0, max);

/**
 * Monta o contexto mínimo que vai para a IA (spec 8.3): tipo de hábito em termos neutros, meta,
 * dias da sequência atual e gatilhos dos últimos 7 relatos. NUNCA entram apelido do hábito, nome,
 * telefone, contatos, notas livres, fotos ou áudios.
 * `hoje` é o dia local, "AAAA-MM-DD".
 */
export function montarContexto(habito: Habito | undefined, relatos: Relato[], hoje: string): string {
  if (!habito) return '';
  const linhas: string[] = [`- Hábito que a pessoa quer mudar: ${TERMOS[habito.tipo]}.`];

  if (habito.meta.tipo === 'parar') {
    linhas.push('- Meta: parar por completo.');
  } else {
    const unidade = limpar(habito.meta.unidade, 20);
    linhas.push(`- Meta: reduzir, no máximo ${habito.meta.maxPorDia}${unidade ? ` ${unidade}` : ''} por dia.`);
  }

  const { sequenciaAtual } = resumoHabito(habito, relatos, hoje);
  const como = habito.meta.tipo === 'parar' ? 'sem usar' : 'dentro da meta';
  linhas.push(
    sequenciaAtual > 0
      ? `- Sequência atual: ${plural(sequenciaAtual, 'dia', 'dias')} seguidos ${como}.`
      : '- Sequência atual: recomeçando (hoje é um novo começo).',
  );

  const recentes = [...relatos].sort((a, b) => (a.dia < b.dia ? 1 : -1)).slice(0, RELATOS_CONSIDERADOS);
  const contagem = new Map<string, number>();
  for (const r of recentes) {
    for (const g of new Set(r.gatilhos.map((x) => limpar(x, 40)).filter(Boolean))) {
      contagem.set(g, (contagem.get(g) ?? 0) + 1);
    }
  }
  const gatilhos = [...contagem.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_GATILHOS);
  if (gatilhos.length > 0) {
    linhas.push(`- Gatilhos que a pessoa marcou nos últimos relatos: ${gatilhos.map(([g]) => g).join(', ')}.`);
  }
  return linhas.join('\n');
}
