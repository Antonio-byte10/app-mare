import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Chip } from '@/components/Chip';
import { Icone } from '@/components/Icone';
import { TelaPasso } from '@/components/TelaPasso';
import { Texto } from '@/components/Texto';
import { ICONE_TIPO } from '@/lib/avaliacao';
import { DICA_TIPO, errosDoRascunho, passoDoPrimeiroUso, ROTULO_TIPO, TIPOS_ORDEM } from '@/lib/primeiroUso';
import { useRascunhoPrimeiroUso } from '@/lib/rascunhoPrimeiroUso';
import type { Habito } from '@/lib/tipos';
import { useVoltar } from '@/lib/useVoltar';
import { comAlfa, cores, fontes } from '@/theme';

const CORES: Habito['cor'][] = ['aqua', 'peri', 'coral', 'sand', 'foam'];
const NOMES_COR: Record<Habito['cor'], string> = {
  aqua: 'Água',
  peri: 'Lavanda',
  coral: 'Coral',
  sand: 'Areia',
  foam: 'Espuma',
};

/** Escolher um ou mais hábitos, cada um com um apelido discreto e uma cor. */
export default function EscolherHabitos() {
  const router = useRouter();
  const voltar = useVoltar();
  const rascunhos = useRascunhoPrimeiroUso((e) => e.rascunhos);
  const alternar = useRascunhoPrimeiroUso((e) => e.alternarTipo);
  const mudar = useRascunhoPrimeiroUso((e) => e.mudarHabito);

  const erros = rascunhos.map((r) => errosDoRascunho(r, rascunhos).apelido);
  const podeSeguir = rascunhos.length > 0 && erros.every((e) => !e);

  return (
    <TelaPasso
      aoVoltar={voltar}
      topo={<Texto tipo="legenda">{passoDoPrimeiroUso('habitos', rascunhos)?.texto}</Texto>}
      rodape={
        <Botao
          desabilitado={!podeSeguir}
          onPress={() => router.push('/boas-vindas/configurar')}
          accessibilityLabel={rascunhos.length === 0 ? 'Continuar. Escolha pelo menos um hábito.' : 'Continuar'}
        >
          Continuar
        </Botao>
      }
    >
      <Texto style={styles.titulo} accessibilityRole="header">
        O que você quer cuidar?
      </Texto>
      <Texto style={styles.sub}>
        Escolha um ou mais. O apelido é o nome que aparece no app, então pode ser discreto. Você muda tudo depois.
      </Texto>

      <View style={styles.lista}>
        {TIPOS_ORDEM.map((tipo, i) => {
          const r = rascunhos.find((x) => x.tipo === tipo);
          const sel = !!r;
          const cor = cores[r?.cor ?? 'aqua'];
          const indice = r ? rascunhos.indexOf(r) : -1;
          return (
            <View key={tipo} style={[styles.item, i > 0 && styles.itemSeparado]}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: sel }}
                accessibilityLabel={`${ROTULO_TIPO[tipo]}, ${DICA_TIPO[tipo]}`}
                onPress={() => alternar(tipo)}
                style={styles.linha}
              >
                <View style={[styles.emblema, { backgroundColor: comAlfa(sel ? cor : cores.muted, sel ? 0.12 : 0.08) }]}>
                  <Icone nome={ICONE_TIPO[tipo]} cor={sel ? cor : cores.muted} />
                </View>
                <View style={styles.textos}>
                  <Texto style={styles.nome}>{ROTULO_TIPO[tipo]}</Texto>
                  <Texto tipo="legenda">{DICA_TIPO[tipo]}</Texto>
                </View>
                <View style={[styles.marca, sel && { backgroundColor: cores.aqua, borderColor: cores.aqua }]}>
                  {sel ? <Icone nome="check" tamanho={14} traco={2.4} cor={cores.tinta} /> : null}
                </View>
              </Pressable>

              {r ? (
                <View style={styles.detalhe}>
                  <Campo
                    rotulo="Apelido"
                    valor={r.apelido}
                    aoMudar={(apelido) => mudar(tipo, { apelido })}
                    erro={erros[indice]}
                    placeholder="Como você quer chamar"
                    maxLength={20}
                  />
                  <Texto style={styles.rotulo}>Cor</Texto>
                  <View style={styles.chips}>
                    {CORES.map((c) => (
                      <Chip key={c} ativo={r.cor === c} cor={cores[c]} ponto onPress={() => mudar(tipo, { cor: c })}>
                        {NOMES_COR[c]}
                      </Chip>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </TelaPasso>
  );
}

const styles = StyleSheet.create({
  titulo: { fontFamily: fontes.display, fontSize: 26, lineHeight: 31, letterSpacing: -0.52 },
  sub: { marginTop: 10, fontSize: 14, lineHeight: 21, color: cores.muted },
  lista: { marginTop: 18 },
  item: { paddingVertical: 4 },
  itemSeparado: { borderTopWidth: 1, borderTopColor: cores.line },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingVertical: 8 },
  emblema: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, gap: 2 },
  nome: { fontFamily: fontes.uiForte, fontSize: 15, lineHeight: 20 },
  marca: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3B5878',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detalhe: { paddingTop: 6, paddingBottom: 12 },
  rotulo: { fontFamily: fontes.uiForte, fontSize: 13.5, lineHeight: 18, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
});
