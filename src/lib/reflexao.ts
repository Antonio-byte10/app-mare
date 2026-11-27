/**
 * "Reflexão semanal": um olhar gentil sobre os últimos 7 dias de cada hábito. Lógica pura (sem
 * Expo/React Native); a tela está em `src/app/reflexao.tsx`.
 *
 * Janela: os 7 dias COMPLETOS que terminam ontem (de hoje-7 a hoje-1), nunca o dia de hoje. Assim
 * o dia corrente, que quase sempre ainda não foi relatado, não vira um falso "sem relato" e o
 * número não muda enquanto a pessoa olha. A semana anterior são os 7 dias antes desses (hoje-14 a
 * hoje-8). Dias antes do início do hábito não contam em nenhuma das duas.
 *
 * Nada aqui julga: um deslize é uma informação, nunca um "fracasso".
 */
import { estadoDaEntrada, normalizarRelatoHabito } from './contador';
import { dataLocal, deslocarDia, meioDia } from './datas';
import { contarGatilhos, GATILHOS_FISSURA, idDoGatilho, normalizarGatilho, type GatilhoContado } from './gatilhos';
import { mediaCircular } from './lembretes/antesDaOnda';
import { economia, type Economia } from './marcos';
import { GATILHOS } from '../conteudo/gatilhos';
import { NOMES_DIAS } from './insights';
import { sugestaoPlano } from './recomeco';
import type { Fissura, Habito, Recomeco, Relato, TipoHabito } from './tipos';

export const DIAS_SEMANA = 7;
/** Com menos relatos que isso na semana, não há o que resumir: a tela mostra um convite gentil. */
export const MIN_RELATOS_SEMANA = 2;
/** Passagens pela Fissura na semana para falar de um horário. */
export const MIN_FISSURAS_HORA = 3;
/** Concentração mínima (0 a 1) dos horários da Fissura para valer como padrão. */
export const MIN_CONCENTRACAO_HORA = 0.5;
/** Vontade mínima (0 a 10) do dia para ele ser apontado como o mais pesado da semana. */
export const VONTADE_DIA_PESADO = 5;
/** Relatos mínimos para apontar o dia mais pesado. */
export const MIN_RELATOS_DIA_PESADO = 3;
/** Diferença mínima (na proporção de dias bons) para dizer que a semana foi melhor ou pior. */
export const MARGEM_COMPARACAO = 0.1;
/** Diferença mínima (em pontos de 0 a 10) da vontade média para comentar. */
export const MARGEM_VONTADE = 1;

export type Janela = { inicio: string; fim: string };

/** A semana que a reflexão olha: de hoje-7 a ontem. */
export const janelaDaSemana = (hoje: string): Janela => ({ inicio: deslocarDia(hoje, -DIAS_SEMANA), fim: deslocarDia(hoje, -1) });

/** A semana de comparação: os 7 dias antes da janela da semana. */
export const janelaAnterior = (hoje: string): Janela => ({
  inicio: deslocarDia(hoje, -2 * DIAS_SEMANA),
  fim: deslocarDia(hoje, -DIAS_SEMANA - 1),
});

type Contagem = {
  livres: number;
  dentroDaMeta: number;
  deslizes: number;
  /** Dias da janela (desde o início do hábito) sem relato do hábito. */
  semRelato: number;
  relatados: number;
  /** Livres + dentro da meta. */
  diasBons: number;
  /** Soma da quantidade dos dias com uso (hábitos de reduzir). */
  quantidade: number;
  vontades: { dia: string; vontade: number }[];
};

