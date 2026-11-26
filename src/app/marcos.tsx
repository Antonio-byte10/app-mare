import { StyleSheet, View } from 'react-native';
import { BotaoIcone } from '@/components/BotaoIcone';
import { Fundo } from '@/components/Fundo';
import { LinhaDoTempo } from '@/components/LinhaDoTempo';
import { SeletorHabito } from '@/components/SeletorHabito';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { Trio } from '@/components/Trio';
import { Vazio } from '@/components/Vazio';
import { textoMarco } from '@/conteudo/marcos';
import { resumoHabito } from '@/lib/contador';
import { dataLocal } from '@/lib/datas';
import { contarFissurasVencidas } from '@/lib/fissura';
import { estadoMarco, MARCOS } from '@/lib/marcos';
import { colunasMarcos, progressoMarco, tituloMarco } from '@/lib/marcosTela';
import { useAgora } from '@/lib/useAgora';
import { useHabitoAtivo } from '@/lib/useHabitoAtivo';
import { useVoltar } from '@/lib/useVoltar';
import { useMare } from '@/store';
import { cores } from '@/theme';

export default function Marcos() {
  const { habitos, ativo, escolher } = useHabitoAtivo();
  const relatos = useMare((e) => e.relatos);
  const fissuras = useMare((e) => e.fissuras);
  const oculto = useMare((e) => e.ajustes.ocultarNumeros);
  const agora = useAgora();
  const voltar = useVoltar();

  const botaoVoltar = <BotaoIcone icone="voltar" onPress={voltar} accessibilityLabel="Voltar" />;

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

  const hoje = dataLocal(agora);
  const resumo = resumoHabito(ativo, relatos, hoje);
  const itens = MARCOS.map((dias) => {
    const estado = estadoMarco(dias, resumo.sequenciaAtual, resumo.recorde);
    return {
      id: String(dias),
      titulo: tituloMarco(dias, estado, resumo.sequenciaAtual, oculto),
      descricao: textoMarco(ativo.tipo, dias, ativo.meta),
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
          <SeletorHabito habitos={habitos} ativoId={ativo.id} onEscolher={escolher} comNovo={false} style={styles.chips} />
        ) : null}

        {oculto ? null : (
          <Trio
            style={styles.trio}
            itens={colunasMarcos(ativo, relatos, hoje, contarFissurasVencidas(fissuras, ativo.id)).map((c) => ({
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
  titulo: { fontSize: 22, lineHeight: 27, flex: 1 },
  chips: { marginTop: 14 },
  trio: { marginTop: 8 },
  divisor: { height: 1, backgroundColor: cores.line, marginTop: 6, marginBottom: 20 },
});
