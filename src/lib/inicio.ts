import type { ResumoHabito } from './contador';
import { dataCurta, deslocarDia, formatarData } from './datas';
import { economia, nomeMarco } from './marcos';
import type { Habito } from './tipos';

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
 * Mais de um dia sem relato: "N relatos para pôr em dia". Um só: "Relato de ontem"
 * (ou da data, se for mais antigo). Nenhum atrasado e hoje sem resposta: "Relato de hoje".
 */
export function textoPendente(
  resumo: Pick<ResumoHabito, 'pendentes' | 'hojeRespondido'>,
  hoje: string,
): LinhaPendenteTexto | null {
  const { pendentes } = resumo;
  if (pendentes.length > 1) {
    return {
      titulo: `${pendentes.length} relatos para pôr em dia`,
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

/** Economia em reais, ou "—" se o hábito não tem custo por dia. */
export function textoEconomia(h: Habito, totalLivres: number): string {
  if (!h.custoPorDiaCentavos) return '—';
  return moeda(economia(h, totalLivres).centavos);
}

/** Singular/plural de "dia seguido(s)". */
export function rotuloSequencia(sequencia: number): string {
  return sequencia === 1 ? 'dia seguido' : 'dias seguidos';
}
