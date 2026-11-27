import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RolarAoFim, useRolarAoFim } from '@/lib/rolagem';
import { margemTela } from '@/theme';
import { BotaoIcone } from './BotaoIcone';
import { Fundo } from './Fundo';

type Props = {
  /** Mostra o botão voltar (40x40) no topo. */
  aoVoltar?: () => void;
  /** Ao lado do botão voltar (ex.: "Hábito 1 de 2"). */
  topo?: ReactNode;
  children: ReactNode;
  /** Botões fixos no rodapé. */
  rodape: ReactNode;
};

/**
 * Tela de um passo (como o `.body` + `.foot` do mockup): topo opcional, conteúdo que rola quando o
 * teclado ou a fonte grande tomam espaço, e rodapé fixo com os botões. O teclado nunca cobre o campo.
 */
export function TelaPasso({ aoVoltar, topo, children, rodape }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const { ref, rolar } = useRolarAoFim();
  return (
    <Fundo>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={[styles.flex, { paddingTop: top + 14 }]}>
          {aoVoltar || topo ? (
            <View style={styles.topo}>
              {aoVoltar ? <BotaoIcone icone="voltar" onPress={aoVoltar} accessibilityLabel="Voltar" /> : null}
              {topo}
            </View>
          ) : null}
          <ScrollView
            ref={ref}
            style={styles.flex}
            contentContainerStyle={styles.corpo}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <RolarAoFim.Provider value={rolar}>{children}</RolarAoFim.Provider>
          </ScrollView>
          <View style={[styles.rodape, { paddingBottom: Math.max(bottom, 12) + 10 }]}>{rodape}</View>
        </View>
      </KeyboardAvoidingView>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: margemTela },
  corpo: { paddingHorizontal: margemTela, paddingTop: 22, paddingBottom: 16 },
  rodape: { paddingHorizontal: margemTela, paddingTop: 12, gap: 6 },
});
