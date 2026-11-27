import { useEffect, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { comAlfa, cores, fontes } from '@/theme';
import { Icone } from './Icone';
import { Texto } from './Texto';

type Props = {
  /** Dígitos digitados até agora. */
  valor: string;
  aoMudar: (valor: string) => void;
  /** Quantos dígitos o PIN tem, se já se sabe (a tela de bloqueio). Sem isso, as bolinhas crescem de 4 a `maximo`. */
  total?: number;
  maximo?: number;
  desabilitado?: boolean;
  /** Algo errado com o último PIN: as bolinhas ficam em areia (nunca vermelho). */
  erro?: boolean;
  /** Botão extra no canto inferior esquerdo (ex.: digital). */
  extraEsquerda?: ReactNode;
  /** Teclas menores para telas baixas. */
  compacto?: boolean;
};

const LINHAS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']];

/** Bolinhas do PIN: mostram quantos dígitos foram digitados, nunca os dígitos. */
export function PontosPin({ preenchidos, total, erro }: { preenchidos: number; total: number; erro?: boolean }) {
  return (
    <View
      style={styles.pontos}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${preenchidos} de ${total} dígitos digitados`}
      accessibilityLiveRegion="polite"
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.ponto,
            i < preenchidos
              ? { backgroundColor: erro ? cores.sand : cores.aqua, borderColor: erro ? cores.sand : cores.aqua }
              : { borderColor: erro ? comAlfa(cores.sand, 0.6) : cores.line2 },
          ]}
        />
      ))}
    </View>
  );
}

/**
 * Teclado numérico próprio para o PIN: teclas grandes (64dp), cada uma com nome para leitores de
 * tela. No navegador, o teclado do computador também digita (só desenvolvimento).
 */
export function TecladoPin({
  valor,
  aoMudar,
  total,
  maximo = 6,
  desabilitado = false,
  erro = false,
  extraEsquerda,
  compacto = false,
}: Props) {
  const limite = total ?? maximo;
  const digitar = (d: string) => {
    if (!desabilitado && valor.length < limite) aoMudar(valor + d);
  };
  const apagar = () => {
    if (!desabilitado && valor.length > 0) aoMudar(valor.slice(0, -1));
  };

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const aoTecla = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) digitar(e.key);
      else if (e.key === 'Backspace') apagar();
    };
    window.addEventListener('keydown', aoTecla);
    return () => window.removeEventListener('keydown', aoTecla);
  });

  const tecla = compacto ? 58 : 66;
  const estiloTecla = { width: tecla, height: tecla, borderRadius: tecla / 2 };

  const renderTecla = (d: string) => (
    <Pressable
      key={d}
      accessibilityRole="button"
      accessibilityLabel={d}
      accessibilityState={{ disabled: desabilitado }}
      disabled={desabilitado}
      onPress={() => digitar(d)}
      style={({ pressed }) => [styles.tecla, estiloTecla, pressed && styles.pressionada, desabilitado && styles.desabilitada]}
    >
      <Texto style={styles.digito}>{d}</Texto>
    </Pressable>
  );

  const vazio = <View style={estiloTecla} />;

  return (
    <View style={[styles.teclado, { gap: compacto ? 10 : 14 }]}>
      <PontosPin
        preenchidos={valor.length}
        total={total ?? Math.min(maximo, Math.max(4, valor.length))}
        erro={erro}
      />
      <View style={{ gap: compacto ? 10 : 14, marginTop: compacto ? 10 : 20 }}>
        {LINHAS.map((linha) => (
          <View key={linha[0]} style={styles.linha}>
            {linha.map(renderTecla)}
          </View>
        ))}
        <View style={styles.linha}>
          {extraEsquerda ? <View style={[estiloTecla, styles.centro]}>{extraEsquerda}</View> : vazio}
          {renderTecla('0')}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Apagar o último dígito"
            accessibilityState={{ disabled: desabilitado || valor.length === 0 }}
            disabled={desabilitado || valor.length === 0}
            onPress={apagar}
            style={({ pressed }) => [estiloTecla, styles.centro, pressed && styles.pressionada]}
          >
            <Icone nome="apagarTecla" tamanho={26} cor={valor.length === 0 ? cores.faint : cores.muted} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  teclado: { alignItems: 'center' },
  pontos: { flexDirection: 'row', gap: 16, height: 24, alignItems: 'center', justifyContent: 'center' },
  ponto: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  linha: { flexDirection: 'row', gap: 22, justifyContent: 'center' },
  tecla: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: cores.line2,
    backgroundColor: 'rgba(255,255,255,.04)',
  },
  centro: { alignItems: 'center', justifyContent: 'center' },
  pressionada: { backgroundColor: comAlfa(cores.aqua, 0.14), borderColor: comAlfa(cores.aqua, 0.4) },
  desabilitada: { opacity: 0.45 },
  digito: { fontFamily: fontes.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.4 },
});
