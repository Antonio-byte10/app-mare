/** Lógica pura do "Recomeçar com cuidado" (spec 6.5). */
import { estadoDaEntrada, normalizarRelatoHabito } from './contador';
import type { Habito, Halt, Recomeco, Relato } from './tipos';

export const OPCOES_HALT: { id: Halt; rotulo: string }[] = [
  { id: 'fome', rotulo: 'Fome' },
  { id: 'raiva', rotulo: 'Raiva' },
  { id: 'solidao', rotulo: 'Solidão' },
  { id: 'cansaco', rotulo: 'Cansaço' },
];

export const alternarItem = <T>(lista: T[], item: T): T[] =>
  lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];

type Entrada = {
  id: string;
  dia: string;
  habitoId: string;
  gatilhos: string[];
  halt: Halt[];
  oQueAcontecia: string;
  proximaVez: string;
  agora: number;
};

/** Monta o registro; textos vazios ficam de fora. */
export function montarRecomeco({ id, dia, habitoId, gatilhos, halt, oQueAcontecia, proximaVez, agora }: Entrada): Recomeco {
  const r: Recomeco = { id, dia, habitoId, gatilhos, halt, salvoEm: agora };
  const o = oQueAcontecia.trim();
  const p = proximaVez.trim();
  if (o) r.oQueAcontecia = o;
  if (p) r.proximaVez = p;
  return r;
}

const SE_GATILHO: Record<string, string> = {
  Ansiedade: 'eu sentir ansiedade',
  Tédio: 'eu sentir tédio',
  Solidão: 'eu estiver sentindo solidão',
  Cansaço: 'eu estiver com muito cansaço',
  Estresse: 'eu estiver com muito estresse',
  'Celular à noite': 'eu estiver com o celular na mão à noite',
  'Festa ou evento': 'eu estiver numa festa ou num evento',
  Discussão: 'eu tiver uma discussão',
};

const SE_HALT: Record<Halt, string> = {
  fome: 'eu estiver com fome',
  raiva: 'eu estiver com raiva',
  solidao: 'eu estiver sentindo solidão',
  cansaco: 'eu estiver com muito cansaço',
};

/**
 * Ponto de partida do plano "Se..., então...": a situação vem do primeiro gatilho (ou do primeiro
 * item do HALT) e a ação, do que a pessoa escreveu em "O que pode ser diferente".
 */
export function sugestaoPlano(r: Pick<Recomeco, 'gatilhos' | 'halt' | 'proximaVez'>): { se: string; entao: string } {
  const g = r.gatilhos[0];
  const se = g ? (SE_GATILHO[g] ?? `acontecer: ${g.toLowerCase()}`) : r.halt[0] ? SE_HALT[r.halt[0]] : '';
  return { se, entao: r.proximaVez?.trim() ?? '' };
}

/** Recomeço já salvo para o mesmo deslize (dia + hábito), para editar em vez de duplicar. */
export const recomecoExistente = (recomecos: Recomeco[], dia: string, habitoId: string): Recomeco | undefined =>
  recomecos.find((r) => r.dia === dia && r.habitoId === habitoId);

/** Ações comuns para "o que pode ser diferente da próxima vez". */
export const SUGESTOES_PROXIMA_VEZ = [
  'respirar antes de decidir',
  'beber água e esperar 10 minutos',
  'falar com alguém de confiança',
  'sair do lugar onde estou',
  'deixar o celular longe',
];

/** Frase curta, sem nomes nem detalhes, que abre a Conversa com a IA depois de um deslize. */
export const INICIO_CONVERSA_RECOMECO = 'Tive um deslize e quero entender o que aconteceu, sem me culpar.';

/**
 * Hábitos com deslize registrado em `relato` que ainda não passaram pelo "Recomeçar com cuidado"
 * (a pessoa tocou em "Depois"). Ids na ordem dos hábitos.
 */
export function deslizesSemRecomeco(habitos: Habito[], relato: Relato | undefined, recomecos: Recomeco[], dia: string): string[] {
  if (!relato) return [];
  return habitos
    .filter((h) => {
      const entrada = relato.habitos.find((x) => x.habitoId === h.id);
      return entrada !== undefined && estadoDaEntrada(h.meta, normalizarRelatoHabito(entrada)) === 'deslize';
    })
    .filter((h) => !recomecoExistente(recomecos, dia, h.id))
    .map((h) => h.id);
}
