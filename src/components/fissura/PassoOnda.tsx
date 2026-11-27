import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '@/components/Botao';
import { LinhaAjuste } from '@/components/LinhaAjuste';
import { Mar } from '@/components/Mar';
import { Texto } from '@/components/Texto';
import { CVV, SAMU } from '@/conteudo/apoio';
import { formatarContagem, ONDA_SEG } from '@/lib/fissura';
import { acoesDoPlano, frasePlano } from '@/lib/plano';
import type { Porque } from '@/lib/tipos';
import { useVoltarInterno } from '@/lib/useVoltarInterno';
import { useMare } from '@/store';
import { cores, fontes, margemTela } from '@/theme';

type Props = {
  porque?: Porque;
  habitoId?: string;
  /** Aberta pela tela de bloqueio: sem links para telas privadas (Meu plano, Conversa). */
  daTrancada?: boolean;
  aoPassou: () => void;
  aoRespirarDeNovo: () => void;
};

const ligar = (numero: string) => {
  Linking.openURL(`tel:${numero}`).catch(() => undefined);
};

/**
 * Passo 2, "Surfe a onda": contagem de 3 minutos, a frase da onda, o porquê da pessoa e o mar com
 * "Ainda difícil" / "Passou". "Ainda difícil" abre as saídas: respirar de novo, o plano, a IA e CVV/SAMU.
 */
