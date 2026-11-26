import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Chip } from '@/components/Chip';
import { Fundo } from '@/components/Fundo';
import { Icone } from '@/components/Icone';
import { IaCampo } from '@/components/IaCampo';
import { Segmento } from '@/components/Segmento';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { confirmar } from '@/lib/confirmar';
import { comoErroIa, mensagemDoErro } from '@/lib/ia/erros';
import { listarModelos, MODELO_PADRAO, NOME_PROVEDOR } from '@/lib/ia/modelos';
import { buscarExpo } from '@/lib/ia/rede';
import { apagarTodosSegredos, gravarChave, gravarCodigoServidor, lerChave, lerCodigoServidor } from '@/lib/ia/segredos';
import { enderecoValido, normalizarEndereco, testarServidor } from '@/lib/ia/servidor';
import {
  AVISO_COMUM,
  AVISO_PRIVACIDADE,
  AVISO_SERVIDOR,
  COMO_CONSEGUIR_CHAVE,
  COMO_CRIAR_SERVIDOR,
} from '@/lib/ia/textos';
import type { ModeloIa, Provedor } from '@/lib/ia/tipos';
import { useMare } from '@/store';
import { comAlfa, cores, fontes } from '@/theme';

type Status = { tipo: 'ocioso' | 'carregando' | 'ok' | 'erro'; texto: string };
const OCIOSO: Status = { tipo: 'ocioso', texto: '' };

const PRAZO_TESTE_CHAVE_MS = 25_000;
// O Render gratuito pode levar até 1 minuto para acordar.
const PRAZO_TESTE_SERVIDOR_MS = 75_000;

const PROVEDORES: { valor: Provedor; rotulo: string }[] = [
  { valor: 'gemini', rotulo: 'Gemini' },
  { valor: 'openai', rotulo: 'ChatGPT' },
  { valor: 'claude', rotulo: 'Claude' },
];

const nomeDe = (p: string | undefined): Provedor | undefined => (p === 'gemini' || p === 'openai' || p === 'claude' ? p : undefined);

/** Mensagem de estado em uma frase, anunciada por leitores de tela. */
function Mensagem({ status }: { status: Status }) {
  if (status.tipo === 'ocioso') return null;
  const cor = status.tipo === 'ok' ? cores.foam : status.tipo === 'erro' ? cores.sand : cores.muted;
  return (
    <View style={styles.mensagem} accessible accessibilityLiveRegion="polite">
      {status.tipo === 'ok' ? <Icone nome="check" tamanho={16} cor={cor} /> : null}
      <Texto tipo="legenda" cor={cor} style={styles.mensagemTexto}>
        {status.texto}
      </Texto>
    </View>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.secao}>
      <Texto style={styles.grupo} accessibilityRole="header">
        {titulo}
      </Texto>
      {children}
    </View>
  );
}

