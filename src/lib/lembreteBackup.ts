import { DIA_MS, dataLocal, meioDia } from './datas';
import type { Habito, Relato } from './tipos';

/** Dias de uso antes de o app sugerir o primeiro backup. */
export const DIAS_DE_USO_PARA_SUGERIR = 7;
/** Passado esse tempo sem backup, o app volta a sugerir. */
export const DIAS_SEM_BACKUP_PARA_SUGERIR = 30;
/** Depois de "Agora não", o app espera esse tempo para sugerir de novo. */
export const DIAS_ENTRE_SUGESTOES = 14;

/** Dias de calendário (no fuso do aparelho) entre dois instantes; nunca negativo. */
function diasDeCalendario(de: number, ate: number): number {
  const dias = Math.round((meioDia(dataLocal(ate)).getTime() - meioDia(dataLocal(de)).getTime()) / DIA_MS);
  return Math.max(0, dias);
}

/** "Último backup: hoje", "há 1 dia", "há 12 dias" ou "nunca". */
export function textoUltimoBackup(ultimoBackupEm: number | undefined, agora: number): string {
  if (ultimoBackupEm === undefined) return 'Último backup: nunca';
  const dias = diasDeCalendario(ultimoBackupEm, agora);
  if (dias === 0) return 'Último backup: hoje';
  return `Último backup: há ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

/** Início do uso do app: o hábito mais antigo ou o relato mais antigo, o que vier primeiro. `undefined` se não há nada. */
export function primeiroUsoEm(habitos: Habito[], relatos: Relato[]): number | undefined {
  const instantes = [...habitos.map((h) => h.criadoEm), ...relatos.map((r) => r.salvoEm)].filter(
    (t) => Number.isFinite(t) && t > 0,
  );
  return instantes.length > 0 ? Math.min(...instantes) : undefined;
}

export interface EntradaSugestao {
  agora: number;
  primeiroUsoEm?: number;
  ultimoBackupEm?: number;
  backupSugeridoEm?: number;
}

/**
 * Hora de sugerir um backup com delicadeza? Só quem já usa o app há pelo menos 7 dias, que nunca
 * fez backup (ou fez há mais de 30 dias) e que não foi lembrado nos últimos 14 dias.
 */
export function deveSugerirBackup({ agora, primeiroUsoEm: primeiro, ultimoBackupEm, backupSugeridoEm }: EntradaSugestao): boolean {
  if (primeiro === undefined) return false;
  if (agora - primeiro < DIAS_DE_USO_PARA_SUGERIR * DIA_MS) return false;
  if (ultimoBackupEm !== undefined && agora - ultimoBackupEm <= DIAS_SEM_BACKUP_PARA_SUGERIR * DIA_MS) return false;
  if (backupSugeridoEm !== undefined && agora - backupSugeridoEm <= DIAS_ENTRE_SUGESTOES * DIA_MS) return false;
  return true;
}
