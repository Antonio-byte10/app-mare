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

/** Data de início: formato válido e não futura (`hoje` é "AAAA-MM-DD"). */
export function validarInicio(texto: string, hoje = dataLocal(new Date())): Resultado<string> {
  const r = brParaIso(texto);
  if (r.erro !== undefined) return r;
  if (r.valor > hoje) return { erro: 'A data não pode ser no futuro.' };
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
 * `true` se a edição muda como os relatos já salvos são lidos (tipo, tipo de meta, limite por dia
 * ou início): os dias anteriores são recalculados com a nova regra.
 */
export function recalculaHistorico(antigo: Habito, novo: Habito): boolean {
  if (antigo.tipo !== novo.tipo || antigo.inicio !== novo.inicio) return true;
  if (antigo.meta.tipo !== novo.meta.tipo) return true;
  return antigo.meta.tipo === 'reduzir' && novo.meta.tipo === 'reduzir' && antigo.meta.maxPorDia !== novo.meta.maxPorDia;
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
