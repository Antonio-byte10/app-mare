import { describe, expect, it } from 'vitest';
import { FRASES_BOM_DIA } from '../../conteudo/lembretes';
import { deslocarDia } from '../datas';
import { LEMBRETES_PADRAO } from '../preferencias';
import type { AjustesLembretes, Habito, Relato } from '../tipos';
import { DIAS_JANELA, planejarLembretes, type EntradaPlano } from './plano';

const habito: Habito = {
  id: 'h1',
  tipo: 'alcool',
  apelido: 'Taça',
  cor: 'peri',
  meta: { tipo: 'parar' },
  inicio: '2026-11-01',
  criadoEm: 0,
};
const em = (dia: string, h: number, m = 0) => {
  const [a, mes, d] = dia.split('-').map(Number);
  return new Date(a, mes - 1, d, h, m).getTime();
};
const relato = (dia: string, vontade = 2, hora = 22): Relato => ({
  dia,
  habitos: [{ habitoId: 'h1', vontade, usou: false }],
  gatilhos: [],
  salvoEm: em(dia, hora),
});

const TODOS: AjustesLembretes = {
  relato: { ligado: true, hora: '22:00' },
  bomDia: { ligado: true, hora: '08:00' },
  antesDaOnda: true,
  marcos: true,
  reflexao: { ligado: true, hora: '19:00' },
};

const entrada = (p: Partial<EntradaPlano> = {}): EntradaPlano => ({
  agora: em('2026-11-26', 10),
  lembretes: TODOS,
  titulo: 'Diário',
  habito,
  relatos: [],
  fissuras: [],
  ...p,
});

