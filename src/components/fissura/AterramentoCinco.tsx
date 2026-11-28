import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '@/components/Botao';
import { Icone } from '@/components/Icone';
import { Texto } from '@/components/Texto';
import { PASSOS_ATERRAMENTO, proximoPassoAterramento } from '@/lib/fissura';
import { vibrarSelecao, vibrarSuave } from '@/lib/haptica';
import { comAlfa, cores, fontes, margemTela, raio } from '@/theme';

type Props = {
  aoVoltar: () => void;
  aoPassou: () => void;
};

/**
 * Aterramento tátil 5-4-3-2-1: ocupa as mãos e a atenção nos cinco sentidos quando a onda
 * está agitada demais. Cada gota tocada dá um retorno tátil discreto, sem contagem regressiva
 * nem pontuação punitiva.
 */
export function AterramentoCinco({ aoVoltar, aoPassou }: Props) {
  const { bottom } = useSafeAreaInsets();
  const [indice, setIndice] = useState(0);
  const [toques, setToques] = useState(0);
  const [concluido, setConcluido] = useState(false);

  const passo = PASSOS_ATERRAMENTO[indice] ?? PASSOS_ATERRAMENTO[0];

  const tocar = (posicao: number) => {
    if (concluido || posicao < toques) return;
    const prox = proximoPassoAterramento(indice, toques);
    if (prox.mudouPasso || prox.concluido) vibrarSuave();
    else vibrarSelecao();
    setIndice(prox.indice);
    setToques(prox.toques);
    setConcluido(prox.concluido);
  };

  return (
    <View style={styles.raiz}>
      <View style={styles.centro}>
        <Texto tipo="rotulo" style={styles.rotulo}>
          Aterramento 5-4-3-2-1
        </Texto>

        <View style={styles.progresso} accessible accessibilityLabel={`Etapa ${indice + 1} de ${PASSOS_ATERRAMENTO.length}`}>
          {PASSOS_ATERRAMENTO.map((p, i) => (
            <View
              key={p.sentido}
              style={[
                styles.ponto,
                i < indice || concluido ? styles.pontoFeito : i === indice ? styles.pontoAtual : styles.pontoPendente,
              ]}
            />
          ))}
        </View>

        {concluido ? (
          <View style={styles.cartaoFim}>
            <View style={styles.circuloFim}>
              <Icone nome="check" tamanho={30} traco={2} cor="#06301F" />
            </View>
            <Texto style={styles.titulo} accessibilityRole="header" accessibilityLiveRegion="polite">
              Você voltou para o agora.
            </Texto>
            <Texto style={styles.instrucao}>
              Quinze pequenas pausas para tirar a cabeça da onda. Se a vontade ainda estiver aí, você pode ficar mais um pouco.
            </Texto>
          </View>
        ) : (
          <>
            <Texto style={styles.titulo} accessibilityRole="header" accessibilityLiveRegion="polite">
              {passo.sentido}
            </Texto>
            <Texto style={styles.instrucao}>{passo.instrucao}</Texto>

            <View style={styles.gotas}>
              {Array.from({ length: passo.total }, (_, i) => {
                const marcado = i < toques;
                const proximo = i === toques;
                return (
                  <Pressable
                    key={`${indice}-${i}`}
                    onPress={() => tocar(i)}
                    disabled={marcado}
                    accessibilityRole="button"
                    accessibilityLabel={`Item ${i + 1} de ${passo.total}`}
                    accessibilityState={{ checked: marcado }}
                    style={({ pressed }) => [
                      styles.gota,
                      marcado ? styles.gotaMarcada : proximo ? styles.gotaProxima : null,
                      pressed && !marcado && styles.gotaPressionada,
                    ]}
                  >
                    {marcado ? (
                      <Icone nome="check" tamanho={20} traco={2} cor={cores.foam} />
                    ) : (
                      <Texto style={styles.gotaNumero}>{String(i + 1)}</Texto>
                    )}
                  </Pressable>
                );
              })}
            </View>
            <Texto tipo="legenda" style={styles.restante}>
              {`Toque em cada círculo conforme perceber (${toques} de ${passo.total}).`}
            </Texto>
          </>
        )}
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
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: margemTela },
  rotulo: { textAlign: 'center', color: cores.foam },
  progresso: { flexDirection: 'row', gap: 8, marginTop: 14 },
  ponto: { height: 6, borderRadius: 3 },
  pontoFeito: { width: 18, backgroundColor: cores.foam },
  pontoAtual: { width: 28, backgroundColor: cores.aqua },
  pontoPendente: { width: 14, backgroundColor: comAlfa(cores.muted, 0.25) },
  titulo: {
    marginTop: 22,
    textAlign: 'center',
    fontFamily: fontes.display,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: cores.text,
  },
  instrucao: { marginTop: 10, maxWidth: 300, textAlign: 'center', fontSize: 14.5, lineHeight: 22, color: cores.muted },
  gotas: {
    marginTop: 28,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    maxWidth: 280,
  },
  gota: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: cores.line2,
    backgroundColor: 'rgba(255,255,255,.03)',
  },
  gotaProxima: { borderColor: comAlfa(cores.aqua, 0.55), backgroundColor: comAlfa(cores.aqua, 0.08) },
  gotaMarcada: { borderColor: comAlfa(cores.foam, 0.6), backgroundColor: comAlfa(cores.foam, 0.14) },
  gotaPressionada: { transform: [{ scale: 0.94 }], backgroundColor: comAlfa(cores.aqua, 0.18) },
  gotaNumero: { fontFamily: fontes.display, fontSize: 20, lineHeight: 24, color: cores.text },
  restante: { marginTop: 18, textAlign: 'center' },
  cartaoFim: {
    marginTop: 24,
    padding: 22,
    borderRadius: raio.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: comAlfa(cores.foam, 0.25),
    backgroundColor: comAlfa(cores.foam, 0.06),
  },
  circuloFim: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.foam,
  },
  rodape: { paddingHorizontal: margemTela, paddingTop: 12, gap: 8 },
});
