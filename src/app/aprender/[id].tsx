import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Icone } from '@/components/Icone';
import { TelaPasso } from '@/components/TelaPasso';
import { Texto } from '@/components/Texto';
import { artigoPorId, AVISO_PROFISSIONAL, type Bloco } from '@/conteudo/biblioteca';
import { abrirLink } from '@/lib/abrir';
import { useVoltar } from '@/lib/useVoltar';
import { comAlfa, cores, fontes } from '@/theme';

/** Um artigo da biblioteca: leitura confortável e, no fim, as fontes. */
export default function Artigo() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const voltar = useVoltar();
  const artigo = artigoPorId(Array.isArray(id) ? id[0] : id);

  if (!artigo) {
    return (
      <TelaPasso aoVoltar={voltar} rodape={<Botao onPress={voltar}>Voltar</Botao>}>
        <Texto style={styles.titulo}>Esse texto não foi encontrado.</Texto>
      </TelaPasso>
    );
  }

  return (
    <TelaPasso aoVoltar={voltar} rodape={null}>
      <Texto tipo="rotulo">{artigo.grupo}</Texto>
      <Texto style={styles.titulo} accessibilityRole="header">
        {artigo.titulo}
      </Texto>
      <Texto tipo="legenda" style={styles.minutos}>{`${artigo.minutos} min de leitura`}</Texto>

      {artigo.blocos.map((b, i) => (
        <BlocoTexto key={i} bloco={b} />
      ))}

      <View style={styles.fontes}>
        <Texto style={styles.fontesTitulo} accessibilityRole="header">
          Fontes
        </Texto>
        {artigo.fontes.map((f) => (
          <Pressable
            key={f.url}
            accessibilityRole="link"
            accessibilityLabel={`${f.titulo}. Abre no navegador.`}
            onPress={() => abrirLink(f.url)}
            style={styles.fonte}
          >
            <Texto style={styles.fonteTexto}>{f.titulo}</Texto>
            <Icone nome="setaDireita" tamanho={16} cor={cores.faint} />
          </Pressable>
        ))}
      </View>
      <Texto tipo="legenda" style={styles.aviso}>
        {AVISO_PROFISSIONAL}
      </Texto>
    </TelaPasso>
  );
}

function BlocoTexto({ bloco }: { bloco: Bloco }) {
  switch (bloco.tipo) {
    case 'paragrafo':
      return <Texto style={styles.paragrafo}>{bloco.texto}</Texto>;
    case 'subtitulo':
      return (
        <Texto style={styles.subtitulo} accessibilityRole="header">
          {bloco.texto}
        </Texto>
      );
    case 'lista':
      return (
        <View style={styles.lista}>
          {bloco.itens.map((item) => (
            <View key={item} style={styles.itemLista}>
              <View style={styles.marcador} />
              <Texto style={styles.itemTexto}>{item}</Texto>
            </View>
          ))}
        </View>
      );
    case 'aviso':
      return (
        <View style={styles.destaque} accessibilityRole="alert">
          <Texto style={styles.destaqueTexto}>{bloco.texto}</Texto>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  titulo: { marginTop: 8, fontFamily: fontes.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.56 },
  minutos: { marginTop: 8, marginBottom: 6 },
  paragrafo: { marginTop: 14, fontSize: 15.5, lineHeight: 25, color: cores.text },
  subtitulo: { marginTop: 24, fontFamily: fontes.display, fontSize: 19, lineHeight: 25, letterSpacing: -0.2 },
  lista: { marginTop: 12, gap: 10 },
  itemLista: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  marcador: { width: 6, height: 6, borderRadius: 3, marginTop: 10, backgroundColor: cores.aqua },
  itemTexto: { flex: 1, fontSize: 15.5, lineHeight: 25 },
  destaque: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: comAlfa(cores.coral, 0.07),
    borderWidth: 1,
    borderColor: comAlfa(cores.coral, 0.25),
  },
  destaqueTexto: { fontSize: 15, lineHeight: 23, color: cores.text },
  fontes: { marginTop: 32, borderTopWidth: 1, borderTopColor: cores.line, paddingTop: 16 },
  fontesTitulo: { fontFamily: fontes.uiForte, fontSize: 11.5, letterSpacing: 1.6, textTransform: 'uppercase', color: cores.faint },
  fonte: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingVertical: 8 },
  fonteTexto: { flex: 1, fontSize: 13, lineHeight: 19, color: cores.muted },
  aviso: { marginTop: 16 },
});
