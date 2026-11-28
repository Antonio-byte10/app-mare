import { useId } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Stop } from 'react-native-svg';

type Props = {
  /** Escala animada (0,74 a 1): vem do passo "Respire". */
  escala: Animated.Value | number;
  tamanho: number;
  /** Dedo apoiado na esfera: acende os anéis de leve. */
  tocada?: boolean;
};

/**
 * Esfera de respiração (`.orb` do mockup): dois anéis finos e a esfera em degradê.
 * Todo o conjunto cresce e encolhe junto; o texto nunca fica sobre a esfera.
 */
export function Esfera({ escala, tamanho, tocada = false }: Props) {
  const base = `esfera${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const inset = (tamanho * 62) / 260;
  const miolo = tamanho - inset * 2;
  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel="Esfera que cresce e diminui, no ritmo da respiração"
      style={{ width: tamanho, height: tamanho, transform: [{ scale: escala }] }}
    >
      <View style={[styles.anel, { borderColor: tocada ? 'rgba(111,211,224,.45)' : 'rgba(111,211,224,.16)' }]} />
      <View
        style={[
          styles.anel,
          {
            top: (tamanho * 28) / 260,
            left: (tamanho * 28) / 260,
            right: (tamanho * 28) / 260,
            bottom: (tamanho * 28) / 260,
            borderColor: tocada ? 'rgba(169,182,245,.5)' : 'rgba(169,182,245,.22)',
          },
        ]}
      />
      <Svg width={miolo} height={miolo} style={{ position: 'absolute', top: inset, left: inset }}>
        <Defs>
          <RadialGradient id={`${base}a`} cx="0.38" cy="0.32" r="0.92">
            <Stop offset="0" stopColor="#C8F4F8" />
            <Stop offset="0.3" stopColor="#76D3E0" />
            <Stop offset="0.72" stopColor="#2F78A8" />
            <Stop offset="1" stopColor="#1B4E80" />
          </RadialGradient>
          <LinearGradient id={`${base}b`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.2} />
            <Stop offset="0.25" stopColor="#FFFFFF" stopOpacity={0} />
            <Stop offset="0.6" stopColor="#0A1E3C" stopOpacity={0} />
            <Stop offset="1" stopColor="#0A1E3C" stopOpacity={0.45} />
          </LinearGradient>
        </Defs>
        <Circle cx={miolo / 2} cy={miolo / 2} r={miolo / 2} fill={`url(#${base}a)`} />
        <Circle cx={miolo / 2} cy={miolo / 2} r={miolo / 2} fill={`url(#${base}b)`} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  anel: { ...StyleSheet.absoluteFill, borderRadius: 999, borderWidth: 1 },
});
