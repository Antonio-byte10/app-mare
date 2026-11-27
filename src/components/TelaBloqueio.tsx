import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, Image, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ICONE_DISFARCE } from '@/conteudo/disfarces';
import { apagarTudo } from '@/lib/apagarTudo';
import { autenticarBiometria, biometriaDisponivel } from '@/lib/biometria';
import { formatarEspera } from '@/lib/bloqueioRegras';
import { gravarPin, lerPin } from '@/lib/cofrePin';
import { confirmar } from '@/lib/confirmar';
import { restanteDaEspera, tentarPin, type RegistroPin } from '@/lib/pin';
import { bloqueioDe, disfarceDe, nomeDisfarce } from '@/lib/preferencias';
import { useBloqueio } from '@/lib/useBloqueio';
import { useMare } from '@/store';
import { comAlfa, cores, fontes } from '@/theme';
import { Botao } from './Botao';
import { Fundo } from './Fundo';
import { Icone } from './Icone';
import { Simbolo } from './Simbolo';
import { TecladoPin } from './TecladoPin';
import { Texto } from './Texto';

/** Símbolo do app (Maré) ou o ícone do disfarce, com o nome que a pessoa escolheu. Nunca diz "Maré" num disfarce. */
export function MarcaBloqueio({ compacto = false }: { compacto?: boolean }) {
  const ajustes = useMare((e) => e.ajustes);
  const disfarce = disfarceDe(ajustes);
  const nome = nomeDisfarce(ajustes);
  const lado = compacto ? 52 : 72;
  return (
    <View style={styles.marca} accessible accessibilityRole="header" accessibilityLabel={nome}>
      {disfarce === 'mare' ? (
        <Simbolo tamanho={lado + 8} />
      ) : (
        <Image source={ICONE_DISFARCE[disfarce]} style={{ width: lado, height: lado, borderRadius: lado * 0.22 }} accessibilityIgnoresInvertColors />
      )}
      <Texto style={[styles.nome, compacto && { fontSize: 26, lineHeight: 31 }]}>{disfarce === 'mare' ? 'maré' : nome}</Texto>
    </View>
  );
}

/** Cobertura de uma cor só, enquanto o app está fora da tela (apps recentes, ligação). */
export function CoberturaBloqueio() {
  return (
    <Fundo variante="abertura" style={StyleSheet.absoluteFill}>
      <View style={styles.centro}>
        <MarcaBloqueio />
      </View>
    </Fundo>
  );
}

type Registro = RegistroPin | null | 'erro' | undefined;

/**
 * Tela de bloqueio em tela cheia (mockup da abertura): marca com o nome do disfarce, teclado
 * numérico próprio, digital, espera crescente depois de erros e a saída "Esqueci o PIN".
 */
