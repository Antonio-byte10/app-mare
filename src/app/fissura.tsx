import { randomUUID } from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BotaoIcone } from '@/components/BotaoIcone';
import { Fundo } from '@/components/Fundo';
import { PassoOnda } from '@/components/fissura/PassoOnda';
import { PassoPassou } from '@/components/fissura/PassoPassou';
import { PassoRespire } from '@/components/fissura/PassoRespire';
import { TracosPasso } from '@/components/fissura/TracosPasso';
import { Texto } from '@/components/Texto';
import { contarFissurasVencidas, deveRegistrarAoFechar, montarFissura, sortearPorque } from '@/lib/fissura';
import { vibrarSucesso } from '@/lib/haptica';
import { habitoAtivoDe } from '@/lib/inicio';
import { useBloqueio } from '@/lib/useBloqueio';
import { useVoltar } from '@/lib/useVoltar';
import { useMare } from '@/store';
import { cores, margemTela } from '@/theme';

type Passo = 1 | 2 | 3;

/**
 * "Fissura agora" (spec 6.3): três telas, uma ação por vez, com fechar sempre à mão.
 * Cada passagem é registrada: vencida se chegou ao passo 3; as outras só se a pessoa ficou um pouco.
 */
export default function Fissura() {
  const router = useRouter();
  const voltar = useVoltar();
  const { top } = useSafeAreaInsets();
  const fissuras = useMare((e) => e.fissuras);
  const habitoId = useMare((e) => habitoAtivoDe(e.habitos, e.ajustes.habitoAtivo)?.id);

  // Aberta pela tela de bloqueio ("Abrir a onda"): só a Fissura está liberada. Lido uma vez, ao abrir.
  const [daTrancada] = useState(() => {
    const e = useBloqueio.getState();
    return e.ondaPedida || e.ondaAtiva;
  });
  // Toda saída nesse modo tranca o app antes de navegar, para nenhuma tela privada aparecer por baixo.
  const sair = () => {
    if (daTrancada) useBloqueio.getState().travar();
    voltar();
  };
  useEffect(() => {
    if (!daTrancada) return undefined;
    // Voltar do Android: o painel "Ainda difícil" registra o dele depois e tem prioridade quando está aberto.
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      sair();
      return true;
    });
    return () => sub.remove();
    // `sair` só usa valores fixos desta abertura (`daTrancada`) e o `voltar` do roteador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daTrancada]);

  const [passo, setPasso] = useState<Passo>(1);
  const [inicio] = useState(() => Date.now());
  const [id] = useState(() => randomUUID());
  // O porquê é sorteado uma vez por passagem (lido na hora, sem reagir a mudanças).
  const [porque] = useState(() => sortearPorque(useMare.getState().porques));
  const [vontadeAntes, setVontadeAntes] = useState<number | undefined>();
  const [vontadeDepois, setVontadeDepois] = useState<number | undefined>();
  const [ajudou, setAjudou] = useState('');
  const [duracaoFinal, setDuracaoFinal] = useState(0);

  // O que vale na saída (fechar, voltar do Android, gesto): lido de uma ref para não depender do render.
  const atual = useRef({ passo, vontadeAntes, vontadeDepois, ajudou, duracaoFinal });

  const registrar = () => {
    const a = atual.current;
    const duracaoSeg = a.passo === 3 ? a.duracaoFinal : (Date.now() - inicio) / 1000;
    if (a.passo !== 3 && !deveRegistrarAoFechar(a.passo, duracaoSeg)) return;
    useMare.getState().salvarFissura(
      montarFissura({
        id,
        inicio,
        agora: inicio + duracaoSeg * 1000,
        venceu: a.passo === 3,
        habitoId,
        vontadeAntes: a.vontadeAntes,
        vontadeDepois: a.vontadeDepois,
        ajudou: a.ajudou,
      }),
    );
  };
  const registrarRef = useRef(registrar);
  // Mantém as refs em dia depois de cada render (nunca durante ele).
  useEffect(() => {
    atual.current = { passo, vontadeAntes, vontadeDepois, ajudou, duracaoFinal };
    registrarRef.current = registrar;
  });

  // Toda saída da tela (X, voltar do Android, gesto) passa por aqui.
  useEffect(() => () => registrarRef.current(), []);

  const chegarAoPasso3 = () => {
    const duracao = Math.round((Date.now() - inicio) / 1000);
    atual.current = { ...atual.current, passo: 3, duracaoFinal: duracao };
    setDuracaoFinal(duracao);
    setPasso(3);
    vibrarSucesso();
    // Já conta como vencida: se o app fechar agora, a conquista não se perde.
    registrarRef.current();
  };

  // Número desta fissura vencida: as já salvas (inclui esta, depois de salva).
  const numero = Math.max(1, contarFissurasVencidas(fissuras));

  return (
    <Fundo variante="mar">
      <View style={[styles.tela, { paddingTop: top + 14 }]}>
        <View style={styles.topo}>
          <BotaoIcone icone="fechar" onPress={sair} accessibilityLabel="Fechar" />
          <TracosPasso passo={passo} />
          <View style={styles.direita}>
            {passo === 1 ? (
              <Texto
                accessibilityRole="button"
                accessibilityLabel="Pular a respiração"
                onPress={() => setPasso(2)}
                style={styles.pular}
                // Área de toque de 48dp, mesmo com o texto pequeno.
                suppressHighlighting
              >
                pular
              </Texto>
            ) : null}
          </View>
        </View>

        {passo === 1 ? <PassoRespire aoSeguir={() => setPasso(2)} /> : null}
        {passo === 2 ? (
          <PassoOnda
            porque={porque}
            habitoId={habitoId}
            daTrancada={daTrancada}
            aoPassou={chegarAoPasso3}
            aoRespirarDeNovo={() => setPasso(1)}
          />
        ) : null}
        {passo === 3 ? (
          <PassoPassou
            numero={numero}
            duracaoSeg={duracaoFinal}
            vontadeAntes={vontadeAntes}
            vontadeDepois={vontadeDepois}
            ajudou={ajudou}
            aoMudarAntes={setVontadeAntes}
            aoMudarDepois={setVontadeDepois}
            aoMudarAjudou={setAjudou}
            aoVoltar={() => (daTrancada ? sair() : router.dismissTo('/'))}
          />
        ) : null}
      </View>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: margemTela,
  },
  direita: { width: 48, alignItems: 'flex-end', justifyContent: 'center' },
  pular: { minWidth: 48, textAlign: 'right', fontSize: 13.5, lineHeight: 18, color: cores.muted, paddingVertical: 15, paddingLeft: 8 },
});
