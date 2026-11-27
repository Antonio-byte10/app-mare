import { describe, expect, it } from 'vitest';
import { deslocarDia, meioDia } from '../datas';
import type { Fissura, Relato } from '../tipos';
import { calcularAntesDaOnda, mediaCircular, nomeDiaSemana, textoSugestao, type SugestaoOnda } from './antesDaOnda';

const HOJE = '2026-11-26'; // quinta-feira
const H = 'h1';

const salvo = (dia: string, hora: number, minuto: number) => {
  const [a, m, d] = dia.split('-').map(Number);
  return new Date(a, m - 1, d, hora, minuto).getTime();
};

const relato = (dia: string, vontade: number, hora = 22, minuto = 0, habitoId = H): Relato => ({
  dia,
  habitos: [{ habitoId, vontade, usou: false }],
  gatilhos: [],
  salvoEm: salvo(dia, hora, minuto),
});

/** Um relato por dia nos últimos `dias` dias (até hoje), vontade dada por `vontadeDe(diaDaSemana)`. */
function diario(vontadeDe: (diaSemana: number) => number, dias = 56, hora = 22, minuto = 0): Relato[] {
  const lista: Relato[] = [];
  for (let i = 0; i < dias; i++) {
    const dia = deslocarDia(HOJE, -i);
    lista.push(relato(dia, vontadeDe(meioDia(dia).getDay()), hora, minuto));
  }
  return lista;
}

const sextaPesada = (d: number) => (d === 5 ? 8 : 2);

