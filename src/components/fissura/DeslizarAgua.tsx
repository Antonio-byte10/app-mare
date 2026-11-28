import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '@/components/Botao';
import { Icone } from '@/components/Icone';
import { Texto } from '@/components/Texto';
import { avancoDeslize } from '@/lib/fissura';
import { vibrarSuave } from '@/lib/haptica';
import { useReduzirMovimento } from '@/lib/useReduzirMovimento';
import { comAlfa, cores, fontes, margemTela, raio } from '@/theme';

type Props = {
  aoVoltar: () => void;
  aoPassou: () => void;
};

/**
 * "Deslizar na água": movimento contínuo e lento do dedo sobre a tela (inspirado no PAUSE),
 * pensado para desacelerar a agitação sem exigir leitura nem concentração forçada.
 * Nunca pune quem solta ou acelera; só convida a ir mais devagar.
 */
export function DeslizarAgua({ aoVoltar, aoPassou }: Props) {
  const { bottom } = useSafeAreaInsets();
  const reduzir = useReduzirMovimento();
  const [progresso, setProgresso] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [rapido, setRapido] = useState(false);

  const concluido = progresso >= 1;
  const progressoRef = useRef(0);
  const ultimoPonto = useRef<{ x: number; y: number; t: number } | null>(null);
  const ultimoPulso = useRef(0);
  const [aura] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduzir) {
      aura.setValue(progresso);
      return;
    }
    Animated.timing(aura, {
      toValue: progresso,
      duration: 240,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [progresso, reduzir, aura]);

  const iniciar = (e: GestureResponderEvent) => {
    const { pageX, pageY, timestamp } = e.nativeEvent;
    ultimoPonto.current = { x: pageX, y: pageY, t: timestamp };
    ultimoPulso.current = timestamp;
    setTocando(true);
    setRapido(false);
    vibrarSuave();
  };

  const mover = (e: GestureResponderEvent) => {
    if (progressoRef.current >= 1) return;
    const { pageX, pageY, timestamp } = e.nativeEvent;
    const prev = ultimoPonto.current;
    if (!prev) {
      ultimoPonto.current = { x: pageX, y: pageY, t: timestamp };
      return;
    }
    const dt = timestamp - prev.t;
    if (dt < 16) return;
    const dist = Math.hypot(pageX - prev.x, pageY - prev.y);
    ultimoPonto.current = { x: pageX, y: pageY, t: timestamp };

    const r = avancoDeslize(dist, dt);
    setRapido(r.rapido);
    if (r.delta !== 0) {
      const prox = Math.min(1, Math.max(0, progressoRef.current + r.delta));
      progressoRef.current = prox;
      setProgresso(prox);
      if (prox >= 1) {
        vibrarSuave();
      } else if (!r.rapido && timestamp - ultimoPulso.current >= 3800) {
        ultimoPulso.current = timestamp;
        vibrarSuave();
      }
    }
  };

  const soltar = () => {
    ultimoPonto.current = null;
    setTocando(false);
    setRapido(false);
  };

  const escalaAura = aura.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1.35] });
  const instrucao = concluido
    ? 'A água assentou. Se a onda ainda estiver por perto, você pode voltar a ela com calma.'
    : rapido
      ? 'Mais devagar… como se o dedo estivesse dentro d’água.'
      : tocando
        ? 'Continue assim, devagar e sem pressa.'
        : 'Apoie o dedo aqui dentro e desenhe círculos bem lentos.';

  return (
    <View style={styles.raiz}>
      <View style={styles.topo}>
        <Texto tipo="rotulo" style={styles.rotulo}>
          Deslizar na água
        </Texto>
        <Texto style={styles.titulo} accessibilityRole="header" accessibilityLiveRegion="polite">
          {concluido ? 'A água assentou.' : 'Mova o dedo bem devagar'}
        </Texto>
        <Texto style={styles.instrucao}>{instrucao}</Texto>
      </View>

      <View
        style={[styles.lago, tocando && styles.lagoAtivo]}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={iniciar}
        onResponderMove={mover}
        onResponderRelease={soltar}
        onResponderTerminate={soltar}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`Área de deslizar na água. Progresso ${Math.round(progresso * 100)} por cento.`}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.auraExterna,
            reduzir ? null : { transform: [{ scale: escalaAura }] },
            concluido ? styles.auraPronta : null,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.auraInterna,
            reduzir ? null : { transform: [{ scale: escalaAura }] },
            concluido ? styles.auraInternaPronta : null,
          ]}
        />
        <View style={[styles.nucleo, concluido ? styles.nucleoPronto : tocando ? styles.nucleoAtivo : null]} pointerEvents="none">
          {concluido ? (
            <Icone nome="check" tamanho={30} traco={2} cor="#06301F" />
          ) : (
            <Texto style={styles.porcentagem}>{`${Math.round(progresso * 100)}%`}</Texto>
          )}
        </View>
      </View>

      <View style={[styles.rodape, { paddingBottom: Math.max(bottom, 12) + 10 }]}>
        {concluido ? (
          <>
            <Botao onPress={aoPassou}>Passou</Botao>
            <Botao variante="secundario" onPress={aoVoltar}>
              Voltar à onda
            </Botao>
          </>
        ) : (
          <Botao variante="texto" onPress={aoVoltar}>
            Voltar à onda
          </Botao>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  topo: { paddingHorizontal: margemTela, paddingTop: 18, alignItems: 'center' },
  rotulo: { textAlign: 'center', color: cores.peri },
  titulo: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: fontes.display,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: cores.text,
  },
  instrucao: { marginTop: 8, maxWidth: 300, textAlign: 'center', fontSize: 14, lineHeight: 20, color: cores.muted },
  lago: {
    flex: 1,
    marginHorizontal: margemTela,
    marginTop: 18,
    marginBottom: 8,
    borderRadius: raio.xl,
    borderWidth: 1,
    borderColor: cores.line,
    backgroundColor: 'rgba(255,255,255,.02)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lagoAtivo: { borderColor: comAlfa(cores.aqua, 0.35), backgroundColor: comAlfa(cores.aqua, 0.03) },
  auraExterna: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: comAlfa(cores.aqua, 0.09),
    borderWidth: 1,
    borderColor: comAlfa(cores.aqua, 0.18),
  },
  auraPronta: { backgroundColor: comAlfa(cores.foam, 0.12), borderColor: comAlfa(cores.foam, 0.35) },
  auraInterna: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: comAlfa(cores.peri, 0.14),
  },
  auraInternaPronta: { backgroundColor: comAlfa(cores.foam, 0.2) },
  nucleo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: comAlfa(cores.aqua, 0.35),
    backgroundColor: comAlfa(cores.surface, 0.88),
  },
  nucleoAtivo: { borderColor: cores.aqua, backgroundColor: comAlfa(cores.aqua, 0.2) },
  nucleoPronto: { borderColor: cores.foam, backgroundColor: cores.foam },
  porcentagem: { fontFamily: fontes.displayLeve, fontSize: 22, lineHeight: 26, color: cores.text },
  rodape: { paddingHorizontal: margemTela, paddingTop: 10, gap: 8 },
});
