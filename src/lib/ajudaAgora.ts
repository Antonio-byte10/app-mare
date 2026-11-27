/** "Ainda difícil" na onda: a quem a pessoa pode ligar agora. Lógica pura (a tela está em `PassoOnda`). */
import { CVV, SAMU } from '../conteudo/apoio';
import { contatosPorNome, normalizarTelefone } from './contatos';
import type { Contato, TipoHabito } from './tipos';

export type SaidaDeApoio = {
  id: string;
  tipo: 'contato' | 'cvv' | 'samu';
  titulo: string;
  subtitulo?: string;
  /** Só dígitos (e o "+"), pronto para `tel:`. */
  telefone: string;
};

/** No máximo tantos contatos de confiança na lista, para o painel não virar uma agenda. */
export const MAX_CONTATOS_NA_ONDA = 3;

type Entrada = {
  /** Hábito ativo; o SAMU só entra para o álcool (abstinência e intoxicação têm risco de vida). */
  tipoHabito?: TipoHabito;
  contatos: readonly Contato[];
  /** Ajuste "Contatos de emergência": liga ou desliga CVV e SAMU (os contatos de confiança não dependem dele). */
  emergencia: boolean;
  /** Onda aberta pela tela de bloqueio: sem nomes de contatos (privacidade), só o CVV. */
  daTrancada: boolean;
};

/** Ordem: contatos de confiança, CVV 188 e, no álcool, SAMU 192. */
export function saidasDeApoio({ tipoHabito, contatos, emergencia, daTrancada }: Entrada): SaidaDeApoio[] {
  const saidas: SaidaDeApoio[] = [];
  if (!daTrancada) {
    for (const c of contatosPorNome([...contatos]).slice(0, MAX_CONTATOS_NA_ONDA)) {
      saidas.push({ id: c.id, tipo: 'contato', titulo: `Ligar para ${c.nome}`, telefone: normalizarTelefone(c.telefone) });
    }
  }
  if (emergencia) {
    saidas.push({ id: 'cvv', tipo: 'cvv', titulo: 'Ligar para o CVV · 188', subtitulo: 'apoio emocional, de graça, 24 horas', telefone: CVV.telefone });
    if (tipoHabito === 'alcool') {
      saidas.push({ id: 'samu', tipo: 'samu', titulo: 'Ligar para o SAMU · 192', subtitulo: 'emergência médica, como abstinência grave', telefone: SAMU.telefone });
    }
  }
  return saidas;
}