function contarJanela(h: Habito, relatos: readonly Relato[], j: Janela): Contagem {
  const c: Contagem = { livres: 0, dentroDaMeta: 0, deslizes: 0, semRelato: 0, relatados: 0, diasBons: 0, quantidade: 0, vontades: [] };
  const porDia = new Map<string, Relato['habitos'][number]>();
  for (const r of relatos) {
    if (r.dia < j.inicio || r.dia > j.fim || r.dia < h.inicio) continue;
    const entrada = r.habitos.find((x) => x.habitoId === h.id);
    if (entrada) porDia.set(r.dia, entrada);
  }
  for (let d = j.inicio; d <= j.fim; d = deslocarDia(d, 1)) {
    if (d < h.inicio) continue;
    const bruta = porDia.get(d);
    if (!bruta) {
      c.semRelato += 1;
      continue;
    }
    const entrada = normalizarRelatoHabito(bruta);
    const estado = estadoDaEntrada(h.meta, entrada);
    c.relatados += 1;
    c.vontades.push({ dia: d, vontade: entrada.vontade });
    if (estado === 'livre') c.livres += 1;
    else if (estado === 'dentroDaMeta') c.dentroDaMeta += 1;
    else c.deslizes += 1;
    if (entrada.usou) c.quantidade += entrada.quantidade ?? 0;
  }
  c.diasBons = c.livres + c.dentroDaMeta;
  return c;
}

const media = (v: number[]) => (v.length ? v.reduce((t, n) => t + n, 0) / v.length : null);

export type Comparacao = 'mais' | 'menos' | 'igual' | 'semBase';

/**
 * Compara a proporção de dias bons (livres ou dentro da meta, entre os dias relatados), e não a
 * contagem: uma semana com menos relatos não parece pior só por ter menos dias registrados.
 * Sem pelo menos `MIN_RELATOS_SEMANA` relatos em uma das semanas, não há base: `semBase`.
 */
export function compararSemanas(
  atual: Pick<Contagem, 'relatados' | 'diasBons'>,
  anterior: Pick<Contagem, 'relatados' | 'diasBons'>,
): Comparacao {
  if (atual.relatados < MIN_RELATOS_SEMANA || anterior.relatados < MIN_RELATOS_SEMANA) return 'semBase';
  const dif = atual.diasBons / atual.relatados - anterior.diasBons / anterior.relatados;
  if (dif > MARGEM_COMPARACAO) return 'mais';
  if (dif < -MARGEM_COMPARACAO) return 'menos';
  return 'igual';
}

export type DiaPesado = { dia: string; diaSemana: number; vontade: number };

/** O dia de vontade mais alta da semana; `null` se há poucos relatos, a vontade é baixa ou há empate no topo. */
export function diaMaisPesado(vontades: { dia: string; vontade: number }[]): DiaPesado | null {
  if (vontades.length < MIN_RELATOS_DIA_PESADO) return null;
  const ordem = [...vontades].sort((a, b) => b.vontade - a.vontade);
  const [primeiro, segundo] = ordem;
  if (primeiro.vontade < VONTADE_DIA_PESADO || (segundo && segundo.vontade === primeiro.vontade)) return null;
  return { dia: primeiro.dia, diaSemana: meioDia(primeiro.dia).getDay(), vontade: primeiro.vontade };
}

/** Horário (minutos do dia, a cada 5) em que as passagens pela Fissura se concentram; `null` sem padrão. */
export function horaMaisPesada(fissuras: readonly Fissura[]): number | null {
  if (fissuras.length < MIN_FISSURAS_HORA) return null;
  const m = mediaCircular(
    fissuras.map((f) => {
      const d = new Date(f.inicio);
      return d.getHours() * 60 + d.getMinutes();
    }),
  );
  return m && m.concentracao >= MIN_CONCENTRACAO_HORA ? m.minutos : null;
}

export type QuantidadeSemana = {
  total: number;
  /** Total da semana anterior; `null` se ela não teve relatos. */
  anterior: number | null;
  maxPorDia: number;
  unidade: string;
};

export type SemanaHabito = {
  habitoId: string;
  tipo: TipoHabito;
  /** O hábito tem meta de reduzir (e não de parar). */
  reduzir: boolean;
  janela: Janela;
  livres: number;
  dentroDaMeta: number;
  deslizes: number;
  semRelato: number;
  relatados: number;
  /** Livres + dentro da meta. */
  diasBons: number;
  comparacao: Comparacao;
  /** Dias bons da semana anterior (só para mostrar); `null` sem relatos nela. */
  diasBonsAnterior: number | null;
  /** Só em hábitos de reduzir. */
  quantidade: QuantidadeSemana | null;
  /** Vontade média (0 a 10) dos relatos da semana; `null` sem relatos. */
  vontadeMedia: number | null;
  vontadeMediaAnterior: number | null;
  diaPesado: DiaPesado | null;
  /** Minutos do dia em que as ondas se concentraram; `null` sem padrão. */
  horaPesada: number | null;
  fissurasVencidas: number;
  /** "Recomeçar com cuidado" feitos para deslizes da semana. */
  recomecos: number;
  /** Os 3 gatilhos que mais apareceram na semana. */
  gatilhos: GatilhoContado[];
  /** O que deixou de gastar (dinheiro e unidades) na semana; `null` sem dado ou sem nada a mostrar. */
  economia: Economia | null;
};

