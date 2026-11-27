import type { AjustesIa } from '../tipos';
import * as claude from './claude';
import { comoErroIa, ErroIa, mensagemDoErro, oferecerRespiro } from './erros';
import { executarFluxo } from './fluxo';
import * as gemini from './gemini';
import { prepararHistorico } from './historico';
import { montarSistema } from './instrucoes';
import { modeloReserva } from './modelos';
import * as openai from './openai';
import { conversarServidor } from './servidor';
import type { Buscar, Mensagem, Provedor, ResultadoConversa } from './tipos';

/** Tempo máximo de uma resposta: o servidor do Render pode levar até 1 minuto só para acordar. */
export const PRAZO_DIRETO_MS = 60_000;
export const PRAZO_SERVIDOR_MS = 120_000;

export type DependenciasConversa = {
  buscar: Buscar;
  lerChave: (provedor: Provedor) => Promise<string | null>;
  lerCodigoServidor: () => Promise<string | null>;
  /** Para os testes: prazos curtos. */
  prazoDiretoMs?: number;
  prazoServidorMs?: number;
};

export type ParamsConversa = {
  ajustes: AjustesIa;
  historico: Mensagem[];
  /** Contexto mínimo da pessoa (ver `montarContexto`). */
  contexto?: string;
  /** Cancela a conversa (a pessoa saiu da tela, por exemplo). */
  sinal?: AbortSignal;
  /** Recebe o texto acumulado da resposta a cada novo pedaço (streaming). */
  aoTexto?: (acumulado: string) => void;
};

/** Erros em que vale tentar o modelo de reserva (antes de qualquer texto chegar). */
const TROCA_RESERVA: readonly ErroIa['tipo'][] = ['limite', 'credito', 'modelo', 'sobrecarga'];

const ADAPTADORES = {
  gemini: { montarPedido: gemini.montarPedido, interpretar: gemini.interpretar },
  openai: { montarPedido: openai.montarPedido, interpretar: openai.interpretar },
  claude: { montarPedido: claude.montarPedido, interpretar: claude.interpretar },
};

/**
 * Conversa com a IA do jeito que a pessoa configurou (direto no provedor ou pelo servidor do Render).
 * Nunca lança: qualquer falha volta como `fim: 'erro'` (ou 'recusa') com uma mensagem gentil.
 */
export async function conversarCom(params: ParamsConversa, deps: DependenciasConversa): Promise<ResultadoConversa> {
  const { ajustes, contexto, sinal, aoTexto } = params;
  const historico = prepararHistorico(params.historico);
  let acumulado = '';
  const acompanhar = (texto: string) => {
    acumulado = texto;
    aoTexto?.(texto);
  };

  const falha = (tipo: ErroIa['tipo']): ResultadoConversa => ({
    texto: acumulado,
    fim: tipo === 'recusa' ? 'recusa' : 'erro',
    erro: mensagemDoErro(tipo),
    oferecerRespiro: oferecerRespiro(tipo),
    tipoErro: tipo,
  });

  if (historico.length === 0) return falha('vazio');

  // Prazo total + cancelamento de quem chamou, num sinal só.
  const controle = new AbortController();
  const aoCancelar = () => controle.abort(sinal?.reason);
  if (sinal?.aborted) controle.abort(sinal.reason);
  else sinal?.addEventListener('abort', aoCancelar);
  const prazo = ajustes.modo === 'servidor' ? (deps.prazoServidorMs ?? PRAZO_SERVIDOR_MS) : (deps.prazoDiretoMs ?? PRAZO_DIRETO_MS);
  let tempoEsgotado = false;
  const relogio = setTimeout(() => {
    tempoEsgotado = true;
    controle.abort(new ErroIa('tempo'));
  }, prazo);

  try {
    const sistema = montarSistema(contexto);
    let resultado: { texto: string; recusa: boolean };
    if (ajustes.modo === 'servidor') {
      const codigo = await deps.lerCodigoServidor();
      if (!ajustes.endereco || !codigo) throw new ErroIa(ajustes.endereco ? 'codigo' : 'servidorConfig');
      resultado = await conversarServidor({
        buscar: deps.buscar,
        endereco: ajustes.endereco,
        codigo,
        sistema,
        historico,
        sinal: controle.signal,
        aoTexto: acompanhar,
      });
    } else {
      const chave = await deps.lerChave(ajustes.provedor);
      if (!chave) throw new ErroIa('chave');
      const adaptador = ADAPTADORES[ajustes.provedor];
      const tentar = (modelo: string) =>
        executarFluxo({
          buscar: deps.buscar,
          pedido: adaptador.montarPedido({ chave, modelo, sistema, historico }),
          interpretar: adaptador.interpretar,
          sinal: controle.signal,
          aoTexto: acompanhar,
        });
      try {
        resultado = await tentar(ajustes.modelo);
      } catch (e) {
        const reserva = modeloReserva(ajustes.provedor, ajustes.modelo);
        const tipo = comoErroIa(e, tempoEsgotado).tipo;
        if (!reserva || acumulado !== '' || controle.signal.aborted || !TROCA_RESERVA.includes(tipo)) throw e;
        resultado = await tentar(reserva);
      }
    }
    acumulado = resultado.texto;
    if (resultado.recusa) return falha('recusa');
    if (resultado.texto.trim() === '') return falha('vazio');
    return { texto: resultado.texto.trim(), fim: 'ok' };
  } catch (e) {
    return falha(comoErroIa(e, tempoEsgotado).tipo);
  } finally {
    clearTimeout(relogio);
    sinal?.removeEventListener('abort', aoCancelar);
  }
}
