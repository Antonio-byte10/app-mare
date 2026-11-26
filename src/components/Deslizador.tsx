import { useId, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { cores, fontes } from '@/theme';
import { Texto } from './Texto';

const RAIO_BOLA = 14;
const ALTURA_TRILHA = 4;

type Props = {
  valor: number;
  onChange: (valor: number) => void;
  min?: number;
  max?: number;
  /** Textos sob as pontas da trilha (`.ticks` do mockup). */
  pontas?: [esquerda: string, direita: string];
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Deslizador por passos inteiros (`.sl` do mockup): arrasta com dedo ou mouse,
 * e tocar na trilha salta para o passo mais próximo. Leitores de tela usam
 * os gestos de aumentar e diminuir.
 */
export function Deslizador({ valor, onChange, min = 0, max = 10, pontas, accessibilityLabel, style }: Props) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [largura, setLargura] = useState(0);
  // Ponto do toque no início do arrasto (só lido nos eventos).
  const toque = useRef({ x: 0, pagina: 0 });

  const util = Math.max(0, largura - 2 * RAIO_BOLA);
  const passoEm = (x: number) => {
    if (util <= 0) return valor;
    const bruto = min + ((x - RAIO_BOLA) / util) * (max - min);
    return Math.min(max, Math.max(min, Math.round(bruto)));
  };
  const mudar = (v: number) => {
    if (v !== valor) onChange(v);
  };

  const passos = max - min;
  const centro = RAIO_BOLA + (util * (valor - min)) / passos;

  return (
    <View style={style}>
      <View
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        // Dentro de uma lista rolável, o arrasto fica com o deslizador.
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => {
          toque.current = { x: e.nativeEvent.locationX, pagina: e.nativeEvent.pageX };
          // Tocar conta como resposta mesmo no valor que já estava (ex.: confirmar 0).
          onChange(passoEm(toque.current.x));
        }}
        onResponderMove={(e) => mudar(passoEm(toque.current.x + e.nativeEvent.pageX - toque.current.pagina))}
        onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={valor}
        aria-valuetext={String(valor)}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment') mudar(Math.min(max, valor + 1));
          if (e.nativeEvent.actionName === 'decrement') mudar(Math.max(min, valor - 1));
        }}
        style={styles.area}
      >
        <View pointerEvents="none" style={styles.trilha} />
        {centro > 0 ? (
          <View pointerEvents="none" style={[styles.preenchimento, { width: centro }]}>
            <Svg width="100%" height={ALTURA_TRILHA}>
              <Defs>
                <LinearGradient id={`sl${id}`} x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={cores.aqua} />
                  <Stop offset="1" stopColor={cores.peri} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height={ALTURA_TRILHA} fill={`url(#sl${id})`} />
            </Svg>
          </View>
        ) : null}
        <View pointerEvents="none" style={[styles.bola, { left: centro - RAIO_BOLA }]}>
          <Texto style={styles.numero} cor="#0A2039">
            {String(valor)}
          </Texto>
        </View>
      </View>
      {pontas ? (
        <View style={styles.pontas}>
          <Texto style={styles.ponta}>{pontas[0]}</Texto>
          <Texto style={styles.ponta}>{pontas[1]}</Texto>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // 44 de altura para o toque; a bola de 28 fica centralizada.
  // As margens negativas devolvem os 8 de folga de cima e de baixo ao ritmo do mockup (28).
  area: { height: 44, justifyContent: 'center', marginVertical: -8 },
  trilha: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 20,
    height: ALTURA_TRILHA,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,.08)',
  },
  preenchimento: {
    position: 'absolute',
    left: 0,
    top: 20,
    height: ALTURA_TRILHA,
    borderRadius: 9,
    overflow: 'hidden',
  },
  bola: {
    position: 'absolute',
    top: 8,
    width: RAIO_BOLA * 2,
    height: RAIO_BOLA * 2,
    borderRadius: RAIO_BOLA,
    backgroundColor: cores.text,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,.45)',
  },
  numero: { fontFamily: fontes.uiForte, fontSize: 12, lineHeight: 14 },
  pontas: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  ponta: { fontSize: 11.5, lineHeight: 15, color: cores.faint },
});
