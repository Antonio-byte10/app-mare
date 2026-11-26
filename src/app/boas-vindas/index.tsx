import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '@/components/Botao';
import { Fundo } from '@/components/Fundo';
import { Icone } from '@/components/Icone';
import { Simbolo } from '@/components/Simbolo';
import { Texto } from '@/components/Texto';
import { useRascunhoPrimeiroUso } from '@/lib/rascunhoPrimeiroUso';
import { cores, fontes } from '@/theme';

/** Abertura (mockup 1): a marca, uma frase calma e a promessa de privacidade. */
export default function Abertura() {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  return (
    <Fundo variante="abertura">
      <View style={styles.centro}>
        <Simbolo tamanho={112} />
        <Texto style={styles.marca} accessibilityRole="header">
          maré
        </Texto>
        <Texto style={styles.frase}>{'Um lugar calmo para atravessar\nas ondas, um dia de cada vez.'}</Texto>
      </View>
      <View style={[styles.rodape, { paddingBottom: Math.max(bottom, 12) + 10 }]}>
        <View style={styles.privacidade} accessible accessibilityLabel="Sem conta. Tudo fica só neste celular.">
          <Icone nome="cadeado" tamanho={16} cor={cores.muted} />
          <Texto style={styles.privacidadeTexto}>Sem conta. Tudo fica só neste celular.</Texto>
        </View>
        <Botao
          onPress={() => {
            // Começar de novo sempre parte de um rascunho limpo.
            useRascunhoPrimeiroUso.getState().reiniciar();
            router.push('/boas-vindas/habitos');
          }}
        >
          Começar
        </Botao>
      </View>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22, paddingHorizontal: 34 },
  marca: { fontFamily: fontes.display, fontSize: 46, lineHeight: 54, letterSpacing: -1.6, textAlign: 'center' },
  frase: { fontSize: 15, lineHeight: 23, color: cores.muted, textAlign: 'center' },
  rodape: { paddingHorizontal: 22, gap: 12 },
  privacidade: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  privacidadeTexto: { fontSize: 12.5, lineHeight: 18, color: cores.muted },
});