describe('calcularAntesDaOnda', () => {
  it('com poucos relatos não sugere nada', () => {
    const r = calcularAntesDaOnda(diario(sextaPesada, 10), [], H, HOJE);
    expect(r.status).toBe('poucosDados');
  });

  it('com 14 relatos seguidos (só 2 semanas) ainda não dá para ver um padrão semanal', () => {
    expect(calcularAntesDaOnda(diario(sextaPesada, 14), [], H, HOJE).status).toBe('poucosDados');
  });

  it('sem relatos do hábito pedido, não sugere', () => {
    expect(calcularAntesDaOnda(diario(sextaPesada), [], 'outro', HOJE).status).toBe('poucosDados');
  });

  it('acha a sexta, avisa 30 minutos antes do horário em que o relato costuma ser salvo', () => {
    const r = calcularAntesDaOnda(diario(sextaPesada), [], H, HOJE) as SugestaoOnda;
    expect(r.status).toBe('ok');
    expect(r.diaSemana).toBe(5);
    expect(r.minutos).toBe(22 * 60);
    expect(r.avisoDiaSemana).toBe(5);
    expect(r.avisoMinutos).toBe(21 * 60 + 30);
    expect(r.origemHorario).toBe('relatos');
    expect(textoSugestao(r)).toBe('sexta 21:30 · aprendido do seu diário');
  });

  it('prefere o horário das passagens pela Fissura quando há pelo menos 3 no dia de pico', () => {
    const f = (dia: string, h: number, m: number): Fissura => ({
      id: dia,
      inicio: salvo(dia, h, m),
      duracaoSeg: 60,
      venceu: true,
    });
    // Três sextas, perto das 20:00.
    const fissuras = [f('2026-11-20', 19, 50), f('2026-11-13', 20, 10), f('2026-11-06', 20, 0)];
    const r = calcularAntesDaOnda(diario(sextaPesada), fissuras, H, HOJE) as SugestaoOnda;
    expect(r.origemHorario).toBe('fissuras');
    expect(r.minutos).toBe(20 * 60);
    expect(r.avisoMinutos).toBe(19 * 60 + 30);
  });

  it('ignora fissuras de outro hábito e de outros dias da semana', () => {
    const fissuras: Fissura[] = [
      { id: 'a', inicio: salvo('2026-11-20', 8, 0), duracaoSeg: 1, venceu: true, habitoId: 'outro' },
      { id: 'b', inicio: salvo('2026-11-13', 8, 0), duracaoSeg: 1, venceu: true, habitoId: 'outro' },
      { id: 'c', inicio: salvo('2026-11-06', 8, 0), duracaoSeg: 1, venceu: true, habitoId: 'outro' },
      { id: 'd', inicio: salvo('2026-11-24', 8, 0), duracaoSeg: 1, venceu: true },
    ];
    const r = calcularAntesDaOnda(diario(sextaPesada), fissuras, H, HOJE) as SugestaoOnda;
    expect(r.origemHorario).toBe('relatos');
    expect(r.minutos).toBe(22 * 60);
  });

  it('sem nenhum dia que se destaque (vontade parecida), diz que nada se destaca', () => {
    expect(calcularAntesDaOnda(diario(() => 5), [], H, HOJE).status).toBe('semPico');
    // Pico existe, mas a diferença para os outros dias é pequena (< 1,5).
    expect(calcularAntesDaOnda(diario((d) => (d === 5 ? 6 : 5)), [], H, HOJE).status).toBe('semPico');
  });

  it('vontade baixa em geral não gera aviso, mesmo com um dia relativamente maior', () => {
    expect(calcularAntesDaOnda(diario((d) => (d === 5 ? 3 : 0)), [], H, HOJE).status).toBe('semPico');
  });

  it('empate entre dois dias: vence o mais cedo na semana; com mais relatos, vence o que tem mais', () => {
    const base = diario((d) => (d === 4 || d === 5 ? 8 : 1), 56); // 8 quintas e 8 sextas, mesma média
    expect((calcularAntesDaOnda(base, [], H, HOJE) as SugestaoOnda).diaSemana).toBe(4);
    // Sem uma das quintas, a sexta tem mais relatos e vence o empate.
    const semUmaQuinta = base.filter((r) => r.dia !== '2026-11-26');
    expect((calcularAntesDaOnda(semUmaQuinta, [], H, HOJE) as SugestaoOnda).diaSemana).toBe(5);
  });

  it('horário perto da meia-noite: 23:50 e 00:10 dão meia-noite, e o aviso cai na véspera, às 23:30', () => {
    // Relatos de sábado salvos às 23:50 e às 00:10 do dia seguinte não valem (salvos fora do dia),
    // então a hora vem das passagens pela Fissura, que atravessam a meia-noite.
    const f = (dia: string, h: number, m: number): Fissura => ({ id: dia + h, inicio: salvo(dia, h, m), duracaoSeg: 1, venceu: true });
    const fissuras = [f('2026-11-21', 23, 50), f('2026-11-14', 0, 10), f('2026-11-07', 23, 55), f('2026-10-31', 0, 5)];
    // Sábados: 2026-11-21 (23:50), 11-14 (00:10), 11-07 (23:55), 10-31 (00:05)
    const r = calcularAntesDaOnda(diario((d) => (d === 6 ? 9 : 1)), fissuras, H, HOJE) as SugestaoOnda;
    expect(r.status).toBe('ok');
    expect(r.diaSemana).toBe(6);
    expect(r.minutos).toBe(0);
    expect(r.avisoDiaSemana).toBe(5); // sexta, 23:30
    expect(r.avisoMinutos).toBe(23 * 60 + 30);
    expect(textoSugestao(r)).toBe('sexta 23:30 · aprendido do seu diário');
  });

  it('horários espalhados o dia todo não formam padrão', () => {
    const f = (dia: string, h: number): Fissura => ({ id: dia, inicio: salvo(dia, h, 0), duracaoSeg: 1, venceu: true });
    const fissuras = [f('2026-11-20', 2), f('2026-11-13', 10), f('2026-11-06', 18), f('2026-10-30', 23)];
    const lista = diario(sextaPesada, 56, 12).map((r) => ({ ...r, salvoEm: salvo(r.dia, 12, 0) }));
    // Os relatos têm hora fixa, mas as fissuras (preferidas) estão espalhadas: sem padrão.
    expect(calcularAntesDaOnda(lista, fissuras, H, HOJE).status).toBe('poucosDados');
  });

  it('relatos salvos em outro dia (registro retroativo) não geram horário', () => {
    const lista = diario(sextaPesada).map((r) => ({ ...r, salvoEm: salvo(deslocarDia(r.dia, 1), 9, 0) }));
    expect(calcularAntesDaOnda(lista, [], H, HOJE).status).toBe('poucosDados');
  });

  it('ignora relatos fora das últimas 8 semanas', () => {
    const antigos = diario(sextaPesada, 56).map((r) => ({ ...r, dia: deslocarDia(r.dia, -60) }));
    expect(calcularAntesDaOnda(antigos, [], H, HOJE).status).toBe('poucosDados');
  });
});

describe('mediaCircular', () => {
  it('é nula sem dados e arredonda a 5 minutos', () => {
    expect(mediaCircular([])).toBeNull();
    expect(mediaCircular([21 * 60 + 33])?.minutos).toBe(21 * 60 + 35);
  });

  it('atravessa a meia-noite sem sair para o meio-dia', () => {
    const m = mediaCircular([23 * 60 + 50, 10]);
    expect(m?.minutos).toBe(0);
    expect(m?.concentracao).toBeGreaterThan(0.99);
  });

  it('pontos opostos têm concentração quase nula', () => {
    expect(mediaCircular([0, 720])?.concentracao).toBeLessThan(0.01);
  });
});

describe('nomeDiaSemana', () => {
  it('0 é domingo e 5 é sexta', () => {
    expect(nomeDiaSemana(0)).toBe('domingo');
    expect(nomeDiaSemana(5)).toBe('sexta');
    expect(nomeDiaSemana(7)).toBe('domingo');
  });
});