export type ResumoSemana = {
  janela: Janela;
  habitos: SemanaHabito[];
};

/** Economia só da janela: a de hoje até o fim dela menos a de antes do início dela. */
function economiaDaJanela(h: Habito, relatos: readonly Relato[], j: Janela): Economia | null {
  const todos = [...relatos];
  const ate = economia(h, todos, j.fim);
  const antes = economia(h, todos, deslocarDia(j.inicio, -1));
  if (!ate || !antes) return null;
  const e = { centavos: Math.max(0, ate.centavos - antes.centavos), unidades: Math.max(0, ate.unidades - antes.unidades) };
  return e.centavos > 0 || e.unidades > 0 ? e : null;
}

const ehDoHabito = (id: string | undefined, habitoId: string) => id === undefined || id === habitoId;

/**
 * Resumo da semana (ver a janela no topo do arquivo). Sem `habitoId`, um item por hábito; com ele,
 * só o desse hábito. Fissuras e planos sem hábito contam para todos.
 */
export function resumoDaSemana(
  habitos: readonly Habito[],
  relatos: readonly Relato[],
  fissuras: readonly Fissura[],
  recomecos: readonly Recomeco[],
  hoje: string,
  habitoId?: string,
): ResumoSemana {
  const janela = janelaDaSemana(hoje);
  const anterior = janelaAnterior(hoje);
  const doPeriodo = (dia: string) => dia >= janela.inicio && dia <= janela.fim;

  const itens = habitos
    .filter((h) => habitoId === undefined || h.id === habitoId)
    .map((h): SemanaHabito => {
      const atual = contarJanela(h, relatos, janela);
      const antes = contarJanela(h, relatos, anterior);
      const reduzir = h.meta.tipo === 'reduzir';
      const fissurasDoHabito = fissuras.filter((f) => ehDoHabito(f.habitoId, h.id) && doPeriodo(dataLocal(f.inicio)));
      const relatosDoHabito = relatos.filter((r) => r.habitos.some((x) => x.habitoId === h.id));
      return {
        habitoId: h.id,
        tipo: h.tipo,
        reduzir,
        janela,
        livres: atual.livres,
        dentroDaMeta: atual.dentroDaMeta,
        deslizes: atual.deslizes,
        semRelato: atual.semRelato,
        relatados: atual.relatados,
        diasBons: atual.diasBons,
        comparacao: compararSemanas(atual, antes),
        diasBonsAnterior: antes.relatados > 0 ? antes.diasBons : null,
        quantidade:
          h.meta.tipo === 'reduzir'
            ? {
                total: atual.quantidade,
                anterior: antes.relatados > 0 ? antes.quantidade : null,
                maxPorDia: h.meta.maxPorDia,
                unidade: h.meta.unidade,
              }
            : null,
        vontadeMedia: media(atual.vontades.map((v) => v.vontade)),
        vontadeMediaAnterior: media(antes.vontades.map((v) => v.vontade)),
        diaPesado: diaMaisPesado(atual.vontades),
        horaPesada: horaMaisPesada(fissurasDoHabito),
        fissurasVencidas: fissurasDoHabito.filter((f) => f.venceu).length,
        recomecos: recomecos.filter((r) => r.habitoId === h.id && doPeriodo(r.dia)).length,
        gatilhos: contarGatilhos({
          fissuras: fissurasDoHabito,
          relatos: relatosDoHabito,
          hoje: janela.fim,
          dias: DIAS_SEMANA,
          limite: 3,
        }),
        economia: economiaDaJanela(h, relatos, janela),
      };
    });

  return { janela, habitos: itens };
}

