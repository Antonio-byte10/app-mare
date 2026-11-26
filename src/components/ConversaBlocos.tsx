import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import { useReduzirMovimento } from '@/lib/useReduzirMovimento';
import { comAlfa, cores } from '@/theme';
import { Simbolo } from './Simbolo';
import { Texto } from './Texto';

/** Mensagem da pessoa: à direita, em balão água-marinha translúcido com borda (`.me` do mockup 12). */
export function MensagemPessoa({ texto }: { texto: string }) {
  return (
    <View style={styles.pessoa} accessible accessibilityLabel={`Você: ${texto}`}>
      <Texto style={styles.textoBalao} selectable>
        {texto}
      </Texto>
    </View>
  );
}

/** Cabeçalho de uma resposta: símbolo pequeno da lua e o nome "Maré" (`.ai .who`). */
function QuemFala() {
  return (
    <View style={styles.quem}>
      <Simbolo tamanho={18} />
      <Texto tipo="legenda" style={styles.nome}>
        Maré
      </Texto>
    </View>
  );
}

/** Resposta da IA: à esquerda, sem balão, com o símbolo e o nome (`.ai` do mockup 12). */
export function MensagemMare({ texto, children }: { texto?: string; children?: React.ReactNode }) {
  return (
    <View style={styles.mare}>
      <QuemFala />
      {texto ? (
        <Texto style={styles.textoMare} selectable accessibilityLabel={`Maré: ${texto}`}>
          {texto}
        </Texto>
      ) : null}
      {children}
    </View>
  );
}

/** Três pontos de "digitando". Com "reduzir movimento", ficam parados. */
export function Digitando() {
  const reduzir = useReduzirMovimento();
  const [valores] = useState(() => [new Animated.Value(0.25), new Animated.Value(0.25), new Animated.Value(0.25)]);

  useEffect(() => {
    if (reduzir) {
      valores.forEach((v) => v.setValue(0.6));
      return;
    }
    const nativo = Platform.OS !== 'web';
    const animacoes = valores.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(v, { toValue: 1, duration: 420, easing: Easing.inOut(Easing.ease), useNativeDriver: nativo }),
          Animated.timing(v, { toValue: 0.25, duration: 420, easing: Easing.inOut(Easing.ease), useNativeDriver: nativo }),
          Animated.delay(560 - i * 200),
        ]),
      ),
    );
    animacoes.forEach((a) => a.start());
    return () => animacoes.forEach((a) => a.stop());
  }, [reduzir, valores]);

  return (
    <View style={styles.pontos} accessible accessibilityLabel="Maré está escrevendo" accessibilityLiveRegion="polite">
      {valores.map((v, i) => (
        <Animated.View key={i} style={[styles.ponto, { opacity: v }]} />
      ))}
    </View>
  );
}

/** Aviso da Maré dentro da conversa (erro, recusa, servidor acordando), em tom calmo e sem cor de alarme. */
export function NotaMare({ texto, children }: { texto: string; children?: React.ReactNode }) {
  return (
    <View style={styles.mare}>
      <QuemFala />
      <View style={styles.nota} accessibilityLiveRegion="polite">
        <Texto style={styles.textoNota} selectable>
          {texto}
        </Texto>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // border-radius: 18px 18px 6px 18px
  pessoa: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 6,
    backgroundColor: comAlfa(cores.aqua, 0.14),
    borderWidth: 1,
    borderColor: comAlfa(cores.aqua, 0.25),
  },
  textoBalao: { fontSize: 14.5, lineHeight: 21 },
  mare: { alignSelf: 'flex-start', maxWidth: '92%', gap: 2 },
  quem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  nome: { fontSize: 12, lineHeight: 16 },
  textoMare: { fontSize: 14.5, lineHeight: 22.5 },
  pontos: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 22, paddingLeft: 2 },
  ponto: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: cores.muted },
  nota: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: comAlfa(cores.sand, 0.07),
    borderWidth: 1,
    borderColor: comAlfa(cores.sand, 0.2),
  },
  textoNota: { fontSize: 14, lineHeight: 21 },
});
