import { Pressable, StyleSheet, View } from 'react-native';
import { comAlfa, cores } from '@/theme';

type Props = {
  ligado: boolean;
  aoMudar: (ligado: boolean) => void;
  accessibilityLabel: string;
};

/**
 * Interruptor (`.tg` do mockup 11): 44x26, bolinha de 20. Sem animação, então não há o que reduzir.
 * Desligado, o contorno usa `faint` (pelo menos 3:1 contra o fundo): só o preenchimento quase some.
 */
export function Interruptor({ ligado, aoMudar, accessibilityLabel }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: ligado }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => aoMudar(!ligado)}
      // Trilho de 44x26; a área de toque chega a 60x48dp.
      hitSlop={{ top: 11, bottom: 11, left: 8, right: 8 }}
      style={[
        styles.trilho,
        ligado
          ? { backgroundColor: comAlfa(cores.aqua, 0.35), borderColor: comAlfa(cores.aqua, 0.5) }
          : { backgroundColor: 'rgba(255,255,255,.1)', borderColor: cores.faint },
      ]}
    >
      <View
        style={[
          styles.bolinha,
          ligado
            ? { backgroundColor: cores.text, transform: [{ translateX: 18 }] }
            : { backgroundColor: cores.faint },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trilho: { width: 44, height: 26, borderRadius: 999, borderWidth: 1, justifyContent: 'center' },
  // Trilho com borda de 1: a bolinha parte de left 2 para ficar a 3px da borda externa.
  bolinha: { position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: 10 },
});
