/**
 * Detecção de crise SEM IA (spec 7.3): padrões em português para risco de suicídio/autolesão,
 * intoxicação/overdose e abstinência alcoólica grave. Roda em todo texto que a pessoa escreve
 * (relato do dia, "Recomeçar com cuidado", Conversa com IA) e não depende de nenhum modelo.
 *
 * Princípio: é melhor mostrar um cartão de cuidado a mais do que deixar passar uma crise de
 * verdade. Mesmo assim, brincadeiras comuns ("morrendo de rir", "me mata de vergonha") não disparam.
 *
 * Como funciona: o texto é normalizado (minúsculas, sem acento, sem pontuação, letras repetidas
 * viram uma só: "morreeer" -> "morer"). Os padrões abaixo são escritos sem acento e passam pela
 * mesma regra de letras repetidas em `compilar` ("morrer" e "alcool" valem como "morer" e "alcol"),
 * então tanto "morrer" quanto "morreeer" casam.
 */
export type TipoCrise = 'suicidio' | 'intoxicacao' | 'abstinencia';

/** Minúsculas, sem acentos, só letras/números/espaços e sem letras repetidas em sequência. */
export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/([a-z])\1+/g, '$1')
    .trim();
}

/** Aplica aos padrões a mesma regra de letras repetidas do texto (sem mexer nos escapes como `\b`). */
const compilar = (padroes: RegExp[]): RegExp[] =>
  padroes.map((p) => new RegExp(p.source.replace(/\\.|([a-z])\1+/g, (m, letra) => (letra ? letra : m))));

/** Exagero do dia a dia que vem depois de "morrer de..." / "me matar de...". */
const EXAGERO =
  '(tanto )?(ri|rir|vergonha|fome|sono|calor|frio|saudade|saudades|curiosidade|inveja|preguica|medo|cansaco|trabalhar|estudar|treinar|correr|ciume|dor de cabeca)';

