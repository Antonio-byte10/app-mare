import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Botao } from '@/components/Botao';
import { Chip } from '@/components/Chip';
import { Degrade } from '@/components/Degrade';
import { Deslizador } from '@/components/Deslizador';
import { Fundo } from '@/components/Fundo';
import { Humor, type ValorHumor } from '@/components/Humor';
import { Icone } from '@/components/Icone';
import { Segmento } from '@/components/Segmento';
import { Texto } from '@/components/Texto';
import { GATILHOS } from '@/conteudo/gatilhos';
import { estadoDoDia, normalizarRelatoHabito, resumoHabito } from '@/lib/contador';
import { dataLocal, dataValida, formatarData } from '@/lib/datas';
import {
  alternarGatilho,
  aplicarMudanca,
  erroQuantidade,
  habitoAberto,
  habitoComErro,
  habitosDoDia,
  montarRelato,
  perguntaUso,
  rascunhoInicial,
  resumoLinha,
  type Rascunho,
} from '@/lib/relato';
import type { Habito } from '@/lib/tipos';
import { useMare } from '@/store';
import { comAlfa, cores, fontes, margemTela } from '@/theme';

const SIM_NAO = [
  { valor: false, rotulo: 'Não' },
  { valor: true, rotulo: 'Sim' },
];

export default function RelatoDoDia() {
  const { dia: param } = useLocalSearchParams<{ dia: string | string[] }>();
  const dia = Array.isArray(param) ? param[0] : param;
  const [hoje] = useState(() => dataLocal(Date.now()));
  // Data inválida ou futura: volta para o Início.
  if (!dia || !dataValida(dia) || dia > hoje) return <Redirect href="/" />;
  return <Formulario dia={dia} hoje={hoje} />;
}

type Deslize = { apelido: string; totalLivres: number };

