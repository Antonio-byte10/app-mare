import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, ScrollView, StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '@/components/Botao';
import { CartaoCrise } from '@/components/CartaoCrise';
import { Chip } from '@/components/Chip';
import { Deslizador } from '@/components/Deslizador';
import { Icone } from '@/components/Icone';
import { Texto } from '@/components/Texto';
import { detectarCrise } from '@/lib/crise';
import { duracaoTexto } from '@/lib/fissura';
import { GATILHOS_FISSURA } from '@/lib/gatilhos';
import { alternarGatilho } from '@/lib/relato';
import { RolarAoFim, useRolarAoFim } from '@/lib/rolagem';
import { useReduzirMovimento } from '@/lib/useReduzirMovimento';
import { useMare } from '@/store';
import { cores, fontes, margemTela } from '@/theme';

type Props = {
  /** Número desta onda atravessada ("Onda nº 23 atravessada"). */
  numero: number;
  /** Aberta pela tela de bloqueio: sem link para Meu plano (tela privada). */
  daTrancada?: boolean;
  duracaoSeg: number;
  vontadeAntes?: number;
  vontadeDepois?: number;
  ajudou: string;
  /** Ids marcados em "O que puxou a onda?" (ver `GATILHOS_FISSURA`). */
  gatilhos: string[];
  aoMudarAntes: (v: number) => void;
  aoMudarDepois: (v: number) => void;
  aoMudarAjudou: (t: string) => void;
  aoMudarGatilhos: (g: string[]) => void;
  aoVoltar: () => void;
};

/** Ondulações verdes que saem do círculo (`.ripple` do mockup). */
function Ondulacao({ atraso, tamanho, parada }: { atraso: number; tamanho: number; parada: boolean }) {
  const [t] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (parada) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(atraso),
        Animated.timing(t, { toValue: 1, duration: 4000, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [parada, atraso, t]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ondulacao,
        { width: tamanho, height: tamanho },
        parada
          ? { opacity: 0.5 }
          : { opacity: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }] },
      ]}
    />
  );
}

/**
 * Pergunta de vontade (0 a 10) que só vale depois do toque: sem resposta, o deslizador fica
 * esmaecido e diz "Toque para marcar", para não parecer um 0 já respondido.
 */
function Vontade({ valor, onChange, rotulo }: { valor?: number; onChange: (v: number) => void; rotulo: string }) {
  const semResposta = valor === undefined;
  return (
    <View>
      {semResposta ? <Texto style={styles.toqueMarcar}>Toque para marcar</Texto> : null}
      <Deslizador
        valor={valor ?? 0}
        onChange={onChange}
        pontas={['nenhuma', 'muita']}
        accessibilityLabel={semResposta ? `${rotulo}, de 0 a 10, ainda sem resposta` : `${rotulo}, de 0 a 10`}
        semResposta={semResposta}
      />
    </View>
  );
}

/**
 * Passo 3, "Passou": a conquista, o tempo, a vontade de antes e de agora (por toque) e, se a
 * pessoa quiser, o que ajudou. Cada passagem vencida conta como conquista.
 */
