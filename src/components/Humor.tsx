import { Pressable, StyleSheet, View } from 'react-native';
import { comAlfa, cores } from '@/theme';
import { Icone, type NomeIcone } from './Icone';

export type ValorHumor = 1 | 2 | 3 | 4 | 5;

/** 1 = muito difícil, 5 = muito bem. Da esquerda para a direita, como no mockup. */
const FACES: { valor: ValorHumor; icone: NomeIcone; rotulo: string }[] = [
  { valor: 1, icone: 'humor5', rotulo: 'Muito difícil' },
  { valor: 2, icone: 'humor4', rotulo: 'Difícil' },
  { valor: 3, icone: 'humor3', rotulo: 'Mais ou menos' },
  { valor: 4, icone: 'humor2', rotulo: 'Bem' },
  { valor: 5, icone: 'humor1', rotulo: 'Muito bem' },
];

type Props = {
  valor?: ValorHumor;
  /** Tocar de novo no rosto selecionado limpa a escolha (`undefined`). */
  onChange: (valor: ValorHumor | undefined) => void;
};

/** Cinco rostos em SVG (`.moods` do mockup). Humor é opcional. */
export function Humor({ valor, onChange }: Props) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Como você se sentiu?" style={styles.linha}>
      {FACES.map((f) => {
        const ativo = f.valor === valor;
        return (
          <Pressable
            key={f.valor}
            accessibilityRole="radio"
            accessibilityLabel={f.rotulo}
            accessibilityState={{ selected: ativo, checked: ativo }}
            onPress={() => onChange(ativo ? undefined : f.valor)}
            style={[styles.face, ativo && styles.ativo]}
          >
            <Icone nome={f.icone} cor={ativo ? cores.peri : cores.faint} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', gap: 8 },
  face: {
    flex: 1,
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: cores.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ativo: { backgroundColor: comAlfa(cores.peri, 0.12), borderColor: comAlfa(cores.peri, 0.5) },
});
