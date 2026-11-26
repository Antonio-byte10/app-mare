import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import {
  celulaTocavel,
  deslocarMes,
  estadoCelula,
  gradeDoMes,
  limitarMes,
  podeIrParaMes,
  tituloMes,
  type EstadoCelula,
  type Mes,
} from '@/lib/calendario';
import { formatarData } from '@/lib/datas';
import type { EstadoDia } from '@/lib/tipos';
import { comAlfa, cores, fontes, linha } from '@/theme';
import { Icone } from './Icone';
import { Texto } from './Texto';

type Props = {
  mes: Mes;
  estados: Record<string, EstadoDia>;
  /** Dia de hoje, "AAAA-MM-DD". */
  hoje: string;
  /** Dia de início do hábito: antes dele os dias ficam esmaecidos. */
  inicio: string;
  /** Chamado ao tocar numa seta, já dentro do intervalo permitido. */
  onMes: (mes: Mes) => void;
  /** Toque num dia que aceita relato (do início até hoje). */
  onDia: (dia: string) => void;
};

const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const ROTULO_ESTADO: Record<EstadoCelula, string> = {
  livre: 'livre',
  dentroDaMeta: 'dentro da meta',
  deslize: 'deslize',
  semRelato: 'sem relato',
  hoje: 'hoje, sem relato',
  futuro: 'ainda não chegou',
  antes: 'antes do início',
};

/** Calendário do mês (`.cal` do mockup 6): semana começa no domingo. */
export function Calendario({ mes, estados, hoje, inicio, onMes, onDia }: Props) {
  const limites = { inicio, hoje };
  const celulas = gradeDoMes(mes);
  while (celulas.length % 7 !== 0) celulas.push(null);
  const semanas: (string | null)[][] = [];
  for (let i = 0; i < celulas.length; i += 7) semanas.push(celulas.slice(i, i + 7));

  const ir = (delta: number) => onMes(limitarMes(deslocarMes(mes, delta), limites));

  return (
    <View>
      <View style={styles.cabecalho}>
        <SetaMes
          nome="voltar"
          rotulo="Mês anterior"
          ativa={podeIrParaMes(mes, -1, limites)}
          onPress={() => ir(-1)}
        />
        <Texto style={styles.titulo} accessibilityRole="header">
          {tituloMes(mes)}
        </Texto>
        <SetaMes
          nome="avancar"
          rotulo="Próximo mês"
          ativa={podeIrParaMes(mes, 1, limites)}
          onPress={() => ir(1)}
        />
      </View>

      <View style={styles.grade}>
        <View style={styles.semana}>
          {SEMANA.map((letra, i) => (
            <View key={i} style={styles.celula}>
              <Texto style={styles.letra} accessible={false}>
                {letra}
              </Texto>
            </View>
          ))}
        </View>
        {semanas.map((semana, s) => (
          <View key={s} style={styles.semana}>
            {semana.map((dia, i) =>
              dia ? (
                <Dia
                  key={dia}
                  dia={dia}
                  estado={estadoCelula(dia, { estados, inicio, hoje })}
                  ehHoje={dia === hoje}
                  onDia={onDia}
                />
              ) : (
                <View key={`v${i}`} style={styles.celula} />
              ),
            )}
          </View>
        ))}
      </View>

      <View style={styles.legenda}>
        <ItemLegenda rotulo="livre" estilo={{ backgroundColor: cores.foam }} />
        <ItemLegenda rotulo="deslize" estilo={{ borderWidth: 1.5, borderColor: cores.sand }} />
        <ItemLegenda rotulo="sem relato" estilo={{ borderWidth: 1.5, borderColor: cores.muted }} />
        <ItemLegenda rotulo="hoje" estilo={{ backgroundColor: cores.aqua }} />
      </View>
    </View>
  );
}

function SetaMes({
  nome,
  rotulo,
  ativa,
  onPress,
}: {
  nome: 'voltar' | 'avancar';
  rotulo: string;
  ativa: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      accessibilityState={{ disabled: !ativa }}
      disabled={!ativa}
      onPress={onPress}
      // 34 de lado no visual; a área de toque chega a 48dp.
      hitSlop={7}
      style={({ pressed }) => [styles.seta, !ativa && styles.setaInativa, pressed && styles.pressionado]}
    >
      <Icone nome={nome} tamanho={18} cor={cores.muted} />
    </Pressable>
  );
}

function Dia({
  dia,
  estado,
  ehHoje,
  onDia,
}: {
  dia: string;
  estado: EstadoCelula;
  ehHoje: boolean;
  onDia: (dia: string) => void;
}) {
  const tocavel = celulaTocavel(estado);
  const rotulo = `${formatarData(dia, { day: 'numeric', month: 'long' })}, ${ROTULO_ESTADO[estado]}`;
  return (
    <View style={styles.celula}>
      <Pressable
        accessibilityRole={tocavel ? 'button' : undefined}
        accessibilityLabel={rotulo}
        accessibilityState={{ disabled: !tocavel }}
        disabled={!tocavel}
        onPress={() => onDia(dia)}
        // Círculo de 32; a área de toque chega a 48dp.
        hitSlop={8}
        style={({ pressed }) => [styles.circulo, estilosEstado[estado], pressed && styles.pressionado]}
      >
        <Texto style={[styles.numero, { color: corNumero[estado] }]}>{Number(dia.slice(8))}</Texto>
      </Pressable>
      {ehHoje ? <View style={styles.pontoHoje} /> : null}
    </View>
  );
}

function ItemLegenda({ rotulo, estilo }: { rotulo: string; estilo: ViewStyle }) {
  return (
    <View style={styles.itemLegenda}>
      <View style={[styles.marca, estilo]} />
      <Texto style={styles.textoLegenda}>{rotulo}</Texto>
    </View>
  );
}

const esmaecido = comAlfa(cores.faint, 0.45);

const corNumero: Record<EstadoCelula, string> = {
  livre: cores.foam,
  dentroDaMeta: cores.foam,
  deslize: cores.sand,
  semRelato: cores.muted,
  hoje: cores.text,
  futuro: esmaecido,
  antes: esmaecido,
};

const livre: ViewStyle = { backgroundColor: comAlfa(cores.foam, 0.13) };

const estilosEstado: Record<EstadoCelula, ViewStyle> = {
  livre,
  dentroDaMeta: livre,
  deslize: { borderWidth: 1.5, borderColor: comAlfa(cores.sand, 0.7) },
  semRelato: { borderWidth: 1.5, borderColor: comAlfa(cores.muted, 0.45) },
  hoje: { borderWidth: 1.5, borderColor: cores.aqua, backgroundColor: comAlfa(cores.aqua, 0.08) },
  futuro: {},
  antes: {},
};

const styles = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  titulo: { fontFamily: fontes.uiForte, fontSize: 15, lineHeight: 20 },
  seta: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: linha,
    borderColor: cores.line,
  },
  setaInativa: { opacity: 0.35 },
  pressionado: { opacity: 0.8 },
  grade: { marginTop: 14, rowGap: 6 },
  semana: { flexDirection: 'row' },
  celula: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' },
  letra: { fontFamily: fontes.uiForte, fontSize: 11, lineHeight: 14, color: cores.faint },
  circulo: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  numero: { fontFamily: fontes.uiMedia, fontSize: 13, lineHeight: 16 },
  pontoHoje: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: cores.aqua,
  },
  legenda: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6, marginTop: 12 },
  itemLegenda: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  marca: { width: 9, height: 9, borderRadius: 4.5 },
  textoLegenda: { fontFamily: fontes.ui, fontSize: 11.5, lineHeight: 15, color: cores.muted },
});