/** Há relatos suficientes para a reflexão desse hábito? */
export const semanaTemDados = (s: Pick<SemanaHabito, 'relatados'>) => s.relatados >= MIN_RELATOS_SEMANA;

// ---------------------------------------------------------------------------------------------
// Frases

type Vocabulario = {
  /** Poucos relatos na semana. */
  poucos: string;
  semDeslize: string;
  umDeslize: string;
  variosDeslizes: (n: number) => string;
  /** Semana em que a maioria dos dias foi com deslize: o esforço de olhar para ela é o que se celebra. */
  pesada: (dias: number) => string;
};

const INFORMACAO = 'Ele é informação, não um veredito.';

const VOCABULARIO: Record<TipoHabito, Vocabulario> = {
  tabaco: {
    poucos: 'Com poucos relatos nesta semana ainda não dá para ver um desenho. Cada registro ajuda a enxergar melhor o seu fôlego.',
    semDeslize: 'Uma semana sem deslizes: foi mais fôlego para você, um dia de cada vez.',
    umDeslize: `A semana teve um deslize. ${INFORMACAO} O que ele te ensina sobre os momentos em que a vontade de fumar aperta?`,
    variosDeslizes: (n) =>
      `A semana teve ${n} deslizes. Eles dizem o que está pesando, não quem você é. O que mudou nos momentos em que a vontade de fumar apertou?`,
    pesada: (n) =>
      `Foi uma semana difícil para o seu fôlego e para o seu ânimo. Você registrou ${n} dias mesmo assim, e olhar para ela de frente já é cuidar de você.`,
  },
  alcool: {
    poucos: 'Com poucos relatos nesta semana ainda não dá para ver um desenho. Cada registro ajuda a enxergar melhor as suas noites.',
    semDeslize: 'Uma semana sem deslizes: noites mais tranquilas, uma de cada vez.',
    umDeslize: `A semana teve um deslize. ${INFORMACAO} O que ele te ensina sobre as noites em que a vontade de beber aperta?`,
    variosDeslizes: (n) =>
      `A semana teve ${n} deslizes. Eles dizem o que está pesando nas suas noites, não quem você é. O que poderia ser diferente da próxima vez?`,
    pesada: (n) =>
      `Foi uma semana de noites difíceis. Você registrou ${n} dias mesmo assim, e olhar para ela de frente já é cuidar de você.`,
  },
  sexual: {
    poucos: 'Com poucos relatos nesta semana ainda não dá para ver um desenho. Cada registro ajuda a enxergar melhor como você usa o seu tempo e a sua atenção.',
    semDeslize: 'Uma semana sem deslizes: você cuidou do seu tempo e da sua atenção.',
    umDeslize: `A semana teve um deslize. ${INFORMACAO} O que ele te ensina sobre o que puxa a vontade?`,
    variosDeslizes: (n) =>
      `A semana teve ${n} deslizes. Eles dizem o que está pesando, não quem você é. O que poderia ser diferente na próxima vez?`,
    pesada: (n) =>
      `Foi uma semana difícil para o seu tempo e a sua atenção. Você registrou ${n} dias mesmo assim, e olhar para ela de frente já é cuidar de você.`,
  },
};

const plural = (n: number, singular: string, mais: string) => `${n} ${n === 1 ? singular : mais}`;

/** "aos sábados" / "às sextas". */
export const nosDias = (diaSemana: number) => `${diaSemana === 0 || diaSemana === 6 ? 'aos' : 'às'} ${NOMES_DIAS[diaSemana]}`;

/** Minutos do dia em linguagem solta: "por volta das 21h", "por volta da 1h". */
export function horaAproximada(minutos: number): string {
  const h = Math.round(minutos / 60) % 24;
  if (h === 0) return 'por volta da meia-noite';
  return `por volta ${h === 1 ? 'da' : 'das'} ${h}h`;
}

const formatarNumero = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

function frasesDeComparacao(s: SemanaHabito): string[] {
  const dias = s.reduzir ? 'dias dentro da meta' : 'dias livres';
  if (s.comparacao === 'mais') return [`Você teve mais ${dias} do que na semana passada.`];
  if (s.comparacao === 'menos') return [`Esta semana teve menos ${dias} que a anterior. Semanas oscilam, e isso não apaga o caminho que você já fez.`];
  if (s.comparacao === 'igual') return ['O ritmo foi parecido com o da semana passada: constância também é conquista.'];
  return [];
}