export function PassoPassou({
  numero,
  daTrancada = false,
  duracaoSeg,
  vontadeAntes,
  vontadeDepois,
  ajudou,
  gatilhos,
  aoMudarAntes,
  aoMudarDepois,
  aoMudarAjudou,
  aoMudarGatilhos,
  aoVoltar,
}: Props) {
  const router = useRouter();
  const semPorque = useMare((e) => e.porques.length === 0);
  const reduzir = useReduzirMovimento();
  const { height } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const [anotando, setAnotando] = useState(false);
  const { ref, rolar } = useRolarAoFim();
  const crise = ajudou ? detectarCrise(ajudou) : null;
  const tamanho = height < 700 ? 120 : height < 820 ? 150 : 200;
  const miolo = Math.round(tamanho * 0.42);

  return (
    <KeyboardAvoidingView style={styles.raiz} behavior="padding">
      <ScrollView
        ref={ref}
        style={styles.flex}
        contentContainerStyle={styles.corpo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.ondas, { width: tamanho, height: tamanho }]}>
          <Ondulacao atraso={0} tamanho={tamanho} parada={reduzir} />
          <Ondulacao atraso={1300} tamanho={tamanho} parada={reduzir} />
          <Ondulacao atraso={2600} tamanho={tamanho} parada={reduzir} />
          <View style={[styles.circulo, { width: miolo, height: miolo, borderRadius: miolo / 2 }]}>
            <Icone nome="check" tamanho={34} traco={2} cor="#06301F" />
          </View>
        </View>

        <Texto style={styles.titulo} accessibilityRole="header" accessibilityLiveRegion="polite">
          {'Você atravessou\na onda.'}
        </Texto>
        <Texto style={styles.sub}>{`Onda nº ${numero} atravessada. Isso também conta.`}</Texto>

        <View style={styles.pilulas}>
          <View style={styles.pilula} accessible accessibilityLabel={`Duração: ${duracaoTexto(duracaoSeg)}`}>
            <Icone nome="relogio" tamanho={16} cor={cores.text} />
            <Texto style={styles.pilulaTexto}>{duracaoTexto(duracaoSeg)}</Texto>
          </View>
          {vontadeAntes !== undefined && vontadeDepois !== undefined ? (
            <View
              style={styles.pilula}
              accessible
              accessibilityLabel={`Vontade de ${vontadeAntes} para ${vontadeDepois}`}
            >
              <Texto style={styles.pilulaTexto}>vontade</Texto>
              <Texto style={[styles.pilulaTexto, { color: cores.sand, fontFamily: fontes.uiForte }]}>{String(vontadeAntes)}</Texto>
              <Icone nome="setaDireita" tamanho={14} cor={cores.text} />
              <Texto style={[styles.pilulaTexto, { color: cores.foam, fontFamily: fontes.uiForte }]}>{String(vontadeDepois)}</Texto>
            </View>
          ) : null}
        </View>

        <View style={styles.perguntas}>
          <Texto style={styles.pergunta}>Quanta vontade você sentia quando abriu a onda?</Texto>
          <Vontade valor={vontadeAntes} onChange={aoMudarAntes} rotulo="Vontade de antes" />
          <Texto style={[styles.pergunta, styles.perguntaSeguinte]}>E agora?</Texto>
          <Vontade valor={vontadeDepois} onChange={aoMudarDepois} rotulo="Vontade de agora" />
        </View>

        <View style={styles.gatilhos}>
          <Texto style={styles.pergunta} accessibilityRole="header">
            O que puxou a onda?
          </Texto>
          <Texto style={styles.dica}>Se quiser marcar. Pode pular.</Texto>
          <View style={styles.chips}>
            {GATILHOS_FISSURA.map((g) => (
              <Chip
                key={g.id}
                ativo={gatilhos.includes(g.id)}
                cor={cores.peri}
                onPress={() => aoMudarGatilhos(alternarGatilho(gatilhos, g.id))}
              >
                {g.rotulo}
              </Chip>
            ))}
          </View>
        </View>

        {anotando ? (
          <View style={styles.anotar}>
            <Texto style={styles.pergunta}>O que ajudou?</Texto>
            <TextInput
              accessibilityLabel="O que ajudou"
              value={ajudou}
              onChangeText={aoMudarAjudou}
              multiline
              maxLength={300}
              autoFocus
              placeholder="Uma frase já basta"
              placeholderTextColor={cores.faint}
              textAlignVertical="top"
              style={styles.entrada}
            />
          </View>
        ) : null}
        {crise ? (
          <View style={styles.crise}>
            <RolarAoFim.Provider value={rolar}>
              <CartaoCrise tipo={crise} />
            </RolarAoFim.Provider>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.rodape, { paddingBottom: Math.max(bottom, 12) + 10 }]}>
        <Botao onPress={aoVoltar}>Voltar ao início</Botao>
        <Botao variante="texto" onPress={() => setAnotando((a) => !a)} accessibilityLabel={anotando ? 'Esconder o campo de anotação' : 'Anotar o que ajudou'}>
          {anotando ? 'Pronto' : 'Anotar o que ajudou'}
        </Botao>
        {semPorque && !daTrancada ? (
          <Botao variante="texto" onPress={() => router.push('/plano')} accessibilityLabel="Escrever um porquê, abre Meu plano">
            Escrever um porquê para a próxima onda
          </Botao>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  flex: { flex: 1 },
  corpo: { paddingHorizontal: margemTela, paddingTop: 26, paddingBottom: 20, alignItems: 'stretch' },
  ondas: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  ondulacao: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(127,224,181,.35)',
  },
  circulo: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#5CC79A', borderTopColor: 'rgba(255,255,255,.5)', borderTopWidth: 1 },
  titulo: {
    marginTop: 18,
    textAlign: 'center',
    fontFamily: fontes.display,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: -0.6,
    color: cores.text,
  },
  sub: { marginTop: 10, textAlign: 'center', fontSize: 14, lineHeight: 21, color: cores.muted },
  pilulas: { marginTop: 18, flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  pilula: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: cores.line2,
    backgroundColor: 'rgba(255,255,255,.03)',
  },
  pilulaTexto: { fontSize: 13, lineHeight: 16, color: cores.text },
  perguntas: { marginTop: 20 },
  pergunta: { fontFamily: fontes.uiForte, fontSize: 13.5, lineHeight: 18, marginBottom: 12, color: cores.text },
  perguntaSeguinte: { marginTop: 16 },
  toqueMarcar: { marginTop: -6, marginBottom: 14, fontSize: 12.5, lineHeight: 16, color: cores.muted },
  gatilhos: { marginTop: 24 },
  dica: { marginTop: -6, marginBottom: 12, fontSize: 12.5, lineHeight: 18, color: cores.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  anotar: { marginTop: 22 },
  entrada: {
    minHeight: 84,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: cores.line2,
    backgroundColor: 'rgba(255,255,255,.03)',
    color: cores.text,
    fontFamily: fontes.ui,
    fontSize: 14.5,
    lineHeight: 21,
  },
  crise: { marginTop: 16 },
  rodape: { paddingHorizontal: margemTela, paddingTop: 12, gap: 6 },
});
