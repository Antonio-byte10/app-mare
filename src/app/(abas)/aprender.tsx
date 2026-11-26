import { StyleSheet } from 'react-native';
import { ListaAprender } from '@/components/ListaAprender';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';

export default function Aprender() {
  return (
    <Tela rolavel style={styles.rodape}>
      <Texto tipo="titulo" style={styles.titulo} accessibilityRole="header">
        Aprender
      </Texto>
      <ListaAprender />
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 24, lineHeight: 29 },
  // Folga para a barra de abas flutuante.
  rodape: { paddingBottom: 120 },
});
