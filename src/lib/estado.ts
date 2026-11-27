import { estadoDoDia, normalizarRelatoHabito } from './contador';
import type {
  AjustesBloqueio,
  AjustesIa,
  AjustesLembretes,
  Disfarce,
  Avaliacao,
  Contato,
  Fissura,
  Habito,
  Meta,
  MensagemConversa,
  PlanoSeEntao,
  Porque,
  Recomeco,
  Relato,
  RelatoHabito,
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
  /** Plano 3. Ausente = padrão; leia sempre por `lembretesDe` / `bloqueioDe` / `disfarceDe` (src/lib/preferencias.ts). */
  lembretes?: AjustesLembretes;
  bloqueio?: AjustesBloqueio;
  disfarce?: Disfarce;
  /** Esconde o conteúdo do app na lista de apps recentes e impede capturas de tela (FLAG_SECURE). */
  protegerTela?: boolean;
  /** Quando foi feito o último backup cifrado (ms). Ausente = nunca. */
  ultimoBackupEm?: number;
  /** Quando o app sugeriu fazer backup pela última vez (ms), para não insistir. */
  backupSugeridoEm?: number;
  /** Última "semana da reflexão" aberta (domingo "AAAA-MM-DD", ver `chaveDaReflexao`), para o cartão do Início não insistir. */
  reflexaoVistaEm?: string;
  /** A dica "toque na onda" do Início já foi vista ou dispensada (aparece uma vez só). */
  dicaOndaVista?: boolean;
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
  contatos: Contato[];
};

export const VERSAO_ESTADO = 2;

/** Listas novas da versão 2; todas começam vazias. */
const LISTAS = ['avaliacoes', 'porques', 'planos', 'fissuras', 'recomecos', 'conversa', 'contatos'] as const;

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
    contatos: [],
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
  // Grava o estado do dia com a meta de agora: mudar a meta depois não reescreve este dia.
  const comEstado = (x: RelatoHabito): RelatoHabito => {
    const n = normalizarRelatoHabito(x);
    const habito = e.habitos.find((h) => h.id === n.habitoId);
    return habito ? { ...n, estado: estadoDoDia(habito.meta, n) } : n;
  };
  const normalizado: Relato = { ...r, habitos: r.habitos.map(comEstado) };
  const existe = e.relatos.some((x) => x.dia === r.dia);
  const relatos = existe
    ? e.relatos.map((x) => (x.dia === r.dia ? normalizado : x))
    : [...e.relatos, normalizado];
  return { ...e, relatos };
}

const mesmaMeta = (a: Meta, b: Meta) =>
  a.tipo === b.tipo && (a.tipo === 'parar' || (b.tipo === 'reduzir' && a.maxPorDia === b.maxPorDia));

export function aplicarHabito(e: EstadoPersistido, h: Habito): EstadoPersistido {
  const antigo = e.habitos.find((x) => x.id === h.id);
  const habitos = antigo ? e.habitos.map((x) => (x.id === h.id ? h : x)) : [...e.habitos, h];
  if (!antigo || mesmaMeta(antigo.meta, h.meta)) return { ...e, habitos };
  // A meta mudou: os dias já relatados ficam como estavam (congela os antigos, sem estado gravado).
  const relatos = e.relatos.map((r) =>
    r.habitos.some((x) => x.habitoId === h.id && x.estado === undefined)
      ? {
          ...r,
          habitos: r.habitos.map((x) =>
            x.habitoId === h.id && x.estado === undefined
              ? { ...x, estado: estadoDoDia(antigo.meta, normalizarRelatoHabito(x)) }
              : x,
          ),
        }
      : r,
  );
  return { ...e, habitos, relatos };
}

const temConteudoDoDia = (r: Relato) => r.humor !== undefined || (r.gatilhos?.length ?? 0) > 0 || !!r.nota?.trim();

/**
 * Remove o hábito e as entradas dele em todos os relatos. O relato do dia só some quando não
 * guarda mais nada (humor, gatilhos ou nota continuam). Planos e fissuras do hábito passam a
 * valer para todos, em vez de ficarem escondidos para sempre.
 */
export function aplicarRemocaoHabito(e: EstadoPersistido, id: string): EstadoPersistido {
  const relatos = e.relatos
    .map((r) => ({ ...r, habitos: r.habitos.filter((x) => x.habitoId !== id) }))
    .filter((r) => r.habitos.length > 0 || temConteudoDoDia(r));
  const habitos = e.habitos.filter((h) => h.id !== id);
  const ajustes =
    e.ajustes.habitoAtivo === id ? { ...e.ajustes, habitoAtivo: undefined } : e.ajustes;
  const semHabito = <T extends { habitoId?: string }>(x: T): T => {
    if (x.habitoId !== id) return x;
    const { habitoId: _removido, ...resto } = x;
    return resto as T;
  };
  return { ...e, habitos, relatos, ajustes, planos: e.planos.map(semHabito), fissuras: e.fissuras.map(semHabito) };
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