describe('planejarLembretes', () => {
  it('padrão: só o relato das 22:00, em janela de 14 dias, sem agendar o que já passou', () => {
    const l = planejarLembretes(entrada({ lembretes: LEMBRETES_PADRAO }));
    const relatos = l.filter((n) => n.tipo === 'relato');
    expect(relatos).toHaveLength(DIAS_JANELA);
    expect(relatos[0].quando).toEqual({ tipo: 'data', em: em('2026-11-26', 22) });
    expect(relatos[0].rota).toBe('/relato/2026-11-26');
    expect(l.some((n) => n.tipo === 'bomDia')).toBe(false);
  });

  it('não agenda o que já passou hoje', () => {
    const l = planejarLembretes(entrada({ agora: em('2026-11-26', 22, 30) }));
    expect(l.filter((n) => n.tipo === 'relato')).toHaveLength(DIAS_JANELA - 1);
    expect(l.filter((n) => n.tipo === 'bomDia')).toHaveLength(DIAS_JANELA - 1);
    expect(l.find((n) => n.id === 'relato-2026-11-26')).toBeUndefined();
    expect(l.find((n) => n.id === 'relato-2026-11-27')).toBeDefined();
  });

  it('relato de hoje já respondido: pula hoje e segue amanhã', () => {
    const l = planejarLembretes(entrada({ relatos: [relato('2026-11-26')] }));
    const relatos = l.filter((n) => n.tipo === 'relato');
    expect(relatos).toHaveLength(DIAS_JANELA - 1);
    expect(relatos[0].id).toBe('relato-2026-11-27');
  });

  it('relato de outro dia respondido não pula o de hoje', () => {
    const l = planejarLembretes(entrada({ relatos: [relato('2026-11-25')] }));
    expect(l.find((n) => n.id === 'relato-2026-11-26')).toBeDefined();
  });

  it('bom dia: uma frase por dia, estável e diferente de um dia para o outro', () => {
    const a = planejarLembretes(entrada()).filter((n) => n.tipo === 'bomDia');
    const b = planejarLembretes(entrada()).filter((n) => n.tipo === 'bomDia');
    expect(a).toEqual(b);
    expect(a[0].quando).toEqual({ tipo: 'data', em: em('2026-11-27', 8) }); // hoje 08:00 já passou
    expect(a[0].rota).toBe('/');
    for (let i = 1; i < a.length; i++) expect(a[i].corpo).not.toBe(a[i - 1].corpo);
    for (const n of a) expect(FRASES_BOM_DIA).toContain(n.corpo);
  });

  it('o título de toda notificação é o nome do disfarce, e o texto não cita o hábito nem o apelido', () => {
    const base = { ...entrada(), habito: { ...habito, apelido: 'Cigarro' } };
    const dados = [...Array(60)].map((_, i) => relato(deslocarDia('2026-11-26', -i - 1), 5));
    const l = planejarLembretes({ ...base, relatos: dados });
    expect(l.length).toBeGreaterThan(20);
    for (const n of l) {
      expect(n.titulo).toBe('Diário');
      expect(n.corpo).not.toMatch(/cigarro|taça|álcool|alcool|fum|beb|sexo|maré|dias/i);
    }
  });

  it('antes da onda: semanal, 30 minutos antes, no padrão de dia do Expo (1 = domingo)', () => {
    // 8 semanas de relatos, sextas pesadas, salvos às 22:00 (hoje é quinta, 26/11).
    const dados: Relato[] = [];
    for (let i = 1; i <= 56; i++) {
      const dia = deslocarDia('2026-11-26', -i + 1);
      const sexta = new Date(dia + 'T12:00:00').getDay() === 5;
      dados.push(relato(dia, sexta ? 9 : 1));
    }
    const l = planejarLembretes(entrada({ relatos: dados }));
    const onda = l.find((n) => n.tipo === 'antesDaOnda');
    expect(onda?.quando).toEqual({ tipo: 'semanal', diaSemana: 6, hora: 21, minuto: 30 });
    expect(onda?.rota).toBe('/fissura');
    expect(onda?.corpo).toBe('Esse costuma ser um horário mais pesado. Se precisar, a onda está a um toque.');
    // Desligado: some.
    const off = planejarLembretes(entrada({ relatos: dados, lembretes: { ...TODOS, antesDaOnda: false } }));
    expect(off.some((n) => n.tipo === 'antesDaOnda')).toBe(false);
  });

  it('antes da onda sem dados suficientes: não agenda', () => {
    expect(planejarLembretes(entrada()).some((n) => n.tipo === 'antesDaOnda')).toBe(false);
  });

  it('marco: um só aviso, às 09:00 do dia previsto, abrindo os Marcos', () => {
    const dados = ['01', '02', '03', '04', '05'].map((d) => relato(`2026-11-${d}`));
    const l = planejarLembretes(entrada({ agora: em('2026-11-06', 10), relatos: dados }));
    const marcos = l.filter((n) => n.tipo === 'marco');
    expect(marcos).toHaveLength(1);
    expect(marcos[0].quando).toEqual({ tipo: 'data', em: em('2026-11-07', 9) });
    expect(marcos[0].rota).toBe('/marcos');
    expect(marcos[0].corpo).toBe('Hoje é um dia para notar. Vale um momento só pra isso.');
  });

  it('reflexão da semana: semanal no domingo (1 no Expo), na hora escolhida, abrindo /reflexao', () => {
    const l = planejarLembretes(entrada());
    const r = l.filter((n) => n.tipo === 'reflexao');
    expect(r).toHaveLength(1);
    expect(r[0].id).toBe('reflexao-semanal');
    expect(r[0].quando).toEqual({ tipo: 'semanal', diaSemana: 1, hora: 19, minuto: 0 });
    expect(r[0].rota).toBe('/reflexao');
    expect(r[0].titulo).toBe('Diário');
    expect(r[0].corpo).toBe('Sua semana está pronta para um olhar gentil.');
    const tarde = planejarLembretes(entrada({ lembretes: { ...TODOS, reflexao: { ligado: true, hora: '20:45' } } }));
    expect(tarde.find((n) => n.tipo === 'reflexao')?.quando).toEqual({ tipo: 'semanal', diaSemana: 1, hora: 20, minuto: 45 });
  });

  it('reflexão desligada, ausente ou sem hábito: não agenda', () => {
    const desligada = planejarLembretes(entrada({ lembretes: { ...TODOS, reflexao: { ligado: false, hora: '19:00' } } }));
    expect(desligada.some((n) => n.tipo === 'reflexao')).toBe(false);
    const { reflexao: _fora, ...semCampo } = TODOS;
    expect(planejarLembretes(entrada({ lembretes: semCampo })).some((n) => n.tipo === 'reflexao')).toBe(false);
    expect(planejarLembretes(entrada({ habito: undefined })).some((n) => n.tipo === 'reflexao')).toBe(false);
  });

  it('o padrão (lembretesDe) já liga a reflexão às 19:00', () => {
    const l = planejarLembretes(entrada({ lembretes: LEMBRETES_PADRAO }));
    expect(l.find((n) => n.tipo === 'reflexao')?.quando).toEqual({ tipo: 'semanal', diaSemana: 1, hora: 19, minuto: 0 });
  });

  it('tudo desligado ou sem hábito: lista vazia (exceto o bom dia, que não depende do hábito)', () => {
    const desligado: AjustesLembretes = {
      relato: { ligado: false, hora: '22:00' },
      bomDia: { ligado: false, hora: '08:00' },
      antesDaOnda: false,
      marcos: false,
      reflexao: { ligado: false, hora: '19:00' },
    };
    expect(planejarLembretes(entrada({ lembretes: desligado }))).toEqual([]);
    const semHabito = planejarLembretes(entrada({ habito: undefined }));
    expect(semHabito.every((n) => n.tipo === 'bomDia')).toBe(true);
  });

  it('é idempotente: a mesma entrada gera exatamente o mesmo plano, com ids únicos', () => {
    const a = planejarLembretes(entrada());
    expect(planejarLembretes(entrada())).toEqual(a);
    expect(new Set(a.map((n) => n.id)).size).toBe(a.length);
  });

  it('cabe no limite de 64 notificações agendadas do iOS', () => {
    expect(planejarLembretes(entrada()).length).toBeLessThanOrEqual(64);
  });
});
