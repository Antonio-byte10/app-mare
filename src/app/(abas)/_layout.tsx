import { Tabs } from 'expo-router/js-tabs';
import { BarraAbas } from '@/components/BarraAbas';
import { Fundo } from '@/components/Fundo';

export default function AbasLayout() {
  return (
    <Fundo>
      <Tabs
        tabBar={(props) => <BarraAbas {...props} />}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
      >
        <Tabs.Screen name="index" options={{ title: 'Início' }} />
        <Tabs.Screen name="diario" options={{ title: 'Diário' }} />
        <Tabs.Screen name="aprender" options={{ title: 'Aprender' }} />
        <Tabs.Screen name="mais" options={{ title: 'Mais' }} />
      </Tabs>
    </Fundo>
  );
}
