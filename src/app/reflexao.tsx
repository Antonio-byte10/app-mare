import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BotaoIcone } from '@/components/BotaoIcone';
import { Botao } from '@/components/Botao';
import { CartaoGatilhos } from '@/components/CartaoGatilhos';
import { Fundo } from '@/components/Fundo';
import { SeletorHabito } from '@/components/SeletorHabito';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { Trio, type ItemTrio } from '@/components/Trio';
import { Vazio } from '@/components/Vazio';
import { dataCurta, dataLocal } from '@/lib/datas';
import { moeda } from '@/lib/inicio';
import { nomeDiaSemana } from '@/lib/lembretes/antesDaOnda';
import {
  chaveDaReflexao,
  DIAS_SEMANA,
  frasesDaReflexao,
  horaAproximada,
  inicioConversaDaSemana,
  resumoDaSemana,
  seDoGatilho,
  semanaTemDados,
  type SemanaHabito,
} from '@/lib/reflexao';
import { useAgora } from '@/lib/useAgora';
import { useHabitoAtivo } from '@/lib/useHabitoAtivo';
import { useVoltar } from '@/lib/useVoltar';
import { useMare } from '@/store';
import { comAlfa, cores, fontes, raio } from '@/theme';

/** Tamanho máximo do gatilho no texto do botão (gatilhos digitados à mão podem ser longos). */
const MAX_ROTULO_BOTAO = 28;

const formatarNumero = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
const cortar = (texto: string, max: number) => (texto.length > max ? `${texto.slice(0, max - 1).trimEnd()}…` : texto);

/** Os números do topo: dias livres (ou dentro da meta), deslizes e dias sem relato. */
function itensDosDias(s: SemanaHabito): ItemTrio[] {
  if (s.reduzir) {
    return [
      { valor: String(s.livres), rotulo: s.livres === 1 ? 'dia livre' : 'dias livres', cor: cores.aqua },
      { valor: String(s.dentroDaMeta), rotulo: 'dentro da meta', cor: cores.foam },
      { valor: String(s.deslizes), rotulo: s.deslizes === 1 ? 'deslize' : 'deslizes', cor: cores.sand },
    ];
  }
  return [
    { valor: String(s.livres), rotulo: s.livres === 1 ? 'dia livre' : 'dias livres', cor: cores.aqua },
    { valor: String(s.deslizes), rotulo: s.deslizes === 1 ? 'deslize' : 'deslizes', cor: cores.sand },
    { valor: String(s.semRelato), rotulo: 'sem relato' },
  ];
}

type Detalhe = { rotulo: string; valor: string };

/** Linhas de detalhe: só as que têm dado. `ocultarNumeros` esconde a economia, como no Início. */
function detalhesDaSemana(s: SemanaHabito, oculto: boolean): Detalhe[] {
  const d: Detalhe[] = [];
  if (s.reduzir && s.semRelato > 0) d.push({ rotulo: 'Dias sem relato', valor: String(s.semRelato) });
  if (s.quantidade) {
    const q = s.quantidade;
    const antes = q.anterior === null ? '' : ` · semana passada: ${q.anterior}`;
    d.push({ rotulo: 'Quantidade', valor: `${q.total} ${q.unidade}${antes} (limite de ${q.maxPorDia} por dia)` });
  }
  if (s.vontadeMedia !== null) {
    const antes = s.vontadeMediaAnterior === null ? '' : ` · semana passada: ${formatarNumero(s.vontadeMediaAnterior)}`;
    d.push({ rotulo: 'Vontade média', valor: `${formatarNumero(s.vontadeMedia)} de 10${antes}` });
  }
  if (s.fissurasVencidas > 0) d.push({ rotulo: 'Ondas que você atravessou', valor: String(s.fissurasVencidas) });
  if (s.diaPesado) d.push({ rotulo: 'Dia mais pesado', valor: nomeDiaSemana(s.diaPesado.diaSemana) });
  if (s.horaPesada !== null) d.push({ rotulo: 'Hora em que as ondas vieram', valor: horaAproximada(s.horaPesada) });
  if (s.economia && !oculto) {
    const partes: string[] = [];
    if (s.economia.centavos > 0) partes.push(moeda(s.economia.centavos));
    if (s.economia.unidades > 0) partes.push(`${s.economia.unidades} ${s.economia.unidades === 1 ? 'unidade' : 'unidades'} a menos`);
    d.push({ rotulo: 'Economizado na semana', valor: partes.join(' · ') });
  }
  return d;
}

/**
 * "Sua semana": um olhar gentil sobre os últimos 7 dias completos (até ontem), por hábito. Só lê o
 * que a pessoa registrou; nada sai do aparelho, a não ser que ela escolha conversar com a IA (e aí
 * vão só números agregados).
 */
