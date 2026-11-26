import { useId } from 'react';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Mask, Path, Rect, Stop } from 'react-native-svg';

type Props = { tamanho?: number };

/** Símbolo lua + onda, copiado do `<symbol id="mare">` do mockup v2 (viewBox 64). */
export function Simbolo({ tamanho = 64 }: Props) {
  const base = `mare${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const idAro = `${base}a`;
  const idAgua = `${base}w`;
  const idRecorte = `${base}c`;
  const idLua = `${base}m`;
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 64 64" accessibilityLabel="Maré" role="img">
      <Defs>
        <LinearGradient id={idAro} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#9BE8F0" />
          <Stop offset="1" stopColor="#8E9DF0" />
        </LinearGradient>
        <LinearGradient id={idAgua} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#7FD9E5" />
          <Stop offset="1" stopColor="#5B6FD6" />
        </LinearGradient>
        <ClipPath id={idRecorte}>
          <Circle cx="32" cy="32" r="24" />
        </ClipPath>
        <Mask id={idLua} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <Rect width="64" height="64" fill="#fff" />
          <Circle cx="44" cy="17.5" r="6.2" fill="#000" />
        </Mask>
      </Defs>
      <Circle cx="32" cy="32" r="24" fill="none" stroke={`url(#${idAro})`} strokeWidth="2.4" />
      <G clipPath={`url(#${idRecorte})`}>
        <Path d="M2 41 C11 35 19 35 27 40 S43 46 51 40 S60 35 64 37 V64 H2Z" fill={`url(#${idAgua})`} />
        <Path
          d="M2 48 C11 43 19 43 27 47 S43 52 51 47 S60 43 64 44"
          fill="none"
          stroke="#071526"
          strokeOpacity={0.35}
          strokeWidth="1.6"
        />
      </G>
      <Circle cx="40" cy="20.5" r="6.6" fill="#F2C98A" mask={`url(#${idLua})`} />
    </Svg>
  );
}
