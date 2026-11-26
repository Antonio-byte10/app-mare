import { View } from 'react-native';
import { Simbolo } from '@/components/Simbolo';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';

// Provisória: a tela Início chega com o resto do núcleo.
export default function Inicio() {
  return (
    <Tela>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <Simbolo tamanho={112} />
        <Texto tipo="titulo">maré</Texto>
        <Texto tipo="legenda">Início</Texto>
      </View>
    </Tela>
  );
}
