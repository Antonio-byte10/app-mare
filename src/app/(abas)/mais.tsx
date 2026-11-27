import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Interruptor } from '@/components/Interruptor';
import { DivisorAjuste, GrupoAjuste, LinhaAjuste } from '@/components/LinhaAjuste';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { NOME_PROVEDOR } from '@/lib/ia/modelos';
import { textoUltimoBackup } from '@/lib/lembreteBackup';
import { useAgora } from '@/lib/useAgora';
import { useMare } from '@/store';
import { cores } from '@/theme';

export default function Mais() {
  const habitos = useMare((e) => e.habitos);
  const ocultarNumeros = useMare((e) => e.ajustes.ocultarNumeros);
  const emergencia = useMare((e) => e.ajustes.contatosEmergencia);
  const ia = useMare((e) => e.ajustes.ia);
  const ultimoBackupEm = useMare((e) => e.ajustes.ultimoBackupEm);
  const setAjustes = useMare((e) => e.setAjustes);
  const router = useRouter();
  const agora = useAgora();

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

      <GrupoAjuste>Meu caminho</GrupoAjuste>
      <LinhaAjuste
        titulo="Marcos"
        subtitulo="o que o seu corpo e a sua rotina ganham com o tempo"
        icone="estrela"
        onPress={() => router.push('/marcos')}
      />
      <DivisorAjuste />
      <LinhaAjuste
        titulo="Reflexão da semana"
        subtitulo="um olhar gentil sobre os últimos 7 dias"
        icone="diario"
        onPress={() => router.push('/reflexao')}
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

      <GrupoAjuste>Ajuda</GrupoAjuste>
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

      <GrupoAjuste>Ajustes</GrupoAjuste>
      <LinhaAjuste
        titulo="Inteligência artificial"
        subtitulo={
          ia
            ? `${NOME_PROVEDOR[ia.provedor]} · ${ia.modo === 'direto' ? 'sua chave' : 'seu servidor'}`
            : 'desligada · o app funciona inteiro sem ela'
        }
        icone="ajustes"
        onPress={() => router.push('/ia')}
      />
      <DivisorAjuste />
      <LinhaAjuste
        titulo="Lembretes"
        subtitulo="relato do dia, bom dia, reflexão da semana, antes da onda e marcos, com texto discreto"
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
        subtitulo="mostra CVV 188 e SAMU 192 na onda e quando o app notar sinais de risco"
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
        subtitulo="versão, código aberto, atualização e privacidade"
        icone="folha"
        onPress={() => router.push('/sobre')}
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
