import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Icone } from '@/components/Icone';
import { Interruptor } from '@/components/Interruptor';
import { DivisorAjuste, GrupoAjuste, LinhaAjuste } from '@/components/LinhaAjuste';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { NOME_PROVEDOR } from '@/lib/ia/modelos';
import { textoUltimoBackup } from '@/lib/lembreteBackup';
import { useAgora } from '@/lib/useAgora';
import { useMare } from '@/store';
import { cores } from '@/theme';

const REPOSITORIO = 'https://github.com/Antonio-byte10/app-mare';

export default function Mais() {
  const habitos = useMare((e) => e.habitos);
  const ocultarNumeros = useMare((e) => e.ajustes.ocultarNumeros);
  const emergencia = useMare((e) => e.ajustes.contatosEmergencia);
  const ia = useMare((e) => e.ajustes.ia);
  const ultimoBackupEm = useMare((e) => e.ajustes.ultimoBackupEm);
  const setAjustes = useMare((e) => e.setAjustes);
  const router = useRouter();
  const agora = useAgora();
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
      <DivisorAjuste />
      <LinhaAjuste
        titulo="Meu plano"
        subtitulo="seus porquês e o que fazer nos momentos difíceis"
        icone="notas"
        onPress={() => router.push('/plano')}
      />
      <DivisorAjuste />
      <LinhaAjuste
        titulo="Como você está"
        subtitulo="refaça a avaliação e veja como você mudou"
        icone="folha"
        onPress={() => router.push('/avaliacao')}
      />

      <GrupoAjuste>Cuidado</GrupoAjuste>
      <LinhaAjuste
        titulo="Aprender"
        subtitulo="textos curtos, com fontes, sobre o que você vive"
        icone="livro"
        onPress={() => router.push('/biblioteca')}
      />
      <DivisorAjuste />
      <LinhaAjuste
        titulo="Apoio"
        subtitulo="CVV, SAMU, SUS, grupos e contatos de confiança"
        icone="telefone"
        onPress={() => router.push('/apoio')}
      />

      <GrupoAjuste>Inteligência artificial</GrupoAjuste>
      <LinhaAjuste
        titulo="Inteligência artificial"
        subtitulo={
          ia
            ? `${NOME_PROVEDOR[ia.provedor]} · ${ia.modo === 'direto' ? 'sua chave' : 'seu servidor'}`
            : 'desligada — o app funciona inteiro sem ela'
        }
        icone="ajustes"
        onPress={() => router.push('/ia')}
      />

      <GrupoAjuste>Lembretes</GrupoAjuste>
      <LinhaAjuste
        titulo="Lembretes"
        subtitulo="relato do dia, bom dia, antes da onda e marcos, com texto discreto"
        icone="sino"
        onPress={() => router.push('/lembretes')}
      />

      <GrupoAjuste>Privacidade</GrupoAjuste>
      <LinhaAjuste
        titulo="Bloqueio e disfarce"
        subtitulo="digital ou PIN, nome e ícone neutros, telas protegidas"
        icone="cadeado"
        onPress={() => router.push('/privacidade')}
      />
      <DivisorAjuste />
      <LinhaAjuste
        titulo="Backup e dados"
        subtitulo={`${textoUltimoBackup(ultimoBackupEm, agora)}. Restaurar ou apagar tudo.`}
        icone="notas"
        onPress={() => router.push('/dados')}
      />
      <DivisorAjuste />
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
      <DivisorAjuste />
      <LinhaAjuste
        titulo="Contatos de emergência"
        subtitulo="mostra CVV 188 e SAMU 192 na Fissura e quando o app notar sinais de risco"
        icone="telefone"
        direita={
          <Interruptor
            ligado={emergencia}
            aoMudar={(v) => setAjustes({ contatosEmergencia: v })}
            accessibilityLabel="Contatos de emergência"
          />
        }
      />

      <GrupoAjuste>Sobre</GrupoAjuste>
      <LinhaAjuste
        titulo="Sobre o Maré"
        subtitulo="versão, procurar atualização e privacidade"
        icone="folha"
        onPress={() => router.push('/sobre')}
      />
      <DivisorAjuste />
      <LinhaAjuste titulo="Versão" subtitulo={versao} />
      <DivisorAjuste />
      <LinhaAjuste titulo="Licença MIT" subtitulo="software livre, use e adapte" />
      <DivisorAjuste />
      <LinhaAjuste
        titulo="Código aberto"
        subtitulo="github.com/Antonio-byte10/app-mare"
        direita={<Icone nome="setaDireita" tamanho={18} cor={cores.faint} />}
        onPress={() => {
          // Sem navegador instalado o link não abre; não há o que fazer além de não quebrar.
          Linking.openURL(REPOSITORIO).catch(() => undefined);
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
