/** Conversões puras dos campos do formulário de hábito. */
import { dataLocal, dataValida } from './datas';
import type { Habito } from './tipos';

export type Resultado<T> = { valor: T; erro?: undefined } | { valor?: undefined; erro: string };

/** "15,50" (reais) -> 1550 centavos. Vazio -> undefined (campo opcional). */
export function paraCentavos(texto: string): Resultado<number | undefined> {
  const t = texto.replace(/R\$/gi, '').replace(/\s/g, '');
  if (t === '') return { valor: undefined };
  // "1.234,56": se há vírgula, os pontos são separador de milhar.
  const normal = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
  if (!/^\d+(\.\d{1,2})?$/.test(normal)) return { erro: 'Use um valor como 15,50.' };
  const [reais, cents = ''] = normal.split('.');
  return { valor: Number(reais) * 100 + Number(cents.padEnd(2, '0')) };
}

/** 1550 -> "15,50". */
export const centavosParaTexto = (c: number) => (c / 100).toFixed(2).replace('.', ',');

/** "24/11/2026" -> "2026-11-24". Rejeita data inexistente. */
export function brParaIso(texto: string): Resultado<string> {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return { erro: 'Use o formato DD/MM/AAAA.' };
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  if (!dataValida(iso)) return { erro: 'Essa data não existe.' };
  return { valor: iso };
}

/** "2026-11-24" -> "24/11/2026". */
export const isoParaBr = (iso: string) => iso.split('-').reverse().join('/');

/** Quantos anos para trás o início pode ir. Mais que isso é quase sempre erro de digitação. */
export const MAX_ANOS_INICIO = 20;

/**
 * Data de início: formato válido, não futura e de no máximo `MAX_ANOS_INICIO` anos atrás (`hoje` é
 * "AAAA-MM-DD"). O contador percorre dia a dia desde o início: "01/01/1900" travaria as telas.
 */
export function validarInicio(texto: string, hoje = dataLocal(new Date())): Resultado<string> {
  const r = brParaIso(texto);
  if (r.erro !== undefined) return r;
  if (r.valor > hoje) return { erro: 'A data não pode ser no futuro.' };
  const limite = `${Number(hoje.slice(0, 4)) - MAX_ANOS_INICIO}${hoje.slice(4)}`;
  if (r.valor < limite) return { erro: `Use uma data dos últimos ${MAX_ANOS_INICIO} anos.` };
  return r;
}

/** Inteiro positivo opcional ("" -> undefined). */
export function inteiroPositivo(texto: string, obrigatorio = false): Resultado<number | undefined> {
  const t = texto.trim();
  if (t === '') return obrigatorio ? { erro: 'Informe um número maior que zero.' } : { valor: undefined };
  if (!/^\d+$/.test(t) || Number(t) <= 0) return { erro: 'Informe um número maior que zero.' };
  return { valor: Number(t) };
}

/**
 * `true` se a edição muda quais relatos contam: só a data de início faz isso. Mudar a meta não
 * reescreve o passado (cada relato guarda o estado do dia com a meta de então).
 */
export function recalculaHistorico(antigo: Habito, novo: Habito): boolean {
  return antigo.inicio !== novo.inicio;
}

/** Limite de "Já estou há N dias": dez anos bastam e evitam números absurdos. */
export const MAX_DIAS_ANTES = 3650;

/**
 * "Já estou há N dias" (opcional). Vazio ou 0 -> undefined. Aceita só inteiros positivos até
 * `MAX_DIAS_ANTES`.
 */
export function diasAntesDeTexto(texto: string): Resultado<number | undefined> {
  const t = texto.trim();
  if (t === '' || /^0+$/.test(t)) return { valor: undefined };
  if (!/^\d+$/.test(t)) return { erro: 'Informe só o número de dias.' };
  const n = Number(t);
  if (n > MAX_DIAS_ANTES) return { erro: `Use até ${MAX_DIAS_ANTES} dias.` };
  return { valor: n };
}
