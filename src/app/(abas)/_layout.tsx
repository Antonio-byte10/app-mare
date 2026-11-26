import { Tabs } from 'expo-router/js-tabs';
import { BarraAbas } from '@/components/BarraAbas';
import { Fundo } from '@/components/Fundo';
import { useMare } from '@/store';

export default function AbasLayout() {
  // Com IA configurada, a 4ª aba é Conversa; sem IA, o lugar dela vira Aprender (spec 6).
  const temIa = useMare((e) => e.ajustes.ia !== undefined);
  return (
    <Fundo>
      <Tabs
        tabBar={(props) => <BarraAbas {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
      >
        <Tabs.Screen name="index" options={{ title: 'Início' }} />
        <Tabs.Screen name="diario" options={{ title: 'Diário' }} />
        <Tabs.Screen name="conversa" options={{ title: 'Conversa', href: temIa ? undefined : null }} />
        <Tabs.Screen name="aprender" options={{ title: 'Aprender', href: temIa ? null : undefined }} />
        <Tabs.Screen name="mais" options={{ title: 'Mais' }} />
      </Tabs>
    </Fundo>
  );
}
