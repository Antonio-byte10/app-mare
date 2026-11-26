import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AvisoDados } from '@/components/AvisoDados';
import { BarrasSemana } from '@/components/BarrasSemana';
import { Calendario } from '@/components/Calendario';
import { Chip } from '@/components/Chip';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { Vazio } from '@/components/Vazio';
import { limitarMes, mesDe, totalRelatosNaJanela, type Mes } from '@/lib/calendario';
import { resumoHabito } from '@/lib/contador';
import { dataLocal } from '@/lib/datas';
import { habitoAtivoDe } from '@/lib/inicio';
import { diaDePico, vontadePorDiaDaSemana } from '@/lib/insights';
import { useAgora } from '@/lib/useAgora';
import { useMare } from '@/store';
import { cores, linha } from '@/theme';

const SEMANAS = 8;

export default function Diario() {
  const habitos = useMare((e) => e.habitos);
  const relatos = useMare((e) => e.relatos);
  const ajustes = useMare((e) => e.ajustes);
  const setAjustes = useMare((e) => e.setAjustes);
  const erroArmazenamento = useMare((e) => e.erroArmazenamento);
  const router = useRouter();
  const agora = useAgora();
  // Mês que a pessoa escolheu com as setas; sem escolha, o mês de hoje.
  const [escolhido, setEscolhido] = useState<Mes | null>(null);

  if (erroArmazenamento) {
    return (
      <Tela>
        <AvisoDados />
      </Tela>
    );
  }

  const ativo = habitoAtivoDe(habitos, ajustes.habitoAtivo);
  if (!ativo) {
    return (
      <Tela>
        <Vazio />
      </Tela>
    );
  }

  const hoje = dataLocal(agora);
  const resumo = resumoHabito(ativo, relatos, hoje);
  // Sempre dentro do intervalo: trocar de hábito ou virar o dia não deixa o mês fora dele.
  const mes = limitarMes(escolhido ?? mesDe(hoje), { inicio: ativo.inicio, hoje });
  const medias = vontadePorDiaDaSemana(relatos, ativo.id, hoje, SEMANAS);
  const pico = diaDePico(medias, totalRelatosNaJanela(relatos, ativo.id, hoje, SEMANAS));

  return (
    <Tela rolavel>
      <Texto tipo="titulo" style={styles.titulo} accessibilityRole="header">
        Diário
      </Texto>

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
        <Chip onPress={() => router.push('/habito/novo')} accessibilityLabel="Adicionar hábito">
          + Novo
        </Chip>
      </View>

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
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 26, lineHeight: 31 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 },
  calendario: { marginTop: 18 },
  divisor: { height: linha, backgroundColor: cores.line, marginTop: 18 },
  barras: { marginTop: 16 },
});