export function TelaBloqueio() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const compacto = height < 700;
  const ajustes = useMare((e) => e.ajustes);
  const setAjustes = useMare((e) => e.setAjustes);
  const bloqueio = bloqueioDe(ajustes);
  const nome = nomeDisfarce(ajustes);
  const rodada = useBloqueio((e) => e.rodada);

  const [registro, setRegistro] = useState<Registro>(undefined);
  const [pin, setPin] = useState('');
  const [errou, setErrou] = useState(false);
  const [livres, setLivres] = useState<number | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());
  const [bioOk, setBioOk] = useState(false);
  const [esqueci, setEsqueci] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [falhouApagar, setFalhouApagar] = useState(false);

  // Lê o PIN guardado a cada trancada (e quando a pessoa pede "Tentar de novo").
  const [leitura, setLeitura] = useState(0);
  useEffect(() => {
    let ativo = true;
    lerPin().then((r) => ativo && setRegistro(r));
    return () => {
      ativo = false;
    };
  }, [rodada, leitura]);
  const carregar = () => {
    setRegistro(undefined);
    setLeitura((n) => n + 1);
  };

  // Sem PIN guardado não há como pedir PIN: o bloqueio não faria sentido e ninguém fica preso.
  useEffect(() => {
    if (registro === null) {
      setAjustes({ bloqueio: { ...bloqueio, ligado: false } });
      useBloqueio.getState().destravar();
    }
  }, [registro, bloqueio, setAjustes]);

  const objeto = registro && registro !== 'erro' ? registro : null;
  const restante = objeto ? restanteDaEspera(objeto, agora) : 0;
  useEffect(() => {
    if (restante <= 0) return;
    const id = setInterval(() => setAgora(Date.now()), 500);
    return () => clearInterval(id);
  }, [restante]);

  const usarBiometria = bloqueio.biometria && bioOk;
  const entrarComBiometria = useCallback(async () => {
    if (!(await autenticarBiometria(`Abrir ${nome}`))) return;
    // Acertar pela digital não é adivinhar: o contador de erros do PIN recomeça.
    if (objeto && objeto.falhas > 0) await gravarPin({ ...objeto, falhas: 0, bloqueadoAte: 0 }).catch(() => undefined);
    useBloqueio.getState().destravar();
  }, [nome, objeto]);

  useEffect(() => {
    biometriaDisponivel().then(setBioOk);
  }, []);
  // Oferece a digital ao abrir a tela (uma vez por trancada, assim que o PIN foi lido).
  const pinLido = objeto !== null;
  useEffect(() => {
    if (usarBiometria && pinLido) entrarComBiometria();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usarBiometria, pinLido, rodada]);

  // "Voltar" do Android: fecha o app (ou sai da explicação). Nunca revela o que está por trás.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (esqueci && !apagando) setEsqueci(false);
      else BackHandler.exitApp();
      return true;
    });
    return () => sub.remove();
  }, [esqueci, apagando]);

  const conferir = async (digitado: string) => {
    if (!objeto) return;
    setVerificando(true);
    const t = await tentarPin(digitado, objeto, Date.now());
    setPin('');
    if (t.registro !== objeto) {
      // Grava antes de seguir: fechar o app no meio não pode zerar o contador de erros.
      await gravarPin(t.registro).catch(() => undefined);
      setRegistro(t.registro);
    }
    setAgora(Date.now());
    setVerificando(false);
    if (t.resultado === 'ok') {
      useBloqueio.getState().destravar();
      return;
    }
    setErrou(true);
    setLivres(t.resultado === 'errado' ? t.tentativasLivres : null);
  };

  const mudou = (valor: string) => {
    setErrou(false);
    setPin(valor);
    if (objeto && valor.length === objeto.tamanho) conferir(valor);
  };

  const pedirOnda = () => {
    useBloqueio.getState().pedirOnda();
    router.push('/fissura');
  };

  const comecarDoZero = () => {
    confirmar(
      'Apagar tudo?',
      'Todos os registros, o PIN e as configurações deste aparelho serão apagados. Não dá para desfazer.',
      'Continuar',
      () =>
        confirmar(
          'Tem certeza?',
          'Última chance: depois de apagar, o Maré volta ao começo, como se tivesse acabado de ser instalado.',
          'Apagar tudo',
          async () => {
            setApagando(true);
            setFalhouApagar(false);
            const falhas = await apagarTudo();
            setApagando(false);
            if (falhas.length > 0) setFalhouApagar(true);
          },
        ),
    );
  };

  let mensagem = '';
  if (registro === 'erro') mensagem = 'Não consegui acessar o cofre deste aparelho. Tente de novo.';
  else if (restante > 0) mensagem = `Muitas tentativas. Tente de novo em ${formatarEspera(restante)}.`;
  else if (errou) {
    mensagem = 'PIN incorreto.';
    if (livres !== null && livres > 0 && livres <= 2) mensagem += ` Mais ${livres === 1 ? '1 tentativa' : `${livres} tentativas`} antes de uma pausa.`;
  }

  const padding = { paddingTop: top + 12, paddingBottom: Math.max(bottom, 12) + 12 };

  if (esqueci) {
    return (
      <Fundo variante="abertura" style={StyleSheet.absoluteFill}>
        <ScrollView contentContainerStyle={[styles.rolagem, padding]} keyboardShouldPersistTaps="handled">
          <MarcaBloqueio compacto />
          <Texto tipo="titulo" style={styles.tituloEsqueci} accessibilityRole="header">
            Esqueci o PIN
          </Texto>
          <Texto style={styles.paragrafo}>
            Por segurança, o PIN não pode ser recuperado nem trocado: ele é a chave que mantém seus registros fechados neste aparelho.
          </Texto>
          <Texto style={styles.paragrafo}>
            A única saída é apagar os dados deste aparelho e começar do zero. Se você tem um backup, depois é só restaurá-lo em Mais, Backup e dados.
          </Texto>
          {falhouApagar ? (
            <Texto tipo="legenda" cor={cores.sand} accessibilityLiveRegion="polite" style={styles.paragrafo}>
              Não consegui apagar tudo agora. Tente de novo.
            </Texto>
          ) : null}
          <View style={styles.acoes}>
            <Botao variante="secundario" onPress={comecarDoZero} desabilitado={apagando}>
              {apagando ? 'Apagando…' : 'Apagar tudo e começar do zero'}
            </Botao>
            <Botao variante="texto" onPress={() => setEsqueci(false)} desabilitado={apagando}>
              Voltar
            </Botao>
          </View>
        </ScrollView>
      </Fundo>
    );
  }

  const aguardando = registro === undefined || verificando || restante > 0 || registro === 'erro';

  return (
    <Fundo variante="abertura" style={StyleSheet.absoluteFill}>
      <ScrollView contentContainerStyle={[styles.rolagem, padding]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <MarcaBloqueio compacto={compacto} />
        <Texto tipo="legenda" style={styles.instrucao}>
          Digite o PIN para abrir
        </Texto>
        <View style={{ marginTop: compacto ? 14 : 24 }}>
          <TecladoPin
            valor={pin}
            aoMudar={mudou}
            total={objeto?.tamanho ?? 4}
            desabilitado={aguardando}
            erro={errou || restante > 0}
            compacto={compacto}
            extraEsquerda={
              usarBiometria ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Usar digital ou rosto"
                  onPress={entrarComBiometria}
                  style={({ pressed }) => [styles.bio, pressed && { backgroundColor: comAlfa(cores.aqua, 0.14) }]}
                >
                  <Icone nome="digital" tamanho={28} cor={cores.aqua} />
                </Pressable>
              ) : undefined
            }
          />
        </View>
        <View style={styles.mensagem} accessibilityLiveRegion="polite">
          {mensagem ? (
            <Texto tipo="legenda" cor={cores.sand} style={styles.mensagemTexto}>
              {mensagem}
            </Texto>
          ) : null}
        </View>
        {registro === 'erro' ? (
          <Botao variante="texto" onPress={carregar}>
            Tentar de novo
          </Botao>
        ) : null}
        <View style={styles.rodape}>
          <Botao variante="texto" onPress={() => setEsqueci(true)}>
            Esqueci o PIN
          </Botao>
          {bloqueio.ondaLivre ? (
            <Pressable
              onPress={pedirOnda}
              accessibilityRole="button"
              accessibilityLabel="Abrir a onda, sem desbloquear o app"
              style={({ pressed }) => [styles.onda, pressed && { backgroundColor: comAlfa(cores.aqua, 0.14) }]}
            >
              <Icone nome="onda" tamanho={20} cor={cores.aqua} />
              <Texto style={styles.ondaTexto}>Abrir a onda</Texto>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34 },
  rolagem: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  marca: { alignItems: 'center', gap: 10 },
  nome: { fontFamily: fontes.display, fontSize: 32, lineHeight: 38, letterSpacing: -1.1, textAlign: 'center' },
  instrucao: { marginTop: 4, textAlign: 'center' },
  mensagem: { minHeight: 40, marginTop: 10, justifyContent: 'center' },
  mensagemTexto: { textAlign: 'center' },
  bio: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  rodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' },
  onda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: comAlfa(cores.aqua, 0.35),
  },
  ondaTexto: { fontFamily: fontes.uiMedia, fontSize: 13.5, lineHeight: 18, color: cores.aqua },
  tituloEsqueci: { marginTop: 22, textAlign: 'center' },
  paragrafo: { marginTop: 12, textAlign: 'center', color: cores.muted },
  acoes: { alignSelf: 'stretch', gap: 8, marginTop: 28 },
});
