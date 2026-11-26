import { economia, nomeMarco, type EstadoMarco } from './marcos';
import { textoEconomia } from './inicio';
import type { Habito, Relato, TipoHabito } from './tipos';

/** Legenda da coluna de unidades do Trio; `null` esconde a coluna (sexual). */
export function rotuloUnidades(tipo: TipoHabito): string | null {
  if (tipo === 'tabaco') return 'cigarros a menos';
  if (tipo === 'alcool') return 'doses a menos';
  return null;
}

export type ColunaTrio = { valor: string; rotulo: string; cor?: 'sand' };

/**
 * Colunas do Trio dos Marcos. "Fissuras vencidas" fica em 0 até o Plano 2.
 * Sem custo ou sem unidades por dia, a coluna mostra "—".
 */
export function colunasMarcos(h: Habito, relatos: Relato[], hoje: string): ColunaTrio[] {
  const colunas: ColunaTrio[] = [{ valor: '0', rotulo: 'fissuras vencidas' }];
  const rotulo = rotuloUnidades(h.tipo);
  if (rotulo) {
    const e = economia(h, relatos, hoje);
    colunas.push({ valor: e && h.unidadesPorDia ? String(e.unidades) : '—', rotulo });
  }
  colunas.push({ valor: textoEconomia(h, relatos, hoje), rotulo: 'no bolso', cor: 'sand' });
  return colunas;
}

/** Título de um marco na linha do tempo; só o marco atual leva "faltam N dias" (e só com números visíveis). */
export function tituloMarco(
  dias: number,
  estado: EstadoMarco,
  sequencia: number,
  ocultarNumeros: boolean,
): string {
  const nome = nomeMarco(dias);
  if (estado !== 'atual' || ocultarNumeros) return nome;
  const faltam = dias - sequencia;
  return `${nome} · ${faltam === 1 ? 'falta 1 dia' : `faltam ${faltam} dias`}`;
}

/** Progresso de 0 a 1 da barra do marco atual: sequência / dias do marco. */
export function progressoMarco(dias: number, sequencia: number): number {
  return Math.min(1, Math.max(0, sequencia / dias));
}
