import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { comAlfa, cores, fontes } from '@/theme';
import { Texto } from './Texto';

type Props<T extends string | number | boolean> = {
  opcoes: { valor: T; rotulo: string }[];
  valor: T;
  onChange: (valor: T) => void;
  /** Cor do item selecionado. Padrão foam (`.seg .on` do mockup). */
  cor?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Controle segmentado (`.seg` do mockup): uma escolha entre poucas opções. */
export function Segmento<T extends string | number | boolean>({
  opcoes,
  valor,
  onChange,
  cor = cores.foam,
  accessibilityLabel,
  style,
}: Props<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={[styles.seg, style]}>
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <Pressable
            key={String(o.valor)}
            accessibilityRole="radio"
            accessibilityState={{ selected: ativo, checked: ativo }}
            onPress={() => onChange(o.valor)}
            style={[styles.item, ativo && { backgroundColor: comAlfa(cor, 0.13), borderColor: comAlfa(cor, 0.35) }]}
          >
            <Texto style={styles.texto} cor={ativo ? cor : cores.muted}>
              {o.rotulo}
            </Texto>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  seg: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: cores.line,
    backgroundColor: 'rgba(255,255,255,.02)',
  },
  item: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  texto: { fontFamily: fontes.uiForte, fontSize: 14, lineHeight: 18 },
});
