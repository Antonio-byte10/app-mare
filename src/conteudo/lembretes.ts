/**
 * Textos das notificações. Regra de ouro (spec 7.1): nunca citam o hábito, o apelido, a substância,
 * contagem de dias "sem..." nem o nome do app. O título é sempre o nome do disfarce escolhido.
 * `lembretes.test.ts` confere essas regras.
 */

export const TEXTO_RELATO = 'Como foi seu dia? Leva um minuto.';

export const TEXTO_ANTES_DA_ONDA = 'Esse costuma ser um horário mais pesado. Se precisar, a onda está a um toque.';

export const TEXTO_MARCO = 'Hoje é um dia para notar. Vale um momento só pra isso.';

export const TEXTO_REFLEXAO = 'Sua semana está pronta para um olhar gentil.';

/** Frases curtas e calmas do "Bom dia". Uma por dia, em rodízio (ver `fraseDoDia`). */
export const FRASES_BOM_DIA: readonly string[] = [
  'Respire fundo. O dia começa devagar.',
  'Hoje você pode ir no seu ritmo.',
  'Seja gentil com você hoje.',
  'Um copo de água e um passo de cada vez.',
  'Você não precisa dar conta de tudo agora.',
  'Que o dia seja leve. Vai com calma.',
  'Abra a janela, respire. Já é um bom começo.',
  'Hoje vale cuidar de você.',
  'O que importa hoje cabe em um passo pequeno.',
  'Você já chegou até aqui. Siga com calma.',
  'Dê a si mesmo o mesmo cuidado que daria a um amigo.',
  'Hoje pode ser simples. E isso basta.',
  'Um minuto de silêncio antes de começar o dia.',
  'Seu ritmo é o ritmo certo.',
  'Escolha uma coisa boa para fazer por você hoje.',
  'Comece pelo que for mais fácil.',
  'Se o dia pesar, faça uma pausa. Você pode.',
  'Hoje, mais um dia para cuidar do que é seu.',
  'Alongue o corpo, solte os ombros. Bom dia.',
  'A calma também é uma escolha. Ela está aí.',
];

const DIA_MS = 86_400_000;

/**
 * Frase do "Bom dia" de um dia ("AAAA-MM-DD"): rodízio pelas frases, então dois dias seguidos nunca
 * repetem e o mesmo dia sempre dá a mesma frase (reagendar não troca a frase).
 */
export function fraseDoDia(dia: string): string {
  const [a, m, d] = dia.split('-').map(Number);
  // Dias desde 1970 pela data civil (UTC), sem depender do fuso do aparelho.
  const n = Math.floor(Date.UTC(a, m - 1, d) / DIA_MS);
  return FRASES_BOM_DIA[((n % FRASES_BOM_DIA.length) + FRASES_BOM_DIA.length) % FRASES_BOM_DIA.length];
}
