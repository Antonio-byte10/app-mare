import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BarrasSemana } from '@/components/BarrasSemana';
import { Calendario } from '@/components/Calendario';
import { CartaoGatilhos } from '@/components/CartaoGatilhos';
import { SeletorHabito } from '@/components/SeletorHabito';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { Vazio } from '@/components/Vazio';
import { limitarMes, mesDe, totalRelatosNaJanela, type Mes } from '@/lib/calendario';
import { resumoHabito } from '@/lib/contador';
import { dataLocal } from '@/lib/datas';
import { contarGatilhos } from '@/lib/gatilhos';
import { diaDePico, vontadePorDiaDaSemana } from '@/lib/insights';
import { seDoGatilho } from '@/lib/reflexao';
import { useAgora } from '@/lib/useAgora';
import { useHabitoAtivo } from '@/lib/useHabitoAtivo';
import { useMare } from '@/store';
import { cores, linha } from '@/theme';

const SEMANAS = 8;
/** Janela do cartão "O que mais puxa a onda". */
const DIAS_GATILHOS = 30;

export default function Diario() {
  const { habitos, ativo, escolher } = useHabitoAtivo();
  const relatos = useMare((e) => e.relatos);
  const fissuras = useMare((e) => e.fissuras);
  const router = useRouter();
  const agora = useAgora();
  // Mês que a pessoa escolheu com as setas; sem escolha, o mês de hoje.
  const [escolhido, setEscolhido] = useState<Mes | null>(null);

  const hoje = dataLocal(agora);
  const resumo = useMemo(() => (ativo ? resumoHabito(ativo, relatos, hoje) : null), [ativo, relatos, hoje]);
  const medias = useMemo(
    () => (ativo ? vontadePorDiaDaSemana(relatos, ativo.id, hoje, SEMANAS) : []),
    [ativo, relatos, hoje],
  );
  const pico = useMemo(
    () => (ativo ? diaDePico(medias, totalRelatosNaJanela(relatos, ativo.id, hoje, SEMANAS)) : null),
    [ativo, medias, relatos, hoje],
  );
  const gatilhos = useMemo(
    () => (ativo ? contarGatilhos({ fissuras, relatos, hoje, dias: DIAS_GATILHOS, habitoId: ativo.id }) : []),
    [ativo, fissuras, relatos, hoje],
  );

  if (!ativo || !resumo) {
    return (
      <Tela>
        <Vazio />
      </Tela>
    );
  }

  // Sempre dentro do intervalo: trocar de hábito ou virar o dia não deixa o mês fora dele.
  const mes = limitarMes(escolhido ?? mesDe(hoje), { inicio: ativo.inicio, hoje });

  return (
    <Tela rolavel>
      <Texto tipo="titulo" style={styles.titulo} accessibilityRole="header">
        Diário
      </Texto>

      <SeletorHabito habitos={habitos} ativoId={ativo.id} onEscolher={escolher} style={styles.chips} />

      <View style={styles.calendario}>
        <Calendario
          mes={mes}
          estados={resumo.estados}
          hoje={hoje}
          inicio={ativo.inicio}
          onMes={setEscolhido}
          onDia={(dia) => router.push(`/relato/${dia}`)}
        />
      </View>

      <View style={styles.divisor} />

      <View style={styles.barras}>
        <BarrasSemana medias={medias} pico={pico} />
      </View>

      {gatilhos.length > 0 ? (
        <>
          <View style={styles.divisor} />
          <View style={styles.barras}>
            <CartaoGatilhos
              itens={gatilhos}
              dias={DIAS_GATILHOS}
              aoTocarItem={(g) => router.push({ pathname: '/plano', params: { se: seDoGatilho(g), entao: '' } })}
            />
          </View>
        </>
      ) : null}
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 26, lineHeight: 31 },
  chips: { marginTop: 14 },
  calendario: { marginTop: 18 },
  divisor: { height: linha, backgroundColor: cores.line, marginTop: 18 },
  barras: { marginTop: 16 },
});
