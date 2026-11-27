import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { cores } from '@/theme';
import { Icone } from './Icone';
import { Texto } from './Texto';

/** Topo das telas de ajustes (como em Inteligência artificial): botão voltar e título. */
export function TopoTela({ titulo }: { titulo: string }) {
  const router = useRouter();
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <View style={styles.topo}>
      <Pressable onPress={voltar} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={4} style={styles.voltar}>
        <Icone nome="voltar" />
      </Pressable>
      <Texto tipo="titulo" style={styles.titulo} accessibilityRole="header">
        {titulo}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  voltar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,.035)',
    borderWidth: 1,
    borderColor: cores.line,
  },
  titulo: { fontSize: 22, lineHeight: 27, flex: 1 },
});
