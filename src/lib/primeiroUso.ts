/** Lógica pura do primeiro uso: rascunho dos hábitos e conversão para `Habito`. */
import { APELIDO_SUGERIDO, COR_SUGERIDA } from './avaliacao';
import { diasAntesDeTexto, inteiroPositivo } from './formulario';
import type { Habito, TipoHabito } from './tipos';

export const UNIDADE_PADRAO: Record<TipoHabito, string> = { tabaco: 'cigarros', alcool: 'doses', sexual: 'vezes' };

export const ROTULO_TIPO: Record<TipoHabito, string> = {
  tabaco: 'Cigarro ou nicotina',
  alcool: 'Álcool',
  sexual: 'Pornografia ou masturbação',
};

/** Frase curta sob o tipo, sem termos explícitos. */
export const DICA_TIPO: Record<TipoHabito, string> = {
  tabaco: 'inclui vape, narguilé e palheiro',
  alcool: 'cerveja, vinho, destilados',
  sexual: 'você define a sua própria meta',
};

export const TIPOS_ORDEM: TipoHabito[] = ['tabaco', 'alcool', 'sexual'];

export type Comecou = 'hoje' | 'ja';

/** Um hábito ainda sendo montado (campos de texto como a pessoa digitou). */
export interface RascunhoHabito {
  tipo: TipoHabito;
  apelido: string;
  cor: Habito['cor'];
  reduzir: boolean;
  maxPorDia: string;
  unidade: string;
  comecou: Comecou;
  /** "Já estou há N dias" (só vale com `comecou: 'ja'`). */
  diasAntes: string;
}

export function rascunhoPadrao(tipo: TipoHabito): RascunhoHabito {
  return {
    tipo,
    apelido: APELIDO_SUGERIDO[tipo],
    cor: COR_SUGERIDA[tipo],
    reduzir: false,
    maxPorDia: '',
    unidade: UNIDADE_PADRAO[tipo],
    comecou: 'hoje',
    diasAntes: '',
  };
}

/** Adiciona ou tira um tipo da escolha, mantendo a ordem fixa (tabaco, álcool, sexual) e o que já foi editado. */
export function alternarTipo(lista: RascunhoHabito[], tipo: TipoHabito): RascunhoHabito[] {
  if (lista.some((r) => r.tipo === tipo)) return lista.filter((r) => r.tipo !== tipo);
  const novo = rascunhoPadrao(tipo);
  return [...lista, novo].sort((a, b) => TIPOS_ORDEM.indexOf(a.tipo) - TIPOS_ORDEM.indexOf(b.tipo));
}

export type ErrosRascunho = Partial<Record<'apelido' | 'maxPorDia' | 'unidade' | 'diasAntes', string>>;

/** Erros do rascunho (vazio = pode seguir). Apelidos repetidos entre hábitos também são erro. */
export function errosDoRascunho(r: RascunhoHabito, todos: RascunhoHabito[] = []): ErrosRascunho {
  const erros: ErrosRascunho = {};
  const apelido = r.apelido.trim();
  if (apelido === '') erros.apelido = 'Dê um apelido ao hábito.';
  else if (todos.some((o) => o !== r && o.apelido.trim().toLowerCase() === apelido.toLowerCase())) {
    erros.apelido = 'Já existe um hábito com esse apelido.';
  }
  if (r.reduzir) {
    const limite = inteiroPositivo(r.maxPorDia, true);
    if (limite.erro) erros.maxPorDia = limite.erro;
    if (r.unidade.trim() === '') erros.unidade = 'Informe a unidade (ex.: cigarros).';
  }
  if (r.comecou === 'ja') {
    const n = diasAntesDeTexto(r.diasAntes);
    if (n.erro) erros.diasAntes = n.erro;
    else if (n.valor === undefined) erros.diasAntes = 'Quantos dias? Se começou hoje, escolha "Hoje".';
  }
  return erros;
}

export const temErros = (e: ErrosRascunho) => Object.values(e).some(Boolean);

/** Rascunho válido -> `Habito`. O início é sempre `hoje`; os dias de antes vão em `diasAntes`. */
export function montarHabito(r: RascunhoHabito, id: string, hoje: string, agora: number): Habito {
  return {
    id,
    tipo: r.tipo,
    apelido: r.apelido.trim(),
    cor: r.cor,
    meta: r.reduzir
      ? { tipo: 'reduzir', maxPorDia: inteiroPositivo(r.maxPorDia).valor as number, unidade: r.unidade.trim() }
      : { tipo: 'parar' },
    inicio: hoje,
    ...(r.comecou === 'ja' ? { diasAntes: diasAntesDeTexto(r.diasAntes).valor } : {}),
    criadoEm: agora,
  };
}

/** Etapas do primeiro uso que contam no "Passo X de Y" (a avaliação tem a barra dela). */
export type EtapaPrimeiroUso = 'habitos' | 'configurar' | 'avaliacao' | 'seguranca' | 'porques';

/**
 * "Passo X de Y" do primeiro uso. O aviso do álcool só existe para quem escolheu álcool, então
 * o total é 4, ou 5 com ele. `null` para uma etapa que não existe nesse caminho.
 */
export function passoDoPrimeiroUso(
  etapa: EtapaPrimeiroUso,
  habitos: Pick<Habito, 'tipo'>[],
): { atual: number; total: number; texto: string } | null {
  const alcool = habitos.some((h) => h.tipo === 'alcool');
  const etapas: EtapaPrimeiroUso[] = alcool
    ? ['habitos', 'configurar', 'avaliacao', 'seguranca', 'porques']
    : ['habitos', 'configurar', 'avaliacao', 'porques'];
  const indice = etapas.indexOf(etapa);
  if (indice < 0) return null;
  return { atual: indice + 1, total: etapas.length, texto: `Passo ${indice + 1} de ${etapas.length}` };
}

/** Depois da avaliação (ou de pular): álcool pede o aviso de segurança; senão, os porquês. */
export const proximaDepoisDaAvaliacao = (habitos: Pick<Habito, 'tipo'>[]) =>
  habitos.some((h) => h.tipo === 'alcool') ? ('/boas-vindas/seguranca' as const) : ('/boas-vindas/porques' as const);