/** O esforço da semana: a primeira coisa que couber, para celebrar mesmo nas semanas difíceis. */
function fraseDeEsforco(s: SemanaHabito): string | null {
  if (s.fissurasVencidas > 0) {
    return `Você enfrentou ${plural(s.fissurasVencidas, 'onda', 'ondas')} de vontade e passou por ${s.fissurasVencidas === 1 ? 'ela' : 'elas'}. Isso é esforço de verdade.`;
  }
  if (s.recomecos > 0) return 'Você parou para olhar com cuidado um deslize. Isso conta muito.';
  const q = s.quantidade;
  if (q && q.anterior !== null && q.total !== q.anterior) {
    return q.total < q.anterior
      ? `Você usou ${q.total} ${q.unidade} no total, menos que os ${q.anterior} da semana passada.`
      : `Foram ${q.total} ${q.unidade} no total, um pouco mais que os ${q.anterior} da semana passada. Vale notar o que mudou, sem pressa.`;
  }
  if (s.vontadeMedia !== null && s.vontadeMediaAnterior !== null) {
    if (s.vontadeMedia <= s.vontadeMediaAnterior - MARGEM_VONTADE) return 'A sua vontade média ficou mais baixa que na semana passada.';
    if (s.vontadeMedia >= s.vontadeMediaAnterior + MARGEM_VONTADE) {
      return 'A sua vontade média foi mais alta que na semana passada. Perceber isso já ajuda a se preparar.';
    }
  }
  if (s.relatados >= 5) return `Você registrou ${s.relatados} dias nesta semana. Olhar para o próprio dia já é um cuidado.`;
  return null;
}

/** Uma sugestão curta, ligada ao que a semana mostrou. */
function fraseDeSugestao(s: SemanaHabito): string | null {
  const g = s.gatilhos[0];
  if (g) return `O que mais puxou a onda foi ${g.rotulo.toLowerCase()}. Que tal um plano “se-então” para esse momento?`;
  if (s.diaPesado) return `As vontades foram mais altas ${nosDias(s.diaPesado.diaSemana)}. Vale se preparar para esse dia.`;
  if (s.horaPesada !== null) return `As ondas vieram ${horaAproximada(s.horaPesada)}. Vale se preparar para esse horário.`;
  return null;
}

/**
 * De 2 a 4 frases calmas para a semana, escolhidas por regras: abertura (sem deslizes, um, vários ou
 * semana pesada), comparação com a semana passada, o esforço e, por fim, uma sugestão ligada aos
 * dados. Com poucos relatos, só um convite a registrar. Nunca é aconselhamento médico.
 */
export function frasesDaReflexao(s: SemanaHabito, tipo: TipoHabito = s.tipo): string[] {
  const v = VOCABULARIO[tipo];
  if (!semanaTemDados(s)) return [v.poucos];

  const frases: string[] = [];
  if (s.deslizes === 0) frases.push(v.semDeslize);
  else if (s.deslizes / s.relatados > 0.5) frases.push(v.pesada(s.relatados));
  else if (s.deslizes === 1) frases.push(v.umDeslize);
  else frases.push(v.variosDeslizes(s.deslizes));

  frases.push(...frasesDeComparacao(s));
  const esforco = fraseDeEsforco(s);
  if (esforco) frases.push(esforco);
  const sugestao = fraseDeSugestao(s);
  if (sugestao) frases.push(sugestao);

  if (frases.length < 2) frases.push('Seu ritmo é o ritmo certo. Até a próxima semana.');
  return frases.slice(0, 4);
}

// ---------------------------------------------------------------------------------------------
// Ações da tela

