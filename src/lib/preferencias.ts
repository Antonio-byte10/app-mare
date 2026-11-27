/** Leitura segura dos ajustes do Plano 3 (lembretes, bloqueio, disfarce), sempre com padrão. */
import type { Ajustes } from './estado';
import type { AjustesBloqueio, AjustesLembretes, Disfarce } from './tipos';

export const LEMBRETES_PADRAO: AjustesLembretes = {
  relato: { ligado: true, hora: '22:00' },
  bomDia: { ligado: false, hora: '08:00' },
  antesDaOnda: true,
  marcos: true,
};

export const BLOQUEIO_PADRAO: AjustesBloqueio = { ligado: false, biometria: true, aposMinutos: 1, ondaLivre: false };

export const DISFARCES: { id: Disfarce; nome: string; descricao: string }[] = [
  { id: 'mare', nome: 'Maré', descricao: 'o nome e o símbolo do app' },
  { id: 'diario', nome: 'Diário', descricao: 'parece um caderno de anotações' },
  { id: 'notas', nome: 'Notas', descricao: 'parece um bloco de notas' },
  { id: 'calma', nome: 'Calma', descricao: 'parece um app de respiração' },
];

const ehHorario = (v: unknown): v is string => typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
const ehObjeto = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

function rotina(v: unknown, padrao: { ligado: boolean; hora: string }) {
  if (!ehObjeto(v)) return padrao;
  return {
    ligado: typeof v.ligado === 'boolean' ? v.ligado : padrao.ligado,
    hora: ehHorario(v.hora) ? v.hora : padrao.hora,
  };
}

export function lembretesDe(a: Pick<Ajustes, 'lembretes'>): AjustesLembretes {
  const l: unknown = a.lembretes;
  if (!ehObjeto(l)) return LEMBRETES_PADRAO;
  return {
    relato: rotina(l.relato, LEMBRETES_PADRAO.relato),
    bomDia: rotina(l.bomDia, LEMBRETES_PADRAO.bomDia),
    antesDaOnda: typeof l.antesDaOnda === 'boolean' ? l.antesDaOnda : LEMBRETES_PADRAO.antesDaOnda,
    marcos: typeof l.marcos === 'boolean' ? l.marcos : LEMBRETES_PADRAO.marcos,
  };
}

export function bloqueioDe(a: Pick<Ajustes, 'bloqueio'>): AjustesBloqueio {
  const b: unknown = a.bloqueio;
  if (!ehObjeto(b)) return BLOQUEIO_PADRAO;
  const min = b.aposMinutos;
  return {
    ligado: b.ligado === true,
    biometria: b.biometria !== false,
    aposMinutos: typeof min === 'number' && Number.isInteger(min) && min >= 0 && min <= 60 ? min : BLOQUEIO_PADRAO.aposMinutos,
    ondaLivre: b.ondaLivre === true,
  };
}

/** Telas protegidas: o que a pessoa escolheu; sem escolha, acompanha o bloqueio (ligado com ele). */
export function protegerTelaDe(a: Pick<Ajustes, 'protegerTela' | 'bloqueio'>): boolean {
  return typeof a.protegerTela === 'boolean' ? a.protegerTela : bloqueioDe(a).ligado;
}

export function disfarceDe(a: Pick<Ajustes, 'disfarce'>): Disfarce {
  return DISFARCES.some((d) => d.id === a.disfarce) ? (a.disfarce as Disfarce) : 'mare';
}

/** Nome mostrado na tela do celular e no título das notificações. */
export const nomeDisfarce = (a: Pick<Ajustes, 'disfarce'>) =>
  DISFARCES.find((d) => d.id === disfarceDe(a))?.nome ?? 'Maré';
