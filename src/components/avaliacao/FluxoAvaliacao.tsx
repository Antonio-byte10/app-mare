import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '@/components/Botao';
import { BotaoIcone } from '@/components/BotaoIcone';
import { Chip } from '@/components/Chip';
import { Texto } from '@/components/Texto';
import { montarFila, type Respostas } from '@/lib/avaliacao';
import type { Habito } from '@/lib/tipos';
import { useVoltarInterno } from '@/lib/useVoltarInterno';
import { comAlfa, cores, fontes, margemTela } from '@/theme';

type Props = {
  habitos: Habito[];
  respostas: Respostas;
  aoResponder: (chave: string, indice: number) => void;
  /** Respondeu a última pergunta e tocou em "Continuar". */
  aoConcluir: () => void;
  /** Voltar na primeira pergunta (sair do fluxo). */
  aoSair: () => void;
  /** "pular avaliação" (só no primeiro uso). */
  aoPular?: () => void;
};

/**
 * Avaliação "Como você está" (mockup 2): uma pergunta por tela, voltar, barra de progresso,
 * "3 de 8", chip "Sobre <apelido>", opções em linhas com rádio e "Continuar".
 * O botão voltar do Android também volta uma pergunta.
 */
export function FluxoAvaliacao({ habitos, respostas, aoResponder, aoConcluir, aoSair, aoPular }: Props) {
  const { bottom } = useSafeAreaInsets();
  const { top } = useSafeAreaInsets();
  const fila = montarFila(habitos);
  const [indice, setIndice] = useState(0);
  const item = fila[indice];

  const voltarPergunta = () => (indice > 0 ? setIndice(indice - 1) : aoSair());
  useVoltarInterno(indice > 0, voltarPergunta);

  if (!item) return null;
  const escolhida = respostas[item.chave];
  const ultima = indice === fila.length - 1;
  const progresso = (indice + 1) / fila.length;

  return (
    <View style={[styles.raiz, { paddingTop: top + 14 }]}>
      <View style={styles.topo}>
        <BotaoIcone icone="voltar" onPress={voltarPergunta} accessibilityLabel="Voltar" />
        <View
          style={styles.barra}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={`Pergunta ${indice + 1} de ${fila.length}`}
          accessibilityValue={{ min: 1, max: fila.length, now: indice + 1 }}
        >
          <View style={[styles.barraPreenchida, { width: `${progresso * 100}%` }]} />
        </View>
        <Texto style={styles.contagem}>{`${indice + 1} de ${fila.length}`}</Texto>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.corpo}
        showsVerticalScrollIndicator={false}
      >
        <Chip ativo ponto cor={cores[item.habito.cor]} style={styles.chip}>
          {`Sobre ${item.habito.apelido}`}
        </Chip>
        <Texto style={styles.pergunta} accessibilityRole="header">
          {item.pergunta.texto}
        </Texto>
        <Texto style={styles.sub}>
          Não existe resposta certa. Isso só ajuda o Maré a entender o seu momento.
        </Texto>
        {item.pergunta.dica ? <Texto style={styles.dica}>{item.pergunta.dica}</Texto> : null}

        <View style={styles.opcoes} accessibilityRole="radiogroup" accessibilityLabel={item.pergunta.texto}>
          {item.pergunta.opcoes.map((o, i) => {
            const sel = escolhida === i;
            return (
              <Pressable
                key={o.rotulo}
                accessibilityRole="radio"
                accessibilityState={{ checked: sel, selected: sel }}
                onPress={() => aoResponder(item.chave, i)}
                style={[styles.opcao, sel && styles.opcaoSel]}
              >
                <Texto style={styles.opcaoTexto}>{o.rotulo}</Texto>
                <View style={[styles.radio, sel && styles.radioSel]} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.rodape, { paddingBottom: Math.max(bottom, 12) + 10 }]}>
        <Botao
          desabilitado={escolhida === undefined}
          onPress={() => (ultima ? aoConcluir() : setIndice(indice + 1))}
          accessibilityLabel={escolhida === undefined ? 'Continuar. Escolha uma resposta primeiro.' : undefined}
        >
          {ultima ? 'Ver meu resultado' : 'Continuar'}
        </Botao>
        {aoPular ? (
          <Botao variante="texto" onPress={aoPular}>
            pular avaliação
          </Botao>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  flex: { flex: 1 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: margemTela },
  barra: { flex: 1, height: 4, borderRadius: 9, backgroundColor: 'rgba(255,255,255,.07)', overflow: 'hidden' },
  barraPreenchida: { height: '100%', borderRadius: 9, backgroundColor: cores.aqua },
  contagem: { fontFamily: fontes.uiForte, fontSize: 12.5, lineHeight: 16, color: cores.muted },
  corpo: { paddingHorizontal: margemTela, paddingTop: 26, paddingBottom: 16 },
  chip: { alignSelf: 'flex-start' },
  pergunta: {
    marginTop: 14,
    fontFamily: fontes.display,
    fontSize: 24,
    lineHeight: 29,
    letterSpacing: -0.48,
    color: cores.text,
  },
  sub: { marginTop: 10, fontSize: 14, lineHeight: 21, color: cores.muted },
  dica: { marginTop: 6, fontSize: 13, lineHeight: 19, color: cores.faint },
  opcoes: { marginTop: 16, gap: 8 },
  opcao: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cores.line,
    backgroundColor: 'rgba(255,255,255,.02)',
  },
  opcaoSel: { backgroundColor: comAlfa(cores.aqua, 0.08), borderColor: comAlfa(cores.aqua, 0.6) },
  opcaoTexto: { flex: 1, fontFamily: fontes.uiMedia, fontSize: 15, lineHeight: 20 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: '#3B5878' },
  radioSel: { borderWidth: 6, borderColor: cores.aqua },
  rodape: { paddingHorizontal: margemTela, paddingTop: 12, gap: 6 },
});
