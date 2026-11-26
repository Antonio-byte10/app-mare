import { randomUUID } from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
  type TextInputInstance,
} from 'react-native';
import { CartaoCrise } from '@/components/CartaoCrise';
import { Chip } from '@/components/Chip';
import { Digitando, MensagemMare, MensagemPessoa, NotaMare } from '@/components/ConversaBlocos';
import { Icone } from '@/components/Icone';
import { Simbolo } from '@/components/Simbolo';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { confirmar } from '@/lib/confirmar';
import { detectarCrise, type TipoCrise } from '@/lib/crise';
import { dataLocal } from '@/lib/datas';
import { conversar } from '@/lib/ia/conversar';
import { montarContexto } from '@/lib/ia/contexto';
import type { TipoErroIa } from '@/lib/ia/erros';
import { NOME_PROVEDOR } from '@/lib/ia/modelos';
import { habitoAtivoDe } from '@/lib/inicio';
import { useMare } from '@/store';
import { comAlfa, cores, fontes } from '@/theme';

/** Itens só da sessão (não vão para o disco): o cartão de crise e os avisos da Maré. */
type Extra = { id: string; aposId: string | null } & (
  | { tipo: 'crise'; crise: TipoCrise }
  | { tipo: 'erro'; texto: string; respiro: boolean; tipoErro?: TipoErroIa }
);

/** Erros que se resolvem nos ajustes de IA (chave, código, modelo, crédito). */
const ERROS_DE_AJUSTE: TipoErroIa[] = ['chave', 'credito', 'modelo', 'codigo', 'tentativas', 'servidorConfig'];

const ESPERA_SERVIDOR_MS = 5000;

const COMECOS = [
  'Estou com muita vontade agora.',
  'Tive um deslize e quero entender o que aconteceu.',
  'Quero lembrar por que comecei.',
];

