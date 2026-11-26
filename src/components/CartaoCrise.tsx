import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, View } from 'react-native';
import { CVV, SAMU } from '@/conteudo/apoio';
import type { TipoCrise } from '@/lib/crise';
import { useRolarAoAparecer } from '@/lib/rolagem';
import { useMare } from '@/store';
import { comAlfa, cores, fontes, raio } from '@/theme';
import { Botao } from './Botao';
import { Icone } from './Icone';
import { Texto } from './Texto';

type Props = { tipo: TipoCrise; aoFechar?: () => void };

const TEXTOS: Record<TipoCrise, { titulo: string; corpo: string; primario: 'cvv' | 'samu' }> = {
  suicidio: {
    titulo: 'Você importa, e não precisa passar por isso sozinho',
    corpo:
      'Sinto muito que esteja doendo tanto. Falar com uma pessoa agora pode ajudar: o CVV atende 24 horas, de graça, por telefone ou chat. Se você está em perigo agora, ligue para o SAMU.',
    primario: 'cvv',
  },
  intoxicacao: {
    titulo: 'Isso pode ser uma emergência',
    corpo:
      'Se alguém usou demais e está passando mal, ligue para o SAMU agora e não deixe a pessoa sozinha. Não espere melhorar.',
    primario: 'samu',
  },
  abstinencia: {
    titulo: 'Isso pode ser abstinência grave',
    corpo:
      'Tremores fortes, convulsão, ver coisas que não existem ou confusão precisam de atenção médica agora. Ligue para o SAMU. Quem bebe muito não deve parar de uma vez sem acompanhamento.',
    primario: 'samu',
  },
};

const ligar = (numero: string) => {
  // Sem discador (ex.: navegador no computador) não há o que fazer além de não quebrar.
  Linking.openURL(`tel:${numero}`).catch(() => undefined);
};

/**
 * Cartão acolhedor com CVV 188 / SAMU 192, mostrado quando `detectarCrise` encontra sinais de risco.
 * Não bloqueia nada: a pessoa pode seguir ou fechar. Respeita "Contatos de emergência" (desligado: não mostra).
 */
export function CartaoCrise({ tipo, aoFechar }: Props) {
  const ligado = useMare((e) => e.ajustes.contatosEmergencia);
  useRolarAoAparecer(ligado);
  if (!ligado) return null;
  const { titulo, corpo, primario } = TEXTOS[tipo];
  return (
    <View style={styles.cartao} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <View style={styles.cabeca}>
        <Icone nome="telefone" tamanho={20} cor={cores.coral} />
        <Texto style={styles.titulo}>{titulo}</Texto>
      </View>
      <Texto style={styles.corpo}>{corpo}</Texto>
      <View style={styles.botoes}>
        <Botao
          variante={primario === 'cvv' ? 'primario' : 'secundario'}
          onPress={() => ligar(CVV.telefone)}
          accessibilityLabel="Ligar para o CVV, 188"
        >
          Ligar 188 (CVV)
        </Botao>
        <Botao
          variante={primario === 'samu' ? 'primario' : 'secundario'}
          onPress={() => ligar(SAMU.telefone)}
          accessibilityLabel="Ligar para o SAMU, 192"
        >
          Ligar 192 (SAMU)
        </Botao>
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel="Conversar pelo chat do CVV, abre o site cvv.org.br"
        onPress={() => Linking.openURL(CVV.chat).catch(() => undefined)}
        style={styles.link}
      >
        <Texto style={styles.linkTexto}>Prefere escrever? Chat do CVV em cvv.org.br</Texto>
      </Pressable>
      <Texto tipo="legenda" style={styles.nota}>
        O Maré não substitui um profissional de saúde.
      </Texto>
      {aoFechar ? (
        <Botao variante="texto" onPress={aoFechar} accessibilityLabel="Fechar este aviso">
          Estou bem, seguir
        </Botao>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    gap: 12,
    padding: 16,
    borderRadius: raio.lg,
    backgroundColor: comAlfa(cores.coral, 0.07),
    borderWidth: 1,
    borderColor: comAlfa(cores.coral, 0.25),
  },
  cabeca: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titulo: { flex: 1, fontFamily: fontes.display, fontSize: 18, lineHeight: 23, letterSpacing: -0.2 },
  corpo: { fontSize: 14, lineHeight: 21, color: cores.muted },
  botoes: { gap: 8, marginTop: 2 },
  link: { minHeight: 44, justifyContent: 'center' },
  linkTexto: { fontFamily: fontes.uiMedia, fontSize: 13.5, lineHeight: 18, color: cores.aqua, textDecorationLine: 'underline' },
  nota: { textAlign: 'center' },
});
