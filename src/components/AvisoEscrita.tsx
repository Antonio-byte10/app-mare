import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMare } from '@/store';
import { cores } from '@/theme';
import { Texto } from './Texto';

/**
 * Faixa discreta no topo enquanto as gravações estiverem falhando (ex.: armazenamento cheio).
 * Some sozinha quando uma gravação volta a dar certo. Não bloqueia nada.
 */
export function AvisoEscrita() {
  const erroEscrita = useMare((e) => e.erroEscrita);
  const { top } = useSafeAreaInsets();
  if (!erroEscrita) return null;
  return (
    <View
      style={[styles.faixa, { paddingTop: top + 8 }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      pointerEvents="none"
    >
      <Texto tipo="legenda" style={styles.texto}>
        Não consegui guardar suas últimas mudanças. Libere espaço no celular; o app tenta de novo na próxima mudança.
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  faixa: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: cores.surface,
    borderBottomWidth: 1,
    borderBottomColor: cores.sand,
  },
  texto: { color: cores.text, textAlign: 'center' },
});
