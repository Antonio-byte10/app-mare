import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { cores, fontes } from '@/theme';
import { Icone, type NomeIcone } from './Icone';
import { Texto } from './Texto';

type Props = {
  titulo: string;
  subtitulo?: string;
  /** Nome de ícone do traço padrão, ou um nó próprio (ex.: ponto colorido). */
  icone?: NomeIcone | ReactNode;
  /** À direita: um interruptor, por exemplo. Sem `direita` e com `onPress`, aparece a seta. */
  direita?: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
};

/** Linha de lista de ajustes (`.si` do mockup 11): ícone, título, subtítulo e controle à direita. */
export function LinhaAjuste({ titulo, subtitulo, icone, direita, onPress, accessibilityLabel }: Props) {
  const conteudo = (
    <>
      {icone ? (
        <View style={styles.icone}>
          {typeof icone === 'string' ? <Icone nome={icone as NomeIcone} tamanho={22} cor={cores.muted} /> : icone}
        </View>
      ) : null}
      <View style={styles.texto}>
        <Texto style={styles.titulo}>{titulo}</Texto>
        {subtitulo ? <Texto tipo="legenda">{subtitulo}</Texto> : null}
      </View>
      {direita ?? (onPress ? <Icone nome="avancar" tamanho={18} cor={cores.faint} /> : null)}
    </>
  );
  if (!onPress) return <View style={styles.linha}>{conteudo}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (subtitulo ? `${titulo}, ${subtitulo}` : titulo)}
      style={styles.linha}
    >
      {conteudo}
    </Pressable>
  );
}

/** Divisor fino entre linhas de um mesmo grupo. */
export function DivisorAjuste() {
  return <View style={styles.divisor} />;
}

/** Rótulo de grupo (`.grp`). */
export function GrupoAjuste({ children }: { children: string }) {
  return (
    <Texto style={styles.grupo} accessibilityRole="header">
      {children}
    </Texto>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, minHeight: 56 },
  icone: { width: 22, alignItems: 'center' },
  texto: { flex: 1, gap: 2 },
  titulo: { fontFamily: fontes.uiMedia, fontSize: 14.5, lineHeight: 20 },
  divisor: { height: 1, backgroundColor: cores.line },
  grupo: {
    fontFamily: fontes.uiForte,
    fontSize: 11.5,
    lineHeight: 15,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: cores.faint,
    marginTop: 18,
    marginBottom: 2,
  },
});
