import { randomUUID } from 'expo-crypto';
import { useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { FluxoAvaliacao } from '@/components/avaliacao/FluxoAvaliacao';
import { ResultadoView } from '@/components/avaliacao/ResultadoView';
import { Botao } from '@/components/Botao';
import { Fundo } from '@/components/Fundo';
import { TelaPasso } from '@/components/TelaPasso';
import { Texto } from '@/components/Texto';
import { Vazio } from '@/components/Vazio';
import { calcularResultados, montarAvaliacao, ultimaAvaliacao, type Respostas } from '@/lib/avaliacao';
import { formatarData } from '@/lib/datas';
import type { Avaliacao as AvaliacaoSalva } from '@/lib/tipos';
import { useVoltar } from '@/lib/useVoltar';
import { useMare } from '@/store';
import { cores, fontes } from '@/theme';

type Etapa = 'resumo' | 'fluxo' | 'resultado';

/**
 * "Como você está" depois do primeiro uso (Mais → Como você está): mostra a última avaliação,
 * deixa refazer e, no fim, mostra a evolução em relação à anterior.
 */
export default function ComoVoceEsta() {
  const voltar = useVoltar();
  const habitos = useMare((e) => e.habitos);
  const avaliacoes = useMare((e) => e.avaliacoes);
  const salvarAvaliacao = useMare((e) => e.salvarAvaliacao);
  const [etapa, setEtapa] = useState<Etapa>('resumo');
  const [respostas, setRespostas] = useState<Respostas>({});
  // A avaliação de antes do que acabou de ser feito, para comparar.
  const [anterior, setAnterior] = useState<AvaliacaoSalva | undefined>();
  const [nova, setNova] = useState<AvaliacaoSalva | undefined>();
  // Toques repetidos em "Concluir" (ou no último "Seguir") não salvam duas vezes nem fecham duas telas.
  const concluindo = useRef(false);
  const saindo = useRef(false);
  const sair = () => {
    if (saindo.current) return;
    saindo.current = true;
    voltar();
  };

  const ultima = ultimaAvaliacao(avaliacoes);

  if (habitos.length === 0) {
    return (
      <TelaPasso aoVoltar={voltar} rodape={null}>
        <Vazio />
      </TelaPasso>
    );
  }

  if (etapa === 'fluxo') {
    return (
      <Fundo>
        <FluxoAvaliacao
          habitos={habitos}
          respostas={respostas}
          aoResponder={(chave, indice) => setRespostas((r) => ({ ...r, [chave]: indice }))}
          aoSair={() => setEtapa('resumo')}
          aoConcluir={() => {
            if (concluindo.current) return;
            concluindo.current = true;
            const resultados = calcularResultados(habitos, respostas);
            const feita = montarAvaliacao(randomUUID(), Date.now(), resultados);
            setAnterior(ultima);
            setNova(feita);
            salvarAvaliacao(feita);
            setEtapa('resultado');
          }}
        />
      </Fundo>
    );
  }

  if (etapa === 'resultado' && nova) {
    return (
      <TelaPasso aoVoltar={voltar} rodape={<Botao onPress={sair}>Concluir</Botao>}>
        <Texto tipo="rotulo" accessibilityRole="header">
          Como você está agora
        </Texto>
        <Texto style={styles.titulo}>{'Obrigado por\nolhar para isso.'}</Texto>
        <Texto style={styles.sub}>
          {anterior
            ? 'Aqui está o seu retrato de hoje, ao lado do anterior. Não é um diagnóstico, e muda com você.'
            : 'Esse é o seu retrato de hoje. Não é um diagnóstico, e muda com você.'}
        </Texto>
        <ResultadoView habitos={habitos} resultados={nova.resultados} anterior={anterior} />
      </TelaPasso>
    );
  }

  return (
    <TelaPasso
      aoVoltar={voltar}
      rodape={
        <Botao
          onPress={() => {
            concluindo.current = false;
            setRespostas({});
            setEtapa('fluxo');
          }}
        >
          {ultima ? 'Refazer a avaliação' : 'Fazer a avaliação'}
        </Botao>
      }
    >
      <Texto style={styles.titulo} accessibilityRole="header">
        Como você está
      </Texto>
      {ultima ? (
        <>
          <Texto style={styles.sub}>
            {`Sua última avaliação foi em ${formatarData(ultima.feitaEm, { day: 'numeric', month: 'long', year: 'numeric' })}. Refazer de vez em quando mostra como você está mudando.`}
          </Texto>
          <ResultadoView habitos={habitos} resultados={ultima.resultados} />
        </>
      ) : (
        <Texto style={styles.sub}>
          Algumas perguntas rápidas, uma por tela, para você ver o seu ponto de partida. Não existe resposta
          certa e não é um diagnóstico.
        </Texto>
      )}
      <Texto tipo="legenda" style={styles.nota}>
        Isso não substitui uma conversa com um profissional de saúde.
      </Texto>
    </TelaPasso>
  );
}

const styles = StyleSheet.create({
  titulo: { marginTop: 10, fontFamily: fontes.display, fontSize: 28, lineHeight: 33, letterSpacing: -0.56 },
  sub: { marginTop: 10, marginBottom: 12, fontSize: 14, lineHeight: 21, color: cores.muted },
  nota: { marginTop: 14 },
});
