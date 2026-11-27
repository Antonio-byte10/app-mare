import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { pinValido, PIN_MAX, PIN_MIN } from '@/lib/pin';
import { cores } from '@/theme';
import { Botao } from './Botao';
import { Icone } from './Icone';
import { TecladoPin } from './TecladoPin';
import { Texto } from './Texto';

type Props = {
  /** Chamado com o PIN confirmado; pode lançar se não conseguir guardar. */
  aoConcluir: (pin: string) => Promise<void>;
  aoCancelar: () => void;
};

/** Criar um PIN novo: digitar (4 a 6 dígitos) e digitar de novo para confirmar. */
export function CriarPin({ aoConcluir, aoCancelar }: Props) {
  const { height } = useWindowDimensions();
  const compacto = height < 700;
  const [passo, setPasso] = useState<'novo' | 'confirmar'>('novo');
  const [primeiro, setPrimeiro] = useState('');
  const [pin, setPin] = useState('');
  const [aviso, setAviso] = useState('');
  const [salvando, setSalvando] = useState(false);

  const confirmando = passo === 'confirmar';

  const mudou = (valor: string) => {
    setAviso('');
    setPin(valor);
    if (confirmando && valor.length === primeiro.length) conferir(valor);
  };

  const continuar = () => {
    if (!pinValido(pin)) return;
    setPrimeiro(pin);
    setPin('');
    setPasso('confirmar');
  };

  const conferir = async (digitado: string) => {
    if (digitado !== primeiro) {
      setAviso('Os PINs não são iguais. Vamos tentar de novo.');
      setPin('');
      setPrimeiro('');
      setPasso('novo');
      return;
    }
    setSalvando(true);
    try {
      await aoConcluir(digitado);
    } catch {
      setAviso('Não consegui guardar o PIN com segurança neste aparelho. Tente de novo.');
      setPin('');
      setPrimeiro('');
      setPasso('novo');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.rolagem} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Texto tipo="titulo" style={styles.titulo} accessibilityRole="header">
        {confirmando ? 'Digite o PIN de novo' : 'Crie um PIN'}
      </Texto>
      <Texto tipo="legenda" style={styles.apoio}>
        {confirmando ? 'Só para ter certeza de que você anotou certo.' : `De ${PIN_MIN} a ${PIN_MAX} dígitos. Escolha algo que só você saiba.`}
      </Texto>

      <View style={{ marginTop: compacto ? 12 : 22 }}>
        <TecladoPin
          valor={pin}
          aoMudar={mudou}
          total={confirmando ? primeiro.length : undefined}
          maximo={PIN_MAX}
          desabilitado={salvando}
          compacto={compacto}
        />
      </View>

      <View style={styles.mensagem} accessibilityLiveRegion="polite">
        {salvando ? (
          <Texto tipo="legenda">Guardando o PIN…</Texto>
        ) : aviso ? (
          <Texto tipo="legenda" cor={cores.sand}>
            {aviso}
          </Texto>
        ) : null}
      </View>

      {confirmando ? null : (
        <Botao onPress={continuar} desabilitado={!pinValido(pin) || salvando} style={styles.botao}>
          Continuar
        </Botao>
      )}
      <Botao variante="texto" onPress={aoCancelar} desabilitado={salvando}>
        Cancelar
      </Botao>

      <View style={styles.aviso}>
        <Icone nome="cadeado" tamanho={16} cor={cores.muted} />
        <Texto tipo="legenda" style={styles.avisoTexto}>
          Não há como recuperar o PIN. Se você esquecer, a única saída é apagar os dados deste aparelho e, se tiver um backup, restaurá-lo depois.
        </Texto>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  rolagem: { alignItems: 'center', paddingTop: 8, paddingBottom: 48 },
  titulo: { textAlign: 'center' },
  apoio: { textAlign: 'center', marginTop: 6 },
  mensagem: { minHeight: 36, marginTop: 8, justifyContent: 'center' },
  botao: { alignSelf: 'stretch', marginTop: 4 },
  aviso: { flexDirection: 'row', gap: 10, marginTop: 20, alignItems: 'flex-start' },
  avisoTexto: { flex: 1 },
});
