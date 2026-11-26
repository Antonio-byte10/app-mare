import { Stack } from 'expo-router';
import { cores } from '@/theme';

/** Primeiro uso: abertura, hábitos, avaliação, resultado, aviso do álcool e porquês. */
export default function BoasVindasLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.bg } }}>
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
    </Stack>
  );
}
