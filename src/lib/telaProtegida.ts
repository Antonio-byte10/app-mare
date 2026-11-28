import { protegerTela } from '../../modules/disfarce';

/**
 * Telas protegidas: no Android, FLAG_SECURE (módulo nativo local, `modules/disfarce`). Bloqueia
 * capturas e gravações de tela e esconde o app na lista de apps recentes. Falha em silêncio; no
 * navegador não faz nada. Módulo fino, fora dos testes.
 */
export async function aplicarTelaProtegida(ligado: boolean): Promise<void> {
  protegerTela(ligado);
}
