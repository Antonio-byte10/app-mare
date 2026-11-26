import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { recomecarDoZero } from '@/lib/armazenamento';
import { confirmar } from '@/lib/confirmar';
import { useMare } from '@/store';
import { cores } from '@/theme';
import { Botao } from './Botao';
import { Simbolo } from './Simbolo';
import { Texto } from './Texto';

/**
 * Início quando o banco existe mas não abriu. Nada foi apagado: só a pessoa decide recomeçar,
 * e só depois de confirmar.
 */
export function AvisoDados() {
  const [apagando, setApagando] = useState(false);
  const [falhou, setFalhou] = useState(false);

  const recomecar = () => {
    confirmar(
      'Começar do zero?',
      'Isso apaga todos os registros deste aparelho e não pode ser desfeito.',
      'Apagar e começar',
      async () => {
        setApagando(true);
        setFalhou(false);
        try {
          await recomecarDoZero();
          await useMare.persist.rehydrate();
        } catch {
          setFalhou(true);
        } finally {
          setApagando(false);
        }
      },
    );
  };

  return (
    <View style={styles.centro}>
      <Simbolo tamanho={72} />
      <Texto tipo="titulo" style={styles.frase} accessibilityRole="alert">
        Não conseguimos abrir seus dados neste aparelho. Nada foi apagado.
      </Texto>
      <Texto tipo="legenda" style={styles.apoio}>
        Se preferir, você pode recomeçar do zero. Só acontece se você confirmar.
      </Texto>
      {falhou ? (
        <Texto tipo="legenda" cor={cores.sand} accessibilityLiveRegion="polite" style={styles.apoio}>
          Não foi possível recomeçar agora. Tente de novo.
        </Texto>
      ) : null}
      <Botao variante="secundario" onPress={recomecar} desabilitado={apagando} style={styles.botao}>
        Começar do zero
      </Botao>
    </View>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, paddingHorizontal: 12 },
  frase: { textAlign: 'center' },
  apoio: { textAlign: 'center' },
  botao: { alignSelf: 'stretch', marginTop: 8 },
});