const SUICIDIO: RegExp[] = compilar([
  // "quero morrer", "queria morrer", "vontade de morrer", "penso em morrer" (menos "morrer de rir").
  new RegExp(
    `\\b(quero|queria|vontade de|penso em|pensando em|pensei em|desejo de|prefiro|melhor)\\s+(eu\\s+)?(me\\s+)?morer\\b(?!\\s+de\\s+${EXAGERO})`,
  ),
  /\bqueria (estar )?mort[oa]\b/,
  // "vou me matar", "quero me matar", "pensando em me enforcar" (menos "me matar de trabalhar").
  new RegExp(
    `\\b(quero|queria|vou|vontade de|penso em|pensando em|pensei em|decidi)\\s+(me\\s+)?(mata|matar|suicidar|enforcar)\\b(?!\\s+de\\s+${EXAGERO})(?!\\s+(a|o|essa|esta|minha|meu)\\s+(vontade|saudade|fome|sede|tempo|fissura|tedio|aula|trabalho|curiosidade))`,
  ),
  // "tentei me matar", "já tentei me matar", "cogitando me envenenar": aqui o "me" é obrigatório.
  new RegExp(
    `\\b(tentei|tento|tentando|tentar|cogitei|cogitando|planejando|preciso|ia|quero|queria|vou|penso em|pensando em)\\s+me\\s+(matar|suicidar|enforcar|envenenar|afogar)\\b(?!\\s+de\\s+${EXAGERO})`,
  ),
  // Primeira pessoa sem verbo antes: "me mato", "me matei", "me enforquei" (menos "me matei de trabalhar").
  new RegExp(`\\bme (mato|matei|enforco|enforquei|envenenei)\\b(?!\\s+de\\s+${EXAGERO})`),
  /\b(vou|quero|queria|vontade de|penso em|pensando em|pensei em) (pular|me jogar|me atirar) (da|do|de|na|no|pela|pelo) (ponte|predio|janela|viaduto|sacada|laje|varanda|trem|metro)\b/,
  /\b(vou|quero|queria|vontade de) acabar comigo\b/,
  // Autolesão.
  /\b(quero|queria|vou|vontade de|penso em|pensando em)\s+(me\s+)?(machucar|automutilar|ferir)\b/,
  // "Cortar" sozinho é como muita gente diz "parar" ("quero cortar o cigarro"): só conta com "me" ou parte do corpo.
  /\b(quero|queria|vou|vontade de|penso em|pensando em|voltei a|voltando a)\s+me\s+cortar\b/,
  /\bcortar (os |o |meus |meu |a |minha |as |minhas )?(pulsos|pulso|braco|bracos|pele|pernas|coxa|coxas)\b/,
  /\bme (corto|cortando)\b|\bme cortei\b(?!\s+(sem querer|cozinhando|fazendo|com (a |o )?(faca|papel|vidro|lamina)))/,
  /\bautomutila(cao|r|ndo)\b|\bme cortar de proposito\b/,
  /\bsuicid(io|ar|arme|ando)\b|\bsucid(io|ar)\b|\bsuisid(io|ar)\b/,
  /\b(pensamentos?|ideias?) suicidas?\b/,
  // Desistir de viver.
  // "não consigo viver sem cigarro" fala da vontade, não de desistir da vida.
  /\bnao (aguento|suporto|quero|consigo)( mais)? viver\b(?!\s+sem\b)|\bnao quero viver mais\b|\bnao aguento mais (a |essa |esta )?vida\b/,
  /\bnao aguento mais (sofrer|existir|essa dor|esta dor|tudo isso|tanta dor)\b/,
  /\bnao (quero|queria) mais existir\b|\bqueria nao existir\b|\bnao queria existir\b/,
  /\b(quero|queria|vontade de) (sumir|desaparecer)\b/,
  /\bnao vale (mais )?a pena (viver|continuar)\b|\ba vida nao vale (mais )?a pena\b/,
  /\bpra que (viver|continuar vivo|continuar viva)\b|\bcansei da vida\b|\bsou um (fardo|peso) (pra|para) (todos|todo mundo|minha familia|eles)\b/,
  /\bqueria dormir (pra|para) sempre\b|\bnao vejo (mais )?saida\b/,
  /\b(cansei|cansad[oa]|farto|farta) de viver\b/,
  /\bnao (vejo|tenho) (mais )?(sentido|motivo|razao|saida)\b.{0,20}\b(viver|vida|existir)\b/,
  /\bnao (tenho|ha) (mais )?(motivo|razao|porque|por que|nada) (pra|para|de) (viver|continuar vivo|continuar viva|seguir vivendo)\b/,
  /\b(acabar|acabo|acabei|vou acabar) (com )?(tudo|a minha vida|minha vida|com minha vida|com a minha vida|com a propria vida)\b/,
  /\b(tirar|tiro|tirei|tirando) (a )?(minha|propria) (propria )?vida\b/,
  /\bdar fim (a|na) (minha )?(propria )?vida\b|\bdar um fim em tudo\b/,
  /\b(todos|todo mundo|ninguem|as pessoas) (ficaria|ficariam|estaria|estariam|sentiria|sentiriam|iria sentir|iam sentir|ia sentir|vai sentir)( melhor| bem| a)?.{0,25}(sem mim|minha falta|falta de mim)\b/,
  /\b(seria|ficaria|era|estaria) melhor sem mim\b/,
  /\bseria melhor se eu (morese|nao existise|nao estivese aqui|desaparecese)\b/,
  /\bqueria (nunca ter nascido|sumir pra sempre|desaparecer pra sempre|nao acordar mais|dormir e nao acordar)\b/,
  /\bnao (queria|quero) (mais )?acordar\b|\bdormir e nao acordar (nunca )?mais\b/,
  // Meios.
  /\b(tomar|tomei|vou tomar|engolir)\s+(todos|todas|tudo|a cartela|a caixa|um monte de|uma cartela).{0,25}(para|pra) (morer|me matar|acabar)\b/,
  // Overdose de remédio (menos a rotina: "tomei todos os remédios do dia").
  /\b(tomei|engoli|vou tomar|vou engolir|quero tomar|quero engolir)\s+(todos|todas|tudo|a cartela|uma cartela|a caixa|uma caixa|um monte de|varios|varias)\b.{0,25}\b(remedios?|comprimidos?|pilulas?|cartela|caixa|medicamentos?|calmantes?)\b(?!\s+(do dia|de hoje|da manha|da noite|certinho|no horario|direitinho))/,
  /\bme (jogar|atirar) (da|do|de|na|no|em) (ponte|predio|janela|viaduto|trem|metro|frente de um|frente do)\b/,
  /\bme dar um tiro\b(?! no pe)/,
]);