export function PassoOnda({ porque, habitoId, daTrancada = false, aoPassou, aoRespirarDeNovo }: Props) {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const [restante, setRestante] = useState(ONDA_SEG);
  const [dificil, setDificil] = useState(false);
  // Voltar do Android fecha o painel "Ainda difícil" antes de fechar a Fissura.
  useVoltarInterno(dificil, () => setDificil(false));

  useEffect(() => {
    const fim = Date.now() + ONDA_SEG * 1000;
    // Calcula pelo relógio (e não "menos 1 por tick"): o contador não atrasa se o app ficar em segundo plano.
    const id = setInterval(() => setRestante(Math.max(0, Math.ceil((fim - Date.now()) / 1000))), 500);
    return () => clearInterval(id);
  }, []);

  const acabou = restante === 0;
  const minutos = Math.floor(restante / 60);
  const segundos = restante % 60;
  const falaTempo = `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'} e ${segundos} ${segundos === 1 ? 'segundo' : 'segundos'}`;

  return (
    <View style={styles.raiz}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.corpo}
        showsVerticalScrollIndicator={false}
        // Esconde o conteúdo de trás para quem usa leitor de tela enquanto o painel está aberto.
        importantForAccessibility={dificil ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={dificil}
      >
        <Texto tipo="rotulo" style={styles.centro}>
          {acabou ? 'Você ficou até aqui' : 'A onda está descendo'}
        </Texto>
        <Texto
          style={styles.tempo}
          accessible
          accessibilityLabel={acabou ? 'Os 3 minutos terminaram' : `Faltam ${falaTempo}`}
        >
          {formatarContagem(restante)}
        </Texto>
        <Texto style={styles.frase}>{'A vontade sobe, chega ao pico\ne passa. Você só precisa ficar.'}</Texto>

        {porque ? (
          <View style={styles.citacao}>
            <Texto style={styles.rotuloPorque}>Seu porquê</Texto>
            <Texto style={styles.textoPorque}>{`“${porque.texto}”`}</Texto>
          </View>
        ) : (
          <View style={styles.citacao}>
            <Texto style={styles.rotuloPorque}>Seu porquê</Texto>
            <Texto style={styles.semPorque}>
              Ainda não há um porquê por aqui. Escrever um pode ajudar nas próximas ondas.
            </Texto>
            {daTrancada ? null : (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Escrever meu porquê, abre Meu plano"
                onPress={() => router.push('/plano')}
                style={styles.linkPlano}
              >
                <Texto style={styles.linkTexto}>Escrever em Meu plano</Texto>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      <Mar altura={150 + Math.max(bottom, 12) - 12}>
        <View
          style={[styles.botoes, { bottom: Math.max(bottom, 12) + 10 }]}
          // Com o painel aberto, "Passou" e "Ainda difícil" ficam fora do alcance do leitor de tela.
          importantForAccessibility={dificil ? 'no-hide-descendants' : 'auto'}
          accessibilityElementsHidden={dificil}
        >
          <Botao variante="secundario" onPress={() => setDificil(true)} style={styles.ainda}>
            Ainda difícil
          </Botao>
          <Botao onPress={aoPassou} style={styles.passou}>
            Passou
          </Botao>
        </View>
      </Mar>

      {dificil ? (
        <PainelDificil
          habitoId={habitoId}
          daTrancada={daTrancada}
          aoFechar={() => setDificil(false)}
          aoRespirarDeNovo={() => {
            setDificil(false);
            aoRespirarDeNovo();
          }}
        />
      ) : null}
    </View>
  );
}

type PainelProps = { habitoId?: string; daTrancada: boolean; aoFechar: () => void; aoRespirarDeNovo: () => void };

/** "Ainda difícil": o que fazer agora, uma saída por linha. */
function PainelDificil({ habitoId, daTrancada, aoFechar, aoRespirarDeNovo }: PainelProps) {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const planos = useMare((e) => e.planos);
  const temIa = useMare((e) => e.ajustes.ia !== undefined);
  const emergencia = useMare((e) => e.ajustes.contatosEmergencia);
  const [verPlano, setVerPlano] = useState(false);
  const acoes = acoesDoPlano(planos, habitoId).slice(0, 4);
  // Pela tela de bloqueio: "Meu plano" só mostra as ações já escritas (sem abrir a tela) e a IA some.
  const mostrarPlano = !daTrancada || acoes.length > 0;

  return (
    <View style={styles.painelFundo} accessibilityViewIsModal>
      <Pressable accessibilityLabel="Fechar e voltar à onda" accessibilityRole="button" style={styles.painelToque} onPress={aoFechar} />
      <View style={[styles.painel, { paddingBottom: Math.max(bottom, 12) + 14 }]}>
        <Texto style={styles.painelTitulo} accessibilityRole="header">
          Tudo bem ser difícil. O que pode ajudar agora?
        </Texto>
        <ScrollView style={styles.painelRolagem} showsVerticalScrollIndicator={false}>
          <LinhaAjuste
            titulo="Mais um ciclo de respiração"
            subtitulo="soltar o ar devagar, por 1 minuto"
            icone="folego"
            onPress={aoRespirarDeNovo}
          />
          {mostrarPlano ? (
            <>
              <View style={styles.divisor} />
              <LinhaAjuste
                titulo="As ações do meu plano"
                subtitulo={acoes.length > 0 ? 'o que você combinou com você mesmo' : 'você ainda não tem ações no plano'}
                icone="notas"
                onPress={() => (acoes.length > 0 ? setVerPlano((v) => !v) : (aoFechar(), router.push('/plano')))}
                accessibilityLabel={acoes.length > 0 ? 'As ações do meu plano, mostrar ou esconder' : 'Criar ações no Meu plano'}
              />
              {verPlano
                ? acoes.map((p) => (
                    <Texto key={p.id} style={styles.acao}>
                      {frasePlano(p)}
                    </Texto>
                  ))
                : null}
            </>
          ) : null}
          {temIa && !daTrancada ? (
            <>
              <View style={styles.divisor} />
              <LinhaAjuste
                titulo="Conversar com a IA"
                subtitulo="apoio por escrito, agora"
                icone="conversa"
                onPress={() => {
                  aoFechar();
                  // Volta às abas que já estão abaixo e abre a Conversa (não monta um segundo conjunto de abas).
                  router.dismissTo('/conversa');
                }}
              />
            </>
          ) : null}
          {emergencia ? (
            <>
              <View style={styles.divisor} />
              <View style={styles.emergencia}>
                <Texto style={styles.emergenciaTexto}>
                  Se estiver demais, fale com uma pessoa agora. É de graça e 24 horas.
                </Texto>
                <View style={styles.emergenciaBotoes}>
                  <Botao variante="secundario" onPress={() => ligar(CVV.telefone)} style={styles.flex} accessibilityLabel="Ligar para o CVV, 188">
                    CVV 188
                  </Botao>
                  <Botao variante="secundario" onPress={() => ligar(SAMU.telefone)} style={styles.flex} accessibilityLabel="Ligar para o SAMU, 192">
                    SAMU 192
                  </Botao>
                </View>
              </View>
            </>
          ) : null}
        </ScrollView>
        <Botao variante="texto" onPress={aoFechar}>
          Voltar à onda
        </Botao>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  flex: { flex: 1 },
  corpo: { paddingHorizontal: margemTela, paddingTop: 30, paddingBottom: 24 },
  centro: { textAlign: 'center' },
  tempo: {
    marginTop: 12,
    textAlign: 'center',
    fontFamily: fontes.displayLeve,
    fontSize: 76,
    lineHeight: 80,
    letterSpacing: -3,
    color: cores.text,
  },
  frase: {
    marginTop: 14,
    textAlign: 'center',
    fontFamily: fontes.display,
    fontSize: 18,
    lineHeight: 25,
    color: cores.muted,
  },
  citacao: { marginTop: 28, paddingLeft: 16, borderLeftWidth: 2, borderLeftColor: cores.sand },
  rotuloPorque: {
    fontFamily: fontes.uiForte,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: cores.sand,
    marginBottom: 8,
  },
  textoPorque: { fontFamily: fontes.display, fontSize: 17, lineHeight: 25, color: cores.text },
  semPorque: { fontSize: 14, lineHeight: 21, color: cores.muted },
  linkPlano: { minHeight: 44, justifyContent: 'center' },
  linkTexto: { fontFamily: fontes.uiMedia, fontSize: 13.5, color: cores.aqua, textDecorationLine: 'underline' },
  botoes: { position: 'absolute', left: margemTela, right: margemTela, flexDirection: 'row', gap: 10 },
  ainda: { flex: 1, backgroundColor: 'rgba(4,16,30,.62)' },
  passou: { flex: 1.25 },
  painelFundo: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end', backgroundColor: 'rgba(2,8,16,.55)' },
  painelToque: { flex: 1 },
  painel: {
    maxHeight: '82%',
    paddingHorizontal: margemTela,
    paddingTop: 22,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#07182C',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: cores.line2,
  },
  painelTitulo: { fontFamily: fontes.display, fontSize: 21, lineHeight: 27, letterSpacing: -0.3, marginBottom: 8 },
  painelRolagem: { flexGrow: 0 },
  divisor: { height: 1, backgroundColor: cores.line },
  acao: {
    paddingLeft: 36,
    paddingBottom: 12,
    fontSize: 14,
    lineHeight: 21,
    color: cores.muted,
  },
  emergencia: { paddingVertical: 16, gap: 12 },
  emergenciaTexto: { fontSize: 13.5, lineHeight: 20, color: cores.muted },
  emergenciaBotoes: { flexDirection: 'row', gap: 8 },
});
