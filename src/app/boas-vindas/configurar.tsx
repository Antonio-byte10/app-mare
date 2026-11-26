import { randomUUID } from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Chip } from '@/components/Chip';
import { Segmento } from '@/components/Segmento';
import { TelaPasso } from '@/components/TelaPasso';
import { Texto } from '@/components/Texto';
import { dataLocal } from '@/lib/datas';
import { errosDoRascunho, montarHabito, temErros, type Comecou, type RascunhoHabito } from '@/lib/primeiroUso';
import { useRascunhoPrimeiroUso } from '@/lib/rascunhoPrimeiroUso';
import { useVoltar } from '@/lib/useVoltar';
import { useVoltarInterno } from '@/lib/useVoltarInterno';
import { cores, fontes } from '@/theme';

/** Rascunhos -> hábitos com id novo, com início hoje. */
function criarHabitos(rascunhos: RascunhoHabito[]) {
  const agora = Date.now();
  const hoje = dataLocal(agora);
  return rascunhos.map((x) => montarHabito(x, randomUUID(), hoje, agora));
}

/**
 * Para cada hábito escolhido: a meta (parar ou reduzir) e "Quando você começou?" (hoje, ou "já
 * estou há N dias", que vira `diasAntes`). Um hábito por vez; voltar volta ao hábito anterior.
 */
export default function ConfigurarHabitos() {
  const router = useRouter();
  const voltar = useVoltar();
  const rascunhos = useRascunhoPrimeiroUso((e) => e.rascunhos);
  const mudar = useRascunhoPrimeiroUso((e) => e.mudarHabito);
  const definirHabitos = useRascunhoPrimeiroUso((e) => e.definirHabitos);
  const [indice, setIndice] = useState(0);
  const [tocados, setTocados] = useState<Record<string, boolean>>({});

  const voltarPasso = () => (indice > 0 ? setIndice(indice - 1) : voltar());
  useVoltarInterno(indice > 0, voltarPasso);

  const r = rascunhos[indice];
  if (!r) return null;
  const erros = errosDoRascunho(r, rascunhos);
  const mostrar = (c: keyof typeof erros) => (tocados[`${indice}${c}`] ? erros[c] : undefined);
  const tocar = (c: string) => setTocados((t) => ({ ...t, [`${indice}${c}`]: true }));
  const ultimo = indice === rascunhos.length - 1;

  const seguir = () => {
    if (temErros(erros)) {
      for (const c of ['maxPorDia', 'unidade', 'diasAntes']) tocar(c);
      return;
    }
    if (!ultimo) {
      setIndice(indice + 1);
      return;
    }
    definirHabitos(criarHabitos(rascunhos));
    router.push('/boas-vindas/avaliacao');
  };

  return (
    <TelaPasso
      aoVoltar={voltarPasso}
      topo={
        rascunhos.length > 1 ? (
          <Texto tipo="legenda" accessibilityLiveRegion="polite">{`Hábito ${indice + 1} de ${rascunhos.length}`}</Texto>
        ) : undefined
      }
      rodape={<Botao onPress={seguir}>{ultimo ? 'Continuar' : 'Próximo hábito'}</Botao>}
    >
      <Chip ativo ponto cor={cores[r.cor]} style={styles.chip}>
        {r.apelido.trim() || 'Seu hábito'}
      </Chip>
      <Texto style={styles.titulo} accessibilityRole="header">
        Qual é a sua meta?
      </Texto>
      {r.tipo === 'sexual' ? (
        <Texto style={styles.sub}>
          Você decide a sua meta, sem julgamento. Por exemplo: parar a pornografia, ou reduzir a masturbação.
        </Texto>
      ) : null}
      <View style={styles.bloco}>
        <Segmento
          opcoes={[
            { valor: false, rotulo: 'Parar' },
            { valor: true, rotulo: 'Reduzir' },
          ]}
          valor={r.reduzir}
          onChange={(reduzir) => mudar(r.tipo, { reduzir })}
          accessibilityLabel="Meta"
        />
      </View>

      {r.reduzir ? (
        <View style={styles.bloco}>
          <Campo
            rotulo="Limite por dia"
            valor={r.maxPorDia}
            aoMudar={(maxPorDia) => {
              mudar(r.tipo, { maxPorDia });
              tocar('maxPorDia');
            }}
            aoSair={() => tocar('maxPorDia')}
            erro={mostrar('maxPorDia')}
            teclado="number-pad"
            placeholder="Ex.: 2"
            maxLength={4}
          />
          <Campo
            rotulo="Unidade"
            valor={r.unidade}
            aoMudar={(unidade) => {
              mudar(r.tipo, { unidade });
              tocar('unidade');
            }}
            aoSair={() => tocar('unidade')}
            erro={mostrar('unidade')}
            placeholder="cigarros, doses..."
            maxLength={20}
          />
        </View>
      ) : null}

      <Texto style={[styles.titulo, styles.tituloSeguinte]} accessibilityRole="header">
        Quando você começou?
      </Texto>
      <Texto style={styles.sub}>Se você já estava sem usar, esses dias contam para você.</Texto>
      <View style={styles.bloco}>
        <Segmento<Comecou>
          opcoes={[
            { valor: 'hoje', rotulo: 'Hoje' },
            { valor: 'ja', rotulo: 'Já estou há N dias' },
          ]}
          valor={r.comecou}
          onChange={(comecou) => mudar(r.tipo, { comecou })}
          accessibilityLabel="Quando você começou"
        />
      </View>
      {r.comecou === 'ja' ? (
        <Campo
          rotulo="Quantos dias?"
          valor={r.diasAntes}
          aoMudar={(diasAntes) => {
            mudar(r.tipo, { diasAntes });
            tocar('diasAntes');
          }}
          aoSair={() => tocar('diasAntes')}
          erro={mostrar('diasAntes')}
          teclado="number-pad"
          placeholder="Ex.: 12"
          maxLength={4}
        />
      ) : null}
    </TelaPasso>
  );
}

const styles = StyleSheet.create({
  chip: { alignSelf: 'flex-start' },
  titulo: { marginTop: 14, fontFamily: fontes.display, fontSize: 24, lineHeight: 29, letterSpacing: -0.48 },
  tituloSeguinte: { marginTop: 22 },
  sub: { marginTop: 8, fontSize: 14, lineHeight: 21, color: cores.muted },
  bloco: { marginTop: 16 },
});
