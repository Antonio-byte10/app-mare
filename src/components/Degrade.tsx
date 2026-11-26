import { useId } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type Props = {
  /** Cor do topo e cor da base (degradê vertical, como `linear-gradient(180deg, ...)`). */
  de: string;
  para: string;
};

/** Preenche o pai (que deve ter `overflow: 'hidden'` e raio) com um degradê vertical. */
export function Degrade({ de, para }: Props) {
  // Ids de SVG são globais no web: um por instância, para cada degradê manter as suas cores.
  const id = `degrade${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={de} />
          <Stop offset="1" stopColor={para} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}
