import { StyleSheet, View } from 'react-native';

type Props = {
  /** Cor do topo e cor da base (degradê vertical, como `linear-gradient(180deg, ...)`). */
  de: string;
  para: string;
};

/**
 * Preenche o pai (que deve ter `overflow: 'hidden'` e raio) com um degradê vertical.
 * Usa o `backgroundImage` nativo do React Native (desenhado pela própria View). Antes era um SVG,
 * e no Android o recorte de cantos arredondados do botão cortava o SVG numa área fixa da tela:
 * o "Começar" e o "Passou" apareciam pela metade.
 */
export function Degrade({ de, para }: Props) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: para, backgroundImage: `linear-gradient(180deg, ${de}, ${para})` }]}
    />
  );
}
