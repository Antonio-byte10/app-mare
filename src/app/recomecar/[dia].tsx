import { randomUUID } from 'expo-crypto';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { CartaoCrise } from '@/components/CartaoCrise';
import { Chip } from '@/components/Chip';
import { TelaPasso } from '@/components/TelaPasso';
import { Texto } from '@/components/Texto';
import { GATILHOS } from '@/conteudo/gatilhos';
import { resumoHabito } from '@/lib/contador';
import { detectarCriseEmTextos } from '@/lib/crise';
import { dataLocal, dataValida, formatarData } from '@/lib/datas';
import {
  alternarItem,
  INICIO_CONVERSA_RECOMECO,
  montarRecomeco,
  OPCOES_HALT,
  recomecoExistente,
  sugestaoPlano,
  SUGESTOES_PROXIMA_VEZ,
} from '@/lib/recomeco';
import type { Halt, Habito } from '@/lib/tipos';
import { useAgora } from '@/lib/useAgora';
import { useVoltar } from '@/lib/useVoltar';
import { useVoltarInterno } from '@/lib/useVoltarInterno';
import { useMare } from '@/store';
import { cores, fontes } from '@/theme';

const param = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function RecomecarComCuidado() {
  const { dia: diaParam, habito: habitoParam, restantes } = useLocalSearchParams<{
    dia: string | string[];
    habito?: string | string[];
    restantes?: string | string[];
  }>();
  const dia = param(diaParam);
  const habitoId = param(habitoParam);
  const habito = useMare((e) => e.habitos.find((h) => h.id === habitoId));
  // Link inválido: volta para o Início sem barulho.
  if (!dia || !dataValida(dia) || !habito) return <Redirect href="/" />;
  return <Fluxo dia={dia} habito={habito} restantes={(param(restantes) ?? '').split(',').filter(Boolean)} />;
}

/**
 * "Recomeçar com cuidado" (spec 6.5), depois de um deslize registrado:
 * 1) agradece e mostra que os dias continuam; 2) o que estava acontecendo; 3) o que pode ser diferente.
 * Tudo é opcional e dá para sair a qualquer momento ("Agora não"): o deslize já foi registrado no relato.
 */
