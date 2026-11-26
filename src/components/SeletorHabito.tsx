import { useRouter } from 'expo-router';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Habito } from '@/lib/tipos';
import { cores } from '@/theme';
import { Chip } from './Chip';

type Props = {
  habitos: Habito[];
  ativoId: string;
  onEscolher: (id: string) => void;
  /** Mostra o chip "+ Novo" (leva a "Novo hábito"). Padrão: sim. */
  comNovo?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Chips para trocar de hábito (Início, Diário e Marcos): um ponto colorido e o apelido. */
export function SeletorHabito({ habitos, ativoId, onEscolher, comNovo = true, style }: Props) {
  const router = useRouter();
  return (
    <View style={[styles.chips, style]}>
      {habitos.map((h) => (
        <Chip key={h.id} ponto cor={cores[h.cor]} ativo={h.id === ativoId} onPress={() => onEscolher(h.id)}>
          {h.apelido}
        </Chip>
      ))}
      {comNovo ? (
        <Chip onPress={() => router.push('/habito/novo')} accessibilityLabel="Adicionar hábito">
          + Novo
        </Chip>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
});
