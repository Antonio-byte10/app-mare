/** Regras do bloqueio do app que não dependem de tela nem de Expo (testáveis). */

export interface EntradaBloqueio {
  ligado: boolean;
  /** Minutos fora do app que bastam para bloquear (0 = ao sair). */
  aposMinutos: number;
}

/**
 * Ao voltar para o app: precisa bloquear?
 * - bloqueio desligado: nunca;
 * - sem saber quando saiu: bloqueia (mais seguro);
 * - relógio que voltou para trás: bloqueia (não dá para saber quanto tempo passou);
 * - senão, bloqueia quando o tempo fora chega ao escolhido (com 0 minutos, sempre).
 */
export function deveBloquear(cfg: EntradaBloqueio, saiuEm: number | null, agora: number): boolean {
  if (!cfg.ligado) return false;
  if (saiuEm === null || agora < saiuEm) return true;
  return agora - saiuEm >= cfg.aposMinutos * 60_000;
}

/** "0:30", "1:05", "15:00" a partir de milissegundos (arredonda para cima). */
export function formatarEspera(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Rótulo da opção "Bloquear depois de". */
export const OPCOES_APOS: { valor: number; rotulo: string }[] = [
  { valor: 0, rotulo: 'Ao sair' },
  { valor: 1, rotulo: '1 min' },
  { valor: 5, rotulo: '5 min' },
  { valor: 15, rotulo: '15 min' },
];
