import { StyleSheet, View } from 'react-native';

type Props = { passo: 1 | 2 | 3 };

/** Indicador de 3 traços (`.steps` do mockup): os passos já alcançados ficam brancos. */
export function TracosPasso({ passo }: Props) {
  return (
    <View
      style={styles.linha}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Passo ${passo} de 3`}
      accessibilityValue={{ min: 1, max: 3, now: passo }}
    >
      {[1, 2, 3].map((n) => (
        <View key={n} style={[styles.traco, n <= passo && styles.ligado]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', gap: 6 },
  traco: { width: 22, height: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.14)' },
  ligado: { backgroundColor: '#EAF2FB' },
});
