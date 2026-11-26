import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Icone } from '@/components/Icone';
import { TelaPasso } from '@/components/TelaPasso';
import { Texto } from '@/components/Texto';
import { SAMU } from '@/conteudo/apoio';
import { useVoltar } from '@/lib/useVoltar';
import { useMare } from '@/store';
import { comAlfa, cores, fontes } from '@/theme';

/**
 * Aviso de segurança do álcool (spec 6.1, passo 8): parar de beber muito de uma vez pode ser
 * perigoso. Orienta procurar UBS ou CAPS AD; não recomenda remédio.
 */
export default function SegurancaAlcool() {
  const router = useRouter();
  const voltar = useVoltar();
  const emergencia = useMare((e) => e.ajustes.contatosEmergencia);

  return (
    <TelaPasso
      aoVoltar={voltar}
      rodape={
        <>
          <Botao onPress={() => router.push('/boas-vindas/porques')}>Entendi</Botao>
          {emergencia ? (
            <Botao
              variante="texto"
              onPress={() => Linking.openURL(`tel:${SAMU.telefone}`).catch(() => undefined)}
              accessibilityLabel="Ligar para o SAMU, 192"
            >
              Ligar 192 (SAMU)
            </Botao>
          ) : null}
        </>
      }
    >
      <View style={styles.selo}>
        <Icone nome="calmaria" cor={cores.coral} />
      </View>
      <Texto style={styles.titulo} accessibilityRole="header">
        Um cuidado importante com o álcool
      </Texto>
      <Texto style={styles.texto}>
        Se você bebe muito e todos os dias, parar de uma vez pode ser perigoso para o corpo. Em alguns casos
        causa tremores fortes, convulsões e confusão.
      </Texto>
      <View style={styles.destaque}>
        <Texto style={styles.destaqueTexto}>
          Antes de parar, converse com um médico. Procure a UBS do seu bairro ou um CAPS AD. O atendimento é
          gratuito.
        </Texto>
      </View>
      <Texto style={styles.texto}>
        Se aparecerem tremores fortes, convulsão, confusão ou você ver ou ouvir coisas que não existem, ligue
        para o SAMU (192) na hora.
      </Texto>
      <Texto style={styles.legenda}>
        Reduzir aos poucos, com acompanhamento, também é um caminho. Em Aprender você encontra mais sobre isso,
        e isso não substitui um profissional.
      </Texto>
    </TelaPasso>
  );
}

const styles = StyleSheet.create({
  selo: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: comAlfa(cores.coral, 0.12),
  },
  titulo: { marginTop: 16, fontFamily: fontes.display, fontSize: 26, lineHeight: 31, letterSpacing: -0.52 },
  texto: { marginTop: 14, fontSize: 15, lineHeight: 23, color: cores.muted },
  destaque: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: comAlfa(cores.coral, 0.07),
    borderWidth: 1,
    borderColor: comAlfa(cores.coral, 0.22),
  },
  destaqueTexto: { fontSize: 14.5, lineHeight: 22, color: cores.text },
  legenda: { marginTop: 18, fontSize: 13, lineHeight: 19, color: cores.faint },
});
