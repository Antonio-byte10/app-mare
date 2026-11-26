/** Estado do formulário do relato do dia e a conversão para `Relato`. */
import { inteiroPositivo } from './formulario';
import type { Habito, Relato, RelatoHabito, TipoHabito } from './tipos';

export type Rascunho = {
  /** `false`: o hábito ainda não foi respondido e fica de fora do relato. */
  respondido: boolean;
  vontade: number;
  usou: boolean;
  /** Texto digitado; só vale quando a meta é reduzir e o hábito foi usado. */
  quantidade: string;
};

export type Rascunhos = Record<string, Rascunho>;

/** Hábitos que já tinham começado no dia, na ordem em que foram criados. */
export const habitosDoDia = (habitos: Habito[], dia: string) => habitos.filter((h) => h.inicio <= dia);

const PERGUNTAS: Record<TipoHabito, string> = {
  tabaco: 'Você fumou hoje?',
  alcool: 'Você bebeu hoje?',
  sexual: 'Você usou hoje?',
};
export const perguntaUso = (tipo: TipoHabito) => PERGUNTAS[tipo];

/** Um rascunho por hábito ativo; carrega os valores do relato salvo, se houver. */
export function rascunhoInicial(ativos: Habito[], existente?: Relato): Rascunhos {
  const rascunhos: Rascunhos = {};
  for (const h of ativos) {
    const salvo = existente?.habitos.find((x) => x.habitoId === h.id);
    rascunhos[h.id] = salvo
      ? {
          respondido: true,
          vontade: salvo.vontade,
          usou: salvo.usou,
          quantidade: salvo.quantidade !== undefined ? String(salvo.quantidade) : '',
        }
      : { respondido: false, vontade: 0, usou: false, quantidade: '' };
  }
  return rascunhos;
}

/**
 * Hábito que abre expandido: o primeiro já respondido (ao editar, os que faltam continuam
 * recolhidos em "responder" e não entram no relato sem o toque da pessoa); sem nenhum, o primeiro.
 */
export function habitoAberto(ativos: Habito[], rascunhos: Rascunhos): string | undefined {
  return (ativos.find((h) => rascunhos[h.id]?.respondido) ?? ativos[0])?.id;
}

/**
 * Aplica uma mudança feita dentro do bloco do hábito. Só mexer no bloco (vontade, uso ou
 * quantidade) marca o hábito como respondido; abrir para olhar não grava nada.
 */
export function aplicarMudanca(rascunhos: Rascunhos, id: string, mudanca: Partial<Omit<Rascunho, 'respondido'>>): Rascunhos {
  return { ...rascunhos, [id]: { ...rascunhos[id], ...mudanca, respondido: true } };
}

/** Primeiro hábito respondido que não pode ser salvo (falta a quantidade). */
export const habitoComErro = (ativos: Habito[], rascunhos: Rascunhos) =>
  ativos.find((h) => rascunhos[h.id] && erroQuantidade(h, rascunhos[h.id]));

/** Na meta reduzir, quem usou precisa dizer quanto (inteiro maior que zero). */
export function erroQuantidade(h: Habito, r: Rascunho): string | undefined {
  if (!r.respondido || h.meta.tipo !== 'reduzir' || !r.usou) return undefined;
  return inteiroPositivo(r.quantidade, true).erro;
}

/** Texto da linha de um hábito recolhido. */
export function resumoLinha(h: Habito, r: Rascunho): string {
  if (!r.respondido) return 'responder';
  const vontade = `vontade ${r.vontade}`;
  if (!r.usou) return `${vontade} · não usou`;
  if (h.meta.tipo !== 'reduzir') return `${vontade} · usou`;
  return erroQuantidade(h, r) ? `${vontade} · falta a quantidade` : `${vontade} · ${r.quantidade.trim()} ${h.meta.unidade}`;
}

export const alternarGatilho = (gatilhos: string[], g: string) =>
  gatilhos.includes(g) ? gatilhos.filter((x) => x !== g) : [...gatilhos, g];

type Entrada = {
  dia: string;
  ativos: Habito[];
  rascunhos: Rascunhos;
  humor: Relato['humor'];
  gatilhos: string[];
  nota: string;
  agora: number;
  /** Relato já salvo no dia: as entradas de hábitos fora de `ativos` são mantidas. */
  existente?: Relato;
};

/** Monta o `Relato` com os hábitos respondidos (a validação fica a cargo de `erroQuantidade`). */
export function montarRelato({ dia, ativos, rascunhos, humor, gatilhos, nota, agora, existente }: Entrada): Relato {
  const habitos: RelatoHabito[] = [];
  for (const h of ativos) {
    const r = rascunhos[h.id];
    if (!r?.respondido) continue;
    const entrada: RelatoHabito = { habitoId: h.id, vontade: r.vontade, usou: r.usou };
    if (r.usou && h.meta.tipo === 'reduzir') entrada.quantidade = inteiroPositivo(r.quantidade).valor;
    habitos.push(entrada);
  }
  const ids = new Set(ativos.map((h) => h.id));
  for (const x of existente?.habitos ?? []) if (!ids.has(x.habitoId)) habitos.push(x);
  return { dia, habitos, humor, gatilhos, nota: nota.trim() || undefined, salvoEm: agora };
}
