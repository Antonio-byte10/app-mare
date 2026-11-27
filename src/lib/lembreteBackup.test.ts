import { describe, expect, it } from 'vitest';
import { DIA_MS } from './datas';
import { deveSugerirBackup, primeiroUsoEm, textoUltimoBackup } from './lembreteBackup';
import type { Habito, Relato } from './tipos';

const AGORA = new Date(2026, 10, 27, 15, 0, 0).getTime();
const haDias = (n: number) => AGORA - n * DIA_MS;

describe('textoUltimoBackup', () => {
  it('nunca', () => expect(textoUltimoBackup(undefined, AGORA)).toBe('Último backup: nunca'));
  it('hoje', () => {
    expect(textoUltimoBackup(AGORA, AGORA)).toBe('Último backup: hoje');
    expect(textoUltimoBackup(new Date(2026, 10, 27, 0, 5).getTime(), AGORA)).toBe('Último backup: hoje');
  });
  it('singular e plural', () => {
    expect(textoUltimoBackup(haDias(1), AGORA)).toBe('Último backup: há 1 dia');
    expect(textoUltimoBackup(haDias(2), AGORA)).toBe('Último backup: há 2 dias');
    expect(textoUltimoBackup(haDias(40), AGORA)).toBe('Último backup: há 40 dias');
  });
  it('conta dias de calendário, não blocos de 24 horas', () => {
    const ontemTarde = new Date(2026, 10, 26, 23, 50).getTime();
    expect(textoUltimoBackup(ontemTarde, new Date(2026, 10, 27, 0, 10).getTime())).toBe('Último backup: há 1 dia');
  });
  it('relógio no futuro vira hoje', () => {
    expect(textoUltimoBackup(AGORA + 5 * DIA_MS, AGORA)).toBe('Último backup: hoje');
  });
});

describe('primeiroUsoEm', () => {
  const h = (criadoEm: number) => ({ criadoEm }) as Habito;
  const r = (salvoEm: number) => ({ salvoEm }) as Relato;
  it('sem nada, não há início', () => expect(primeiroUsoEm([], [])).toBeUndefined());
  it('pega o mais antigo entre hábitos e relatos', () => {
    expect(primeiroUsoEm([h(500), h(900)], [r(300), r(1000)])).toBe(300);
    expect(primeiroUsoEm([h(200)], [r(300)])).toBe(200);
  });
});

describe('deveSugerirBackup', () => {
  const base = { agora: AGORA, primeiroUsoEm: haDias(10) };
  it('sem início de uso, não sugere', () => expect(deveSugerirBackup({ agora: AGORA })).toBe(false));
  it('menos de 7 dias de uso, não sugere', () => {
    expect(deveSugerirBackup({ agora: AGORA, primeiroUsoEm: haDias(6) })).toBe(false);
  });
  it('7 dias de uso e nunca fez backup, sugere', () => {
    expect(deveSugerirBackup({ agora: AGORA, primeiroUsoEm: haDias(7) })).toBe(true);
    expect(deveSugerirBackup(base)).toBe(true);
  });
  it('backup recente, não sugere', () => {
    expect(deveSugerirBackup({ ...base, ultimoBackupEm: haDias(30) })).toBe(false);
    expect(deveSugerirBackup({ ...base, ultimoBackupEm: haDias(2) })).toBe(false);
  });
  it('backup com mais de 30 dias, sugere', () => {
    expect(deveSugerirBackup({ ...base, ultimoBackupEm: haDias(31) })).toBe(true);
  });
  it('depois de "Agora não", espera 14 dias', () => {
    expect(deveSugerirBackup({ ...base, backupSugeridoEm: haDias(3) })).toBe(false);
    expect(deveSugerirBackup({ ...base, backupSugeridoEm: haDias(14) })).toBe(false);
    expect(deveSugerirBackup({ ...base, backupSugeridoEm: haDias(15) })).toBe(true);
  });
  it('as três condições juntas', () => {
    expect(
      deveSugerirBackup({ agora: AGORA, primeiroUsoEm: haDias(90), ultimoBackupEm: haDias(60), backupSugeridoEm: haDias(20) }),
    ).toBe(true);
  });
});
