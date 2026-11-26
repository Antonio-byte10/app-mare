import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { Fundo } from '@/components/Fundo';
import { Icone } from '@/components/Icone';
import { LinhaDoTempo } from '@/components/LinhaDoTempo';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { Trio } from '@/components/Trio';
import { Vazio } from '@/components/Vazio';
import { textoMarco } from '@/conteudo/marcos';
import { resumoHabito } from '@/lib/contador';
import { dataLocal } from '@/lib/datas';
import { habitoAtivoDe } from '@/lib/inicio';
import { estadoMarco, MARCOS } from '@/lib/marcos';
import { colunasMarcos, progressoMarco, tituloMarco } from '@/lib/marcosTela';
import { useAgora } from '@/lib/useAgora';
import { useMare } from '@/store';
import { cores } from '@/theme';

export default function Marcos() {
  const habitos = useMare((e) => e.habitos);
  const relatos = useMare((e) => e.relatos);
  const ajustes = useMare((e) => e.ajustes);
  const setAjustes = useMare((e) => e.setAjustes);
  const router = useRouter();
  const agora = useAgora();
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const ativo = habitoAtivoDe(habitos, ajustes.habitoAtivo);
  const oculto = ajustes.ocultarNumeros;

  const botaoVoltar = (
    <Pressable onPress={() => voltar()} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={12} style={styles.voltar}>
      <Icone nome="voltar" />
    </Pressable>
  );

  if (!ativo) {
    return (
      <Fundo>
        <Tela>
          <View style={styles.topo}>{botaoVoltar}</View>
          <Vazio />
        </Tela>
      </Fundo>
    );
  }

  const resumo = resumoHabito(ativo, relatos, dataLocal(agora));
  const itens = MARCOS.map((dias) => {
    const estado = estadoMarco(dias, resumo.sequenciaAtual, resumo.recorde);
    return {
      id: String(dias),
      titulo: tituloMarco(dias, estado, resumo.sequenciaAtual, oculto),
      descricao: textoMarco(ativo.tipo, dias),
      estado,
      progresso: estado === 'atual' && !oculto ? progressoMarco(dias, resumo.sequenciaAtual) : undefined,
    };
  });

  return (
    <Fundo>
      <Tela rolavel>
        <View style={styles.topo}>
          {botaoVoltar}
          <Texto tipo="titulo" style={styles.titulo} accessibilityRole="header">
            Marcos · {ativo.apelido}
          </Texto>
        </View>

        {habitos.length > 1 ? (
          <View style={styles.chips}>
            {habitos.map((h) => (
              <Chip
                key={h.id}
                ponto
                cor={cores[h.cor]}
                ativo={h.id === ativo.id}
                onPress={() => setAjustes({ habitoAtivo: h.id })}
              >
                {h.apelido}
              </Chip>
            ))}
          </View>
        ) : null}

        {oculto ? null : (
          <Trio
            style={styles.trio}
            itens={colunasMarcos(ativo, resumo.totalLivres).map((c) => ({
              valor: c.valor,
              rotulo: c.rotulo,
              cor: c.cor ? cores[c.cor] : undefined,
            }))}
          />
        )}
        <View style={styles.divisor} />

        <LinhaDoTempo itens={itens} />
      </Tela>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  voltar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,.035)',
    borderWidth: 1,
    borderColor: cores.line,
  },
  titulo: { fontSize: 22, lineHeight: 27, flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  trio: { marginTop: 8 },
  divisor: { height: 1, backgroundColor: cores.line, marginTop: 6, marginBottom: 20 },
});
