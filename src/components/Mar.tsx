import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useReduzirMovimento } from '@/lib/useReduzirMovimento';

type OndaProps = { cor: string; opacidade?: number; altura: number; crista: number; duracao: number; largura: number; parada: boolean };

/** Onda de 200% da largura que desliza uma volta (meia largura) em loop, só com `transform`. */
function Onda({ cor, opacidade = 1, altura, crista, duracao, largura, parada }: OndaProps) {
  const [x] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (parada) {
      x.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(x, { toValue: -largura, duration: duracao, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [parada, duracao, largura, x]);
  const y = crista;
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.onda, { width: largura * 2, height: `${altura * 100}%`, opacity: opacidade, transform: [{ translateX: x }] }]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 400 100" preserveAspectRatio="none">
        <Path d={`M0 ${y} Q50 ${y - 18} 100 ${y} T200 ${y} T300 ${y} T400 ${y} V100 H0Z`} fill={cor} />
      </Svg>
    </Animated.View>
  );
}

type Props = {
  altura?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/** Mar do rodapé do passo "Surfe a onda" (`.ocean` do mockup): três ondas em deriva e o conteúdo por cima. */
export function Mar({ altura = 150, style, children }: Props) {
  const { width } = useWindowDimensions();
  const reduzir = useReduzirMovimento();
  return (
    <View style={[styles.mar, { height: altura }, style]}>
      <View style={StyleSheet.absoluteFill} importantForAccessibility="no-hide-descendants" pointerEvents="none">
        <Onda cor="#2B5F96" opacidade={0.35} altura={1} crista={22} duracao={18000} largura={width} parada={reduzir} />
        <Onda cor="#2E73A8" opacidade={0.6} altura={0.8} crista={26} duracao={12000} largura={width} parada={reduzir} />
        <Onda cor="#3A8DBE" altura={0.58} crista={30} duracao={9000} largura={width} parada={reduzir} />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  mar: { overflow: 'hidden' },
  onda: { position: 'absolute', left: 0, bottom: 0 },
});
