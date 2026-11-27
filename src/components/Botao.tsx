import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { cores, fontes, raio } from '@/theme';
import { Degrade } from './Degrade';
import { Texto } from './Texto';

type Props = {
  variante?: 'primario' | 'secundario' | 'texto';
  onPress?: () => void;
  desabilitado?: boolean;
  children: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Botao({
  variante = 'primario',
  onPress,
  desabilitado,
  children,
  style,
  accessibilityLabel,
}: Props) {
  const primario = variante === 'primario';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!desabilitado }}
      disabled={desabilitado}
      onPress={onPress}
      // O botão de texto tem 40 de altura; a área de toque chega a 48dp.
      hitSlop={variante === 'texto' ? { top: 4, bottom: 4 } : undefined}
      style={({ pressed }) => [
        styles.base,
        variante === 'secundario' && styles.secundario,
        variante === 'texto' && styles.texto,
        desabilitado && styles.desabilitado,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      {primario ? (
        <>
          <Degrade de="#8BE1EA" para="#62C7D6" />
          <View style={styles.brilho} pointerEvents="none" />
        </>
      ) : null}
      <Texto
        style={variante === 'texto' ? styles.rotuloTexto : styles.rotulo}
        cor={primario ? cores.tinta : variante === 'texto' ? cores.muted : cores.text}
      >
        {children}
      </Texto>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // minHeight (e não height): com a fonte do sistema grande o rótulo quebra em linhas e o botão cresce, sem cortar.
  base: {
    minHeight: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  secundario: {
    backgroundColor: 'rgba(255,255,255,.04)',
    borderWidth: 1,
    borderColor: cores.line2,
  },
  texto: { minHeight: 40, borderRadius: raio.sm, paddingVertical: 4 },
  desabilitado: { opacity: 0.45 },
  // Realce interno no topo (inset 0 1px 0 rgba(255,255,255,.45)).
  brilho: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,.45)',
  },
  // zIndex: o texto fica acima do degradê e do realce, que são absolutos.
  rotulo: { fontFamily: fontes.uiForte, fontSize: 15.5, lineHeight: 20, letterSpacing: -0.08, textAlign: 'center', zIndex: 1 },
  rotuloTexto: { fontFamily: fontes.uiForte, fontSize: 14, lineHeight: 18, textAlign: 'center', zIndex: 1 },
});
