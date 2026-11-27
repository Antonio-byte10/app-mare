/** Lógica pura de "Meu plano": porquês e planos "Se..., então...". */
import type { PlanoSeEntao, Porque } from './tipos';

export const MAX_PORQUE = 280;
export const MAX_PLANO = 140;

/** Ações comuns para o "então" (a pessoa pode escrever a própria). */
export const SUGESTOES_ENTAO = [
  'beber um copo de água gelada',
  'respirar fundo por 1 minuto',
  'abrir a Fissura agora',
  'sair para uma caminhada curta',
  'tomar um banho',
  'ligar para alguém de confiança',
  'deixar o celular em outro cômodo',
  'escovar os dentes',
];

/** Situações comuns para o "se". */
export const SUGESTOES_SE = [
  'eu sentir vontade depois do café',
  'eu estiver sozinho à noite',
  'eu estiver numa festa ou num bar',
  'eu sentir muita ansiedade',
  'eu acordar sentindo vontade',
  'eu tiver um dia estressante',
];

export type ResultadoTexto = { valor: string; erro?: undefined } | { valor?: undefined; erro: string };

/** Porquê: texto de 1 a `MAX_PORQUE` caracteres. */
export function validarPorque(texto: string): ResultadoTexto {
  const t = texto.trim();
  if (t === '') return { erro: 'Escreva o seu porquê.' };
  if (t.length > MAX_PORQUE) return { erro: `Use até ${MAX_PORQUE} caracteres.` };
  return { valor: t };
}

/**
 * Porquê que pode ser só uma foto: com `temFoto`, o texto pode ficar vazio (mas, se houver, vale
 * a mesma regra de `validarPorque`). Sem texto e sem foto, pede uma das duas.
 */
export function validarPorqueOuFoto(texto: string, temFoto: boolean): ResultadoTexto {
  if (temFoto && texto.trim() === '') return { valor: '' };
  const r = validarPorque(texto);
  return r.erro !== undefined && texto.trim() === '' ? { erro: 'Escreva o seu porquê ou escolha uma foto.' } : r;
}

/** Como o porquê é lido por quem usa leitor de tela: o texto, ou "foto" quando é só a imagem. */
export const descreverPorque = (p: Pick<Porque, 'texto' | 'foto'>): string =>
  p.texto.trim() !== '' ? p.texto : p.foto ? 'foto' : '';

/** "Se" e "então" não podem ficar vazios; os dois são aparados e limitados. */
export function validarPlano(se: string, entao: string): { se: string; entao: string } | { erro: string } {
  const s = se.trim().replace(/[,.]+$/, '');
  const e = entao.trim().replace(/[,.]+$/, '');
  if (s === '') return { erro: 'Conte em que situação o plano vale.' };
  if (e === '') return { erro: 'Conte o que você vai fazer.' };
  if (s.length > MAX_PLANO || e.length > MAX_PLANO) return { erro: `Use até ${MAX_PLANO} caracteres em cada parte.` };
  return { se: s, entao: e };
}

/** "Se eu sentir ansiedade, então respirar fundo." */
export function frasePlano(p: Pick<PlanoSeEntao, 'se' | 'entao'>): string {
  return `Se ${p.se}, então ${p.entao}.`;
}

/** Do mais novo para o mais antigo. */
export const maisNovosPrimeiro = <T extends { criadoEm: number }>(lista: T[]): T[] =>
  [...lista].sort((a, b) => b.criadoEm - a.criadoEm);

/** Sugestões que a pessoa ainda não usou como "então". */
export function sugestoesLivres(lista: string[], usados: string[]): string[] {
  const feitos = new Set(usados.map((u) => u.trim().toLowerCase()));
  return lista.filter((s) => !feitos.has(s.toLowerCase()));
}

/** As ações do plano, para mostrar em "Ainda difícil" (as mais novas primeiro). */
export function acoesDoPlano(planos: PlanoSeEntao[], habitoId?: string): PlanoSeEntao[] {
  return maisNovosPrimeiro(planos.filter((p) => !p.habitoId || !habitoId || p.habitoId === habitoId));
}

export const porquesOrdenados = (porques: Porque[]) => maisNovosPrimeiro(porques);
