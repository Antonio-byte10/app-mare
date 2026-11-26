import { normalizarRelatoHabito } from './contador';
import type {
  AjustesIa,
  Avaliacao,
  Fissura,
  Habito,
  MensagemConversa,
  PlanoSeEntao,
  Porque,
  Recomeco,
  Relato,
} from './tipos';

export type Ajustes = {
  habitoAtivo?: string;
  ocultarNumeros: boolean;
  /** Primeiro uso (abertura + avaliação) concluído. */
  onboardingConcluido: boolean;
  /** Mostra CVV 188 / SAMU 192 na Fissura e o cartão de crise. Padrão: ligado. */
  contatosEmergencia: boolean;
  /** IA configurada. Sem isso, a aba Conversa não aparece. */
  ia?: AjustesIa;
};

export type EstadoPersistido = {
  versao: 2;
  habitos: Habito[];
  relatos: Relato[];
  ajustes: Ajustes;
  avaliacoes: Avaliacao[];
  porques: Porque[];
  planos: PlanoSeEntao[];
  fissuras: Fissura[];
  recomecos: Recomeco[];
  conversa: MensagemConversa[];
};

export const VERSAO_ESTADO = 2;

/** Listas novas da versão 2; todas começam vazias. */
const LISTAS = ['avaliacoes', 'porques', 'planos', 'fissuras', 'recomecos', 'conversa'] as const;

export function estadoInicial(): EstadoPersistido {
  return {
    versao: 2,
    habitos: [],
    relatos: [],
    ajustes: { ocultarNumeros: false, onboardingConcluido: false, contatosEmergencia: true },
    avaliacoes: [],
    porques: [],
    planos: [],
    fissuras: [],
    recomecos: [],
    conversa: [],
  };
}

/** Insere ou substitui pelo `id`, sem alterar a lista recebida. */
export function inserirOuTrocar<T extends { id: string }>(lista: T[], item: T): T[] {
  return lista.some((x) => x.id === item.id) ? lista.map((x) => (x.id === item.id ? item : x)) : [...lista, item];
}

/** Máximo de mensagens guardadas na Conversa (as mais antigas saem). */
export const MAX_CONVERSA = 200;

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

const iaValida = (v: unknown): v is AjustesIa =>
  ehObjeto(v) &&
  (v.provedor === 'gemini' || v.provedor === 'openai' || v.provedor === 'claude') &&
  (v.modo === 'direto' || v.modo === 'servidor') &&
  typeof v.modelo === 'string';

/** Leva o estado da versão `n` para a `n + 1`. Acrescentar aqui ao subir `VERSAO_ESTADO`. */
export type Migracao = (estado: Record<string, unknown>) => Record<string, unknown>;
const MIGRACOES: Record<number, Migracao> = {
  // 1 -> 2: listas novas vazias. Quem já tinha hábitos não passa de novo pelo primeiro uso.
  1: (e) => ({
    ...e,
    ajustes: {
      ...(ehObjeto(e.ajustes) ? e.ajustes : {}),
      onboardingConcluido: Array.isArray(e.habitos) && e.habitos.length > 0,
      contatosEmergencia: true,
    },
  }),
};

/** Aplica, em ordem, as migrações de `de` até `para` (`tabela[n]` leva da versão n à n + 1). */
export function aplicarMigracoes(
  estado: Record<string, unknown>,
  de: number,
  para: number,
  tabela: Record<number, Migracao> = MIGRACOES,
): Record<string, unknown> {
  let atual = estado;
  for (let v = de; v < para; v += 1) atual = tabela[v]?.(atual) ?? atual;
  return atual;
}

/** `true` se os dados vêm de uma versão do app mais nova do que esta. */
export const ehVersaoFutura = (versao: number) => versao > VERSAO_ESTADO;

/**
 * Leva o que estava salvo para o formato atual, mantendo os campos que este app não conhece
 * (de uma versão mais nova do mesmo formato ou de um complemento).
 * - versão mais nova que a atual, ou inválida: `null`. O chamador deve deixar os dados como
 *   estão, nunca trocar por vazio nem gravar por cima.
 * - dados fora do formato na versão atual viram o estado vazio.
 */
export function migrar(estado: unknown, versao: number): EstadoPersistido | null {
  if (!Number.isInteger(versao) || versao < 1 || ehVersaoFutura(versao)) return null;
  if (!ehObjeto(estado)) return estadoInicial();
  const migrado = aplicarMigracoes(estado, versao, VERSAO_ESTADO);
  if (!Array.isArray(migrado.habitos) || !Array.isArray(migrado.relatos)) return estadoInicial();
  const ajustes = ehObjeto(migrado.ajustes) ? migrado.ajustes : {};
  const { habitoAtivo, ia, ...ajustesExtras } = ajustes;
  const listas = Object.fromEntries(
    LISTAS.map((nome) => [nome, Array.isArray(migrado[nome]) ? migrado[nome] : []]),
  ) as Pick<EstadoPersistido, (typeof LISTAS)[number]>;
  return {
    ...migrado,
    ...listas,
    versao: 2,
    habitos: migrado.habitos as Habito[],
    relatos: migrado.relatos as Relato[],
    ajustes: {
      ...ajustesExtras,
      ...(typeof habitoAtivo === 'string' ? { habitoAtivo } : {}),
      ...(iaValida(ia) ? { ia } : {}),
      ocultarNumeros: ajustes.ocultarNumeros === true,
      onboardingConcluido: ajustes.onboardingConcluido === true,
      contatosEmergencia: ajustes.contatosEmergencia !== false,
    },
  };
}

/**
 * `merge` do store: o que estava salvo por cima do estado atual, passando sempre pelo `migrar`.
 * `null` quando os dados são de uma versão futura (o chamador mantém `atual` e sinaliza erro).
 */
export function mesclar<T extends EstadoPersistido>(persistido: unknown, atual: T): T | null {
  const migrado = migrar(persistido, VERSAO_ESTADO);
  return migrado ? { ...atual, ...migrado } : null;
}

/** O que vai para o disco: só dados, sem funções nem flags de sessão. Campos extras são mantidos. */
export function paraPersistir<T extends object>(estado: T, efemeros: readonly string[]): EstadoPersistido {
  const dados = Object.fromEntries(
    Object.entries(estado).filter(([chave, valor]) => typeof valor !== 'function' && !efemeros.includes(chave)),
  );
  return dados as unknown as EstadoPersistido;
}
