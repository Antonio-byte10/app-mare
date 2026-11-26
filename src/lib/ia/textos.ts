import type { Provedor } from './tipos';

/** Textos da tela "Inteligência artificial" (Ajustes de IA): privacidade e passo a passo das chaves. */

/** Aviso de privacidade específico de cada provedor, mostrado antes do primeiro uso (spec 8.1). */
export const AVISO_PRIVACIDADE: Record<Provedor, { titulo: string; itens: string[] }> = {
  gemini: {
    titulo: 'Antes de usar o Gemini',
    itens: [
      'No plano gratuito, o Google pode usar o que você escreve para melhorar os produtos dele. Os registros (logs) já vêm ligados por padrão.',
      'Para conversas sensíveis, desligue os registros no Google AI Studio, no menu Logs, ou use uma chave de um projeto com faturamento ativo.',
    ],
  },
  openai: {
    titulo: 'Antes de usar o ChatGPT',
    itens: [
      'O Maré envia à OpenAI o pedido para não guardar a conversa (store: false).',
      'Pelos termos da OpenAI, dados enviados pela API não são usados para treinar modelos sem o seu consentimento.',
    ],
  },
  claude: {
    titulo: 'Antes de usar o Claude',
    itens: ['Pela API, a Anthropic não guarda a conversa por padrão.'],
  },
};

export const AVISO_COMUM = [
  'O Maré envia só o necessário: o tipo de hábito, a meta, os dias, os gatilhos recentes e a conversa. Nunca envia nome, telefone ou contatos.',
  'O histórico da conversa fica só neste celular, e você pode apagá-lo quando quiser.',
];

export const AVISO_SERVIDOR =
  'No modo servidor, a conversa passa pelo seu servidor no Render, que não guarda nem registra o conteúdo, e segue para o provedor configurado lá.';

export type PassoChave = { titulo: string; passos: string[]; link: { rotulo: string; url: string } };

export const COMO_CONSEGUIR_CHAVE: Record<Provedor, PassoChave> = {
  gemini: {
    titulo: 'Chave do Gemini',
    passos: [
      'Abra o Google AI Studio e entre com a sua conta Google.',
      'Toque em "Criar chave de API" e escolha um projeto (ou crie um).',
      'Copie a chave, volte aqui e cole no campo.',
      'O plano gratuito costuma bastar para conversar. Veja o aviso de privacidade acima.',
    ],
    link: { rotulo: 'Abrir aistudio.google.com/apikey', url: 'https://aistudio.google.com/apikey' },
  },
  openai: {
    titulo: 'Chave do ChatGPT (OpenAI)',
    passos: [
      'Entre na plataforma da OpenAI com a sua conta.',
      'Em Billing, adicione um pouco de crédito. A API é cobrada à parte, separada de qualquer assinatura do ChatGPT.',
      'Em API keys, toque em "Create new secret key" e dê um nome.',
      'Copie a chave agora (ela só aparece uma vez), volte aqui e cole no campo.',
    ],
    link: { rotulo: 'Abrir platform.openai.com/api-keys', url: 'https://platform.openai.com/api-keys' },
  },
  claude: {
    titulo: 'Chave do Claude (Anthropic)',
    passos: [
      'Entre no console da Anthropic com a sua conta.',
      'Em Plans & Billing, adicione um pouco de crédito. A API é cobrada à parte da assinatura do Claude.',
      'Em API Keys, toque em "Create Key" e dê um nome.',
      'Copie a chave, volte aqui e cole no campo.',
    ],
    link: { rotulo: 'Abrir console.anthropic.com', url: 'https://console.anthropic.com' },
  },
};

/** Passo a passo do modo servidor. */
export const COMO_CRIAR_SERVIDOR = [
  'Crie uma conta gratuita no Render e um serviço a partir do arquivo render.yaml do Maré.',
  'No painel do Render, em Environment, cole a sua chave em IA_CHAVE. O código de acesso (APP_TOKEN) já vem gerado.',
  'Copie o endereço do serviço (termina em onrender.com) e o valor de APP_TOKEN, e cole aqui.',
];
