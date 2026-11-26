import { StyleSheet, View } from 'react-native';
import { BotaoIcone } from '@/components/BotaoIcone';
import { Fundo } from '@/components/Fundo';
import { ListaAprender } from '@/components/ListaAprender';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useVoltar } from '@/lib/useVoltar';

/**
 * Aprender aberto por Mais: a mesma lista da aba, mas como tela própria com botão voltar.
 * Existe porque, com a IA ligada, a aba Aprender some da barra (spec 6).
 */
export default function Biblioteca() {
  const voltar = useVoltar();
  return (
    <Fundo>
      <Tela rolavel>
        <View style={styles.topo}>
          <BotaoIcone icone="voltar" onPress={voltar} accessibilityLabel="Voltar" />
          <Texto tipo="titulo" style={styles.titulo} accessibilityRole="header">
            Aprender
          </Texto>
        </View>
        <ListaAprender />
      </Tela>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titulo: { fontSize: 24, lineHeight: 29, flex: 1 },
});
