/** Tokens visuais do Maré. Valores tirados de docs/design/mockups-v2.html. */

export const cores = {
  abyss: '#030D19',
  bg: '#071526',
  surface: '#0E2540',
  surface2: '#143253',
  line: 'rgba(150,190,240,.11)',
  line2: 'rgba(150,190,240,.18)',
  text: '#EAF2FB',
  muted: '#9DB3CC',
  faint: '#7F97B3',
  aqua: '#6FD3E0',
  peri: '#A9B6F5',
  sand: '#F2C98A',
  foam: '#7FE0B5',
  coral: '#F0A08A',
  /** Texto sobre o botão primário e o botão da onda. */
  tinta: '#052033',
} as const;

export const fontes = {
  display: 'Fraunces_400Regular',
  displayLeve: 'Fraunces_300Light',
  ui: 'Geist_400Regular',
  uiMedia: 'Geist_500Medium',
  uiForte: 'Geist_600SemiBold',
} as const;

export const raio = { sm: 12, md: 16, lg: 20, xl: 24 } as const;

/** Espessura das linhas e contornos. */
export const linha = 1;

/** Margem lateral padrão das telas (`.body` do mockup). */
export const margemTela = 22;

/** `#RRGGBB` + opacidade (0 a 1) vira `rgba(...)`. */
export function comAlfa(hex: string, alfa: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alfa})`;
}
