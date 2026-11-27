import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { lerFotoComoDataUri } from '@/lib/fotos';
import { comAlfa, cores } from '@/theme';
import { Texto } from './Texto';

type Props = {
  /** Nome do arquivo cifrado (`Porque.foto`). Troque o `key` ao mudar de foto. */
  nome: string;
  altura: number;
  /** Padrão: a largura toda. */
  largura?: DimensionValue;
  raio?: number;
  /** Mostra "Não consegui abrir esta foto." quando falha (nas miniaturas, fica só o fundo). */
  avisarFalha?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Foto de um porquê: decifrada na hora, só em memória, com um fundo calmo enquanto carrega.
 * Se o arquivo ou a chave se perderam, não quebra nada: mostra o fundo (e, se pedido, um aviso).
 */
export function FotoPorque({ nome, altura, largura = '100%', raio = 16, avisarFalha = false, accessibilityLabel = 'Foto do seu porquê', style }: Props) {
  // `undefined` = carregando; `null` = não foi possível abrir.
  const [uri, setUri] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let vivo = true;
    lerFotoComoDataUri(nome)
      .then((u) => vivo && setUri(u))
      .catch(() => vivo && setUri(null));
    return () => {
      vivo = false;
    };
  }, [nome]);

  return (
    <View style={[styles.caixa, { height: altura, width: largura, borderRadius: raio }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          resizeMode="cover"
          accessible
          accessibilityRole="image"
          accessibilityLabel={accessibilityLabel}
          style={StyleSheet.absoluteFill}
        />
      ) : uri === undefined ? (
        <ActivityIndicator color={cores.muted} accessibilityLabel="Carregando a foto" />
      ) : avisarFalha ? (
        <Texto tipo="legenda" style={styles.falha}>
          Não consegui abrir esta foto.
        </Texto>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: comAlfa(cores.aqua, 0.06),
    borderWidth: 1,
    borderColor: cores.line,
  },
  falha: { textAlign: 'center', paddingHorizontal: 12 },
});
