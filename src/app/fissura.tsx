import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Fundo } from '@/components/Fundo';
import { Icone } from '@/components/Icone';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { cores } from '@/theme';

export default function Fissura() {
  const router = useRouter();
  return (
    <Fundo variante="mar">
      <Tela>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          hitSlop={4}
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: cores.line,
            backgroundColor: 'rgba(255,255,255,.035)',
          }}
        >
          <Icone nome="fechar" />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Texto tipo="titulo">A onda</Texto>
          <Texto tipo="legenda">Em breve neste app.</Texto>
        </View>
      </Tela>
    </Fundo>
  );
}
