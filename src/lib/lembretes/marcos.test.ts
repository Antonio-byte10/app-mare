import { describe, expect, it } from 'vitest';
import { deslocarDia } from '../datas';
import type { Habito, Relato } from '../tipos';
import { proximoAvisoMarco } from './marcos';

const habito: Habito = {
  id: 'h1',
  tipo: 'tabaco',
  apelido: 'x',
  cor: 'aqua',
  meta: { tipo: 'parar' },
  inicio: '2026-11-01',
  criadoEm: 0,
};

const livre = (dia: string): Relato => ({
  dia,
  habitos: [{ habitoId: 'h1', vontade: 2, usou: false }],
  gatilhos: [],
  salvoEm: 0,
});
const deslize = (dia: string): Relato => ({
  dia,
  habitos: [{ habitoId: 'h1', vontade: 8, usou: true }],
  gatilhos: [],
  salvoEm: 0,
});
/** Relatos livres de `de` até `ate`, inclusive. */
const livres = (de: string, ate: string) => {
  const l: Relato[] = [];
  for (let d = de; d <= ate; d = deslocarDia(d, 1)) l.push(livre(d));
  return l;
};
const em = (dia: string, h: number, m = 0) => {
  const [a, mes, d] = dia.split('-').map(Number);
  return new Date(a, mes - 1, d, h, m).getTime();
};

describe('proximoAvisoMarco', () => {
  it('relato de hoje ainda não feito: o dia-base é ontem', () => {
    // 5 dias livres (01 a 05); hoje é 06 e falta responder. Faltam 2 para a semana: cai no dia 07.
    const a = proximoAvisoMarco(habito, livres('2026-11-01', '2026-11-05'), '2026-11-06', em('2026-11-06', 10));
    expect(a).toEqual({ dias: 7, dia: '2026-11-07', em: em('2026-11-07', 9) });
  });

  it('relato de hoje já feito: o dia-base é hoje, e o resultado é o mesmo dia', () => {
    const a = proximoAvisoMarco(habito, livres('2026-11-01', '2026-11-06'), '2026-11-06', em('2026-11-06', 23));
    expect(a).toEqual({ dias: 7, dia: '2026-11-07', em: em('2026-11-07', 9) });
  });

  it('o marco cai hoje, mas as 09:00 já passaram: não agenda', () => {
    const l = livres('2026-11-01', '2026-11-06'); // sequência 6, falta 1 (a semana)
    expect(proximoAvisoMarco(habito, l, '2026-11-07', em('2026-11-07', 15))).toBeNull();
    // Mesmo dia, de manhã cedo: ainda dá tempo.
    expect(proximoAvisoMarco(habito, l, '2026-11-07', em('2026-11-07', 7))?.dia).toBe('2026-11-07');
  });

  it('com a sequência zerada, o próximo marco é o de 24 horas', () => {
    const a = proximoAvisoMarco(habito, [deslize('2026-11-06')], '2026-11-06', em('2026-11-06', 12));
    expect(a).toEqual({ dias: 1, dia: '2026-11-07', em: em('2026-11-07', 9) });
  });

  it('muda quando a sequência muda: um deslize empurra o marco para mais longe', () => {
    const certo = [...livres('2026-11-01', '2026-11-05'), livre('2026-11-06')];
    const comDeslize = [...livres('2026-11-01', '2026-11-05'), deslize('2026-11-06')];
    const hoje = '2026-11-06';
    expect(proximoAvisoMarco(habito, certo, hoje, em(hoje, 12))?.dias).toBe(7);
    expect(proximoAvisoMarco(habito, comDeslize, hoje, em(hoje, 12))?.dias).toBe(1);
  });

  it('respeita "já estou há N dias" na sequência', () => {
    const h = { ...habito, diasAntes: 28 }; // 28 dias antes: o marco de 30 falta 2 (depois de hoje respondido)
    const a = proximoAvisoMarco(h, [livre('2026-11-01')], '2026-11-01', em('2026-11-01', 12));
    expect(a?.dias).toBe(30);
    expect(a?.dia).toBe('2026-11-02');
  });

  it('sem próximo marco (depois de 1 ano), não há aviso', () => {
    const h = { ...habito, diasAntes: 400 };
    expect(proximoAvisoMarco(h, [], '2026-11-06', em('2026-11-06', 12))).toBeNull();
  });
});
