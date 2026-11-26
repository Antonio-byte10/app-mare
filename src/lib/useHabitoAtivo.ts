import { habitoAtivoDe } from './inicio';
import type { Habito } from './tipos';
import { useMare } from '@/store';

/**
 * Hábito mostrado nas telas (Início, Diário, Marcos): o escolhido em `ajustes.habitoAtivo` ou, se
 * ele não existe mais, o primeiro. `ativo` é `undefined` sem hábitos.
 */
export function useHabitoAtivo(): { habitos: Habito[]; ativo: Habito | undefined; escolher: (id: string) => void } {
  const habitos = useMare((e) => e.habitos);
  const habitoAtivo = useMare((e) => e.ajustes.habitoAtivo);
  const setAjustes = useMare((e) => e.setAjustes);
  return { habitos, ativo: habitoAtivoDe(habitos, habitoAtivo), escolher: (id) => setAjustes({ habitoAtivo: id }) };
}
