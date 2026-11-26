import { Redirect, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { ResultadoView } from '@/components/avaliacao/ResultadoView';
import { Botao } from '@/components/Botao';
import { TelaPasso } from '@/components/TelaPasso';
import { Texto } from '@/components/Texto';
import { proximaDepoisDaAvaliacao } from '@/lib/primeiroUso';
import { useRascunhoPrimeiroUso } from '@/lib/rascunhoPrimeiroUso';
import { useVoltar } from '@/lib/useVoltar';
import { cores, fontes } from '@/theme';

/** Resultado (mockup 3): "Seu ponto de partida", um retrato de hoje, sem diagnóstico. */
export default function Resultado() {
  const router = useRouter();
  const voltar = useVoltar();
  const habitos = useRascunhoPrimeiroUso((e) => e.habitos);
  const resultados = useRascunhoPrimeiroUso((e) => e.resultados);

  if (habitos.length === 0) return <Redirect href="/boas-vindas" />;

  return (
    <TelaPasso
      aoVoltar={voltar}
      rodape={
        <Botao onPress={() => router.push(proximaDepoisDaAvaliacao(habitos))}>Começar minha jornada</Botao>
      }
    >
      <Texto tipo="rotulo" accessibilityRole="header">
        Seu ponto de partida
      </Texto>
      <Texto style={styles.titulo}>{'Obrigado pela\nhonestidade.'}</Texto>
      <Texto style={styles.sub}>
        Isso não é um diagnóstico. É um retrato de hoje, e ele vai mudar com você.
      </Texto>
      <ResultadoView habitos={habitos} resultados={resultados} />
    </TelaPasso>
  );
}

const styles = StyleSheet.create({
  titulo: { marginTop: 10, fontFamily: fontes.display, fontSize: 30, lineHeight: 35, letterSpacing: -0.6 },
  sub: { marginTop: 10, marginBottom: 12, fontSize: 14, lineHeight: 21, color: cores.muted },
});