export default function AjustesIa() {
  const router = useRouter();
  const ia = useMare((e) => e.ajustes.ia);
  const setAjustes = useMare((e) => e.setAjustes);

  const [provedor, setProvedor] = useState<Provedor>(ia?.provedor ?? 'gemini');
  const [modo, setModo] = useState<'direto' | 'servidor'>(ia?.modo ?? 'direto');
  const [modelo, setModelo] = useState(ia?.modelo ?? MODELO_PADRAO[ia?.provedor ?? 'gemini']);
  const [modelos, setModelos] = useState<ModeloIa[] | null>(null);
  const [chave, setChave] = useState('');
  const [chaveGuardada, setChaveGuardada] = useState(false);
  const [endereco, setEndereco] = useState(ia?.endereco ?? '');
  const [codigo, setCodigo] = useState('');
  const [codigoGuardado, setCodigoGuardado] = useState(false);
  const [avisoLido, setAvisoLido] = useState(ia?.avisoVisto === true);
  const [comoAberto, setComoAberto] = useState(false);
  const [testeChave, setTesteChave] = useState<Status>(OCIOSO);
  const [testeServidor, setTesteServidor] = useState<Status>(OCIOSO);
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<Status>(OCIOSO);

  // Cancela testes em andamento ao sair da tela ou ao trocar de provedor/modo.
  const emCurso = useRef<AbortController | null>(null);
  const cancelar = useCallback(() => {
    emCurso.current?.abort();
    emCurso.current = null;
  }, []);
  useEffect(() => cancelar, [cancelar]);

  // O que já está guardado no cofre (nunca mostramos o valor, só avisamos que existe).
  useEffect(() => {
    let ativo = true;
    lerChave(provedor).then((v) => ativo && setChaveGuardada(!!v));
    return () => {
      ativo = false;
    };
  }, [provedor]);
  useEffect(() => {
    let ativo = true;
    lerCodigoServidor().then((v) => ativo && setCodigoGuardado(!!v));
    return () => {
      ativo = false;
    };
  }, []);

  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const trocarProvedor = (p: Provedor) => {
    if (p === provedor) return;
    cancelar();
    setProvedor(p);
    setModelo(ia?.provedor === p ? ia.modelo : MODELO_PADRAO[p]);
    setModelos(null);
    setChave('');
    setTesteChave(OCIOSO);
    setResultado(OCIOSO);
    // O aviso é específico do provedor: só vale se já foi lido para este.
    setAvisoLido(ia?.avisoVisto === true && ia.provedor === p);
  };

  const trocarModo = (m: 'direto' | 'servidor') => {
    cancelar();
    setModo(m);
    setResultado(OCIOSO);
  };

  /** Executa `fn` com um sinal que aborta no prazo ou ao sair da tela. */
  const comPrazo = async <T,>(prazoMs: number, fn: (sinal: AbortSignal) => Promise<T>): Promise<T> => {
    cancelar();
    const controle = new AbortController();
    emCurso.current = controle;
    const relogio = setTimeout(() => controle.abort(), prazoMs);
    try {
      return await fn(controle.signal);
    } finally {
      clearTimeout(relogio);
      if (emCurso.current === controle) emCurso.current = null;
    }
  };

  const testarChave = async () => {
    const valor = chave.trim() || (await lerChave(provedor)) || '';
    if (!valor) {
      setTesteChave({ tipo: 'erro', texto: 'Cole a sua chave no campo acima para testar.' });
      return;
    }
    setTesteChave({ tipo: 'carregando', texto: 'Testando a chave…' });
    try {
      const lista = await comPrazo(PRAZO_TESTE_CHAVE_MS, (sinal) => listarModelos({ provedor, chave: valor, buscar: buscarExpo, sinal }));
      setModelos(lista);
      if (!lista.some((m) => m.id === modelo)) setModelo(lista[0]!.id);
      setTesteChave({ tipo: 'ok', texto: 'Chave funcionando. Escolha o modelo abaixo.' });
    } catch (e) {
      setTesteChave({ tipo: 'erro', texto: mensagemDoErro(comoErroIa(e).tipo) });
    }
  };

  const testarConexao = async () => {
    if (!enderecoValido(endereco)) {
      setTesteServidor({ tipo: 'erro', texto: 'Use um endereço que comece com https://, como https://mare-ia.onrender.com.' });
      return;
    }
    const valor = codigo.trim() || (await lerCodigoServidor()) || '';
    setTesteServidor({ tipo: 'carregando', texto: 'Conectando… o servidor gratuito leva até 1 minuto para acordar.' });
    const r = await comPrazo(PRAZO_TESTE_SERVIDOR_MS, (sinal) => testarServidor({ buscar: buscarExpo, endereco, codigo: valor, sinal }));
    if (r.ok) {
      // O servidor sabe qual IA usa: ajusta o provedor e o modelo sozinho.
      const p = nomeDe(r.provedor);
      if (p) setProvedor(p);
      if (r.modelo) setModelo(r.modelo);
      const detalhe = p && r.modelo ? ` Usando ${NOME_PROVEDOR[p]}, modelo ${r.modelo}.` : '';
      setTesteServidor({ tipo: 'ok', texto: r.mensagem + detalhe });
    } else {
      setTesteServidor({ tipo: 'erro', texto: r.mensagem });
    }
  };

  const aviso = AVISO_PRIVACIDADE[provedor];
  const enderecoPreenchido = endereco.trim() !== '';
  const configOk =
    modo === 'direto'
      ? (chave.trim() !== '' || chaveGuardada) && modelo.trim() !== ''
      : enderecoValido(endereco) && (codigo.trim() !== '' || codigoGuardado);
  const podeSalvar = configOk && avisoLido && !salvando;
  const pendencia = !configOk
    ? modo === 'direto'
      ? 'Cole a sua chave para poder salvar.'
      : 'Preencha o endereço (https://) e o código de acesso para poder salvar.'
    : !avisoLido
      ? 'Leia o aviso de privacidade e toque em "Entendi" para poder salvar.'
      : '';

  const salvar = async () => {
    if (!podeSalvar) return;
    setSalvando(true);
    setResultado(OCIOSO);
    try {
      if (modo === 'direto') {
        if (chave.trim()) await gravarChave(provedor, chave);
        setAjustes({ ia: { provedor, modo, modelo: modelo.trim(), avisoVisto: true } });
      } else {
        if (codigo.trim()) await gravarCodigoServidor(codigo);
        setAjustes({
          ia: { provedor, modo, modelo: modelo.trim() || MODELO_PADRAO[provedor], endereco: normalizarEndereco(endereco), avisoVisto: true },
        });
      }
      setChave('');
      setCodigo('');
      if (modo === 'direto') setChaveGuardada(true);
      else setCodigoGuardado(true);
      setResultado({ tipo: 'ok', texto: 'Pronto. A aba Conversa já está disponível.' });
    } catch {
      setResultado({ tipo: 'erro', texto: 'Não consegui guardar a chave com segurança neste aparelho. Tente de novo.' });
    } finally {
      setSalvando(false);
    }
  };

  const desligar = () => {
    confirmar(
      'Desligar a IA?',
      'A chave e o código guardados neste aparelho serão apagados e a aba Conversa deixa de aparecer. O histórico da conversa continua guardado até você apagá-lo.',
      'Desligar',
      async () => {
        await apagarTodosSegredos();
        setAjustes({ ia: undefined });
        setChave('');
        setCodigo('');
        setChaveGuardada(false);
        setCodigoGuardado(false);
        setModelos(null);
        setTesteChave(OCIOSO);
        setTesteServidor(OCIOSO);
        setAvisoLido(false);
        setResultado({ tipo: 'ok', texto: 'IA desligada. O app segue funcionando por inteiro, sem ela.' });
      },
    );
  };

  const como = COMO_CONSEGUIR_CHAVE[provedor];

  return (
    <Fundo>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Tela>
          <View style={styles.topo}>
            <Pressable onPress={voltar} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={4} style={styles.voltar}>
              <Icone nome="voltar" />
            </Pressable>
            <Texto tipo="titulo" style={styles.titulo} accessibilityRole="header">
              Inteligência artificial
            </Texto>
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.rolagem}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <Texto tipo="legenda" style={styles.intro}>
              É opcional. O Maré funciona por inteiro sem IA. Se quiser conversar, use a sua própria IA: ela aparece na aba Conversa.
            </Texto>

            <Secao titulo="Qual IA">
              <Segmento opcoes={PROVEDORES} valor={provedor} onChange={trocarProvedor} accessibilityLabel="Provedor de IA" />
              {modo === 'servidor' ? (
                <Texto tipo="legenda" style={styles.apoio}>
                  Escolha a mesma que está em IA_PROVEDOR no Render. Ao testar a conexão, eu ajusto sozinho.
                </Texto>
              ) : null}
            </Secao>

            <Secao titulo="Como conectar">
              <Segmento
                opcoes={[
                  { valor: 'direto', rotulo: 'Direto' },
                  { valor: 'servidor', rotulo: 'Meu servidor' },
                ]}
                valor={modo}
                onChange={trocarModo}
                accessibilityLabel="Modo de conexão"
              />
              <Texto tipo="legenda" style={styles.apoio}>
                {modo === 'direto'
                  ? 'Direto: a chave fica guardada com segurança neste celular e a conversa vai direto ao provedor.'
                  : 'Meu servidor: a chave fica no seu servidor no Render, e o app guarda só o endereço e o código de acesso.'}
              </Texto>
            </Secao>

            {modo === 'direto' ? (
              <>
                <Secao titulo={`Chave do ${NOME_PROVEDOR[provedor]}`}>
                  <IaCampo
                    accessibilityLabel={`Chave de API do ${NOME_PROVEDOR[provedor]}`}
                    value={chave}
                    onChangeText={(t) => {
                      setChave(t);
                      setModelos(null);
                      setTesteChave(OCIOSO);
                    }}
                    placeholder={chaveGuardada ? 'Chave guardada neste aparelho' : 'Cole a chave aqui'}
                    secureTextEntry
                    autoCapitalize="none"
                    textContentType="password"
                  />
                  <Botao variante="secundario" onPress={testarChave} desabilitado={testeChave.tipo === 'carregando'} style={styles.botaoSecao}>
                    {testeChave.tipo === 'carregando' ? 'Testando…' : 'Testar chave'}
                  </Botao>
                  <Mensagem status={testeChave} />

                  <Texto tipo="legenda" style={styles.rotuloModelo}>
                    Modelo
                  </Texto>
                  {modelos ? (
                    <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Modelo de IA">
                      {modelos.map((m) => (
                        <Chip
                          key={m.id}
                          ativo={m.id === modelo}
                          onPress={() => setModelo(m.id)}
                          accessibilityLabel={`${m.nome}${m.id === MODELO_PADRAO[provedor] ? ', sugerido' : ''}`}
                        >
                          {m.id === MODELO_PADRAO[provedor] ? `${m.nome} · sugerido` : m.nome}
                        </Chip>
                      ))}
                    </View>
                  ) : (
                    <Texto tipo="legenda" cor={cores.text}>
                      {modelo}
                      {modelo === MODELO_PADRAO[provedor] ? ' (sugerido)' : ''}
                    </Texto>
                  )}
                  {modelos ? null : (
                    <Texto tipo="legenda" style={styles.apoio}>
                      Toque em Testar chave para ver os modelos disponíveis na sua conta.
                    </Texto>
                  )}
                </Secao>

                <Pressable
                  onPress={() => setComoAberto((v) => !v)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: comoAberto }}
                  accessibilityLabel="Como conseguir minha chave"
                  style={styles.recolhivel}
                >
                  <Texto style={styles.recolhivelTitulo}>Como conseguir minha chave</Texto>
                  <View style={{ transform: [{ rotate: comoAberto ? '90deg' : '0deg' }] }}>
                    <Icone nome="avancar" tamanho={18} cor={cores.faint} />
                  </View>
                </Pressable>
                {comoAberto ? (
                  <View style={styles.passos}>
                    <Texto style={styles.passoTitulo}>{como.titulo}</Texto>
                    {como.passos.map((p, i) => (
                      <View key={i} style={styles.passo}>
                        <Texto tipo="legenda" cor={cores.aqua} style={styles.passoNumero}>
                          {i + 1}
                        </Texto>
                        <Texto tipo="legenda" cor={cores.text} style={styles.flex}>
                          {p}
                        </Texto>
                      </View>
                    ))}
                    <Botao
                      variante="secundario"
                      onPress={() => Linking.openURL(como.link.url).catch(() => undefined)}
                      accessibilityLabel={`${como.link.rotulo}. Abre no navegador`}
                      style={styles.botaoSecao}
                    >
                      {como.link.rotulo}
                    </Botao>
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <Secao titulo="Seu servidor">
                  <IaCampo
                    accessibilityLabel="Endereço do servidor"
                    value={endereco}
                    onChangeText={(t) => {
                      setEndereco(t);
                      setTesteServidor(OCIOSO);
                    }}
                    placeholder="https://mare-ia.onrender.com"
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                  {enderecoPreenchido && !enderecoValido(endereco) ? (
                    <Texto tipo="legenda" cor={cores.sand} accessibilityLiveRegion="polite" style={styles.apoio}>
                      Só endereços que começam com https://.
                    </Texto>
                  ) : null}
                  <View style={styles.espaco} />
                  <IaCampo
                    accessibilityLabel="Código de acesso do servidor"
                    value={codigo}
                    onChangeText={(t) => {
                      setCodigo(t);
                      setTesteServidor(OCIOSO);
                    }}
                    placeholder={codigoGuardado ? 'Código guardado neste aparelho' : 'Código de acesso (APP_TOKEN)'}
                    secureTextEntry
                    autoCapitalize="none"
                    textContentType="password"
                  />
                  <Botao
                    variante="secundario"
                    onPress={testarConexao}
                    desabilitado={testeServidor.tipo === 'carregando'}
                    style={styles.botaoSecao}
                  >
                    {testeServidor.tipo === 'carregando' ? 'Conectando…' : 'Testar conexão'}
                  </Botao>
                  <Mensagem status={testeServidor} />
                </Secao>

                <Pressable
                  onPress={() => setComoAberto((v) => !v)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: comoAberto }}
                  accessibilityLabel="Como criar meu servidor"
                  style={styles.recolhivel}
                >
                  <Texto style={styles.recolhivelTitulo}>Como criar meu servidor</Texto>
                  <View style={{ transform: [{ rotate: comoAberto ? '90deg' : '0deg' }] }}>
                    <Icone nome="avancar" tamanho={18} cor={cores.faint} />
                  </View>
                </Pressable>
                {comoAberto ? (
                  <View style={styles.passos}>
                    {COMO_CRIAR_SERVIDOR.map((p, i) => (
                      <View key={i} style={styles.passo}>
                        <Texto tipo="legenda" cor={cores.aqua} style={styles.passoNumero}>
                          {i + 1}
                        </Texto>
                        <Texto tipo="legenda" cor={cores.text} style={styles.flex}>
                          {p}
                        </Texto>
                      </View>
                    ))}
                    <Botao
                      variante="secundario"
                      onPress={() => Linking.openURL('https://render.com').catch(() => undefined)}
                      accessibilityLabel="Abrir render.com. Abre no navegador"
                      style={styles.botaoSecao}
                    >
                      Abrir render.com
                    </Botao>
                  </View>
                ) : null}
              </>
            )}

            <Secao titulo="Privacidade">
              <View style={styles.aviso}>
                <Icone nome="cadeado" tamanho={18} cor={cores.aqua} />
                <View style={styles.avisoTexto}>
                  <Texto style={styles.avisoTitulo}>{aviso.titulo}</Texto>
                  {[...aviso.itens, ...(modo === 'servidor' ? [AVISO_SERVIDOR] : []), ...AVISO_COMUM].map((t, i) => (
                    <Texto key={i} tipo="legenda" cor={cores.text}>
                      {t}
                    </Texto>
                  ))}
                </View>
              </View>
              {avisoLido ? (
                <View style={styles.mensagem} accessible accessibilityLiveRegion="polite">
                  <Icone nome="check" tamanho={16} cor={cores.foam} />
                  <Texto tipo="legenda" cor={cores.foam}>
                    Aviso lido
                  </Texto>
                </View>
              ) : (
                <Botao variante="secundario" onPress={() => setAvisoLido(true)} style={styles.botaoSecao}>
                  Entendi
                </Botao>
              )}
            </Secao>

            <View style={styles.salvar}>
              <Botao onPress={salvar} desabilitado={!podeSalvar}>
                {salvando ? 'Salvando…' : 'Salvar'}
              </Botao>
              {pendencia ? (
                <Texto tipo="legenda" style={styles.apoio}>
                  {pendencia}
                </Texto>
              ) : null}
              <Mensagem status={resultado} />
              {ia ? (
                <Botao variante="texto" onPress={desligar} style={styles.desligar}>
                  Desligar IA
                </Botao>
              ) : null}
            </View>
          </ScrollView>
        </Tela>
      </KeyboardAvoidingView>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  titulo: { fontSize: 22, lineHeight: 27, flex: 1 },
  rolagem: { paddingTop: 14, paddingBottom: 48 },
  intro: { marginBottom: 4 },
  secao: { marginTop: 8, gap: 8 },
  grupo: {
    fontFamily: fontes.uiForte,
    fontSize: 11.5,
    lineHeight: 15,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: cores.faint,
    marginTop: 14,
  },
  apoio: { marginTop: 2 },
  espaco: { height: 2 },
  botaoSecao: { height: 48, marginTop: 4 },
  mensagem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4 },
  mensagemTexto: { flex: 1 },
  rotuloModelo: { marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  recolhivel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: cores.line,
  },
  recolhivelTitulo: { fontFamily: fontes.uiMedia, fontSize: 14.5, lineHeight: 20 },
  passos: { gap: 10, paddingTop: 12, paddingBottom: 4 },
  passoTitulo: { fontFamily: fontes.uiForte, fontSize: 14, lineHeight: 19 },
  passo: { flexDirection: 'row', gap: 10 },
  passoNumero: { width: 16, fontFamily: fontes.uiForte },
  aviso: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: comAlfa(cores.aqua, 0.06),
    borderWidth: 1,
    borderColor: comAlfa(cores.aqua, 0.22),
  },
  avisoTexto: { flex: 1, gap: 6 },
  avisoTitulo: { fontFamily: fontes.uiForte, fontSize: 14, lineHeight: 19 },
  salvar: { marginTop: 24, gap: 10 },
  desligar: { alignSelf: 'center' },
});
