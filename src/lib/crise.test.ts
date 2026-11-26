import { describe, expect, it } from 'vitest';
import { detectarCrise, detectarCriseEmTextos, normalizarTexto } from './crise';

const todas = (textos: string[], tipo: ReturnType<typeof detectarCrise>) => {
  for (const t of textos) expect(detectarCrise(t), t).toBe(tipo);
};

describe('normalizarTexto', () => {
  it('tira acento, pontuação, maiúsculas e letras repetidas', () => {
    expect(normalizarTexto('  NÃO aguento MAIS!!! Morreeer... ')).toBe('nao aguento mais morer');
  });
});

describe('detectarCrise: suicídio e autolesão', () => {
  it('detecta ideação com a escrita correta', () => {
    todas(
      [
        'quero morrer',
        'Eu queria morrer.',
        'vou me matar',
        'Estou pensando em me matar hoje',
        'não aguento mais viver',
        'não quero mais viver',
        'cansei de viver',
        'penso em suicídio todo dia',
        'vontade de acabar com tudo',
        'quero acabar com a minha vida',
        'vou tirar minha vida',
        'ninguém sentiria minha falta',
        'todo mundo ficaria melhor sem mim',
        'seria melhor se eu não existisse',
        'queria dormir e não acordar',
        'não vejo mais sentido na vida',
        'não tenho motivo pra viver',
        'vou me enforcar',
        'pensei em me jogar da ponte',
      ],
      'suicidio',
    );
  });

  it('detecta autolesão', () => {
    todas(['vontade de me machucar', 'quero me cortar', 'tenho vontade de me automutilar', 'automutilação de novo'], 'suicidio');
  });

  it('pega gírias, falta de acento e erros de digitação comuns', () => {
    todas(
      [
        'quero morreeer',
        'QUERO MORRER!!!',
        'nao aguento mais viver',
        'nao aguento mais vivr'.replace('vivr', 'viver'),
        'vou me matr'.replace('matr', 'matar'),
        'vo me mata'.replace('vo me mata', 'quero me mata'),
        'quero morer',
        'penso em sucidio',
        'pensando em suisidio',
        'to pensando em me matar',
        'nao quero viver mais',
        'queria estar morto',
      ],
      'suicidio',
    );
  });

  it('NÃO dispara com brincadeiras e exageros do dia a dia', () => {
    todas(
      [
        'morrendo de rir',
        'estou morrendo de rir com isso',
        'me mata de vergonha',
        'isso me mata de vergonha',
        'quero morrer de rir',
        'vou morrer de fome',
        'to morrendo de sono',
        'vou me matar de trabalhar',
        'quero me matar de tanto estudar',
        'quase morri de vergonha',
        'morri de saudade',
        'esse calor me mata',
        'a fila estava me matando',
        'quero cortar o cabelo',
        'vou cortar a unha',
        'não aguento mais esse calor',
        'não aguento mais essa fissura',
        'cansei de tentar de novo',
        'hoje foi um dia ótimo',
        '',
        '   ',
      ],
      null,
    );
  });
});

describe('detectarCrise: intoxicação', () => {
  it('detecta overdose e intoxicação grave', () => {
    todas(
      [
        'meu amigo teve uma overdose',
        'acho que estou tendo uma overdose',
        'over dose',
        'bebeu demais e não acorda',
        'ele usou e desmaiou',
        'meu amigo bebeu e apagou',
        'bebi demais e não consigo levantar',
        'tomei remédio demais',
        'intoxicação alcoólica',
        'coma etílico',
      ],
      'intoxicacao',
    );
  });

  it('NÃO dispara com consumo comum', () => {
    todas(['bebi demais ontem e estou de ressaca', 'usei o celular demais', 'tomei remédio para dor de cabeça', 'dormi muito'], null);
  });
});

describe('detectarCrise: abstinência alcoólica grave', () => {
  it('detecta tremores fortes, convulsão, alucinação e confusão', () => {
    todas(
      [
        'tive uma convulsão',
        'estou convulsionando',
        'tremores fortes desde que parei de beber',
        'tremor forte nas mãos e no corpo todo',
        'meu corpo tá tremendo muito',
        'tremendo sem parar',
        'estou vendo bichos',
        'tô ouvindo vozes',
        'alucinação',
        'estou com delirium tremens',
        'confusão mental depois que parei de beber',
        'não sei onde estou',
        'parei de beber ontem e estou tremendo',
        'abstinência grave',
      ],
      'abstinencia',
    );
  });

  it('NÃO dispara com tremer de frio, rir ou nervoso, nem com abstinência comum', () => {
    todas(
      [
        'estou tremendo de frio',
        'tremendo todo de frio',
        'tremendo de rir',
        'fiquei tremendo de nervoso',
        'estou ansioso e irritado, sem beber há 3 dias',
        'dor de cabeça e suor',
        'estou confuso sobre o que fazer da vida',
      ],
      null,
    );
  });
});

describe('prioridade', () => {
  it('suicídio vence intoxicação e abstinência', () => {
    expect(detectarCrise('tive uma overdose e quero morrer')).toBe('suicidio');
    expect(detectarCrise('convulsão, tremores fortes e quero me matar')).toBe('suicidio');
  });
  it('intoxicação vence abstinência', () => {
    expect(detectarCrise('overdose e tremores fortes')).toBe('intoxicacao');
  });
});

describe('detectarCriseEmTextos', () => {
  it('ignora campos vazios e devolve o mais urgente', () => {
    expect(detectarCriseEmTextos([undefined, '', null, 'dia tranquilo'])).toBeNull();
    expect(detectarCriseEmTextos(['tremores fortes', undefined, 'quero morrer'])).toBe('suicidio');
    expect(detectarCriseEmTextos(['tive uma convulsão'])).toBe('abstinencia');
  });
});