function Formulario({ dia, hoje }: { dia: string; hoje: string }) {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const habitos = useMare((e) => e.habitos);
  const existente = useMare((e) => e.relatos.find((r) => r.dia === dia));
  const salvarRelato = useMare((e) => e.salvarRelato);
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const ativos = habitosDoDia(habitos, dia);
  const [inicial] = useState(() => {
    const rs = rascunhoInicial(ativos, existente);
    const primeiro = habitoAberto(ativos, rs);
    // O bloco que abre expandido já conta como respondido (padrão: vontade 0, não usou).
    if (primeiro) rs[primeiro] = { ...rs[primeiro], respondido: true };
    return { rs, primeiro };
  });
  const [rascunhos, setRascunhos] = useState(inicial.rs);
  const [aberto, setAberto] = useState(inicial.primeiro);
  const [humor, setHumor] = useState<ValorHumor | undefined>(existente?.humor);
  const [gatilhos, setGatilhos] = useState(existente?.gatilhos ?? []);
  const [nota, setNota] = useState(existente?.nota ?? '');
  const [tocados, setTocados] = useState<Record<string, boolean>>({});
  const [deslizes, setDeslizes] = useState<Deslize[] | null>(null);

  const opcoesGatilho = [...GATILHOS, ...(existente?.gatilhos ?? []).filter((g) => !GATILHOS.includes(g))];
  const comErro = habitoComErro(ativos, rascunhos);
  const temErro = comErro !== undefined;
  const ehHoje = dia === hoje;

  // Só mexer no bloco marca o hábito como respondido; abrir para olhar não grava nada.
  const mudar = (id: string, p: Partial<Omit<Rascunho, 'respondido'>>) =>
    setRascunhos((rs) => aplicarMudanca(rs, id, p));
  const completar = (id: string) => {
    setTocados((t) => ({ ...t, [id]: true }));
    setAberto(id);
  };

  const salvar = () => {
    if (temErro || ativos.length === 0) return;
    salvarRelato(montarRelato({ dia, ativos, rascunhos, humor, gatilhos, nota, agora: Date.now(), existente }));
    // Total de dias livres calculado com o que acabou de ser salvo.
    const { relatos } = useMare.getState();
    const salvo = relatos.find((r) => r.dia === dia);
    const lista: Deslize[] = [];
    for (const h of ativos) {
      const entrada = salvo?.habitos.find((x) => x.habitoId === h.id);
      if (!entrada || !rascunhos[h.id]?.respondido) continue;
      if (estadoDoDia(h.meta, normalizarRelatoHabito(entrada)) === 'deslize') {
        lista.push({ apelido: h.apelido, totalLivres: resumoHabito(h, relatos, hoje).totalLivres });
      }
    }
    if (lista.length > 0) setDeslizes(lista);
    else voltar();
  };

  if (deslizes) {
    return (
      <Fundo>
        <View style={[styles.agradecimento, { paddingTop: top + 14, paddingBottom: Math.max(bottom, 12) + 22 }]}>
          <View style={styles.agradecimentoCorpo}>
            <Texto tipo="titulo" style={styles.centro}>
              Obrigado por registrar. Seus dias continuam contando.
            </Texto>
            <View style={styles.totais}>
              {deslizes.map((d) => (
                <Texto key={d.apelido} cor={cores.muted} style={styles.centro}>
                  {`${d.apelido}: ${d.totalLivres} ${d.totalLivres === 1 ? 'dia livre' : 'dias livres'} no total`}
                </Texto>
              ))}
            </View>
          </View>
          <Botao onPress={voltar}>Continuar</Botao>
        </View>
      </Fundo>
    );
  }

  return (
    <Fundo>
      <View style={[styles.tela, { paddingTop: top + 14 }]}>
        <View style={styles.cabecalho}>
          <Pressable onPress={voltar} accessibilityRole="button" accessibilityLabel="Voltar" style={styles.voltar}>
            <Icone nome="voltar" />
          </Pressable>
          <View style={styles.titulos}>
            <Texto tipo="titulo" style={styles.titulo}>
              {ehHoje ? 'Relato de hoje' : `Relato de ${formatarData(dia, { day: 'numeric', month: 'long' })}`}
            </Texto>
            <Texto tipo="legenda" style={styles.subtitulo}>
              {formatarData(
                dia,
                ehHoje ? { weekday: 'long', day: 'numeric', month: 'long' } : { weekday: 'long' },
              )}
            </Texto>
          </View>
          <View style={styles.espaco} />
        </View>

        {ativos.length === 0 ? (
          <View style={styles.vazio}>
            <Texto cor={cores.muted} style={styles.centro}>
              Nenhum hábito tinha começado nesse dia.
            </Texto>
            <Botao onPress={() => router.push('/habito/novo')}>Adicionar hábito</Botao>
          </View>
        ) : (
          <>
            <View style={styles.corpo}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.rolagem}
              >
                <View>
                  {ativos.map((h, i) => {
                    const r = rascunhos[h.id];
                    if (aberto === h.id) {
                      return (
                        <BlocoHabito
                          key={h.id}
                          habito={h}
                          separado={i > 0}
                          rascunho={r}
                          erro={tocados[h.id] ? erroQuantidade(h, r) : undefined}
                          aoMudar={(p) => mudar(h.id, p)}
                          aoTocarQuantidade={() => setTocados((t) => ({ ...t, [h.id]: true }))}
                        />
                      );
                    }
                    const proximoRecolhido = i + 1 < ativos.length && aberto !== ativos[i + 1].id;
                    return (
                      <Pressable
                        key={h.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${h.apelido}, ${resumoLinha(h, r)}`}
                        onPress={() => setAberto(h.id)}
                        style={[styles.mini, !proximoRecolhido && styles.miniUltimo]}
                      >
                        <View style={styles.linhaNome}>
                          <View style={[styles.ponto, { backgroundColor: cores[h.cor] }]} />
                          <Texto style={styles.miniNome}>{h.apelido}</Texto>
                        </View>
                        <Texto
                          style={styles.miniResumo}
                          cor={!r.respondido ? cores.aqua : erroQuantidade(h, r) ? cores.sand : cores.muted}
                        >
                          {resumoLinha(h, r)}
                        </Texto>
                      </Pressable>
                    );
                  })}
                </View>

                <View>
                  <Texto style={styles.rotulo}>Como você se sentiu?</Texto>
                  <Humor valor={humor} onChange={setHumor} />
                </View>

                <View>
                  <Texto style={styles.rotulo}>O que mexeu com você?</Texto>
                  <View style={styles.chips}>
                    {opcoesGatilho.map((g) => (
                      <Chip
                        key={g}
                        ativo={gatilhos.includes(g)}
                        cor={cores.peri}
                        onPress={() => setGatilhos((gs) => alternarGatilho(gs, g))}
                      >
                        {g}
                      </Chip>
                    ))}
                  </View>
                </View>

                <View>
                  <Texto style={styles.rotulo}>Quer anotar algo? (opcional)</Texto>
                  <TextInput
                    accessibilityLabel="Nota do dia"
                    value={nota}
                    onChangeText={setNota}
                    multiline
                    maxLength={500}
                    placeholder="Como foi o dia"
                    placeholderTextColor={cores.faint}
                    textAlignVertical="top"
                    style={styles.nota}
                  />
                </View>
              </ScrollView>
              {/* `.fade` do mockup: a rolagem some devagar sob o botão. */}
              <View pointerEvents="none" style={styles.fade}>
                <Degrade de={comAlfa(cores.bg, 0)} para={cores.bg} />
              </View>
            </View>
            <View style={[styles.rodape, { paddingBottom: Math.max(bottom, 12) + 10 }]}>
              {comErro ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Falta a quantidade de ${comErro.apelido}. Toque para completar.`}
                  onPress={() => completar(comErro.id)}
                >
                  <Texto tipo="legenda" cor={cores.sand} style={styles.centro}>
                    {`Falta a quantidade de ${comErro.apelido}. Toque para completar.`}
                  </Texto>
                </Pressable>
              ) : null}
              <Botao
                onPress={salvar}
                desabilitado={temErro}
                accessibilityLabel={comErro ? `Salvar relato. Falta a quantidade de ${comErro.apelido}.` : undefined}
              >
                Salvar relato
              </Botao>
            </View>
          </>
        )}
      </View>
    </Fundo>
  );
}

type BlocoProps = {
  habito: Habito;
  /** Há outro hábito antes dele: abre um respiro depois da linha recolhida. */
  separado: boolean;
  rascunho: Rascunho;
  erro?: string;
  aoMudar: (p: Partial<Omit<Rascunho, 'respondido'>>) => void;
  aoTocarQuantidade: () => void;
};

/** Hábito expandido: vontade, uso e, na meta reduzir, a quantidade. */
function BlocoHabito({ habito, separado, rascunho, erro, aoMudar, aoTocarQuantidade }: BlocoProps) {
  return (
    <View style={[styles.bloco, separado && styles.blocoSeparado]}>
      <View style={[styles.linhaNome, styles.blocoTitulo]}>
        <View style={[styles.ponto, { backgroundColor: cores[habito.cor] }]} />
        <Texto style={styles.blocoNome}>{habito.apelido}</Texto>
      </View>

      <Texto style={styles.rotulo}>Quanta vontade você sentiu hoje?</Texto>
      <Deslizador
        valor={rascunho.vontade}
        onChange={(vontade) => aoMudar({ vontade })}
        pontas={['nenhuma', 'muita']}
        accessibilityLabel={`Vontade de ${habito.apelido}, de 0 a 10`}
      />

      <Texto style={[styles.rotulo, styles.rotuloSeguinte]}>{perguntaUso(habito.tipo)}</Texto>
      <Segmento
        opcoes={SIM_NAO}
        valor={rascunho.usou}
        onChange={(usou) => aoMudar({ usou })}
        accessibilityLabel={perguntaUso(habito.tipo)}
      />

      {habito.meta.tipo === 'reduzir' && rascunho.usou ? (
        <View>
          <Texto style={[styles.rotulo, styles.rotuloSeguinte]}>{`Quantidade de ${habito.meta.unidade}`}</Texto>
          <TextInput
            accessibilityLabel={`Quantidade de ${habito.meta.unidade}`}
            value={rascunho.quantidade}
            onChangeText={(quantidade) => {
              aoMudar({ quantidade });
              aoTocarQuantidade();
            }}
            onBlur={aoTocarQuantidade}
            keyboardType="number-pad"
            maxLength={4}
            placeholder={`Ex.: ${habito.meta.maxPorDia}`}
            placeholderTextColor={cores.faint}
            style={[styles.input, erro ? { borderColor: cores.sand } : null]}
          />
          {erro ? (
            <Texto tipo="legenda" cor={cores.sand} accessibilityLiveRegion="polite" style={styles.erro}>
              {erro}
            </Texto>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: margemTela,
  },
  voltar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,.035)',
    borderWidth: 1,
    borderColor: cores.line,
  },
  espaco: { width: 40 },
  titulos: { flex: 1, alignItems: 'center' },
  titulo: { fontSize: 19, lineHeight: 24, letterSpacing: -0.3, textAlign: 'center' },
  subtitulo: { fontSize: 12, lineHeight: 16, marginTop: 2, textAlign: 'center' },
  corpo: { flex: 1, minHeight: 0, marginTop: 22 },
  rolagem: { paddingHorizontal: margemTela, paddingBottom: 48, gap: 22 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 40, overflow: 'hidden' },
  rodape: { paddingHorizontal: margemTela, paddingTop: 14, gap: 10 },
  bloco: { paddingBottom: 22 },
  blocoSeparado: { paddingTop: 18 },
  blocoTitulo: { marginBottom: 14 },
  linhaNome: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ponto: { width: 7, height: 7, borderRadius: 3.5 },
  blocoNome: { fontFamily: fontes.uiForte, fontSize: 15, lineHeight: 20 },
  rotulo: { fontFamily: fontes.uiForte, fontSize: 13.5, lineHeight: 18, marginBottom: 12 },
  rotuloSeguinte: { marginTop: 18 },
  mini: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderColor: cores.line,
  },
  miniUltimo: { borderBottomWidth: 1 },
  miniNome: { fontSize: 14, lineHeight: 18 },
  miniResumo: { fontSize: 12.5, lineHeight: 16, flexShrink: 1, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  input: {
    height: 52,
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: cores.line2,
    backgroundColor: 'rgba(255,255,255,.03)',
    color: cores.text,
    fontFamily: fontes.ui,
    fontSize: 14.5,
  },
  erro: { marginTop: 6 },
  nota: {
    minHeight: 84,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: cores.line2,
    backgroundColor: 'rgba(255,255,255,.03)',
    color: cores.text,
    fontFamily: fontes.ui,
    fontSize: 14.5,
    lineHeight: 21,
  },
  vazio: { flex: 1, justifyContent: 'center', gap: 22, paddingHorizontal: margemTela },
  centro: { textAlign: 'center' },
  agradecimento: { flex: 1, paddingHorizontal: margemTela },
  agradecimentoCorpo: { flex: 1, justifyContent: 'center', gap: 22 },
  totais: { gap: 6 },
});
