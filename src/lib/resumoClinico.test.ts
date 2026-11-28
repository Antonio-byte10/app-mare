import { describe, expect, it } from 'vitest';
import { gerarResumoConsulta } from './resumoClinico';
import type { Avaliacao, Fissura, Habito, Relato } from './tipos';

const HOJE = '2026-11-28';
const em = (dia: string, hora = 21) => new Date(`${dia}T${String(hora).padStart(2, '0')}:00:00`).getTime();

const habito: Habito = {
  id: 'h1',
  tipo: 'tabaco',
  apelido: 'Fôlego',
  cor: 'aqua',
  meta: { tipo: 'parar' },
  inicio: '2026-11-01',
  criadoEm: 0,
};

describe('gerarResumoConsulta', () => {
  it('sem hábitos ou sem registros no período retorna temDados false', () => {
    expect(gerarResumoConsulta({ habitos: [], relatos: [], fissuras: [], avaliacoes: [], hoje: HOJE }).temDados).toBe(false);
    expect(gerarResumoConsulta({ habitos: [habito], relatos: [], fissuras: [], avaliacoes: [], hoje: HOJE }).temDados).toBe(false);
  });

  it('gera resumo com contagens, vontade média, horário e gatilhos conhecidos sem vazar notas nem texto livre', () => {
    const relatos: Relato[] = [
      {
        dia: '2026-11-27',
        habitos: [{ habitoId: 'h1', vontade: 6, usou: false, estado: 'livre' }],
        gatilhos: ['Estresse', 'Briga com meu chefe João'],
        nota: 'SEGREDO_INTIMO_NAO_EXPOR',
        salvoEm: em('2026-11-27'),
      },
      {
        dia: '2026-11-28',
        habitos: [{ habitoId: 'h1', vontade: 4, usou: true, estado: 'deslize' }],
        gatilhos: ['Ansiedade'],
        nota: 'OUTRA_NOTA_PRIVADA',
        salvoEm: em('2026-11-28'),
      },
    ];
    const fissuras: Fissura[] = [
      { id: '1', inicio: em('2026-11-25', 21), duracaoSeg: 180, venceu: true, habitoId: 'h1', ajudou: 'TEXTO_PRIVADO', gatilhos: ['estresse'] },
      { id: '2', inicio: em('2026-11-26', 21), duracaoSeg: 200, venceu: true, habitoId: 'h1' },
      { id: '3', inicio: em('2026-11-27', 21), duracaoSeg: 190, venceu: true, habitoId: 'h1' },
    ];
    const avaliacoes: Avaliacao[] = [
      { id: 'a1', feitaEm: em('2026-11-20'), resultados: [{ habitoId: 'h1', tipo: 'tabaco', pontos: 5, maximo: 10, nivel: 'moderada' }] },
    ];

    const res = gerarResumoConsulta({ habitos: [habito], relatos, fissuras, avaliacoes, hoje: HOJE });
    expect(res.temDados).toBe(true);
    expect(res.texto).toContain('Fôlego (Tabaco / nicotina) — Meta: parar');
    expect(res.texto).toContain('1 dia livre, 1 deslize');
    expect(res.texto).toContain('Vontade média: 5 de 10');
    expect(res.texto).toContain('Ondas de fissura atravessadas: 3');
    expect(res.texto).toContain('por volta das 21h');
    expect(res.texto).toContain('Estresse (2x)');
    expect(res.texto).toContain('Atenção moderada (5/10)');
    expect(res.texto).not.toContain('SEGREDO_INTIMO_NAO_EXPOR');
    expect(res.texto).not.toContain('OUTRA_NOTA_PRIVADA');
    expect(res.texto).not.toContain('TEXTO_PRIVADO');
    expect(res.texto).not.toContain('Briga com meu chefe João');
  });
});
