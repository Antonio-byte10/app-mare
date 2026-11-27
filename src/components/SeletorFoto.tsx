import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { FotoPorque } from '@/components/FotoPorque';
import { Texto } from '@/components/Texto';
import { escolherFoto, fotosDisponiveis, mensagemDoErroFoto } from '@/lib/fotos';
import { cores } from '@/theme';

type Props = {
  /** Nome do arquivo cifrado da foto escolhida (ou nada). */
  foto?: string;
  /** Chamado com o nome da foto nova, ou `undefined` quando a pessoa a tira. Quem chama apaga o arquivo que sobrou. */
  aoMudar: (foto: string | undefined) => void;
};

/**
 * "Adicionar foto" de um porquê: abre o seletor de fotos do sistema, mostra uma miniatura e deixa
 * trocar ou tirar. A explicação fica sempre à vista: a foto é cifrada e fica só no celular, e é
 * melhor escolher uma que não lembre o hábito. Não aparece no navegador (onde não há como guardar).
 */
export function SeletorFoto({ foto, aoMudar }: Props) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | undefined>();

  if (!fotosDisponiveis) return null;

  const escolher = async () => {
    if (ocupado) return;
    setOcupado(true);
    setErro(undefined);
    try {
      const nova = await escolherFoto();
      if (nova) aoMudar(nova);
    } catch (e) {
      setErro(mensagemDoErroFoto(e));
    } finally {
      setOcupado(false);
    }
  };

  return (
    <View style={styles.raiz}>
      <Texto tipo="legenda">Uma foto de quem ou do que te faz querer mudar. Ela fica cifrada só no celular.</Texto>
      <Texto tipo="legenda">Evite fotos que lembrem o hábito.</Texto>
      {foto ? (
        <View style={styles.linha}>
          <FotoPorque key={foto} nome={foto} altura={96} largura={96} raio={14} avisarFalha accessibilityLabel="Foto escolhida para o porquê" />
          <View style={styles.acoes}>
            <Botao variante="secundario" onPress={escolher} desabilitado={ocupado} style={styles.botao}>
              {ocupado ? 'Preparando…' : 'Trocar foto'}
            </Botao>
            <Botao variante="texto" onPress={() => aoMudar(undefined)} desabilitado={ocupado}>
              Remover a foto
            </Botao>
          </View>
        </View>
      ) : (
        <Botao variante="secundario" onPress={escolher} desabilitado={ocupado} style={styles.botao}>
          {ocupado ? 'Preparando a foto…' : 'Adicionar foto'}
        </Botao>
      )}
      {erro ? (
        <Texto tipo="legenda" cor={cores.sand} accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { marginTop: 4, marginBottom: 6, gap: 6 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 6 },
  acoes: { flex: 1, gap: 2 },
  botao: { marginTop: 6 },
});
