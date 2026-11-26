import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { cores, fontes } from '@/theme';

type Props = Pick<
  TextInputProps,
  'value' | 'onChangeText' | 'placeholder' | 'secureTextEntry' | 'keyboardType' | 'autoCapitalize' | 'textContentType' | 'editable'
> & {
  /** Nome para leitores de tela (o placeholder some quando a pessoa digita). */
  accessibilityLabel: string;
};

/** Campo de texto de uma linha no estilo `.input` do mockup (52 de altura, contorno fino). */
export function IaCampo({ accessibilityLabel, ...resto }: Props) {
  return (
    <TextInput
      {...resto}
      accessibilityLabel={accessibilityLabel}
      placeholderTextColor={cores.faint}
      autoCorrect={false}
      autoComplete="off"
      spellCheck={false}
      selectionColor={cores.aqua}
      style={styles.campo}
    />
  );
}

const styles = StyleSheet.create({
  campo: {
    height: 52,
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: cores.line2,
    backgroundColor: 'rgba(255,255,255,.03)',
    color: cores.text,
    fontFamily: fontes.ui,
    fontSize: 14.5,
  },
});
