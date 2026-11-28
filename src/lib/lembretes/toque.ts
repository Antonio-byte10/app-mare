/** Para onde o toque numa notificação leva. Só aceita rotas conhecidas: o `data` nunca é confiado. */
import { dataValida } from '../datas';

export const ROTA_INICIO = '/';
export const ROTA_FISSURA = '/fissura';
export const ROTA_MARCOS = '/marcos';
export const ROTA_REFLEXAO = '/reflexao';
export const rotaRelato = (dia: string) => `/relato/${dia}`;

export const CATEGORIA_ONDA = 'antes_da_onda';
export const ACAO_ABRIR_ONDA = 'abrir_onda';

/** Rota guardada no `data` da notificação, ou `null` se não for uma das rotas do app. */
export function rotaDaNotificacao(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return null;
  const rota = (data as Record<string, unknown>).rota;
  if (typeof rota !== 'string') return null;
  if (rota === ROTA_INICIO || rota === ROTA_FISSURA || rota === ROTA_MARCOS || rota === ROTA_REFLEXAO) return rota;
  const m = /^\/relato\/(\d{4}-\d{2}-\d{2})$/.exec(rota);
  return m && dataValida(m[1]) ? rota : null;
}

/** Decide para qual rota navegar a partir de um toque na notificação ou em um botão dela. */
export function rotaDaResposta(actionIdentifier: string, defaultAction: string, data: unknown): string | null {
  if (actionIdentifier === ACAO_ABRIR_ONDA) return ROTA_FISSURA;
  if (actionIdentifier === defaultAction) return rotaDaNotificacao(data);
  return null;
}
