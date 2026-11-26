import { Fraunces_300Light } from '@expo-google-fonts/fraunces/300Light';
import { Fraunces_400Regular } from '@expo-google-fonts/fraunces/400Regular';
import { Geist_400Regular } from '@expo-google-fonts/geist/400Regular';
import { Geist_500Medium } from '@expo-google-fonts/geist/500Medium';
import { Geist_600SemiBold } from '@expo-google-fonts/geist/600SemiBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useHydrated } from '@/store';
import { cores } from '@/theme';

export default function RootLayout() {
  const hidratado = useHydrated();
  const [fontesProntas, erroFonte] = useFonts({
    Fraunces_300Light,
    Fraunces_400Regular,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
  });
  // Se a fonte falhar, segue com a do sistema em vez de travar numa tela vazia.
  if (!hidratado || (!fontesProntas && !erroFonte)) {
    return <View style={{ flex: 1, backgroundColor: cores.bg }} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.bg } }}>
        <Stack.Screen name="(abas)" />
        <Stack.Screen name="fissura" options={{ animation: 'fade' }} />
      </Stack>
    </>
  );
}
