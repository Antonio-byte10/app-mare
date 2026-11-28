import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '@/components/Botao';
import { Esfera } from '@/components/Esfera';
import { Texto } from '@/components/Texto';
import { CICLOS, EXPIRA_MS, INSPIRA_MS } from '@/lib/fissura';
import { vibrarLeve, vibrarSuave } from '@/lib/haptica';
import { useReduzirMovimento } from '@/lib/useReduzirMovimento';
import { cores, fontes, margemTela } from '@/theme';

type Props = { aoSeguir: () => void };

type Fase = 'inspire' | 'solte' | 'fim';
const ESCALA_MIN = 0.74;
const ESCALA_REPOUSO = 0.87;

const TEXTO_FASE: Record<Fase, string> = {
  inspire: 'Inspire',
  solte: 'Solte devagar',
  fim: 'Respire no seu ritmo',
};

/**
 * Passo 1, "Respire": a esfera cresce em 4 s e encolhe em 6 s, por 6 ciclos, com uma vibração leve
 * em cada virada. O texto fica ABAIXO da esfera. Com "reduzir movimento" a esfera fica parada e só
 * o texto (e a vibração) marcam o ritmo.
 */
export function PassoRespire({ aoSeguir }: Props) {
  const reduzir = useReduzirMovimento();
  const { height } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const [escala] = useState(() => new Animated.Value(ESCALA_REPOUSO));
  const [fase, setFase] = useState<Fase>('inspire');
  const [ciclo, setCiclo] = useState(1);
  const [segurando, setSegurando] = useState(false);

  useEffect(() => {
    let cancelado = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const mover = (para: number, duracao: number) => {
      if (reduzir) return;
      Animated.timing(escala, {
        toValue: para,
        duration: duracao,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start();
    };
    const rodar = (n: number) => {
      if (cancelado) return;
      if (n > CICLOS) {
        setFase('fim');
        mover(ESCALA_REPOUSO, 1500);
        return;
      }
      setCiclo(n);
      setFase('inspire');
      vibrarLeve();
      mover(1, INSPIRA_MS);
      timers.push(
        setTimeout(() => {
          if (cancelado) return;
          setFase('solte');
          vibrarSuave();
          mover(ESCALA_MIN, EXPIRA_MS);
          timers.push(setTimeout(() => rodar(n + 1), EXPIRA_MS));
        }, INSPIRA_MS),
      );
    };
    if (!reduzir) escala.setValue(ESCALA_MIN);
    else escala.setValue(ESCALA_REPOUSO);
    rodar(1);
    return () => {
      cancelado = true;
      timers.forEach(clearTimeout);
      escala.stopAnimation();
    };
  }, [reduzir, escala]);

  // A esfera encolhe em telas baixas para o texto e o botão caberem sem rolar.
  const tamanho = Math.max(190, Math.min(260, Math.round(height * 0.36)));

  return (
    <View style={styles.raiz}>
      <View style={styles.centro}>
        <Pressable
          onPressIn={() => {
            setSegurando(true);
            vibrarSuave();
          }}
          onPressOut={() => setSegurando(false)}
          pressRetentionOffset={{ top: 80, bottom: 80, left: 80, right: 80 }}
          accessibilityRole="button"
          accessibilityLabel="Esfera de respiração"
          accessibilityHint="Toque e mantenha o dedo se quiser sentir o ritmo da respiração na mão."
          accessibilityState={{ selected: segurando }}
          style={[styles.esfera, { width: tamanho, height: tamanho }]}
        >
          <View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Esfera escala={escala} tamanho={tamanho} tocada={segurando} />
          </View>
        </Pressable>
        <Texto style={styles.fase} accessibilityLiveRegion="polite">
          {TEXTO_FASE[fase]}
        </Texto>
        <Texto style={styles.ritmo}>
          {fase === 'fim'
            ? 'Seis ciclos concluídos. Siga quando quiser.'
            : `4 segundos para dentro, 6 para fora · ciclo ${ciclo} de ${CICLOS}`}
        </Texto>
        <Texto style={styles.dicaToque}>
          {segurando ? 'Sentindo o ritmo na mão…' : 'Se quiser, segure a esfera para sentir cada virada.'}
        </Texto>
      </View>
      <View style={[styles.rodape, { paddingBottom: Math.max(bottom, 12) + 10 }]}>
        <Botao variante="secundario" onPress={aoSeguir}>
          Já estou um pouco melhor
        </Botao>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: margemTela },
  esfera: { alignItems: 'center', justifyContent: 'center' },
  fase: {
    marginTop: 26,
    fontFamily: fontes.display,
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: -0.7,
    textAlign: 'center',
    color: cores.text,
  },
  ritmo: { marginTop: 6, fontSize: 13.5, lineHeight: 19, color: cores.muted, textAlign: 'center' },
  dicaToque: { marginTop: 10, fontSize: 12.5, lineHeight: 18, color: cores.faint, textAlign: 'center' },
  rodape: { paddingHorizontal: margemTela, paddingTop: 14 },
});