const INTOXICACAO: RegExp[] = compilar([
  /\bover ?do[sz]e\b|\bovedose\b|\bovrdose\b/,
  /\bintoxica(cao|do|da)\b.{0,20}\b(alcool|droga|remedio|bebida|cocaina|crack|medicamento)\b|\b(alcool|droga|remedio|bebida|cocaina|crack|medicamento)\b.{0,20}\bintoxica(cao|do|da)\b/,
  /\bcoma etilico\b|\bintoxicacao alcoolica\b|\bintoxicacao por (droga|drogas|remedio|medicamento|alcool)\b/,
  /\b(bebi|bebeu|usei|usou|cheirei|cheirou|fumei|fumou|tomei|tomou|injetei|injetou)\b.{0,50}\b(nao (acorda|respira|responde|reage|consigo acordar)|desmai(ou|ei)|apagou|esta (roxo|roxa|gelado|gelada))\b/,
  /\b(nao (acorda|respira|responde|reage)|desmai(ou|ei)|ficou (roxo|roxa))\b.{0,50}\b(bebeu|bebi|usou|usei|cheirou|tomou|tomei|droga|alcool|bebida|remedio|cocaina|crack)\b/,
  /\bbebi (demais|muito|um monte)\b.{0,30}\b(nao consigo (levantar|andar|falar|respirar)|vomitando sem parar|vomitando muito|passando muito mal|coracao disparado)\b/,
  /\b(passando|passei) (muito )?mal\b.{0,30}\b(depois de|apos|de tanto)\b.{0,15}\b(beber|bebida|usar|droga|cocaina|crack|remedio)\b/,
  /\btomei (remedio|comprimido|comprimidos|pilula|pilulas|cartela|caixa) (demais|de mais|em excesso|a mais)\b/,
]);

const ABSTINENCIA: RegExp[] = compilar([
  /\bconvuls(ao|oes|ionando|ionei|ionou|ionar)\b/,
  /\bdelirium\b|\bdelirio tremens\b/,
  /\balucin(acao|acoes|ando|ei|ou)\b/,
  /\b(vendo|ouvindo|ver|ouvir|vi|ouvi)( umas?| uns| varias?)? (bichos|vozes|vultos|sombras|coisas que nao existem|coisas que nao estao la|cobras|insetos)\b/,
  /\bconfusao mental\b|\bdesorientad[oa]\b|\bnao sei (onde|quem) (eu )?(estou|sou|to)\b/,
  /\b(muito|completamente|totalmente) confus[oa]\b.{0,40}\b(alcool|bebi|bebida|parei de beber|abstinencia)\b/,
  /\b(tremor|tremores)( muito)? (forte|fortes|intenso|intensos|violento|violentos|pelo corpo|no corpo)\b/,
  /\bfortes? tremor(es)?\b/,
  /\btremedeira (forte|muito forte|que nao para|intensa)\b/,
  /\b(corpo|maos|bracos|pernas)( todo| toda| inteiro)? tremendo (muito|sem parar|forte|demais)\b(?! de (frio|rir|medo|nervoso|emocao))/,
  /\b(tremendo|tremo) (muito|todo|toda|inteiro|inteira|sem parar|demais)\b(?! de (frio|rir|medo|nervoso|nervosa|emocao|raiva))/,
  /\bparei de beber\b.{0,70}\b(tremendo|tremor|tremores|tremedeira|convuls|alucin|confus|suando frio|vendo coisas|ouvindo vozes)\b/,
  /\babstinencia (alcoolica )?(grave|forte|pesada|severa)\b/,
]);

const em = (padroes: RegExp[], texto: string) => padroes.some((p) => p.test(texto));

/**
 * Procura sinais de crise num texto. Devolve o tipo mais urgente encontrado
 * (suicídio/autolesão, depois intoxicação, depois abstinência grave) ou `null`.
 */
export function detectarCrise(texto: string): TipoCrise | null {
  const t = normalizarTexto(texto ?? '');
  if (t === '') return null;
  if (em(SUICIDIO, t)) return 'suicidio';
  if (em(INTOXICACAO, t)) return 'intoxicacao';
  if (em(ABSTINENCIA, t)) return 'abstinencia';
  return null;
}

const PRIORIDADE: TipoCrise[] = ['suicidio', 'intoxicacao', 'abstinencia'];

/** Roda `detectarCrise` em vários textos (campos vazios são ignorados) e devolve o mais urgente. */
export function detectarCriseEmTextos(textos: (string | undefined | null)[]): TipoCrise | null {
  const achados = textos.map((t) => (t ? detectarCrise(t) : null)).filter((t): t is TipoCrise => t !== null);
  return PRIORIDADE.find((p) => achados.includes(p)) ?? null;
}
