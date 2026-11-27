import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Fundo } from '@/components/Fundo';
import { IaCampo } from '@/components/IaCampo';
import { Icone } from '@/components/Icone';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { TopoTela } from '@/components/TopoTela';
import { bytesAleatorios } from '@/lib/aleatorio';
import { apagarTudo } from '@/lib/apagarTudo';
import { escolherArquivo, guardarArquivo } from '@/lib/arquivos';
import {
  abrirBackup,
  aplicarRestauracao,
  criarBackup,
  MENSAGEM_FALHA,
  SENHA_MIN,
  senhaValida,
  type ResumoBackup,
} from '@/lib/backup';
import { confirmar } from '@/lib/confirmar';
import { formatarData } from '@/lib/datas';
import type { EstadoPersistido } from '@/lib/estado';
import { useMare } from '@/store';
import { comAlfa, cores, fontes } from '@/theme';

type Status = { tipo: 'ok' | 'erro' | 'info'; texto: string } | null;

const DATA_LONGA: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };

function Mensagem({ status }: { status: Status }) {
  if (!status) return null;
  const cor = status.tipo === 'ok' ? cores.foam : status.tipo === 'erro' ? cores.sand : cores.muted;
  return (
    <View style={styles.mensagem} accessible accessibilityLiveRegion="polite">
      {status.tipo === 'ok' ? <Icone nome="check" tamanho={16} cor={cor} /> : null}
      <Texto tipo="legenda" cor={cor} style={styles.flex}>
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

const porcentagem = (f: number) => `${Math.min(100, Math.round(f * 100))}%`;

/** Backup cifrado, restaurar e apagar tudo (spec 5.2). */
export default function Dados() {
  // Backup
  const [fazendo, setFazendo] = useState(false);
  const [senha, setSenha] = useState('');
  const [repeticao, setRepeticao] = useState('');
  const [trabalhandoBackup, setTrabalhandoBackup] = useState(false);
  const [progressoBackup, setProgressoBackup] = useState(0);
  const [statusBackup, setStatusBackup] = useState<Status>(null);
  // Restaurar
  const [arquivo, setArquivo] = useState<{ nome: string; texto: string } | null>(null);
  const [senhaRestaurar, setSenhaRestaurar] = useState('');
  const [abrindo, setAbrindo] = useState(false);
  const [progressoAbrir, setProgressoAbrir] = useState(0);
  const [aberto, setAberto] = useState<{ estado: EstadoPersistido; resumo: ResumoBackup } | null>(null);
  const [statusRestaurar, setStatusRestaurar] = useState<Status>(null);
  // Apagar
  const [apagando, setApagando] = useState(false);
  const [statusApagar, setStatusApagar] = useState<Status>(null);

  const ocupado = trabalhandoBackup || abrindo || apagando;

  const erroSenha = !fazendo
    ? ''
    : senha.length > 0 && !senhaValida(senha)
      ? `Use pelo menos ${SENHA_MIN} caracteres.`
      : repeticao.length > 0 && senha !== repeticao
        ? 'As senhas não são iguais.'
        : '';
  const podeFazer = senhaValida(senha) && senha === repeticao && !ocupado;

  const fazerBackup = async () => {
    if (!podeFazer) return;
    setTrabalhandoBackup(true);
    setProgressoBackup(0);
    setStatusBackup(null);
    try {
      const { nome, conteudo } = await criarBackup(useMare.getState(), senha, {
        aleatorio: bytesAleatorios,
        aoProgresso: setProgressoBackup,
      });
      const compartilhou = await guardarArquivo(nome, conteudo);
      setSenha('');
      setRepeticao('');
      setFazendo(false);
      setStatusBackup(
        compartilhou
          ? { tipo: 'ok', texto: `Backup pronto (${nome}). Guarde o arquivo e a senha em lugares seguros: sem a senha, não dá para abrir.` }
          : { tipo: 'erro', texto: 'Este aparelho não tem como compartilhar arquivos agora.' },
      );
    } catch {
      setStatusBackup({ tipo: 'erro', texto: 'Não consegui criar o backup agora. Tente de novo.' });
    } finally {
      setTrabalhandoBackup(false);
    }
  };

  const escolher = async () => {
    setStatusRestaurar(null);
    setAberto(null);
    setSenhaRestaurar('');
    try {
      const r = await escolherArquivo();
      if (r === null) return;
      if (r === 'grande') {
        setStatusRestaurar({ tipo: 'erro', texto: 'Este arquivo é grande demais para ser um backup do Maré.' });
        return;
      }
      setArquivo(r);
    } catch {
      setStatusRestaurar({ tipo: 'erro', texto: 'Não consegui abrir o seletor de arquivos.' });
    }
  };

  const abrir = async () => {
    if (!arquivo || senhaRestaurar === '' || ocupado) return;
    setAbrindo(true);
    setProgressoAbrir(0);
    setStatusRestaurar(null);
    try {
      const r = await abrirBackup(arquivo.texto, senhaRestaurar, setProgressoAbrir);
      if (r.ok) {
        setAberto({ estado: r.estado, resumo: r.resumo });
        setSenhaRestaurar('');
      } else {
        setStatusRestaurar({ tipo: 'erro', texto: MENSAGEM_FALHA[r.motivo] });
      }
    } catch {
      setStatusRestaurar({ tipo: 'erro', texto: 'Não consegui abrir o backup agora. Tente de novo.' });
    } finally {
      setAbrindo(false);
    }
  };

  const cancelarRestauracao = () => {
    setArquivo(null);
    setAberto(null);
    setSenhaRestaurar('');
    setStatusRestaurar(null);
  };

  const restaurar = () => {
    if (!aberto) return;
    confirmar(
      'Restaurar este backup?',
      'Tudo o que está neste aparelho agora (hábitos, relatos, plano) será substituído pelo conteúdo do backup. Não dá para desfazer.',
      'Restaurar',
      () => {
        const atual = useMare.getState();
        useMare.getState().substituirEstado(aplicarRestauracao(atual, aberto.estado));
        setArquivo(null);
        setAberto(null);
        setStatusRestaurar({ tipo: 'ok', texto: 'Pronto. Seus registros foram restaurados.' });
      },
      true,
    );
  };

  const apagar = () => {
    confirmar(
      'Apagar tudo?',
      'Todos os registros, o PIN, as chaves da IA e as configurações deste aparelho serão apagados. Faça um backup antes, se quiser guardar algo.',
      'Continuar',
      () =>
        confirmar(
          'Tem certeza?',
          'Última chance: depois de apagar, o Maré volta ao começo, como se tivesse acabado de ser instalado. Não dá para desfazer.',
          'Apagar tudo',
          async () => {
            setApagando(true);
            setStatusApagar(null);
            const falhas = await apagarTudo();
            setApagando(false);
            if (falhas.length > 0) {
              setStatusApagar({ tipo: 'erro', texto: `Não consegui apagar tudo (${falhas.join(', ')}). Tente de novo.` });
            }
          },
        ),
    );
  };

  return (
    <Fundo>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Tela>
          <TopoTela titulo="Backup e dados" />
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.rolagem}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <Texto tipo="legenda">
              Seus registros ficam só neste celular, cifrados. O backup é uma cópia que você guarda onde quiser, fechada com uma senha só sua.
            </Texto>

            <Secao titulo="Fazer backup">
              {fazendo ? (
                <>
                  <View style={styles.aviso}>
                    <Icone nome="cadeado" tamanho={18} cor={cores.sand} />
                    <Texto tipo="legenda" cor={cores.text} style={styles.flex}>
                      Sem esta senha não há como recuperar o backup: nem o Maré nem ninguém consegue abri-lo. Anote em um lugar seguro.
                    </Texto>
                  </View>
                  <IaCampo
                    accessibilityLabel="Senha do backup"
                    value={senha}
                    onChangeText={setSenha}
                    placeholder={`Senha (mínimo ${SENHA_MIN} caracteres)`}
                    secureTextEntry
                    autoCapitalize="none"
                    textContentType="newPassword"
                    editable={!ocupado}
                  />
                  <IaCampo
                    accessibilityLabel="Repita a senha do backup"
                    value={repeticao}
                    onChangeText={setRepeticao}
                    placeholder="Repita a senha"
                    secureTextEntry
                    autoCapitalize="none"
                    textContentType="newPassword"
                    editable={!ocupado}
                  />
                  {erroSenha ? (
                    <Texto tipo="legenda" cor={cores.sand} accessibilityLiveRegion="polite">
                      {erroSenha}
                    </Texto>
                  ) : null}
                  <Botao onPress={fazerBackup} desabilitado={!podeFazer} style={styles.botao}>
                    {trabalhandoBackup ? `Protegendo… ${porcentagem(progressoBackup)}` : 'Criar e guardar o backup'}
                  </Botao>
                  {trabalhandoBackup ? (
                    <Texto tipo="legenda" accessibilityLiveRegion="polite">
                      Cifrando com a sua senha. Pode levar alguns segundos.
                    </Texto>
                  ) : (
                    <Botao
                      variante="texto"
                      onPress={() => {
                        setFazendo(false);
                        setSenha('');
                        setRepeticao('');
                      }}
                    >
                      Cancelar
                    </Botao>
                  )}
                </>
              ) : (
                <Botao
                  variante="secundario"
                  onPress={() => {
                    setStatusBackup(null);
                    setFazendo(true);
                  }}
                  desabilitado={ocupado}
                  style={styles.botao}
                >
                  Fazer backup
                </Botao>
              )}
              <Mensagem status={statusBackup} />
            </Secao>

            <Secao titulo="Restaurar backup">
              {aberto ? (
                <>
                  <View style={styles.resumo} accessible accessibilityLabel="Resumo do backup">
                    <Texto style={styles.resumoTitulo}>
                      {aberto.resumo.habitos} {aberto.resumo.habitos === 1 ? 'hábito' : 'hábitos'} · {aberto.resumo.relatos}{' '}
                      {aberto.resumo.relatos === 1 ? 'relato' : 'relatos'}
                    </Texto>
                    {aberto.resumo.desde ? <Texto tipo="legenda">Registros desde {formatarData(aberto.resumo.desde, DATA_LONGA)}</Texto> : null}
                    <Texto tipo="legenda">Backup feito em {formatarData(new Date(aberto.resumo.criadoEm), DATA_LONGA)}</Texto>
                  </View>
                  <View style={styles.aviso}>
                    <Icone nome="cadeado" tamanho={18} cor={cores.sand} />
                    <Texto tipo="legenda" cor={cores.text} style={styles.flex}>
                      Restaurar substitui tudo o que está neste aparelho agora. O bloqueio, o disfarce e a IA ficam como estão.
                    </Texto>
                  </View>
                  <Botao onPress={restaurar} style={styles.botao}>
                    Restaurar
                  </Botao>
                  <Botao variante="texto" onPress={cancelarRestauracao}>
                    Cancelar
                  </Botao>
                </>
              ) : arquivo ? (
                <>
                  <Texto tipo="legenda" cor={cores.text}>
                    Arquivo: {arquivo.nome}
                  </Texto>
                  <IaCampo
                    accessibilityLabel="Senha do backup a restaurar"
                    value={senhaRestaurar}
                    onChangeText={setSenhaRestaurar}
                    placeholder="Senha do backup"
                    secureTextEntry
                    autoCapitalize="none"
                    textContentType="password"
                    editable={!ocupado}
                  />
                  <Botao onPress={abrir} desabilitado={senhaRestaurar === '' || ocupado} style={styles.botao}>
                    {abrindo ? `Abrindo… ${porcentagem(progressoAbrir)}` : 'Abrir backup'}
                  </Botao>
                  {abrindo ? null : (
                    <Botao variante="texto" onPress={cancelarRestauracao}>
                      Cancelar
                    </Botao>
                  )}
                </>
              ) : (
                <>
                  <Texto tipo="legenda">Escolha um arquivo .mare e digite a senha que você usou ao criá-lo. Antes de trocar qualquer coisa, eu mostro um resumo.</Texto>
                  <Botao variante="secundario" onPress={escolher} desabilitado={ocupado} style={styles.botao}>
                    Restaurar backup
                  </Botao>
                </>
              )}
              <Mensagem status={statusRestaurar} />
            </Secao>

            <Secao titulo="Apagar tudo">
              <Texto tipo="legenda">
                Apaga os registros, o PIN, as chaves da IA e os lembretes deste aparelho, e o Maré volta ao começo. Pede duas confirmações e não dá para desfazer.
              </Texto>
              <Botao variante="secundario" onPress={apagar} desabilitado={ocupado} style={[styles.botao, styles.perigo]}>
                {apagando ? 'Apagando…' : 'Apagar tudo'}
              </Botao>
              <Mensagem status={statusApagar} />
            </Secao>
          </ScrollView>
        </Tela>
      </KeyboardAvoidingView>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rolagem: { paddingTop: 14, paddingBottom: 48 },
  secao: { marginTop: 8, gap: 10 },
  grupo: {
    fontFamily: fontes.uiForte,
    fontSize: 11.5,
    lineHeight: 15,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: cores.faint,
    marginTop: 14,
  },
  botao: { height: 48, marginTop: 4 },
  perigo: { borderColor: comAlfa(cores.sand, 0.4) },
  mensagem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 4 },
  aviso: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: comAlfa(cores.sand, 0.07),
    borderWidth: 1,
    borderColor: comAlfa(cores.sand, 0.28),
  },
  resumo: {
    gap: 4,
    padding: 14,
    borderRadius: 16,
    backgroundColor: comAlfa(cores.aqua, 0.06),
    borderWidth: 1,
    borderColor: comAlfa(cores.aqua, 0.22),
  },
  resumoTitulo: { fontFamily: fontes.uiForte, fontSize: 15, lineHeight: 20 },
});