export default function Conversa() {
  const router = useRouter();
  const { inicio } = useLocalSearchParams<{ inicio?: string }>();
  const ia = useMare((e) => e.ajustes.ia);
  const mensagens = useMare((e) => e.conversa);
  const adicionarMensagem = useMare((e) => e.adicionarMensagem);
  const limparConversa = useMare((e) => e.limparConversa);

  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [stream, setStream] = useState<string | null>(null);
  const [acordando, setAcordando] = useState(false);
  const [extras, setExtras] = useState<Extra[]>([]);

  const rolagem = useRef<ScrollViewInstance>(null);
  const campo = useRef<TextInputInstance>(null);
  // Só rola sozinho quando a pessoa está no fim: quem sobe para reler não é puxado de volta.
  const noFim = useRef(true);
  // Cada pedido tem um número; limpar a conversa ou pedir de novo invalida o anterior.
  const geracao = useRef(0);
  const controle = useRef<AbortController | null>(null);
  const relogio = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(relogio.current);
    },
    [],
  );

  // "Recomeçar com cuidado" navega para /conversa?inicio=...: pré-preenche o campo (uma vez por valor).
  const [inicioAplicado, setInicioAplicado] = useState('');
  if (inicio && inicio !== inicioAplicado) {
    setInicioAplicado(inicio);
    setTexto(inicio);
  } else if (!inicio && inicioAplicado) {
    setInicioAplicado('');
  }
  useEffect(() => {
    if (!inicio) return;
    router.setParams({ inicio: '' });
    // Sem limpar o temporizador: o setParams acima refaz o efeito e cancelaria o foco.
    setTimeout(() => campo.current?.focus(), 150);
  }, [inicio, router]);

  const ultima = mensagens[mensagens.length - 1];

  const pedirResposta = useCallback(async () => {
    if (!ia) return;
    const minha = ++geracao.current;
    controle.current?.abort();
    const ctl = new AbortController();
    controle.current = ctl;
    clearTimeout(relogio.current);
    setEnviando(true);
    setStream('');
    setAcordando(false);
    setExtras((atual) => atual.filter((x) => x.tipo !== 'erro'));
    // O servidor gratuito do Render pode levar até 1 minuto para acordar: avisa depois de ~5 s sem resposta.
    if (ia.modo === 'servidor') {
      relogio.current = setTimeout(() => {
        if (geracao.current === minha) setAcordando(true);
      }, ESPERA_SERVIDOR_MS);
    }

    const estado = useMare.getState();
    const habito = habitoAtivoDe(estado.habitos, estado.ajustes.habitoAtivo);
    const r = await conversar({
      ajustes: ia,
      historico: estado.conversa.map(({ papel, texto: t }) => ({ papel, texto: t })),
      contexto: montarContexto(habito, estado.relatos, dataLocal(Date.now())),
      sinal: ctl.signal,
      aoTexto: (acumulado) => {
        if (geracao.current !== minha) return;
        clearTimeout(relogio.current);
        setAcordando(false);
        setStream(acumulado);
      },
    });
    clearTimeout(relogio.current);
    if (geracao.current !== minha) return;
    setStream(null);
    setEnviando(false);
    setAcordando(false);

    // Salva só mensagens completas.
    if (r.fim === 'ok') {
      const resposta = { id: randomUUID(), papel: 'ia' as const, texto: r.texto, em: Date.now() };
      adicionarMensagem(resposta);
      // Detecção local também no que a IA escreve, independente do que ela diga.
      const crise = detectarCrise(r.texto);
      if (crise) setExtras((atual) => [...atual, { id: randomUUID(), aposId: resposta.id, tipo: 'crise', crise }]);
    } else {
      const aposId = useMare.getState().conversa.at(-1)?.id ?? null;
      setExtras((atual) => [
        ...atual,
        { id: randomUUID(), aposId, tipo: 'erro', texto: r.erro ?? '', respiro: r.oferecerRespiro !== false, tipoErro: r.tipoErro },
      ]);
    }
  }, [ia, adicionarMensagem]);

  const enviar = () => {
    const t = texto.trim();
    if (!t || enviando || !ia) return;
    // A detecção de crise roda antes de enviar, no texto da pessoa; a mensagem segue mesmo assim.
    const crise = detectarCrise(t);
    const mensagem = { id: randomUUID(), papel: 'usuario' as const, texto: t, em: Date.now() };
    adicionarMensagem(mensagem);
    if (crise) setExtras((atual) => [...atual, { id: randomUUID(), aposId: mensagem.id, tipo: 'crise', crise }]);
    setTexto('');
    noFim.current = true;
    void pedirResposta();
  };

  const apagar = () => {
    confirmar(
      'Apagar a conversa?',
      'As mensagens guardadas neste celular serão apagadas. Isso não pode ser desfeito.',
      'Apagar',
      () => {
        geracao.current++;
        controle.current?.abort();
        clearTimeout(relogio.current);
        limparConversa();
        setExtras([]);
        setStream(null);
        setEnviando(false);
        setAcordando(false);
      },
    );
  };

  const preencher = (t: string) => {
    setTexto(t);
    setTimeout(() => campo.current?.focus(), 50);
  };

  const aoRolar = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    noFim.current = contentSize.height - (contentOffset.y + layoutMeasurement.height) < 80;
  };
  const rolarAoFim = () => {
    if (noFim.current) rolagem.current?.scrollToEnd({ animated: true });
  };

  const rotulo = useMemo(() => (ia ? `${NOME_PROVEDOR[ia.provedor]} · ${ia.modo === 'direto' ? 'sua chave' : 'seu servidor'}` : ''), [ia]);

  if (!ia) {
    return (
      <Tela>
        <Texto tipo="titulo" accessibilityRole="header">
          Conversa
        </Texto>
        <Texto tipo="legenda" style={styles.convite}>
          A conversa usa a sua própria IA. Ela é opcional: o Maré funciona por inteiro sem ela.
        </Texto>
        <Chip onPress={() => router.push('/ia')} style={styles.chipConvite}>
          Configurar a IA
        </Chip>
      </Tela>
    );
  }

  const crisesApos = (id: string | null) => extras.filter((x) => x.aposId === id);
  const renderExtras = (id: string | null) =>
    crisesApos(id).map((x) =>
      x.tipo === 'crise' ? (
        <CartaoCrise key={x.id} tipo={x.crise} aoFechar={() => setExtras((atual) => atual.filter((y) => y.id !== x.id))} />
      ) : (
        <NotaMare key={x.id} texto={x.texto}>
          <View style={styles.acoes}>
            {x.respiro ? (
              <Chip ativo onPress={() => router.push('/fissura')}>
                Respirar agora
              </Chip>
            ) : null}
            {x.tipoErro && ERROS_DE_AJUSTE.includes(x.tipoErro) ? (
              <Chip onPress={() => router.push('/ia')}>Ajustes de IA</Chip>
            ) : ultima?.papel === 'usuario' ? (
              <Chip onPress={() => void pedirResposta()}>Tentar de novo</Chip>
            ) : null}
          </View>
        </NotaMare>
      ),
    );

  const vazio = mensagens.length === 0 && extras.length === 0 && stream === null;
  const podeEnviar = texto.trim() !== '' && !enviando;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <Tela>
        <View style={styles.topo}>
          <View style={styles.flex}>
            <Texto tipo="titulo" style={styles.titulo} accessibilityRole="header">
              Conversa
            </Texto>
            <View style={styles.subtitulo} accessible accessibilityLabel={`Conectada: ${rotulo}`}>
              <View style={styles.ponto} />
              <Texto tipo="legenda" style={styles.subtituloTexto}>
                {rotulo}
              </Texto>
            </View>
          </View>
          <Pressable
            onPress={apagar}
            disabled={mensagens.length === 0}
            accessibilityRole="button"
            accessibilityLabel="Apagar a conversa"
            accessibilityState={{ disabled: mensagens.length === 0 }}
            hitSlop={4}
            style={[styles.lixeira, mensagens.length === 0 && styles.desligado]}
          >
            <Icone nome="lixeira" />
          </Pressable>
        </View>

        <ScrollView
          ref={rolagem}
          style={styles.flex}
          contentContainerStyle={styles.lista}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          onScroll={aoRolar}
          scrollEventThrottle={64}
          onContentSizeChange={rolarAoFim}
          onLayout={rolarAoFim}
        >
          {vazio ? (
            <View style={styles.vazio}>
              <Simbolo tamanho={56} />
              <Texto tipo="titulo" style={styles.vazioTitulo}>
                Oi. Eu sou a Maré.
              </Texto>
              <Texto tipo="legenda" style={styles.vazioTexto}>
                Pode falar do seu dia, de uma vontade que apertou ou só pensar em voz alta. Eu escuto, sem julgar.
              </Texto>
              <View style={styles.comecos}>
                {COMECOS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => preencher(c)}
                    accessibilityRole="button"
                    accessibilityLabel={`Começar com: ${c}`}
                    style={({ pressed }) => [styles.comeco, pressed && styles.comecoPressionado]}
                  >
                    <Texto style={styles.comecoTexto}>{c}</Texto>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <>
              {renderExtras(null)}
              {mensagens.map((m) => (
                <View key={m.id} style={styles.item}>
                  {m.papel === 'usuario' ? <MensagemPessoa texto={m.texto} /> : <MensagemMare texto={m.texto} />}
                  {renderExtras(m.id)}
                </View>
              ))}
              {stream !== null ? (
                stream === '' ? (
                  <MensagemMare>
                    <Digitando />
                    {acordando ? (
                      <Texto tipo="legenda" accessibilityLiveRegion="polite" style={styles.acordando}>
                        O servidor está acordando, pode levar até 1 minuto.
                      </Texto>
                    ) : null}
                  </MensagemMare>
                ) : (
                  <MensagemMare texto={stream} />
                )
              ) : null}
              {!enviando && ultima?.papel === 'ia' ? (
                <View style={styles.acoes}>
                  <Chip ativo onPress={() => router.push('/fissura')}>
                    Respirar 1 minuto
                  </Chip>
                  <Chip onPress={() => preencher('O que pesou hoje foi ')}>Contar o que pesou</Chip>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>

        <View style={styles.rodape}>
          <View style={styles.entrada}>
            <TextInput
              ref={campo}
              value={texto}
              onChangeText={setTexto}
              placeholder="Escreva aqui"
              placeholderTextColor={cores.faint}
              accessibilityLabel="Escreva sua mensagem"
              multiline
              maxLength={2000}
              selectionColor={cores.aqua}
              style={styles.campo}
            />
            <Pressable
              onPress={enviar}
              disabled={!podeEnviar}
              accessibilityRole="button"
              accessibilityLabel="Enviar mensagem"
              accessibilityState={{ disabled: !podeEnviar }}
              hitSlop={6}
              style={({ pressed }) => [styles.enviar, !podeEnviar && styles.desligado, { transform: [{ scale: pressed ? 0.96 : 1 }] }]}
            >
              <Icone nome="setaDireita" tamanho={18} traco={2} cor={cores.tinta} />
            </Pressable>
          </View>
          <Texto tipo="legenda" style={styles.aviso}>
            A IA apoia, mas não substitui um profissional.
          </Texto>
        </View>
      </Tela>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titulo: { fontSize: 22, lineHeight: 27 },
  subtitulo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  subtituloTexto: { fontSize: 12, lineHeight: 16 },
  ponto: { width: 6, height: 6, borderRadius: 3, backgroundColor: cores.foam },
  lixeira: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,.035)',
    borderWidth: 1,
    borderColor: cores.line,
  },
  desligado: { opacity: 0.4 },
  lista: { flexGrow: 1, gap: 12, paddingTop: 22, paddingBottom: 12 },
  item: { gap: 12 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  acordando: { marginTop: 6 },
  vazio: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, paddingBottom: 24 },
  vazioTitulo: { textAlign: 'center' },
  vazioTexto: { textAlign: 'center', maxWidth: 300 },
  comecos: { alignSelf: 'stretch', gap: 8, marginTop: 12 },
  comeco: {
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cores.line2,
    backgroundColor: 'rgba(255,255,255,.03)',
  },
  comecoPressionado: { backgroundColor: comAlfa(cores.aqua, 0.08) },
  comecoTexto: { fontSize: 14, lineHeight: 20, color: cores.muted },
  // O rodapé fica logo acima da barra de abas (que fica no fluxo, não por cima) e do teclado.
  rodape: { gap: 10, paddingTop: 8, paddingBottom: 10 },
  entrada: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    minHeight: 52,
    borderRadius: 18,
    paddingVertical: 7,
    paddingLeft: 16,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: cores.line2,
    backgroundColor: 'rgba(255,255,255,.03)',
  },
  campo: {
    flex: 1,
    minHeight: 38,
    maxHeight: 120,
    paddingVertical: 9,
    color: cores.text,
    fontFamily: fontes.ui,
    fontSize: 14.5,
    lineHeight: 20,
  },
  enviar: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.aqua,
  },
  aviso: { textAlign: 'center', fontSize: 11, lineHeight: 15, color: cores.faint },
  convite: { marginTop: 8 },
  chipConvite: { marginTop: 16 },
});
