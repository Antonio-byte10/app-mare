/** Lógica pura da avaliação "Como você está": perguntas, pontuação, nível e evolução. */
import { QUESTIONARIOS, type PerguntaAvaliacao, type Questionario } from '../conteudo/avaliacao';
import type { Avaliacao, Habito, NivelAtencao, ResultadoAvaliacao, TipoHabito } from './tipos';

export const questionarioDe = (tipo: TipoHabito): Questionario => QUESTIONARIOS[tipo];

/** Faixa de atenção (leve, moderada ou alta) para uma pontuação. Nunca é diagnóstico. */
export function nivelDe(tipo: TipoHabito, pontos: number): NivelAtencao {
  const { cortes } = questionarioDe(tipo);
  if (pontos >= cortes.alta) return 'alta';
  if (pontos >= cortes.moderada) return 'moderada';
  return 'leve';
}

/** Uma pergunta da fila, já ligada ao hábito a que se refere. */
export type ItemFila = {
  habito: Habito;
  pergunta: PerguntaAvaliacao;
  /** Chave da resposta: `habitoId:perguntaId`. */
  chave: string;
};

export const chaveResposta = (habitoId: string, perguntaId: string) => `${habitoId}:${perguntaId}`;

/** Todas as perguntas, hábito por hábito, na ordem em que os hábitos foram escolhidos. */
export function montarFila(habitos: Habito[]): ItemFila[] {
  return habitos.flatMap((habito) =>
    questionarioDe(habito.tipo).perguntas.map((pergunta) => ({
      habito,
      pergunta,
      chave: chaveResposta(habito.id, pergunta.id),
    })),
  );
}

/** Respostas: chave -> posição da opção escolhida na pergunta. */
export type Respostas = Record<string, number>;

/** Soma os pontos das respostas dadas a um hábito; opção inexistente conta 0. */
export function pontuar(habito: Habito, respostas: Respostas): number {
  const q = questionarioDe(habito.tipo);
  let total = 0;
  for (const p of q.perguntas) {
    const escolha = respostas[chaveResposta(habito.id, p.id)];
    total += p.opcoes[escolha]?.pontos ?? 0;
  }
  return total;
}

/** `true` se todas as perguntas do hábito foram respondidas. */
export const completoPara = (habito: Habito, respostas: Respostas) =>
  questionarioDe(habito.tipo).perguntas.every((p) => respostas[chaveResposta(habito.id, p.id)] !== undefined);

/** Resultado por hábito (só dos que foram respondidos por inteiro). */
export function calcularResultados(habitos: Habito[], respostas: Respostas): ResultadoAvaliacao[] {
  return habitos
    .filter((h) => completoPara(h, respostas))
    .map((h) => {
      const pontos = pontuar(h, respostas);
      return {
        habitoId: h.id,
        tipo: h.tipo,
        pontos,
        maximo: questionarioDe(h.tipo).maximo,
        nivel: nivelDe(h.tipo, pontos),
      };
    });
}

export const montarAvaliacao = (id: string, feitaEm: number, resultados: ResultadoAvaliacao[]): Avaliacao => ({
  id,
  feitaEm,
  resultados,
});

/** A avaliação mais recente, ou `undefined`. */
export const ultimaAvaliacao = (avaliacoes: Avaliacao[]): Avaliacao | undefined =>
  avaliacoes.reduce<Avaliacao | undefined>((a, b) => (!a || b.feitaEm > a.feitaEm ? b : a), undefined);

export const TEXTO_NIVEL: Record<NivelAtencao, string> = {
  leve: 'Atenção leve',
  moderada: 'Atenção moderada',
  alta: 'Atenção alta',
};

/** Barrinhas preenchidas: leve 1, moderada 2, alta 3. */
export const BARRAS_NIVEL: Record<NivelAtencao, number> = { leve: 1, moderada: 2, alta: 3 };

const ORDEM: NivelAtencao[] = ['leve', 'moderada', 'alta'];

export type Evolucao = 'mais-leve' | 'igual' | 'mais-alta';

/** Compara dois níveis do mesmo hábito. */
export function compararNiveis(anterior: NivelAtencao, atual: NivelAtencao): Evolucao {
  const d = ORDEM.indexOf(atual) - ORDEM.indexOf(anterior);
  return d < 0 ? 'mais-leve' : d > 0 ? 'mais-alta' : 'igual';
}

/** Frase acolhedora sobre a mudança, sem cobrança. */
export function textoEvolucao(anterior: NivelAtencao, atual: NivelAtencao): string {
  const e = compararNiveis(anterior, atual);
  if (e === 'mais-leve') return `Da ${TEXTO_NIVEL[anterior].toLowerCase()} para a ${TEXTO_NIVEL[atual].toLowerCase()}. Isso é um passo.`;
  if (e === 'igual') return 'Segue no mesmo ponto. Mudar leva tempo, e você está aqui.';
  return 'Está um pouco mais pesado agora. Isso muda, e você não está só.';
}

/** Para cada resultado atual, o resultado anterior do mesmo hábito (se houver). */
export function emparelhar(
  atual: ResultadoAvaliacao[],
  anterior: Avaliacao | undefined,
): { atual: ResultadoAvaliacao; anterior?: ResultadoAvaliacao }[] {
  return atual.map((a) => ({ atual: a, anterior: anterior?.resultados.find((r) => r.habitoId === a.habitoId) }));
}

/**
 * Sugestão de conversar com um profissional, só quando algum nível é alto. `null` se nenhum for.
 * Um hábito: "Para o Foco, ..."; mais de um: "Para Foco e Calmaria, ...".
 */
export function textoSugestaoProfissional(resultados: ResultadoAvaliacao[], habitos: Habito[]): string | null {
  const nomes = resultados
    .filter((r) => r.nivel === 'alta')
    .map((r) => habitos.find((h) => h.id === r.habitoId)?.apelido)
    .filter((n): n is string => !!n);
  if (nomes.length === 0) return null;
  const alvo = nomes.length === 1 ? `o ${nomes[0]}` : `os hábitos ${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;
  return `Para ${alvo}, conversar com um psicólogo costuma ajudar bastante. Em Aprender você vê como encontrar um, inclusive pelo SUS.`;
}

/** Ícone do hábito na avaliação: folego (tabaco), calmaria (álcool) e foco (sexual). */
export const ICONE_TIPO = { tabaco: 'folego', alcool: 'calmaria', sexual: 'foco' } as const;

/** Apelido sugerido por tipo (discreto). */
export const APELIDO_SUGERIDO: Record<TipoHabito, string> = { tabaco: 'Fôlego', alcool: 'Calmaria', sexual: 'Foco' };

/** Cor sugerida por tipo, combinando com o ícone do mockup. */
export const COR_SUGERIDA = { tabaco: 'aqua', alcool: 'peri', sexual: 'coral' } as const;
