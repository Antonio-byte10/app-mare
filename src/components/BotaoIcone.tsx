import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { cores } from '@/theme';
import { Icone, type NomeIcone } from './Icone';

type Props = {
  icone: NomeIcone;
  onPress: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

/** Botão quadrado de 40 (`.ib` do mockup) para voltar e fechar; a área de toque chega a 48dp. */
export function BotaoIcone({ icone, onPress, accessibilityLabel, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={4}
      style={[styles.botao, style]}
    >
      <Icone nome={icone} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: cores.line,
    backgroundColor: 'rgba(255,255,255,.035)',
  },
});
