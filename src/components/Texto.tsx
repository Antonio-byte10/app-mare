import { Text, type TextProps, type TextStyle } from 'react-native';
import { cores, fontes } from '@/theme';

export type TipoTexto = 'display' | 'titulo' | 'corpo' | 'rotulo' | 'legenda';

type Props = TextProps & {
  tipo?: TipoTexto;
  /** Sobrescreve a cor padrão do tipo. */
  cor?: string;
};

// Medidas do mockup v2 (letter-spacing em em, convertido para px).
const estilos: Record<TipoTexto, TextStyle> = {
  // Números grandes (.num: 84px, Fraunces leve, -0.05em).
  display: { fontFamily: fontes.displayLeve, fontSize: 84, lineHeight: 72, letterSpacing: -4.2, color: cores.text },
  // Títulos e frases de acolhimento (.h: 26px, -0.02em).
  titulo: { fontFamily: fontes.display, fontSize: 26, lineHeight: 31, letterSpacing: -0.52, color: cores.text },
  // Texto de interface (Geist 15px).
  corpo: { fontFamily: fontes.ui, fontSize: 15, lineHeight: 23, color: cores.text },
  // Etiqueta em caixa alta (.k2: 11px, .16em, aqua).
  rotulo: {
    fontFamily: fontes.uiForte,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.76,
    textTransform: 'uppercase',
    color: cores.aqua,
  },
  // Apoio e metadados (12.5px, muted).
  legenda: { fontFamily: fontes.ui, fontSize: 12.5, lineHeight: 18, color: cores.muted },
};

export function Texto({ tipo = 'corpo', cor, style, ...resto }: Props) {
  return <Text {...resto} style={[estilos[tipo], cor ? { color: cor } : null, style]} />;
}
