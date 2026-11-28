import { useEffect, useId, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { vibrarSelecao } from '@/lib/haptica';
import { heroContador } from '@/lib/inicio';
import { useReduzirMovimento } from '@/lib/useReduzirMovimento';
import { cores, fontes } from '@/theme';
import { Texto } from './Texto';

type Props = {
  /** Dias seguidos da sequência atual. */
  sequencia: number;
  /** Dias livres no total: vira o número grande quando a sequência zerou (recomeço). */
  totalLivres?: number;
  /** Próximo marco; `null` quando todos já foram alcançados (anel cheio). */
  proximo: { dias: number; faltam: number } | null;
  /** Esconde o número e o progresso: só a água e "Um dia de cada vez". */
  oculto?: boolean;
  /** Ao tocar no anel (ex.: abrir a tela de Marcos). */
  onPress?: () => void;
};

// Medidas do `.ring` do mockup v2.
const TAMANHO = 236;
const RAIO = 112;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;
const INSET = 20;
const AGUA = TAMANHO - INSET * 2;

/** Progresso do anel de 0 a 1: sequência / marco, ou cheio sem próximo marco. */
function progresso(sequencia: number, proximo: Props['proximo']): number {
  if (!proximo) return 1;
  return Math.min(1, Math.max(0, sequencia / proximo.dias));
}

type OndaProps = {
  cor: string;
  opacidade?: number;
  /** Altura da onda como fração da água. */
  altura: number;
  /** Altura da crista no viewBox (0 a 100). */
  crista: number;
  duracao: number;
  parada: boolean;
};

/** Onda de 200% da largura que desliza meia volta (um ciclo exato) em loop, só com `transform`. */
function Onda({ cor, opacidade = 1, altura, crista, duracao, parada }: OndaProps) {
  const [x] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (parada) {
      x.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(x, { toValue: -AGUA, duration: duracao, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [parada, duracao, x]);

  const h = AGUA * altura;
  const y = crista;
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.onda, { width: AGUA * 2, height: h, opacity: opacidade, transform: [{ translateX: x }] }]}
    >
      <Svg width={AGUA * 2} height={h} viewBox="0 0 400 100" preserveAspectRatio="none">
        <Path d={`M0 ${y} Q50 ${y - 18} 100 ${y} T200 ${y} T300 ${y} T400 ${y} V100 H0Z`} fill={cor} />
      </Svg>
    </Animated.View>
  );
}

/** Anel de água do Início: arco até o próximo marco, ondas deslizando e a sequência no centro. */
export function AnelAgua({ sequencia, totalLivres = 0, proximo, oculto = false, onPress }: Props) {
  const base = `anel${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const idArco = `${base}a`;
  const idAgua = `${base}w`;
  const reduzir = useReduzirMovimento();
  // Oculto não revela o progresso: o arco fica cheio.
  const p = oculto ? 1 : progresso(sequencia, proximo);
  const hero = heroContador(sequencia, totalLivres);
  const rotulo = oculto
    ? 'Um dia de cada vez'
    : `${hero.valor} ${hero.rotulo}${hero.nota ? `. ${hero.nota}` : ''}`;

  const miolo = (
    <>
      <Svg
        width={TAMANHO}
        height={TAMANHO}
        viewBox={`0 0 ${TAMANHO} ${TAMANHO}`}
        style={[StyleSheet.absoluteFill, styles.arco]}
      >
        <Defs>
          <LinearGradient id={idArco} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#9BE8F0" />
            <Stop offset="1" stopColor="#8E9DF0" />
          </LinearGradient>
        </Defs>
        <Circle cx={TAMANHO / 2} cy={TAMANHO / 2} r={RAIO} stroke="rgba(255,255,255,.06)" strokeWidth={3} fill="none" />
        {p > 0 ? (
          <Circle
            cx={TAMANHO / 2}
            cy={TAMANHO / 2}
            r={RAIO}
            stroke={`url(#${idArco})`}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={CIRCUNFERENCIA * (1 - p)}
          />
        ) : null}
      </Svg>

      <View style={styles.agua} importantForAccessibility="no-hide-descendants">
        <Svg width={AGUA} height={AGUA} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id={idAgua} cx={AGUA / 2} cy={AGUA * 0.28} r={171.7} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#16406A" />
              <Stop offset="0.75" stopColor="#091C33" />
              <Stop offset="1" stopColor="#091C33" />
            </RadialGradient>
          </Defs>
          <Circle cx={AGUA / 2} cy={AGUA / 2} r={AGUA / 2} fill={`url(#${idAgua})`} />
        </Svg>
        <Onda cor="#2B6A9C" opacidade={0.5} altura={0.52} crista={28} duracao={15000} parada={reduzir} />
        <Onda cor="#3B86B4" altura={0.47} crista={32} duracao={10000} parada={reduzir} />
        <View pointerEvents="none" style={styles.borda} />
      </View>

      <View style={styles.texto} pointerEvents="none">
        {oculto ? (
          <Texto style={styles.oculto}>Um dia de cada vez</Texto>
        ) : (
          <>
            <Texto tipo="display">{String(hero.valor)}</Texto>
            <Texto style={styles.legenda}>{hero.rotulo}</Texto>
            {hero.nota ? <Texto style={styles.nota}>{hero.nota}</Texto> : null}
          </>
        )}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => {
          vibrarSelecao();
          onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={`${rotulo}. Ver marcos`}
        style={({ pressed }) => [styles.anel, pressed && { transform: [{ scale: 0.985 }], opacity: 0.95 }]}
      >
        {miolo}
      </Pressable>
    );
  }

  return (
    <View style={styles.anel} accessible accessibilityLabel={rotulo} accessibilityRole="image">
      {miolo}
    </View>
  );
}

const styles = StyleSheet.create({
  anel: { width: TAMANHO, height: TAMANHO, alignSelf: 'center', marginTop: 14 },
  agua: {
    position: 'absolute',
    top: INSET,
    left: INSET,
    width: AGUA,
    height: AGUA,
    borderRadius: AGUA / 2,
    overflow: 'hidden',
  },
  // O arco começa no topo e segue no sentido horário.
  arco: { transform: [{ rotate: '-90deg' }] },
  onda: { position: 'absolute', left: 0, bottom: 0 },
  borda: {
    ...StyleSheet.absoluteFill,
    borderRadius: AGUA / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.05)',
  },
  texto: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  legenda: { fontFamily: fontes.uiMedia, fontSize: 13, lineHeight: 16, color: cores.text, opacity: 0.85, marginTop: 8 },
  nota: { fontSize: 12, lineHeight: 16, color: cores.text, opacity: 0.8, textAlign: 'center', width: 132, marginTop: 6 },
  oculto: {
    fontFamily: fontes.display,
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: cores.text,
    textAlign: 'center',
    width: 140,
  },
});
