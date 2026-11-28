import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Texto } from '@/components/Texto';
import { EXPIRA_MS, faseAncora, formatarContagem, falarTempo, INSPIRA_MS } from '@/lib/fissura';
import { vibrarLeve, vibrarSuave } from '@/lib/haptica';
import { useReduzirMovimento } from '@/lib/useReduzirMovimento';
import { comAlfa, cores, fontes } from '@/theme';

type Props = {
  /** Avisa quando o dedo encosta ou solta (o passo trava a rolagem enquanto segura). */
  aoMudarSegurando?: (segurando: boolean) => void;
};

const TAMANHO = 132;
// Folga para o dedo escorregar sem soltar a âncora.
const FOLGA = { top: 120, bottom: 120, left: 120, right: 120 };

/**
 * "Segure a onda": uma âncora para o dedo no passo 2. Enquanto a pessoa segura, a vibração marca a
 * respiração (4 s / 6 s) e o círculo cresce e encolhe junto, para dar para fechar os olhos.
 * Soltar não pune: o tempo segurado só se soma, e "Passou" continua valendo a qualquer momento.
 * Com "reduzir movimento", o círculo fica parado e só a vibração e o texto marcam o ritmo.
 */
export function AncoraOnda({ aoMudarSegurando }: Props) {
  const reduzir = useReduzirMovimento();
  const [segurando, setSegurando] = useState(false);
  const [fase, setFase] = useState<'inspire' | 'solte'>('inspire');
  // Tempo das vezes anteriores e o da vez atual, em ms.
  const [acumulado, setAcumulado] = useState(0);
  const [atual, setAtual] = useState(0);
  const inicio = useRef<number | null>(null);
  const [escala] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!segurando) {
      escala.stopAnimation();
      if (!reduzir) Animated.timing(escala, { toValue: 1, duration: 500, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      return undefined;
    }
    let faseAtual: 'inspire' | 'solte' | null = null;
    const tick = () => {
      if (inicio.current === null) return;
      const ms = Date.now() - inicio.current;
      setAtual(ms);
      const f = faseAncora(ms);
      if (f === faseAtual) return;
      faseAtual = f;
      setFase(f);
      if (f === 'inspire') vibrarLeve();
      else vibrarSuave();
      if (!reduzir) {
        Animated.timing(escala, {
          toValue: f === 'inspire' ? 1.14 : 0.94,
          duration: f === 'inspire' ? INSPIRA_MS : EXPIRA_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }).start();
      }
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [segurando, reduzir, escala]);

  const encostar = () => {
    inicio.current = Date.now();
    setAtual(0);
    setSegurando(true);
    aoMudarSegurando?.(true);
  };
  const soltar = () => {
    if (inicio.current !== null) {
      const ms = Date.now() - inicio.current;
      setAcumulado((a) => a + ms);
    }
    inicio.current = null;
    setAtual(0);
    setSegurando(false);
    aoMudarSegurando?.(false);
  };

  const totalSeg = Math.floor((acumulado + atual) / 1000);
  const legenda = segurando
    ? `Segurando a onda · ${formatarContagem(totalSeg)}`
    : totalSeg > 0
      ? `Você segurou ${formatarContagem(totalSeg)}. Volte quando quiser.`
      : 'Toque e segure. A vibração marca a respiração; dá para fechar os olhos.';

  return (
    <View style={styles.raiz}>
      <Pressable
        onPressIn={encostar}
        onPressOut={soltar}
        pressRetentionOffset={FOLGA}
        accessibilityRole="button"
        accessibilityLabel="Âncora da onda"
        accessibilityHint="Toque duas vezes e mantenha o dedo. A vibração marca a respiração enquanto você segura."
        accessibilityState={{ selected: segurando }}
        style={styles.alvo}
      >
        <Animated.View
          style={[
            styles.anel,
            {
              borderColor: segurando ? comAlfa(cores.aqua, 0.55) : comAlfa(cores.aqua, 0.22),
              transform: [{ scale: escala }],
            },
          ]}
        />
        <View style={[styles.miolo, segurando ? styles.mioloAtivo : null]}>
          <Texto style={styles.textoMiolo} accessibilityLiveRegion={segurando ? 'polite' : 'none'}>
            {segurando ? (fase === 'inspire' ? 'Inspire' : 'Solte') : 'Segure'}
          </Texto>
        </View>
      </Pressable>
      <Texto
        style={styles.legenda}
        accessibilityLabel={totalSeg > 0 && !segurando ? `Você segurou ${falarTempo(totalSeg)}. Volte quando quiser.` : undefined}
      >
        {legenda}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { marginTop: 24, alignItems: 'center' },
  alvo: { width: TAMANHO + 28, height: TAMANHO + 28, alignItems: 'center', justifyContent: 'center' },
  anel: {
    position: 'absolute',
    width: TAMANHO + 24,
    height: TAMANHO + 24,
    borderRadius: 999,
    borderWidth: 1,
  },
  miolo: {
    width: TAMANHO,
    height: TAMANHO,
    borderRadius: TAMANHO / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: comAlfa(cores.aqua, 0.35),
    backgroundColor: comAlfa(cores.aqua, 0.08),
  },
  mioloAtivo: { borderColor: cores.aqua, backgroundColor: comAlfa(cores.aqua, 0.22) },
  textoMiolo: { fontFamily: fontes.display, fontSize: 22, lineHeight: 28, color: cores.text },
  legenda: { marginTop: 8, maxWidth: 280, textAlign: 'center', fontSize: 13, lineHeight: 19, color: cores.muted },
});