export default function Reflexao() {
  const router = useRouter();
  const voltar = useVoltar();
  const { habitos, ativo, escolher } = useHabitoAtivo();
  const relatos = useMare((e) => e.relatos);
  const fissuras = useMare((e) => e.fissuras);
  const recomecos = useMare((e) => e.recomecos);
  const oculto = useMare((e) => e.ajustes.ocultarNumeros);
  const temIa = useMare((e) => e.ajustes.ia !== undefined);
  const vistaEm = useMare((e) => e.ajustes.reflexaoVistaEm);
  const setAjustes = useMare((e) => e.setAjustes);
  const hoje = dataLocal(useAgora());

  // Abrir a reflexão desta semana tira o cartão "Sua semana" do Início.
  const chave = chaveDaReflexao(hoje);
  useEffect(() => {
    if (vistaEm !== chave) setAjustes({ reflexaoVistaEm: chave });
  }, [vistaEm, chave, setAjustes]);

  const idAtivo = ativo?.id;
  const semana = useMemo(
    () => (idAtivo ? resumoDaSemana(habitos, relatos, fissuras, recomecos, hoje, idAtivo).habitos[0] : undefined),
    [habitos, relatos, fissuras, recomecos, hoje, idAtivo],
  );

  const topo = (
    <View style={styles.topo}>
      <BotaoIcone icone="voltar" onPress={voltar} accessibilityLabel="Voltar" />
      <Texto tipo="titulo" style={styles.titulo} accessibilityRole="header">
        Sua semana
      </Texto>
    </View>
  );

  if (!ativo || !semana) {
    return (
      <Fundo>
        <Tela>
          {topo}
          <Vazio />
        </Tela>
      </Fundo>
    );
  }

  const tem = semanaTemDados(semana);
  const frases = frasesDaReflexao(semana, ativo.tipo);
  const detalhes = tem ? detalhesDaSemana(semana, oculto) : [];
  const gatilho = semana.gatilhos[0];
  const { inicio, fim } = semana.janela;

  return (
    <Fundo>
      <Tela rolavel>
        {topo}

        {habitos.length > 1 ? (
          <SeletorHabito habitos={habitos} ativoId={ativo.id} onEscolher={escolher} comNovo={false} style={styles.chips} />
        ) : null}

        <Texto tipo="legenda" style={styles.periodo}>
          {`${dataCurta(inicio)} a ${dataCurta(fim)} · ${DIAS_SEMANA} dias`}
        </Texto>

        <View style={styles.cartao} accessibilityRole="summary">
          {tem ? null : (
            <Texto style={styles.vazioTitulo} accessibilityRole="header">
              Ainda há poucos relatos nesta semana.
            </Texto>
          )}
          {frases.map((f) => (
            <Texto key={f} style={styles.frase}>
              {f}
            </Texto>
          ))}
        </View>

        {tem ? (
          <>
            {oculto ? null : <Trio style={styles.trio} itens={itensDosDias(semana)} />}

            {detalhes.length > 0 ? (
              <View style={styles.detalhes}>
                {detalhes.map((d) => (
                  <View key={d.rotulo} style={styles.detalhe} accessible accessibilityLabel={`${d.rotulo}: ${d.valor}`}>
                    <Texto tipo="legenda" style={styles.detalheRotulo}>
                      {d.rotulo}
                    </Texto>
                    <Texto style={styles.detalheValor}>{d.valor}</Texto>
                  </View>
                ))}
              </View>
            ) : null}

            {semana.gatilhos.length > 0 ? (
              <>
                <View style={styles.divisor} />
                <CartaoGatilhos itens={semana.gatilhos} dias={DIAS_SEMANA} />
              </>
            ) : null}

            <View style={styles.acoes}>
              {gatilho ? (
                <Botao
                  variante="secundario"
                  onPress={() => router.push({ pathname: '/plano', params: { se: seDoGatilho(gatilho), entao: '' } })}
                  accessibilityLabel={`Criar um plano para ${gatilho.rotulo}`}
                >
                  {`Criar um plano para ${cortar(gatilho.rotulo.toLowerCase(), MAX_ROTULO_BOTAO)}`}
                </Botao>
              ) : null}
              {temIa ? (
                <Botao
                  variante="texto"
                  // Reaproveita as abas que já estão na pilha: fecha esta tela e abre a Conversa com o texto pronto.
                  onPress={() => router.dismissTo({ pathname: '/conversa', params: { inicio: inicioConversaDaSemana(semana) } })}
                >
                  Conversar sobre a semana com a IA
                </Botao>
              ) : null}
            </View>
          </>
        ) : (
          <View style={styles.acoes}>
            <Botao onPress={() => router.push(`/relato/${hoje}`)}>Fazer o relato de hoje</Botao>
          </View>
        )}

        <Texto tipo="legenda" style={styles.nota}>
          Este resumo é só um espelho do que você registrou. Não é um diagnóstico nem uma avaliação de quem você é.
        </Texto>
      </Tela>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titulo: { fontSize: 22, lineHeight: 27, flex: 1 },
  chips: { marginTop: 14 },
  periodo: { marginTop: 14 },
  cartao: {
    gap: 10,
    padding: 16,
    marginTop: 10,
    borderRadius: raio.md,
    backgroundColor: comAlfa(cores.aqua, 0.06),
    borderWidth: 1,
    borderColor: comAlfa(cores.aqua, 0.22),
  },
  vazioTitulo: { fontFamily: fontes.display, fontSize: 19, lineHeight: 25 },
  frase: { fontSize: 15, lineHeight: 23, color: cores.text },
  trio: { marginTop: 10 },
  detalhes: { marginTop: 8, gap: 12 },
  detalhe: { gap: 2 },
  detalheRotulo: { fontSize: 12, lineHeight: 16 },
  detalheValor: { fontFamily: fontes.uiMedia, fontSize: 14.5, lineHeight: 20 },
  divisor: { height: 1, backgroundColor: cores.line, marginTop: 20, marginBottom: 18 },
  acoes: { gap: 6, marginTop: 22 },
  nota: { marginTop: 18, textAlign: 'center' },
});