function Fluxo({ dia, habito, restantes }: { dia: string; habito: Habito; restantes: string[] }) {
  const router = useRouter();
  const voltar = useVoltar();
  const relatos = useMare((e) => e.relatos);
  const recomecos = useMare((e) => e.recomecos);
  const ocultarNumeros = useMare((e) => e.ajustes.ocultarNumeros);
  const temIa = useMare((e) => e.ajustes.ia !== undefined);
  const salvarRecomeco = useMare((e) => e.salvarRecomeco);
  const agora = useAgora();
  const relato = relatos.find((r) => r.dia === dia);
  const existente = recomecoExistente(recomecos, dia, habito.id);

  const [passo, setPasso] = useState<1 | 2 | 3>(1);
  const [gatilhos, setGatilhos] = useState<string[]>(existente?.gatilhos ?? relato?.gatilhos ?? []);
  const [halt, setHalt] = useState<Halt[]>(existente?.halt ?? []);
  const [oQue, setOQue] = useState(existente?.oQueAcontecia ?? '');
  const [proxima, setProxima] = useState(existente?.proximaVez ?? '');

  const voltarPasso = () => (passo > 1 ? setPasso((passo - 1) as 1 | 2) : voltar());
  useVoltarInterno(passo > 1, voltarPasso);

  const totalLivres = resumoHabito(habito, relatos, dataLocal(agora)).totalLivres;
  const opcoesGatilho = [...GATILHOS, ...gatilhos.filter((g) => !GATILHOS.includes(g))];
  const crise = detectarCriseEmTextos([oQue, proxima]);

  const gravar = () =>
    salvarRecomeco(
      montarRecomeco({
        id: existente?.id ?? randomUUID(),
        dia,
        habitoId: habito.id,
        gatilhos,
        halt,
        oQueAcontecia: oQue,
        proximaVez: proxima,
        agora: Date.now(),
      }),
    );

  /** Depois de salvar: o próximo deslize da lista, ou volta de onde a pessoa estava. */
  const terminar = () => {
    const [proximo, ...resto] = restantes;
    if (proximo) {
      router.replace({ pathname: '/recomecar/[dia]', params: { dia, habito: proximo, restantes: resto.join(',') } });
    } else {
      voltar();
    }
  };

  const salvarEFechar = () => {
    gravar();
    terminar();
  };

  const virarPlano = () => {
    gravar();
    const { se, entao } = sugestaoPlano({ gatilhos, halt, proximaVez: proxima });
    router.replace({ pathname: '/plano', params: { se, entao } });
  };

  const conversarComIa = () => {
    gravar();
    router.replace({ pathname: '/conversa', params: { inicio: INICIO_CONVERSA_RECOMECO } });
  };

  return (
    <TelaPasso
      aoVoltar={voltarPasso}
      topo={<Texto tipo="legenda" accessibilityLiveRegion="polite">{`Passo ${passo} de 3`}</Texto>}
      rodape={
        passo === 1 ? (
          <>
            <Botao onPress={() => setPasso(2)}>Continuar</Botao>
            <Botao variante="texto" onPress={terminar}>
              Agora não
            </Botao>
          </>
        ) : passo === 2 ? (
          <>
            <Botao onPress={() => setPasso(3)}>Continuar</Botao>
            <Botao variante="texto" onPress={terminar}>
              Agora não
            </Botao>
          </>
        ) : (
          <>
            <Botao onPress={salvarEFechar}>Salvar</Botao>
            {proxima.trim() !== '' || gatilhos.length > 0 || halt.length > 0 ? (
              <Botao variante="secundario" onPress={virarPlano}>
                Transformar em plano
              </Botao>
            ) : null}
            {temIa ? (
              <Botao variante="texto" onPress={conversarComIa}>
                Conversar sobre isso com a IA
              </Botao>
            ) : null}
          </>
        )
      }
    >
      {passo === 1 ? (
        <>
          <Chip ativo ponto cor={cores[habito.cor]} style={styles.chip}>
            {habito.apelido}
          </Chip>
          <Texto style={styles.titulo} accessibilityRole="header">
            Obrigado por registrar. Isso exige coragem.
          </Texto>
          <Texto style={styles.texto}>
            {`Um deslize não apaga o que você já construiu. ${formatarData(dia, { day: 'numeric', month: 'long' })} foi um dia difícil, e amanhã é outro.`}
          </Texto>
          <View style={styles.destaque}>
            {ocultarNumeros ? (
              <Texto style={styles.destaqueTexto}>Seus dias livres continuam contando.</Texto>
            ) : (
              <>
                <Texto style={styles.numero}>{String(totalLivres)}</Texto>
                <Texto style={styles.destaqueTexto}>
                  {totalLivres === 1 ? 'dia livre no total, e continua contando.' : 'dias livres no total, e continuam contando.'}
                </Texto>
              </>
            )}
          </View>
          <Texto tipo="legenda">
            Se quiser, vamos olhar com calma o que aconteceu, para o próximo momento difícil ser diferente. Leva
            menos de um minuto.
          </Texto>
        </>
      ) : null}

      {passo === 2 ? (
        <>
          <Texto style={styles.titulo} accessibilityRole="header">
            O que estava acontecendo?
          </Texto>
          <Texto style={styles.texto}>Escolha o que fizer sentido. Não existe resposta certa.</Texto>
          <Texto style={styles.rotulo}>O que mexeu com você?</Texto>
          <View style={styles.chips}>
            {opcoesGatilho.map((g) => (
              <Chip key={g} ativo={gatilhos.includes(g)} cor={cores.peri} onPress={() => setGatilhos((gs) => alternarItem(gs, g))}>
                {g}
              </Chip>
            ))}
          </View>
          <Texto style={styles.rotulo}>E o seu corpo e o seu dia?</Texto>
          <View style={styles.chips}>
            {OPCOES_HALT.map((o) => (
              <Chip key={o.id} ativo={halt.includes(o.id)} cor={cores.sand} onPress={() => setHalt((h) => alternarItem(h, o.id))}>
                {o.rotulo}
              </Chip>
            ))}
          </View>
          <View style={styles.campo}>
            <Campo
              rotulo="Quer contar mais? (opcional)"
              valor={oQue}
              aoMudar={setOQue}
              multilinha
              maxLength={500}
              placeholder="O que estava acontecendo"
            />
          </View>
        </>
      ) : null}

      {passo === 3 ? (
        <>
          <Texto style={styles.titulo} accessibilityRole="header">
            O que pode ser diferente da próxima vez?
          </Texto>
          <Texto style={styles.texto}>Uma coisa pequena e possível já ajuda. Você pode guardar como um plano.</Texto>
          <View style={styles.campo}>
            <Campo
              rotulo="Da próxima vez, eu posso..."
              valor={proxima}
              aoMudar={setProxima}
              multilinha
              maxLength={300}
              placeholder="Escreva com as suas palavras"
            />
          </View>
          <View style={styles.chips}>
            {SUGESTOES_PROXIMA_VEZ.map((s) => (
              <Chip key={s} ativo={proxima === s} onPress={() => setProxima(s)}>
                {s}
              </Chip>
            ))}
          </View>
        </>
      ) : null}

      {crise ? (
        <View style={styles.crise}>
          <CartaoCrise tipo={crise} />
        </View>
      ) : null}
    </TelaPasso>
  );
}

const styles = StyleSheet.create({
  chip: { alignSelf: 'flex-start' },
  titulo: { marginTop: 14, fontFamily: fontes.display, fontSize: 27, lineHeight: 33, letterSpacing: -0.54 },
  texto: { marginTop: 12, fontSize: 15, lineHeight: 23, color: cores.muted },
  destaque: { marginVertical: 22, alignItems: 'center', gap: 4 },
  numero: { fontFamily: fontes.displayLeve, fontSize: 64, lineHeight: 66, letterSpacing: -2.4, color: cores.text },
  destaqueTexto: { fontSize: 14.5, lineHeight: 21, color: cores.muted, textAlign: 'center' },
  rotulo: { marginTop: 22, marginBottom: 12, fontFamily: fontes.uiForte, fontSize: 13.5, lineHeight: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  campo: { marginTop: 22 },
  crise: { marginTop: 18 },
});
