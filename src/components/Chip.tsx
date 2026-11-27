import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { comAlfa, cores, fontes } from '@/theme';
import { Texto } from './Texto';

type Props = {
  children: string;
  ativo?: boolean;
  /** Cor de destaque do chip (ponto e contorno quando ativo). Padrão aqua. */
  cor?: string;
  /** Mostra o ponto colorido antes do texto (como nos eixos Fôlego, Calmaria, Foco). */
  ponto?: boolean;
  onPress?: () => void;
  /** Nome para leitores de tela, quando o texto sozinho não basta (ex.: "+ Novo"). */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ children, ativo = false, cor = cores.aqua, ponto = false, onPress, accessibilityLabel, style }: Props) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: ativo }}
      disabled={!onPress}
      // 36 de altura no visual; a área de toque chega a 42dp. A folga é de 3 em cima e embaixo para não
      // invadir o chip vizinho (os grupos de chips usam espaço de 7 ou mais entre as linhas).
      hitSlop={{ top: 3, bottom: 3 }}
      onPress={onPress}
      style={[
        styles.base,
        ativo
          ? { backgroundColor: comAlfa(cor, 0.1), borderColor: comAlfa(cor, 0.42) }
          : { borderColor: cores.faint }, // contorno com pelo menos 3:1 contra o fundo
        style,
      ]}
    >
      {ponto ? <View style={[styles.ponto, { backgroundColor: cor }]} /> : null}
      <Texto style={styles.texto} cor={ativo ? cores.text : cores.muted}>
        {children}
      </Texto>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    minHeight: 36,
    paddingVertical: 5,
    maxWidth: '100%',
    paddingHorizontal: 13,
    borderRadius: 999,
    borderWidth: 1,
  },
  ponto: { width: 7, height: 7, borderRadius: 3.5 },
  texto: { fontFamily: fontes.uiMedia, fontSize: 13, lineHeight: 16, flexShrink: 1 },
});
