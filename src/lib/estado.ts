import { normalizarRelatoHabito } from './contador';
import type { Habito, Relato } from './tipos';

export type Ajustes = { habitoAtivo?: string; ocultarNumeros: boolean };

export type EstadoPersistido = {
  versao: 1;
  habitos: Habito[];
  relatos: Relato[];
  ajustes: Ajustes;
};

export const VERSAO_ESTADO = 1;

export function estadoInicial(): EstadoPersistido {
  return { versao: 1, habitos: [], relatos: [], ajustes: { ocultarNumeros: false } };
}

/** Um relato por dia: salvar de novo no mesmo dia substitui o anterior. */
export function aplicarRelato(e: EstadoPersistido, r: Relato): EstadoPersistido {
  const normalizado: Relato = { ...r, habitos: r.habitos.map(normalizarRelatoHabito) };
  const existe = e.relatos.some((x) => x.dia === r.dia);
  const relatos = existe
    ? e.relatos.map((x) => (x.dia === r.dia ? normalizado : x))
    : [...e.relatos, normalizado];
  return { ...e, relatos };
}

export function aplicarHabito(e: EstadoPersistido, h: Habito): EstadoPersistido {
  const existe = e.habitos.some((x) => x.id === h.id);
  const habitos = existe ? e.habitos.map((x) => (x.id === h.id ? h : x)) : [...e.habitos, h];
  return { ...e, habitos };
}

/** Remove o hábito e as entradas dele em todos os relatos; relatos que ficam vazios somem. */
export function aplicarRemocaoHabito(e: EstadoPersistido, id: string): EstadoPersistido {
  const relatos = e.relatos
    .map((r) => ({ ...r, habitos: r.habitos.filter((x) => x.habitoId !== id) }))
    .filter((r) => r.habitos.length > 0);
  const habitos = e.habitos.filter((h) => h.id !== id);
  const ajustes =
    e.ajustes.habitoAtivo === id ? { ...e.ajustes, habitoAtivo: undefined } : e.ajustes;
  return { ...e, habitos, relatos, ajustes };
}

const ehObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

/** Versão desconhecida ou dados fora do formato viram o estado vazio, nunca erro. */
export function migrar(estado: unknown, versao: number): EstadoPersistido {
  if (versao !== VERSAO_ESTADO) return estadoInicial();
  if (!ehObjeto(estado) || !Array.isArray(estado.habitos) || !Array.isArray(estado.relatos)) {
    return estadoInicial();
  }
  const ajustes = ehObjeto(estado.ajustes) ? estado.ajustes : {};
  return {
    versao: 1,
    habitos: estado.habitos as Habito[],
    relatos: estado.relatos as Relato[],
    ajustes: {
      ...(typeof ajustes.habitoAtivo === 'string' ? { habitoAtivo: ajustes.habitoAtivo } : {}),
      ocultarNumeros: ajustes.ocultarNumeros === true,
    },
  };
}
