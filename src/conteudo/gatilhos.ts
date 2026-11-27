import { GATILHOS_CANONICOS } from '../lib/gatilhos';

/**
 * Gatilhos oferecidos no relato do dia e em Recomeçar (rótulos). É a mesma lista do fim da onda:
 * a fonte única fica em `src/lib/gatilhos.ts`.
 */
export const GATILHOS: string[] = GATILHOS_CANONICOS.map((g) => g.rotulo);
