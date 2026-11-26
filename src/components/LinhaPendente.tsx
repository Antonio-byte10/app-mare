import { Pressable, StyleSheet, View } from 'react-native';
import { comAlfa, cores, fontes, raio } from '@/theme';
import { Icone } from './Icone';
import { Texto } from './Texto';

type Props = {
  titulo: string;
  subtitulo?: string;
  onPress: () => void;
};

/** Cartão de relato pendente (`.rowcard` do mockup): lápis, texto e seta. */
export function LinhaPendente({ titulo, subtitulo, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitulo ? `${titulo}. ${subtitulo}` : titulo}
      onPress={onPress}
      style={({ pressed }) => [styles.cartao, pressed && styles.pressionado]}
    >
      <Icone nome="lapis" cor={cores.peri} />
      <View style={styles.textos}>
        <Texto style={styles.titulo}>{titulo}</Texto>
        {subtitulo ? <Texto tipo="legenda" style={styles.subtitulo}>{subtitulo}</Texto> : null}
      </View>
      <Icone nome="avancar" tamanho={18} cor={cores.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: raio.lg,
    backgroundColor: comAlfa(cores.peri, 0.07),
    borderWidth: 1,
    borderColor: comAlfa(cores.peri, 0.18),
  },
  pressionado: { opacity: 0.8 },
  textos: { flex: 1 },
  titulo: { fontFamily: fontes.uiForte, fontSize: 14.5, lineHeight: 20 },
  subtitulo: { marginTop: 2 },
});
