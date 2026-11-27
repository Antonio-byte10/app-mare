import type { ImageSourcePropType } from 'react-native';
import type { Disfarce } from '@/lib/tipos';

/** Prévia do ícone de cada disfarce (gerada por scripts/gerar-icones-disfarce.py). */
export const ICONE_DISFARCE: Record<Disfarce, ImageSourcePropType> = {
  mare: require('../../assets/disfarces/mare.png'),
  diario: require('../../assets/disfarces/diario.png'),
  notas: require('../../assets/disfarces/notas.png'),
  calma: require('../../assets/disfarces/calma.png'),
};
