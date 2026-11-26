import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { margemTela } from '@/theme';

type Props = {
  children: React.ReactNode;
  /** Rola o conteúdo. Padrão: não rola (como o `.body` do mockup). */
  rolavel?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Corpo de uma tela: respeita a área segura do topo e usa a margem lateral do mockup (22). */
export function Tela({ children, rolavel = false, style }: Props) {
  const { top } = useSafeAreaInsets();
  const padding = { paddingTop: top + 14, paddingHorizontal: margemTela };
  if (rolavel) {
    return (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[padding, styles.rolagem, style]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.flex, padding, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rolagem: { paddingBottom: 24 },
});
