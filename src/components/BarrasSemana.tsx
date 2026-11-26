import { StyleSheet, View } from 'react-native';
import { textoPico } from '@/lib/calendario';
import { comAlfa, cores, fontes } from '@/theme';
import { Degrade } from './Degrade';
import { Texto } from './Texto';

type Props = {
  /** Vontade média de 0 a 10 por dia da semana (0 = domingo); `null` sem dado. */
  medias: (number | null)[];
  /** Dia da semana com a maior média, ou `null` se ainda não há relatos suficientes. */
  pico: number | null;
};

const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const NOMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const ALTURA_MAX = 62;
const ALTURA_MIN = 5;

/** "Vontade média por dia" (`.bars` do mockup 6): 7 barras proporcionais, a do pico em sand. */
export function BarrasSemana({ medias, pico }: Props) {
  const texto = textoPico(pico);
  return (
    <View>
      <View style={styles.titulo}>
        <Texto style={styles.tituloTexto}>Vontade média por dia</Texto>
        <Texto style={styles.periodo}>últimas 8 semanas</Texto>
      </View>

      <View style={styles.barras} accessible accessibilityRole="image" accessibilityLabel={resumoAcessivel(medias)}>
        {LETRAS.map((letra, i) => {
          const media = medias[i];
          const destaque = i === pico;
          const altura = media === null ? ALTURA_MIN : Math.max(ALTURA_MIN, (media / 10) * ALTURA_MAX);
          return (
            <View key={i} style={styles.coluna}>
              <View
                style={[
                  styles.barra,
                  { height: altura },
                  media === null && styles.barraVazia,
                  !destaque && styles.barraNormal,
                ]}
              >
                {destaque ? <Degrade de={cores.sand} para={comAlfa(cores.sand, 0.35)} /> : null}
              </View>
              <Texto style={[styles.letra, destaque && { color: cores.sand }]}>{letra}</Texto>
            </View>
          );
        })}
      </View>

      <Texto style={styles.frase}>
        {texto ? (
          <>
            {texto.antes}
            <Texto style={styles.destaque}>{texto.destaque}</Texto>
            {texto.depois}
          </>
        ) : (
          'Depois de alguns relatos, você vai ver aqui os dias mais difíceis.'
        )}
      </Texto>
    </View>
  );
}

function resumoAcessivel(medias: (number | null)[]): string {
  const partes = medias.flatMap((m, i) => (m === null ? [] : [`${NOMES[i]} ${m.toFixed(1).replace('.', ',')}`]));
  return partes.length
    ? `Vontade média por dia da semana: ${partes.join(', ')}.`
    : 'Vontade média por dia: ainda sem dados.';
}

const styles = StyleSheet.create({
  titulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  tituloTexto: { fontFamily: fontes.uiForte, fontSize: 14.5, lineHeight: 20 },
  periodo: { fontFamily: fontes.ui, fontSize: 12, lineHeight: 16, color: cores.muted },
  barras: { flexDirection: 'row', alignItems: 'flex-end', gap: 9, height: 86, marginTop: 14 },
  coluna: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  barra: {
    width: '100%',
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    overflow: 'hidden',
  },
  barraNormal: { backgroundColor: comAlfa(cores.peri, 0.28) },
  barraVazia: { opacity: 0.5 },
  letra: { fontFamily: fontes.ui, fontSize: 10.5, lineHeight: 14, color: cores.faint },
  frase: { fontFamily: fontes.ui, fontSize: 13, lineHeight: 20, color: cores.muted, marginTop: 12 },
  destaque: { fontFamily: fontes.uiForte, color: cores.sand },
});
