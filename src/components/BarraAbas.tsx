import { useRouter } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { cores, fontes } from '@/theme';
import { Degrade } from './Degrade';
import { Icone, type NomeIcone } from './Icone';
import { Texto } from './Texto';

const icones: Record<string, NomeIcone> = {
  index: 'inicio',
  diario: 'diario',
  aprender: 'livro',
  mais: 'mais',
};

/**
 * Barra de abas do mockup v2: cinco colunas, com o botão da onda no centro.
 * O botão da onda não é uma aba: abre `/fissura` por cima das abas.
 */
export function BarraAbas({ state, descriptors, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const router = useRouter();

  const aba = (indice: number) => {
    const rota = state.routes[indice];
    if (!rota) return null;
    const focada = state.index === indice;
    const titulo = descriptors[rota.key]?.options.title ?? rota.name;
    const aoPressionar = () => {
      const evento = emitter.emit({ type: 'tabPress', target: rota.key, canPreventDefault: true });
      if (!focada && !evento.defaultPrevented) navigateToTab(rota.key);
    };
    return (
      <Pressable
        key={rota.key}
        accessibilityRole="tab"
        accessibilityLabel={titulo}
        accessibilityState={{ selected: focada }}
        onPress={aoPressionar}
        style={styles.aba}
      >
        <Icone nome={icones[rota.name] ?? 'mais'} tamanho={21} cor={focada ? cores.aqua : cores.faint} />
        <Texto style={styles.rotulo} cor={focada ? cores.text : cores.faint}>
          {titulo}
        </Texto>
      </Pressable>
    );
  };

  return (
    <View style={[styles.externa, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.barra}>
        <View style={styles.realce} pointerEvents="none" />
        {aba(0)}
        {aba(1)}
        <View style={styles.aba}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Estou com vontade. Abrir a onda"
            onPress={() => router.push('/fissura')}
            style={({ pressed }) => [styles.fab, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
          >
            <Degrade de="#8BE1EA" para="#5BBFD0" />
            <View style={styles.fabBrilho} pointerEvents="none" />
            <View style={styles.fabIcone}>
              <Icone nome="onda" tamanho={25} traco={2} cor={cores.tinta} />
            </View>
          </Pressable>
        </View>
        {aba(2)}
        {aba(3)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  externa: { paddingHorizontal: 12 },
  barra: {
    height: 68,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8,24,44,.92)',
    borderWidth: 1,
    borderColor: cores.line,
  },
  // inset 0 1px 0 rgba(255,255,255,.04)
  realce: {
    position: 'absolute',
    top: 0,
    left: 14,
    right: 14,
    height: 1,
    backgroundColor: 'rgba(255,255,255,.04)',
  },
  aba: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  rotulo: { fontFamily: fontes.uiMedia, fontSize: 10.5, lineHeight: 13 },
  fab: {
    width: 54,
    height: 54,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  // O ícone fica acima do degradê e do realce, que são absolutos.
  fabIcone: { zIndex: 1 },
  // inset 0 1px 0 rgba(255,255,255,.5); sem brilho externo.
  fabBrilho: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,.5)',
  },
});
