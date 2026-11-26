/**
 * Erros da IA já traduzidos para o que a pessoa precisa ouvir: nada de "HTTP 401" ou JSON na tela.
 * `tipo` é o mesmo vocabulário que o servidor do Render usa nas respostas de erro.
 */
export type TipoErroIa =
  | 'chave' // chave recusada (401/403)
  | 'credito' // sem crédito ou cota
  | 'limite' // pedidos demais (429)
  | 'modelo' // modelo indisponível (404)
  | 'sobrecarga' // provedor fora do ar ou sobrecarregado (5xx)
  | 'rede' // sem internet ou sem alcançar o servidor
  | 'recusa' // o provedor não quis responder (SAFETY, refusal)
  | 'pedido' // o provedor não aceitou o pedido (400)
  | 'tempo' // demorou demais
  | 'codigo' // código de acesso do servidor recusado
  | 'tentativas' // IP bloqueado por tentativas erradas
  | 'servidorConfig' // servidor sem chave/APP_TOKEN
  | 'vazio' // resposta sem texto
  | 'desconhecido';

const TIPOS: readonly string[] = [
  'chave', 'credito', 'limite', 'modelo', 'sobrecarga', 'rede', 'recusa', 'pedido', 'tempo', 'codigo',
  'tentativas', 'servidorConfig', 'vazio', 'desconhecido',
];

export const ehTipoErroIa = (v: unknown): v is TipoErroIa => typeof v === 'string' && TIPOS.includes(v);

export class ErroIa extends Error {
  readonly tipo: TipoErroIa;
  constructor(tipo: TipoErroIa) {
    super(tipo);
    this.name = 'ErroIa';
    this.tipo = tipo;
  }
}

/** Frases em primeira pessoa: aparecem na conversa como se fossem da Maré. */
const MENSAGENS: Record<TipoErroIa, string> = {
  chave: 'Não consegui entrar com a sua chave de IA. Confira se ela está certa em Mais, Inteligência artificial.',
  credito: 'Parece que a sua conta de IA está sem crédito ou chegou ao limite do plano. Dá para conferir no site do provedor.',
  limite: 'A IA está recebendo pedidos demais agora. Espere um instante e tente de novo.',
  modelo: 'O modelo de IA escolhido não está disponível agora. Dá para trocar em Mais, Inteligência artificial.',
  sobrecarga: 'A IA está sobrecarregada agora. Tente de novo em alguns instantes.',
  rede: 'Parece que estou sem conexão com a internet. Quando ela voltar, tente de novo.',
  recusa: 'Não consegui responder a isso do jeito que você merece. Mas continuo aqui com você.',
  pedido: 'Algo não saiu como esperado do meu lado. Tente de novo daqui a pouco.',
  tempo: 'A resposta demorou mais do que o normal. Tente de novo.',
  codigo: 'O servidor não aceitou o código de acesso. Confira o código em Mais, Inteligência artificial.',
  tentativas:
    'O servidor bloqueou novas tentativas por um tempo, porque o código veio errado várias vezes. Tente de novo em 15 minutos.',
  servidorConfig: 'O seu servidor ainda não está pronto: falta configurar a chave ou o código de acesso no Render.',
  vazio: 'Não consegui formular uma resposta agora. Pode tentar contar de outro jeito?',
  desconhecido: 'Algo não saiu como esperado do meu lado. Tente de novo daqui a pouco.',
};

export function mensagemDoErro(tipo: TipoErroIa): string {
  return MENSAGENS[tipo];
}

/** Erros de configuração não combinam com "Respirar agora"; os outros podem pegar a pessoa em um mau momento. */
export function oferecerRespiro(tipo: TipoErroIa): boolean {
  return tipo !== 'codigo' && tipo !== 'tentativas' && tipo !== 'servidorConfig';
}

/** Traduz o status HTTP do provedor (e uma pista do corpo) para um tipo de erro. */
export function tipoDeStatus(status: number, corpo = ''): TipoErroIa {
  // O Gemini responde 400 (e não 401) para chave inválida.
  if (/api[ _-]?key not valid|API_KEY_INVALID|invalid[ _-]?(x-)?api[ _-]?key/i.test(corpo)) return 'chave';
  if (status !== 401 && /credit|quota|billing|insufficient|exceeded your current/i.test(corpo)) return 'credito';
  if (status === 401 || status === 403) return 'chave';
  if (status === 404) return 'modelo';
  if (status === 408) return 'tempo';
  if (status === 429) return 'limite';
  if (status >= 500) return 'sobrecarga';
  return 'pedido';
}

/** Lê o corpo de uma resposta de erro sem nunca falhar (só serve de pista para `tipoDeStatus`). */
export async function pistaDoCorpo(resposta: { text(): Promise<string> }): Promise<string> {
  try {
    return (await resposta.text()).slice(0, 600);
  } catch {
    return '';
  }
}

/** Qualquer coisa lançada vira um `ErroIa` (falha de rede, cancelamento por tempo…). */
export function comoErroIa(e: unknown, tempoEsgotado = false): ErroIa {
  if (e instanceof ErroIa) return e;
  if (tempoEsgotado) return new ErroIa('tempo');
  const nome = (e as { name?: string } | null)?.name;
  if (nome === 'AbortError' || nome === 'TimeoutError') return new ErroIa('tempo');
  // TypeError do fetch: sem internet, DNS, CORS no navegador…
  return new ErroIa('rede');
}
