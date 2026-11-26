import { StyleSheet, View } from 'react-native';
import { Icone } from '@/components/Icone';
import { Texto } from '@/components/Texto';
import {
  BARRAS_NIVEL,
  emparelhar,
  ICONE_TIPO,
  TEXTO_NIVEL,
  textoEvolucao,
  textoSugestaoProfissional,
} from '@/lib/avaliacao';
import type { Avaliacao, Habito, NivelAtencao, ResultadoAvaliacao } from '@/lib/tipos';
import { comAlfa, cores, fontes } from '@/theme';

const COR_NIVEL: Record<NivelAtencao, string> = { leve: cores.foam, moderada: cores.sand, alta: cores.coral };

type Props = {
  habitos: Habito[];
  resultados: ResultadoAvaliacao[];
  /** Avaliação anterior, para mostrar a evolução (ao refazer). */
  anterior?: Avaliacao;
};

/** Lista do resultado (mockup 3): ícone, nome, três barrinhas e "Atenção leve/moderada/alta". */
export function ResultadoView({ habitos, resultados, anterior }: Props) {
  const sugestao = textoSugestaoProfissional(resultados, habitos);
  return (
    <View>
      <View style={styles.lista}>
        {emparelhar(resultados, anterior).map(({ atual, anterior: antes }, i) => {
          const habito = habitos.find((h) => h.id === atual.habitoId);
          if (!habito) return null;
          const cor = cores[habito.cor];
          const cheias = BARRAS_NIVEL[atual.nivel];
          return (
            <View
              key={atual.habitoId}
              style={[styles.item, i > 0 && styles.itemSeparado]}
              accessible
              accessibilityLabel={`${habito.apelido}. ${TEXTO_NIVEL[atual.nivel]}.${antes ? ` ${textoEvolucao(antes.nivel, atual.nivel)}` : ''}`}
            >
              <View style={[styles.emblema, { backgroundColor: comAlfa(cor, 0.11) }]}>
                <Icone nome={ICONE_TIPO[habito.tipo]} cor={cor} />
              </View>
              <View style={styles.texto}>
                <Texto style={styles.nome}>{habito.apelido}</Texto>
                <View style={styles.nivel}>
                  <View style={styles.barras}>
                    {[0, 1, 2].map((n) => (
                      <View
                        key={n}
                        style={[styles.barra, n < cheias && { backgroundColor: COR_NIVEL[atual.nivel] }]}
                      />
                    ))}
                  </View>
                  <Texto style={styles.nivelTexto}>{TEXTO_NIVEL[atual.nivel]}</Texto>
                </View>
                {antes ? <Texto style={styles.evolucao}>{textoEvolucao(antes.nivel, atual.nivel)}</Texto> : null}
              </View>
            </View>
          );
        })}
      </View>
      {sugestao ? (
        <View style={styles.conselho} accessibilityRole="summary">
          <Texto style={styles.conselhoTexto}>{sugestao}</Texto>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lista: {},
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 16 },
  itemSeparado: { borderTopWidth: 1, borderTopColor: cores.line },
  emblema: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  texto: { flex: 1, gap: 6 },
  nome: { fontFamily: fontes.uiForte, fontSize: 15, lineHeight: 20 },
  nivel: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barras: { flexDirection: 'row', gap: 4 },
  barra: { width: 22, height: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.08)' },
  nivelTexto: { fontSize: 12.5, lineHeight: 16, color: cores.muted },
  evolucao: { fontSize: 12.5, lineHeight: 18, color: cores.faint },
  conselho: {
    marginTop: 6,
    padding: 14,
    borderRadius: 16,
    backgroundColor: comAlfa(cores.coral, 0.07),
    borderWidth: 1,
    borderColor: comAlfa(cores.coral, 0.2),
  },
  conselhoTexto: { fontSize: 13, lineHeight: 20, color: cores.muted },
});
