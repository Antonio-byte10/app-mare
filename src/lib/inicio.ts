import type { ResumoHabito } from './contador';
import { dataCurta, deslocarDia, formatarData } from './datas';
import { economia, nomeMarco } from './marcos';
import type { Habito, Relato } from './tipos';

/** "Bom dia" até 11h59, "Boa tarde" até 17h59, depois "Boa noite". */
export function saudacao(hora: number): string {
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** "Quinta-feira, 26 de novembro" */
export function dataPorExtenso(agora: number | Date): string {
  const texto = formatarData(agora, { weekday: 'long', day: 'numeric', month: 'long' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Hábito mostrado no Início: o salvo em `habitoAtivo`; se não existe mais, o primeiro. */
export function habitoAtivoDe(habitos: Habito[], id: string | undefined): Habito | undefined {
  return habitos.find((h) => h.id === id) ?? habitos[0];
}

export type LinhaPendenteTexto = {
  titulo: string;
  subtitulo: string;
  /** Dia para onde a linha leva: o pendente mais antigo. */
  dia: string;
};

/**
 * Texto da linha de relato pendente, ou `null` se não falta nada.
 * Mais de um dia sem relato: um convite sem cobrança ("Quer completar os últimos dias? Sem pressa."). Um só: "Relato de ontem"
 * (ou da data, se for mais antigo). Nenhum atrasado e hoje sem resposta: "Relato de hoje".
 */
export function textoPendente(
  resumo: Pick<ResumoHabito, 'pendentes' | 'hojeRespondido'>,
  hoje: string,
): LinhaPendenteTexto | null {
  const { pendentes } = resumo;
  if (pendentes.length > 1) {
    return {
      titulo: 'Quer completar os últimos dias? Sem pressa.',
      subtitulo: `Começa por ${dataCurta(pendentes[0])}`,
      dia: pendentes[0],
    };
  }
  if (pendentes.length === 1) {
    const dia = pendentes[0];
    const titulo =
      dia === deslocarDia(hoje, -1)
        ? 'Relato de ontem'
        : `Relato de ${formatarData(dia, { day: 'numeric', month: 'long' })}`;
    return { titulo, subtitulo: 'Leva 1 minuto', dia };
  }
  if (!resumo.hojeRespondido) return { titulo: 'Relato de hoje', subtitulo: 'Leva 1 minuto', dia: hoje };
  return null;
}

/** "faltam **2 dias** para 2 semanas", dividido para o destaque em aqua. */
export function textoFaltam(proximo: { dias: number; faltam: number } | null): {
  antes: string;
  destaque: string;
  depois: string;
} {
  if (!proximo) return { antes: '', destaque: 'Todos os marcos', depois: ' alcançados' };
  const { faltam } = proximo;
  // "falta 1 dia para 24 horas" diria a mesma coisa duas vezes.
  if (proximo.dias === 1) return { antes: 'próximo marco: ', destaque: nomeMarco(1), depois: '' };
  return {
    antes: faltam === 1 ? 'falta ' : 'faltam ',
    destaque: faltam === 1 ? '1 dia' : `${faltam} dias`,
    depois: ` para ${nomeMarco(proximo.dias)}`,
  };
}

/** Reais com a formatação do Brasil. */
export function moeda(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Economia em reais, ou "—" se o hábito não tem custo por dia (ou, em "reduzir", unidades por dia). */
export function textoEconomia(h: Habito, relatos: Relato[], hoje: string): string {
  if (!h.custoPorDiaCentavos) return '—';
  const e = economia(h, relatos, hoje);
  return e ? moeda(e.centavos) : '—';
}

/** Singular/plural de "dia seguido(s)". */
export function rotuloSequencia(sequencia: number): string {
  return sequencia === 1 ? 'dia seguido' : 'dias seguidos';
}

/** O que o número grande do anel mostra. */
export type HeroContador = {
  valor: number;
  rotulo: string;
  /** Linha de apoio abaixo do rótulo (só quando a pessoa está recomeçando). */
  nota?: string;
  /** `true` quando a sequência zerou mas a pessoa já tem dias livres: o herói passa a ser o total. */
  recomecando: boolean;
};

/**
 * Depois de um deslize a sequência volta a 0, e "0 dias seguidos" em destaque pune quem já
 * acumulou dias. Com sequência 0 e dias livres no total, o herói é o total ("dias no total");
 * sequência e recorde seguem no trio. Sem nada ainda (primeiro dia), mantém o "0 dias seguidos".
 */
export function heroContador(sequencia: number, totalLivres: number): HeroContador {
  if (sequencia === 0 && totalLivres > 0) {
    return {
      valor: totalLivres,
      rotulo: totalLivres === 1 ? 'dia no total' : 'dias no total',
      nota: 'Recomeçando hoje. Seus dias continuam contando.',
      recomecando: true,
    };
  }
  return { valor: sequencia, rotulo: rotuloSequencia(sequencia), recomecando: false };
}

/** Sugestões que o Início pode mostrar; só uma por vez. */
export type SugestaoInicio = 'recomeco' | 'dica-onda' | 'pendente' | 'reflexao' | 'backup';

export type EntradaSugestaoInicio = {
  avisoRecomeco: boolean;
  dicaOnda: boolean;
  pendente: boolean;
  reflexao: boolean;
  backup: boolean;
};

/**
 * Escolhe UMA sugestão para o Início, para a tela não virar uma lista de tarefas.
 * Prioridade: aviso de recomeço, dica da onda (só na primeira vez), relatos pendentes,
 * reflexão da semana, backup.
 */
export function escolherSugestao(e: EntradaSugestaoInicio): SugestaoInicio | null {
  if (e.avisoRecomeco) return 'recomeco';
  if (e.dicaOnda) return 'dica-onda';
  if (e.pendente) return 'pendente';
  if (e.reflexao) return 'reflexao';
  if (e.backup) return 'backup';
  return null;
}