const SE_DO_GATILHO: Record<string, string> = {
  fome: 'eu estiver com fome',
  raiva: 'eu estiver com raiva',
  solidao: 'eu estiver sentindo solidão',
  cansaco: 'eu estiver com muito cansaço',
  estresse: 'eu estiver com muito estresse',
  tedio: 'eu sentir tédio',
  lugar: 'eu estiver naquele lugar que costuma puxar a vontade',
  pessoas: 'eu estiver com as pessoas que costumam puxar a vontade',
  celular: 'eu estiver com o celular na mão',
  ansiedade: 'eu sentir ansiedade',
  festa: 'eu estiver numa festa ou num evento',
  discussao: 'eu tiver uma discussão',
};

/** O "Se..." para um gatilho guardado como texto (rótulo do relato ou do Recomeçar); `undefined` se for livre. */
export const seDoGatilhoTexto = (texto: string): string | undefined => {
  const id = idDoGatilho(texto);
  return id ? SE_DO_GATILHO[id] : undefined;
};

/** O "Se..." do plano para um gatilho da semana (o `chave` de `contarGatilhos`). */
export function seDoGatilho(g: GatilhoContado): string {
  return SE_DO_GATILHO[g.chave] ?? sugestaoPlano({ gatilhos: [g.rotulo], halt: [], proximaVez: '' }).se;
}

const GATILHOS_CONHECIDOS = new Set<string>([...GATILHOS_FISSURA.map((g) => g.id), ...GATILHOS.map(normalizarGatilho)]);

/**
 * Abertura da Conversa com a IA sobre a semana. Só números agregados e gatilhos da lista do app:
 * nunca o apelido, notas, nem gatilhos digitados à mão (que podem ter nomes ou detalhes).
 */
export function inicioConversaDaSemana(s: SemanaHabito): string {
  const partes = [`${plural(s.livres, 'dia livre', 'dias livres')}`];
  if (s.reduzir) partes.push(plural(s.dentroDaMeta, 'dia dentro da meta', 'dias dentro da meta'));
  partes.push(plural(s.deslizes, 'dia com deslize', 'dias com deslize'));
  if (s.semRelato > 0) partes.push(plural(s.semRelato, 'dia sem relato', 'dias sem relato'));
  const extras: string[] = [];
  if (s.vontadeMedia !== null) extras.push(`A minha vontade média foi ${formatarNumero(s.vontadeMedia)} de 10.`);
  if (s.fissurasVencidas > 0) extras.push(`Passei por ${plural(s.fissurasVencidas, 'onda', 'ondas')} de vontade.`);
  const conhecidos = s.gatilhos.filter((g) => GATILHOS_CONHECIDOS.has(g.chave));
  if (conhecidos.length > 0) extras.push(`O que mais pesou: ${conhecidos.map((g) => g.rotulo.toLowerCase()).join(', ')}.`);
  const comparacao =
    s.comparacao === 'mais'
      ? 'Foi melhor que a semana anterior.'
      : s.comparacao === 'menos'
        ? 'Foi mais difícil que a semana anterior.'
        : s.comparacao === 'igual'
          ? 'Foi parecida com a semana anterior.'
          : '';
  return [
    `Quero conversar sobre a minha semana, com calma e sem me culpar. Em números: ${partes.join(', ')}.`,
    ...extras,
    comparacao,
    'O que você enxerga nisso, e o que posso tentar na próxima?',
  ]
    .filter(Boolean)
    .join(' ');
}

// ---------------------------------------------------------------------------------------------
// Cartão do Início

/** Domingo (ou o mais recente até hoje): a "semana da reflexão". Domingo e segunda dão a mesma chave. */
export const chaveDaReflexao = (hoje: string): string => deslocarDia(hoje, -meioDia(hoje).getDay());

/** O cartão "Sua semana" aparece aos domingos e às segundas. */
export const ehDiaDaReflexao = (hoje: string): boolean => {
  const d = meioDia(hoje).getDay();
  return d === 0 || d === 1;
};

/**
 * O cartão "Sua semana" do Início: domingo ou segunda, com relatos suficientes em algum hábito e
 * sem a pessoa ter aberto a reflexão desta semana (`vistaEm`, a chave guardada em `reflexaoVistaEm`).
 */
export function deveMostrarCartaoReflexao(hoje: string, vistaEm: string | undefined, resumo: ResumoSemana): boolean {
  return ehDiaDaReflexao(hoje) && vistaEm !== chaveDaReflexao(hoje) && resumo.habitos.some(semanaTemDados);
}
