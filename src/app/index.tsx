import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.tela}>
      <Text style={styles.titulo}>Maré</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: '#071526', alignItems: 'center', justifyContent: 'center' },
  titulo: { color: '#EAF2FB', fontSize: 40 },
});
