import { Pressable, StyleSheet, View } from 'react-native';
import type { GatilhoContado } from '@/lib/gatilhos';
import { comAlfa, cores, fontes } from '@/theme';
import { Texto } from './Texto';

type Props = {
  /** Os gatilhos que mais aparecem, do maior para o menor; vazio = o cartão não aparece. */
  itens: GatilhoContado[];
  /** Janela da contagem, em dias (só para o texto). */
  dias: number;
  /** Ao tocar num gatilho (ex.: abrir Meu plano já com o "Se..." preenchido). */
  aoTocarItem?: (item: GatilhoContado) => void;
};

const vezes = (n: number) => (n === 1 ? '1 vez' : `${n} vezes`);

/** "O que mais puxa a onda": os 3 gatilhos mais frequentes do período, sem julgamento. */
export function CartaoGatilhos({ itens, dias, aoTocarItem }: Props) {
  if (itens.length === 0) return null;
  const maximo = itens[0].total;
  const resumo = `O que mais puxa a onda, nos últimos ${dias} dias: ${itens.map((g) => `${g.rotulo}, ${vezes(g.total)}`).join('; ')}.`;

  return (
    <View>
      <View style={styles.titulo}>
        <Texto style={styles.tituloTexto} accessibilityRole="header">
          O que mais puxa a onda
        </Texto>
        <Texto style={styles.periodo}>{`últimos ${dias} dias`}</Texto>
      </View>

      <View style={styles.lista} accessible={!aoTocarItem} accessibilityLabel={aoTocarItem ? undefined : resumo}>
        {itens.map((g) => {
          const conteudo = (
            <>
              <View style={styles.cabeca}>
                <Texto style={styles.rotulo} numberOfLines={1}>
                  {g.rotulo}
                </Texto>
                <View style={styles.direita}>
                  <Texto style={styles.vezes}>{vezes(g.total)}</Texto>
                  {aoTocarItem ? <Texto style={styles.acao}>+ plano</Texto> : null}
                </View>
              </View>
              <View style={styles.trilho}>
                <View style={[styles.barra, { width: `${Math.max(8, Math.round((g.total / maximo) * 100))}%` }]} />
              </View>
            </>
          );
          if (aoTocarItem) {
            return (
              <Pressable
                key={g.chave}
                onPress={() => aoTocarItem(g)}
                accessibilityRole="button"
                accessibilityLabel={`${g.rotulo}, ${vezes(g.total)}. Criar plano para este gatilho`}
                style={({ pressed }) => [styles.linhaTocavel, pressed && styles.pressionada]}
              >
                {conteudo}
              </Pressable>
            );
          }
          return (
            <View key={g.chave} style={styles.linha}>
              {conteudo}
            </View>
          );
        })}
      </View>

      <Texto style={styles.frase}>
        {aoTocarItem ? 'Toque em um gatilho para montar um plano “se-então”.' : 'Saber o que puxa a onda ajuda a se preparar para ela.'}
      </Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  tituloTexto: { fontFamily: fontes.uiForte, fontSize: 14.5, lineHeight: 20 },
  periodo: { fontFamily: fontes.ui, fontSize: 12, lineHeight: 16, color: cores.muted },
  lista: { marginTop: 12, gap: 12 },
  linha: { gap: 6 },
  linhaTocavel: { gap: 6, minHeight: 44, justifyContent: 'center', borderRadius: 10, paddingVertical: 4 },
  pressionada: { opacity: 0.78 },
  cabeca: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  rotulo: { flexShrink: 1, fontFamily: fontes.uiMedia, fontSize: 14, lineHeight: 19, color: cores.text },
  direita: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  vezes: { fontFamily: fontes.ui, fontSize: 12, lineHeight: 16, color: cores.muted },
  acao: { fontFamily: fontes.uiMedia, fontSize: 11.5, lineHeight: 15, color: cores.aqua },
  trilho: { height: 5, borderRadius: 3, backgroundColor: comAlfa(cores.peri, 0.12), overflow: 'hidden' },
  barra: { height: 5, borderRadius: 3, backgroundColor: comAlfa(cores.peri, 0.55) },
  frase: { fontFamily: fontes.ui, fontSize: 13, lineHeight: 20, color: cores.muted, marginTop: 12 },
});
