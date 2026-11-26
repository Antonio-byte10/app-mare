import { StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { cores, fontes } from '@/theme';
import { Texto } from './Texto';

type Props = {
  rotulo: string;
  valor: string;
  aoMudar: (t: string) => void;
  aoSair?: () => void;
  erro?: string;
  /** Explicação curta sob o campo (some quando há erro). */
  ajuda?: string;
  placeholder?: string;
  teclado?: KeyboardTypeOptions;
  maxLength?: number;
  multilinha?: boolean;
  /** Abre o teclado ao entrar na tela. */
  autoFoco?: boolean;
};

/** Campo de texto do formulário: rótulo, entrada de 52 de altura e mensagem de erro em areia (nunca vermelho). */
export function Campo({
  rotulo,
  valor,
  aoMudar,
  aoSair,
  erro,
  ajuda,
  placeholder,
  teclado,
  maxLength,
  multilinha,
  autoFoco,
}: Props) {
  return (
    <View style={styles.campo}>
      <Texto style={styles.rotulo}>{rotulo}</Texto>
      <TextInput
        accessibilityLabel={rotulo}
        value={valor}
        onChangeText={aoMudar}
        onBlur={aoSair}
        placeholder={placeholder}
        placeholderTextColor={cores.faint}
        keyboardType={teclado}
        maxLength={maxLength}
        multiline={multilinha}
        textAlignVertical={multilinha ? 'top' : 'center'}
        autoFocus={autoFoco}
        style={[styles.input, multilinha && styles.multilinha, erro ? { borderColor: cores.sand } : null]}
      />
      {erro ? (
        <Texto tipo="legenda" cor={cores.sand} accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : ajuda ? (
        <Texto tipo="legenda">{ajuda}</Texto>
      ) : null}
    </View>
  );
}

export const estiloInput = {
  height: 52,
  borderRadius: 18,
  paddingHorizontal: 16,
  borderWidth: 1,
  borderColor: cores.line2,
  backgroundColor: 'rgba(255,255,255,.03)',
  color: cores.text,
  fontFamily: fontes.ui,
  fontSize: 14.5,
} as const;

const styles = StyleSheet.create({
  campo: { marginBottom: 20, gap: 8 },
  rotulo: { fontFamily: fontes.uiForte, fontSize: 13.5, lineHeight: 18, color: cores.text },
  input: estiloInput,
  multilinha: { height: undefined, minHeight: 96, paddingVertical: 14, lineHeight: 21 },
});
