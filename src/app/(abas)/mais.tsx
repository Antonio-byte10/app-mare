import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Icone } from '@/components/Icone';
import { Interruptor } from '@/components/Interruptor';
import { DivisorAjuste, GrupoAjuste, LinhaAjuste } from '@/components/LinhaAjuste';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { useMare } from '@/store';
import { cores } from '@/theme';

const REPOSITORIO = 'https://github.com/Antonio-byte10/app-mare';

export default function Mais() {
  const habitos = useMare((e) => e.habitos);
  const ocultarNumeros = useMare((e) => e.ajustes.ocultarNumeros);
  const setAjustes = useMare((e) => e.setAjustes);
  const router = useRouter();
  const versao = Constants.expoConfig?.version ?? '0.1.0';

  return (
    <Tela rolavel style={styles.rodape}>
      <Texto tipo="titulo" style={styles.titulo} accessibilityRole="header">
        Mais
      </Texto>

      <GrupoAjuste>Hábitos</GrupoAjuste>
      <View>
        {habitos.map((h) => (
          <View key={h.id}>
            <LinhaAjuste
              titulo={h.apelido}
              subtitulo={h.meta.tipo === 'parar' ? 'parar' : `reduzir · até ${h.meta.maxPorDia} ${h.meta.unidade} por dia`}
              icone={<View style={[styles.ponto, { backgroundColor: cores[h.cor] }]} />}
              onPress={() => router.push(`/habito/${h.id}`)}
              accessibilityLabel={`Editar hábito ${h.apelido}`}
            />
            <DivisorAjuste />
          </View>
        ))}
        <LinhaAjuste titulo="Adicionar hábito" icone="adicionar" onPress={() => router.push('/habito/novo')} />
      </View>

      <GrupoAjuste>Jornada</GrupoAjuste>
      <LinhaAjuste
        titulo="Marcos"
        subtitulo="o que o seu corpo e a sua rotina ganham com o tempo"
        icone="estrela"
        onPress={() => router.push('/marcos')}
      />

      <GrupoAjuste>Privacidade</GrupoAjuste>
      <LinhaAjuste
        titulo="Ocultar números"
        subtitulo="esconde dias, recorde e economia no Início"
        icone="olhoOculto"
        direita={
          <Interruptor
            ligado={ocultarNumeros}
            aoMudar={(v) => setAjustes({ ocultarNumeros: v })}
            accessibilityLabel="Ocultar números"
          />
        }
      />

      <GrupoAjuste>Sobre</GrupoAjuste>
      <LinhaAjuste titulo="Versão" subtitulo={versao} />
      <DivisorAjuste />
      <LinhaAjuste titulo="Licença MIT" subtitulo="software livre, use e adapte" />
      <DivisorAjuste />
      <LinhaAjuste
        titulo="Código aberto"
        subtitulo="github.com/Antonio-byte10/app-mare"
        direita={<Icone nome="setaDireita" tamanho={18} cor={cores.faint} />}
        onPress={() => {
          void Linking.openURL(REPOSITORIO);
        }}
        accessibilityLabel="Código aberto, abre o repositório no navegador"
      />
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 24, lineHeight: 29 },
  // Folga para a barra de abas flutuante.
  rodape: { paddingBottom: 120 },
  ponto: { width: 10, height: 10, borderRadius: 5 },
});
