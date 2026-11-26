import { useId } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { cores } from '@/theme';

type Props = {
  variante?: 'padrao' | 'mar' | 'abertura';
  style?: ViewStyle;
  children?: React.ReactNode;
};

/**
 * Fundo das telas, igual ao `.scr` do mockup.
 * padrao: radial-gradient(140% 70% at 50% -8%, #113257 0%, #071526 55%)
 * mar:    radial-gradient(120% 65% at 50% 30%, #164373 0%, #0A2442 46%, #040E1B 100%)
 * abertura (`.splash`): radial-gradient(100% 60% at 50% 45%, #123A63 0%, #071526 60%, #040E1B 100%)
 * Em unidades da caixa, `r` 1 vira uma elipse com raios iguais à largura e à altura;
 * `gradientTransform` ajusta o raio vertical.
 */
export function Fundo({ variante = 'padrao', style, children }: Props) {
  // [centroY, raioX, raioY] como fração da caixa
  const [cy, rx, ry] =
    variante === 'mar' ? [0.3, 1.2, 0.65] : variante === 'abertura' ? [0.45, 1.0, 0.6] : [-0.08, 1.4, 0.7];
  const paradas: [number, string][] =
    variante === 'mar'
      ? [[0, '#164373'], [0.46, '#0A2442'], [1, '#040E1B']]
      : variante === 'abertura'
        ? [[0, '#123A63'], [0.6, cores.bg], [1, '#040E1B']]
        : [[0, '#113257'], [0.55, cores.bg], [1, cores.bg]];
  const id = `fundo${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View style={[styles.raiz, style]}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
        <Defs>
          <RadialGradient
            id={id}
            cx="0.5"
            cy={cy}
            r={rx}
            gradientTransform={`translate(0.5 ${cy}) scale(1 ${ry / rx}) translate(-0.5 ${-cy})`}
          >
            {paradas.map(([offset, cor]) => (
              <Stop key={offset} offset={offset} stopColor={cor} />
            ))}
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.bg },
});
