import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Botao } from './Botao';
import { Simbolo } from './Simbolo';
import { Texto } from './Texto';

/** Início sem hábitos. */
export function Vazio() {
  const router = useRouter();
  return (
    <View style={styles.centro}>
      <Simbolo tamanho={96} />
      <Texto tipo="titulo" style={styles.frase}>
        Vamos começar pelo que você quer mudar.
      </Texto>
      <Botao onPress={() => router.push('/habito/novo')} style={styles.botao}>
        Adicionar hábito
      </Botao>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22, paddingHorizontal: 12 },
  frase: { textAlign: 'center' },
  botao: { alignSelf: 'stretch', marginTop: 8 },
});
