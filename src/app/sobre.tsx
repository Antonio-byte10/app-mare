import Constants from 'expo-constants';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Fundo } from '@/components/Fundo';
import { Icone } from '@/components/Icone';
import { Simbolo } from '@/components/Simbolo';
import { DivisorAjuste, GrupoAjuste, LinhaAjuste } from '@/components/LinhaAjuste';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { TopoTela } from '@/components/TopoTela';
import { abrirLink } from '@/lib/abrir';
import { MENSAGEM_ERRO_ATUALIZACAO, procurarAtualizacao, type ResultadoAtualizacao } from '@/lib/atualizacao';
import { comAlfa, cores } from '@/theme';

const REPOSITORIO = 'https://github.com/Antonio-byte10/app-mare';
const POLITICA_PRIVACIDADE = `${REPOSITORIO}/blob/main/PRIVACY.md`;

const PRIVACIDADE = [
  'Seus registros ficam só neste celular, em um banco cifrado. Não há conta, anúncios nem análise de uso.',
  'Backups só existem quando você pede, fechados com a sua senha. O backup automático do Android fica desligado.',
  'A conversa com IA é opcional: só ela envia o que você escreve, junto de um resumo mínimo (tipo de hábito, meta, dias seguidos e gatilhos), ao provedor que você escolheu, com a sua chave.',
  'Os lembretes são locais, agendados no próprio celular.',
];

/** Sobre o Maré: versão, procurar atualização (só ao tocar), privacidade e aviso sobre os textos de saúde. */
export default function Sobre() {
  const versao = Constants.expoConfig?.version ?? '0.0.0';
  const [procurando, setProcurando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAtualizacao | null>(null);

  const procurar = async () => {
    if (procurando) return;
    setProcurando(true);
    setResultado(null);
    try {
      setResultado(await procurarAtualizacao(versao, (url, init) => globalThis.fetch(url, init)));
    } catch {
      setResultado({ tipo: 'erro', motivo: 'rede' });
    } finally {
      setProcurando(false);
    }
  };

  return (
    <Fundo>
      <Tela>
        <TopoTela titulo="Sobre o Maré" />
        <ScrollView style={styles.flex} contentContainerStyle={styles.rolagem} showsVerticalScrollIndicator={false}>
          <View style={styles.identidade}>
            <Simbolo tamanho={56} />
            <View style={styles.flex}>
              <Texto tipo="rotulo">Versão {versao}</Texto>
              <Texto tipo="legenda">Feito como projeto aberto e gratuito.</Texto>
            </View>
          </View>

          <View style={styles.aviso} accessible accessibilityLabel="Aviso sobre os textos de saúde">
            <Icone nome="folha" tamanho={18} cor={cores.sand} />
            <Texto tipo="legenda" cor={cores.text} style={styles.flex}>
              Os textos de saúde do Maré ainda não foram revisados por um profissional. Eles informam, mas não substituem atendimento.
            </Texto>
          </View>

          <LinhaAjuste
            titulo="Código aberto"
            subtitulo="Licença MIT · github.com/Antonio-byte10/app-mare"
            direita={<Icone nome="setaDireita" tamanho={18} cor={cores.faint} />}
            onPress={() => abrirLink(REPOSITORIO)}
            accessibilityLabel="Código aberto, abre o repositório no navegador"
          />

          <GrupoAjuste>Atualização</GrupoAjuste>
          <View style={styles.bloco}>
            <Texto tipo="legenda">
              Esta consulta contacta o GitHub, que vê o IP do celular, e só acontece quando você toca no botão.
            </Texto>
            <Botao variante="secundario" onPress={procurar} desabilitado={procurando} style={styles.botao}>
              {procurando ? 'Procurando…' : 'Procurar atualização'}
            </Botao>
            <View accessibilityLiveRegion="polite" style={styles.bloco}>
              {resultado?.tipo === 'atual' ? (
                <View style={styles.mensagem}>
                  <Icone nome="check" tamanho={16} cor={cores.foam} />
                  <Texto tipo="legenda" cor={cores.foam} style={styles.flex}>
                    Você está na versão mais recente.
                  </Texto>
                </View>
              ) : null}
              {resultado?.tipo === 'nova' ? (
                <>
                  <Texto tipo="legenda" cor={cores.text}>
                    Versão {resultado.versao} disponível.
                  </Texto>
                  <Botao onPress={() => abrirLink(resultado.url)} style={styles.botao}>
                    Ver no navegador
                  </Botao>
                  <Texto tipo="legenda">O Maré não baixa nem instala nada sozinho: a página da versão abre no navegador.</Texto>
                </>
              ) : null}
              {resultado?.tipo === 'erro' ? (
                <Texto tipo="legenda" cor={cores.sand}>
                  {MENSAGEM_ERRO_ATUALIZACAO[resultado.motivo]}
                </Texto>
              ) : null}
            </View>
          </View>

          <GrupoAjuste>Privacidade</GrupoAjuste>
          <View style={styles.bloco}>
            {PRIVACIDADE.map((linha) => (
              <View key={linha} style={styles.item}>
                <Texto tipo="legenda" cor={cores.faint}>
                  •
                </Texto>
                <Texto tipo="legenda" cor={cores.text} style={styles.flex}>
                  {linha}
                </Texto>
              </View>
            ))}
          </View>
          <DivisorAjuste />
          <LinhaAjuste
            titulo="Política de privacidade completa"
            subtitulo="abre no navegador"
            direita={<Icone nome="setaDireita" tamanho={18} cor={cores.faint} />}
            onPress={() => abrirLink(POLITICA_PRIVACIDADE)}
            accessibilityLabel="Política de privacidade completa, abre no navegador"
          />
        </ScrollView>
      </Tela>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rolagem: { paddingTop: 18, paddingBottom: 48, gap: 6 },
  identidade: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8, marginBottom: 12 },
  bloco: { gap: 10, marginTop: 6 },
  botao: { minHeight: 48 },
  mensagem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  item: { flexDirection: 'row', gap: 8 },
  aviso: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: comAlfa(cores.sand, 0.07),
    borderWidth: 1,
    borderColor: comAlfa(cores.sand, 0.28),
  },
});
