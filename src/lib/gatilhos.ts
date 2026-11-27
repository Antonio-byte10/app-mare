/** Gatilhos do fim da Fissura ("O que puxou a onda?") e a contagem do cartão do Diário. */
import { dataLocal, deslocarDia } from './datas';
import type { Fissura, Relato } from './tipos';

/** Gatilhos de um toque, na ordem em que aparecem. O `id` é o que fica guardado em `Fissura.gatilhos`. */
export const GATILHOS_FISSURA = [
  { id: 'fome', rotulo: 'Fome' },
  { id: 'raiva', rotulo: 'Raiva' },
  { id: 'solidao', rotulo: 'Solidão' },
  { id: 'cansaco', rotulo: 'Cansaço' },
  { id: 'estresse', rotulo: 'Estresse' },
  { id: 'tedio', rotulo: 'Tédio' },
  { id: 'lugar', rotulo: 'Um lugar' },
  { id: 'pessoas', rotulo: 'Pessoas' },
  { id: 'celular', rotulo: 'Celular/telas' },
] as const;

export type IdGatilhoFissura = (typeof GATILHOS_FISSURA)[number]['id'];

const IDS: readonly string[] = GATILHOS_FISSURA.map((g) => g.id);

/** Minúsculas, sem acento e com espaços simples: "  Tédio " e "tedio" viram a mesma coisa. */
export function normalizarGatilho(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Só os ids conhecidos, sem repetir e na ordem da lista (descarta o que vier de um dado antigo ou estranho). */
export function limparGatilhosFissura(ids: readonly string[] | undefined): string[] {
  if (!ids) return [];
  return IDS.filter((id) => ids.includes(id));
}

// Texto normalizado (rótulo ou id) -> id, para casar o texto livre do relato com os gatilhos de um toque.
const PORTEXTO = new Map<string, string>(
  GATILHOS_FISSURA.flatMap((g) => [
    [normalizarGatilho(g.rotulo), g.id] as [string, string],
    [g.id, g.id] as [string, string],
  ]),
);

const ROTULO_DO_ID = new Map<string, string>(GATILHOS_FISSURA.map((g) => [g.id, g.rotulo]));

/** Rótulo de um id guardado; um id que não existe mais volta como veio (nunca quebra a tela). */
export const rotuloGatilho = (id: string): string => ROTULO_DO_ID.get(id) ?? id;

export type GatilhoContado = {
  /** Id do gatilho conhecido, ou o texto normalizado quando é um gatilho livre do relato. */
  chave: string;
  rotulo: string;
  total: number;
};

type Entrada = {
  fissuras: readonly Fissura[];
  relatos: readonly Relato[];
  /** Hoje, "AAAA-MM-DD". */
  hoje: string;
  /** Janela em dias, contando hoje. */
  dias?: number;
  /** Quantos mostrar. */
  limite?: number;
};

/**
 * Os gatilhos que mais aparecem nos últimos `dias` dias (30 por padrão), somando os marcados no fim
 * de uma Fissura e os do relato do dia. Cada Fissura e cada relato conta no máximo uma vez por
 * gatilho. O texto livre do relato que bate com um gatilho de um toque (sem ligar para maiúsculas
 * e acentos) soma com ele; o resto é contado pelo próprio texto. Empate: ordem alfabética.
 */
export function contarGatilhos({ fissuras, relatos, hoje, dias = 30, limite = 3 }: Entrada): GatilhoContado[] {
  const primeiro = deslocarDia(hoje, -(dias - 1));
  const noPeriodo = (dia: string) => dia >= primeiro && dia <= hoje;
  const contagem = new Map<string, GatilhoContado>();

  const somar = (chave: string, rotulo: string) => {
    const atual = contagem.get(chave);
    if (atual) atual.total += 1;
    else contagem.set(chave, { chave, rotulo, total: 1 });
  };

  for (const f of fissuras) {
    if (!f.gatilhos?.length || !noPeriodo(dataLocal(f.inicio))) continue;
    for (const id of limparGatilhosFissura(f.gatilhos)) somar(id, rotuloGatilho(id));
  }

  for (const r of relatos) {
    if (!r.gatilhos?.length || !noPeriodo(r.dia)) continue;
    const vistos = new Set<string>();
    for (const texto of r.gatilhos) {
      const norm = normalizarGatilho(texto);
      if (!norm) continue;
      const id = PORTEXTO.get(norm);
      const chave = id ?? norm;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      somar(chave, id ? rotuloGatilho(id) : texto.trim());
    }
  }

  return [...contagem.values()]
    .sort((a, b) => b.total - a.total || a.rotulo.localeCompare(b.rotulo, 'pt-BR'))
    .slice(0, Math.max(0, limite));
}
