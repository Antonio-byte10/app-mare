import type { Meta, TipoHabito } from '../lib/tipos';

/**
 * Textos dos marcos. Tabaco segue a linha do tempo da OMS:
 * https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation
 * (docs/01-pesquisa-fundamentos.md, seção 2.1). Álcool e sexual são textos de
 * acolhimento, sem afirmação médica, seguindo o guia de voz (seção 7.5).
 */
const TEXTOS: Record<TipoHabito, Record<number, string>> = {
  tabaco: {
    1: 'Em cerca de 12 horas, o monóxido de carbono no seu sangue volta ao normal. Seu corpo já começou a responder.',
    3: 'O pior período da abstinência costuma ser nos 2 ou 3 primeiros dias. O pico ficou para trás.',
    7: 'Uma semana. A circulação e a função pulmonar começam a melhorar nas próximas semanas (de 2 a 12).',
    14: 'Duas semanas. Entre 2 e 12 semanas, a circulação e a função pulmonar costumam melhorar.',
    30: 'Um mês. A maior parte dos sintomas de abstinência costuma ter melhorado, e a tosse e a falta de ar tendem a diminuir ao longo dos meses.',
    90: 'Três meses. Entre 1 e 9 meses, muita gente sente menos tosse e menos falta de ar.',
    180: 'Seis meses. Você já está dentro da janela em que tosse e falta de ar costumam diminuir.',
    365: 'Um ano. O risco de doença coronariana cai para cerca da metade em relação a quem continua fumando.',
  },
  alcool: {
    1: 'Um dia inteiro. Cada dia que você escolhe conta.',
    3: 'Três dias seguidos. Você está construindo um ritmo novo.',
    7: 'Uma semana inteira escolhendo você.',
    14: 'Duas semanas. Olhe para trás e veja o caminho que você já fez.',
    30: 'Um mês. Seu plano está funcionando, do seu jeito.',
    90: 'Três meses. Uma rotina nova, sua.',
    180: 'Seis meses de escolhas que foram suas, dia após dia.',
    365: 'Um ano. Muita coisa mudou, e foi você quem fez isso.',
  },
  sexual: {
    1: 'Um dia inteiro. Você começou, e isso já é muito.',
    3: 'Três dias seguidos. Siga com calma e com gentileza consigo.',
    7: 'Uma semana inteira escolhendo você.',
    14: 'Duas semanas. Você está cuidando do que importa para você.',
    30: 'Um mês. Seus valores e suas ações caminhando juntos.',
    90: 'Três meses de cuidado consigo, com paciência.',
    180: 'Seis meses. Um caminho que você está trilhando com constância.',
    365: 'Um ano. Você honrou o que escolheu, um dia de cada vez.',
  },
};

/**
 * Quem só reduz não parou: os textos de saúde de quem para (monóxido, circulação...) não valem.
 * Para a meta "reduzir" os marcos falam de constância, sem afirmação médica, para qualquer tipo.
 */
const TEXTOS_REDUZIR: Record<number, string> = {
  1: 'Um dia dentro da sua meta. Cada dia assim conta.',
  3: 'Três dias seguidos dentro da sua meta. Você está criando um ritmo.',
  7: 'Uma semana dentro da sua meta. Olhe o que você já construiu.',
  14: 'Duas semanas dentro da sua meta. Seu plano está funcionando, do seu jeito.',
  30: 'Um mês dentro da sua meta. Uma rotina que é sua.',
  90: 'Três meses dentro da sua meta, dia após dia.',
  180: 'Seis meses mantendo o seu limite. É a constância que sustenta o caminho.',
  365: 'Um ano dentro da sua meta. Foi você quem fez isso, um dia de cada vez.',
};

export function textoMarco(tipo: TipoHabito, dias: number, meta?: Meta): string {
  if (meta?.tipo === 'reduzir') return TEXTOS_REDUZIR[dias] ?? '';
  return TEXTOS[tipo][dias] ?? '';
}
