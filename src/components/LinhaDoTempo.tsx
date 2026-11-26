import { StyleSheet, View } from 'react-native';
import type { EstadoMarco } from '@/lib/marcos';
import { comAlfa, cores, fontes } from '@/theme';
import { Icone } from './Icone';
import { Texto } from './Texto';

export type ItemLinhaDoTempo = {
  id: string;
  titulo: string;
  descricao: string;
  estado: EstadoMarco;
  /** Só no estado "atual": 0 a 1. Sem valor, a barra não aparece. */
  progresso?: number;
};

type Props = { itens: ItemLinhaDoTempo[] };

/** Linha do tempo dos marcos (`.tl` do mockup 13). */
export function LinhaDoTempo({ itens }: Props) {
  return (
    <View>
      {itens.map((item, i) => (
        <Item key={item.id} item={item} ultimo={i === itens.length - 1} />
      ))}
    </View>
  );
}

const ESTADO_ROTULO: Record<EstadoMarco, string> = {
  atingido: 'atingido',
  atual: 'em andamento',
  jaAlcancado: 'já alcançado antes',
  futuro: 'ainda não chegou',
};

function Item({ item, ultimo }: { item: ItemLinhaDoTempo; ultimo: boolean }) {
  const { estado } = item;
  const futuro = estado === 'futuro';
  return (
    <View
      style={styles.item}
      accessible
      accessibilityLabel={`${item.titulo}, ${ESTADO_ROTULO[estado]}. ${item.descricao}`}
    >
      {ultimo ? null : (
        <View
          style={[styles.fio, estado === 'atingido' ? { backgroundColor: comAlfa(cores.sand, 0.35) } : null]}
        />
      )}
      <Marca estado={estado} />
      <View style={styles.texto}>
        <Texto style={[styles.titulo, futuro ? { color: cores.faint } : null]}>{item.titulo}</Texto>
        <Texto tipo="legenda" style={styles.descricao}>
          {item.descricao}
        </Texto>
        {estado === 'jaAlcancado' ? (
          <Texto tipo="legenda" cor={cores.sand} style={styles.antes}>
            você já chegou aqui antes
          </Texto>
        ) : null}
        {estado === 'atual' && item.progresso !== undefined ? (
          <View style={styles.barra}>
            <View style={[styles.barraPreenchida, { width: `${Math.round(item.progresso * 100)}%` }]} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function Marca({ estado }: { estado: EstadoMarco }) {
  if (estado === 'atingido') {
    return (
      <View style={[styles.marca, styles.marcaAtingido]}>
        <Icone nome="check" tamanho={16} cor={cores.sand} traco={2.2} />
      </View>
    );
  }
  if (estado === 'atual') {
    return (
      <View style={[styles.marca, { borderWidth: 1.5, borderColor: cores.aqua }]}>
        <Icone nome="ondaSimples" tamanho={15} cor={cores.aqua} />
      </View>
    );
  }
  if (estado === 'jaAlcancado') {
    return (
      <View style={[styles.marca, { borderWidth: 1, borderColor: comAlfa(cores.sand, 0.5) }]}>
        <Icone nome="ondaSimples" tamanho={15} cor={cores.sand} />
      </View>
    );
  }
  return (
    <View style={[styles.marca, { borderWidth: 1, borderColor: cores.line2 }]}>
      <Icone nome="cadeado" tamanho={15} cor={cores.faint} />
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: 14, paddingBottom: 18 },
  fio: {
    position: 'absolute',
    left: 14,
    top: 30,
    bottom: 0,
    width: 2,
    backgroundColor: cores.line,
  },
  marca: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  marcaAtingido: {
    backgroundColor: comAlfa(cores.sand, 0.16),
    borderWidth: 1,
    borderColor: comAlfa(cores.sand, 0.5),
  },
  texto: { flex: 1 },
  titulo: { fontFamily: fontes.uiForte, fontSize: 14.5, lineHeight: 20, paddingTop: 5, color: cores.text },
  descricao: { lineHeight: 19, marginTop: 3 },
  antes: { marginTop: 4, fontFamily: fontes.uiMedia },
  barra: {
    height: 4,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,.08)',
    marginTop: 8,
    overflow: 'hidden',
  },
  barraPreenchida: { height: '100%', backgroundColor: cores.aqua, borderRadius: 9 },
});
