import { Fragment } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { cores, fontes } from '@/theme';
import { Texto } from './Texto';

export type ItemTrio = {
  /** Valor em destaque (Fraunces 22). */
  valor: string;
  /** Legenda embaixo (11px, muted). */
  rotulo: string;
  /** Cor do valor. Padrão: text. */
  cor?: string;
};

type Props = {
  /** Normalmente 3 itens; as colunas dividem a largura igualmente, com separadores de 1px. */
  itens: ItemTrio[];
  style?: StyleProp<ViewStyle>;
};

/** Três números lado a lado (`.trio` do mockup): total, recorde, economia. */
export function Trio({ itens, style }: Props) {
  return (
    <View style={[styles.trio, style]}>
      {itens.map((item, i) => (
        <Fragment key={item.rotulo}>
          {i > 0 ? <View style={styles.sep} /> : null}
          <View
            style={styles.coluna}
            accessible
            accessibilityLabel={`${item.rotulo}: ${item.valor}`}
          >
            <Texto
              style={[styles.valor, item.cor ? { color: item.cor } : null]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {item.valor}
            </Texto>
            <Texto style={styles.rotulo}>{item.rotulo}</Texto>
          </View>
        </Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  trio: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingVertical: 12 },
  coluna: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  sep: { width: 1, height: 30, backgroundColor: cores.line },
  valor: {
    fontFamily: fontes.display,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.44,
    color: cores.text,
    textAlign: 'center',
  },
  rotulo: { fontSize: 11, lineHeight: 14, marginTop: 3, color: cores.muted, textAlign: 'center' },
});
