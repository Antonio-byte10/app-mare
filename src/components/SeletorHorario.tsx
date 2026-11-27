import { Pressable, StyleSheet, View } from 'react-native';
import { formatarHorario, lerHorario } from '@/lib/lembretes/horario';
import { comAlfa, cores, fontes, raio } from '@/theme';
import { Texto } from './Texto';

type Props = {
  /** "HH:MM". */
  valor: string;
  aoMudar: (valor: string) => void;
  /** Nome do que está sendo ajustado, para leitores de tela ("Relato do dia"). */
  rotulo: string;
};

const HORAS = Array.from({ length: 24 }, (_, i) => i);
const MINUTOS = [0, 15, 30, 45];
const COLUNAS = 6;

/**
 * Seletor de horário simples e acessível: uma grade de horas e quatro opções de minutos (de 15 em
 * 15). Cada opção tem 48dp de altura, sem relógio giratório nem teclado.
 */
export function SeletorHorario({ valor, aoMudar, rotulo }: Props) {
  const { hora, minuto } = lerHorario(valor);
  const linhasDeHoras = Array.from({ length: HORAS.length / COLUNAS }, (_, i) => HORAS.slice(i * COLUNAS, (i + 1) * COLUNAS));

  return (
    <View style={styles.caixa}>
      <Texto style={styles.titulo} accessibilityRole="header">
        {`Horário · ${valor}`}
      </Texto>

      <Texto tipo="legenda" style={styles.rotulo}>
        Hora
      </Texto>
      <View style={styles.grade}>
        {linhasDeHoras.map((linha) => (
          <View key={linha[0]} style={styles.fila}>
            {linha.map((h) => (
              <Opcao
                key={h}
                texto={String(h).padStart(2, '0')}
                ativo={h === hora}
                aoPressionar={() => aoMudar(formatarHorario(h, minuto))}
                accessibilityLabel={`${rotulo}: ${h} ${h === 1 ? 'hora' : 'horas'}`}
              />
            ))}
          </View>
        ))}
      </View>

      <Texto tipo="legenda" style={styles.rotulo}>
        Minutos
      </Texto>
      <View style={styles.fila}>
        {MINUTOS.map((m) => (
          <Opcao
            key={m}
            texto={String(m).padStart(2, '0')}
            ativo={m === minuto}
            aoPressionar={() => aoMudar(formatarHorario(hora, m))}
            accessibilityLabel={`${rotulo}: ${m} minutos`}
          />
        ))}
      </View>
    </View>
  );
}

function Opcao({
  texto,
  ativo,
  aoPressionar,
  accessibilityLabel,
}: {
  texto: string;
  ativo: boolean;
  aoPressionar: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: ativo }}
      onPress={aoPressionar}
      style={[styles.opcao, ativo ? styles.opcaoAtiva : null]}
    >
      <Texto style={styles.opcaoTexto} cor={ativo ? cores.text : cores.muted}>
        {texto}
      </Texto>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  caixa: {
    marginTop: 2,
    marginBottom: 12,
    padding: 14,
    gap: 6,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.line,
    backgroundColor: 'rgba(255,255,255,.03)',
  },
  titulo: { fontFamily: fontes.display, fontSize: 18, lineHeight: 24 },
  rotulo: { marginTop: 6 },
  grade: { gap: 6 },
  fila: { flexDirection: 'row', gap: 6 },
  opcao: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cores.line,
  },
  opcaoAtiva: { backgroundColor: comAlfa(cores.aqua, 0.12), borderColor: comAlfa(cores.aqua, 0.5) },
  opcaoTexto: { fontFamily: fontes.uiMedia, fontSize: 14, lineHeight: 18 },
});
