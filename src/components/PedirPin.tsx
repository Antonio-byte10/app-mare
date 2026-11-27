import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { formatarEspera } from '@/lib/bloqueioRegras';
import { gravarPin, lerPin } from '@/lib/cofrePin';
import { restanteDaEspera, tentarPin, type RegistroPin } from '@/lib/pin';
import { cores } from '@/theme';
import { Botao } from './Botao';
import { TecladoPin } from './TecladoPin';
import { Texto } from './Texto';

type Props = {
  titulo: string;
  descricao: string;
  aoConfirmar: () => void;
  aoCancelar: () => void;
};

/**
 * Pede o PIN atual antes de mexer em algo sensível (mudar ou desligar o bloqueio, trocar o
 * disfarce). Usa o mesmo contador de erros e a mesma espera crescente da tela de bloqueio.
 */
export function PedirPin({ titulo, descricao, aoConfirmar, aoCancelar }: Props) {
  const { height } = useWindowDimensions();
  const compacto = height < 700;
  const [registro, setRegistro] = useState<RegistroPin | null | 'erro' | undefined>(undefined);
  const [pin, setPin] = useState('');
  const [errou, setErrou] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [agora, setAgora] = useState(() => Date.now());

  // Lê o PIN guardado (e de novo quando a pessoa pede "Tentar de novo").
  const [leitura, setLeitura] = useState(0);
  useEffect(() => {
    let ativo = true;
    lerPin().then((r) => ativo && setRegistro(r));
    return () => {
      ativo = false;
    };
  }, [leitura]);
  const tentarDeNovo = () => {
    setRegistro(undefined);
    setLeitura((n) => n + 1);
  };
  // Cofre sem resposta ou sem PIN: o teclado não tem o que conferir, então oferece tentar de novo.
  const semPin = registro === 'erro' || registro === null;

  const objeto = registro && registro !== 'erro' ? registro : null;
  const restante = objeto ? restanteDaEspera(objeto, agora) : 0;
  useEffect(() => {
    if (restante <= 0) return;
    const id = setInterval(() => setAgora(Date.now()), 500);
    return () => clearInterval(id);
  }, [restante]);

  const conferir = async (digitado: string) => {
    if (!objeto) return;
    setVerificando(true);
    const t = await tentarPin(digitado, objeto, Date.now());
    setPin('');
    if (t.registro !== objeto) {
      await gravarPin(t.registro).catch(() => undefined);
      setRegistro(t.registro);
    }
    setAgora(Date.now());
    setVerificando(false);
    if (t.resultado === 'ok') aoConfirmar();
    else setErrou(true);
  };

  const mudou = (valor: string) => {
    setErrou(false);
    setPin(valor);
    if (objeto && valor.length === objeto.tamanho) conferir(valor);
  };

  const mensagem =
    semPin
      ? 'Não consegui acessar o cofre deste aparelho. Tente de novo.'
      : restante > 0
        ? `Muitas tentativas. Tente de novo em ${formatarEspera(restante)}.`
        : errou
          ? 'PIN incorreto.'
          : '';

  return (
    <ScrollView contentContainerStyle={styles.rolagem} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Texto tipo="titulo" style={styles.centro} accessibilityRole="header">
        {titulo}
      </Texto>
      <Texto tipo="legenda" style={[styles.centro, styles.apoio]}>
        {descricao}
      </Texto>
      <View style={{ marginTop: compacto ? 12 : 22 }}>
        <TecladoPin
          valor={pin}
          aoMudar={mudou}
          total={objeto?.tamanho ?? 4}
          desabilitado={!objeto || verificando || restante > 0}
          erro={errou || restante > 0}
          compacto={compacto}
        />
      </View>
      <View style={styles.mensagem} accessibilityLiveRegion="polite">
        {mensagem ? (
          <Texto tipo="legenda" cor={cores.sand} style={styles.centro}>
            {mensagem}
          </Texto>
        ) : null}
      </View>
      {semPin ? (
        <Botao variante="texto" onPress={tentarDeNovo}>
          Tentar de novo
        </Botao>
      ) : null}
      <Botao variante="texto" onPress={aoCancelar}>
        Voltar
      </Botao>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rolagem: { alignItems: 'center', paddingTop: 8, paddingBottom: 48 },
  centro: { textAlign: 'center' },
  apoio: { marginTop: 6 },
  mensagem: { minHeight: 36, marginTop: 8, justifyContent: 'center' },
});
