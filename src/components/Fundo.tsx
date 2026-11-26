import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { cores } from '@/theme';

type Props = {
  variante?: 'padrao' | 'mar';
  style?: ViewStyle;
  children?: React.ReactNode;
};

/**
 * Fundo das telas, igual ao `.scr` do mockup.
 * padrao: radial-gradient(140% 70% at 50% -8%, #113257 0%, #071526 55%)
 * mar:    radial-gradient(120% 65% at 50% 30%, #164373 0%, #0A2442 46%, #040E1B 100%)
 * Em unidades da caixa, `r` 1 vira uma elipse com raios iguais à largura e à altura;
 * `gradientTransform` ajusta o raio vertical.
 */
export function Fundo({ variante = 'padrao', style, children }: Props) {
  const mar = variante === 'mar';
  // [centroY, raioX, raioY] como fração da caixa
  const [cy, rx, ry] = mar ? [0.3, 1.2, 0.65] : [-0.08, 1.4, 0.7];
  const paradas: [number, string][] = mar
    ? [[0, '#164373'], [0.46, '#0A2442'], [1, '#040E1B']]
    : [[0, '#113257'], [0.55, cores.bg], [1, cores.bg]];
  const id = `fundo-${variante}`;
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
