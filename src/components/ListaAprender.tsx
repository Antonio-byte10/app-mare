import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { ARTIGOS, GRUPOS } from '@/conteudo/biblioteca';
import { DivisorAjuste, GrupoAjuste, LinhaAjuste } from './LinhaAjuste';
import { Texto } from './Texto';

/** Lista da biblioteca, em grupos e linhas finas. Serve à aba Aprender e à tela Aprender aberta por Mais. */
export function ListaAprender() {
  const router = useRouter();
  return (
    <View>
      <Texto tipo="legenda" style={{ marginTop: 6 }}>
        Textos curtos e sem julgamento, com a fonte de cada informação. Não substituem um profissional de saúde.
      </Texto>
      {GRUPOS.map((grupo) => (
        <View key={grupo}>
          <GrupoAjuste>{grupo}</GrupoAjuste>
          {ARTIGOS.filter((a) => a.grupo === grupo).map((a, i) => (
            <View key={a.id}>
              {i > 0 ? <DivisorAjuste /> : null}
              <LinhaAjuste
                titulo={a.titulo}
                subtitulo={`${a.resumo} · ${a.minutos} min`}
                onPress={() => router.push(`/aprender/${a.id}`)}
                accessibilityLabel={`${a.titulo}. ${a.resumo}. Leitura de ${a.minutos} minutos.`}
              />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}
