import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { CriarPin } from '@/components/CriarPin';
import { Fundo } from '@/components/Fundo';
import { Icone } from '@/components/Icone';
import { Interruptor } from '@/components/Interruptor';
import { DivisorAjuste, GrupoAjuste, LinhaAjuste } from '@/components/LinhaAjuste';
import { PedirPin } from '@/components/PedirPin';
import { Segmento } from '@/components/Segmento';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { TopoTela } from '@/components/TopoTela';
import { ICONE_DISFARCE } from '@/conteudo/disfarces';
import { bytesAleatorios } from '@/lib/aleatorio';
import { biometriaDisponivel } from '@/lib/biometria';
import { OPCOES_APOS } from '@/lib/bloqueioRegras';
import { apagarPin, gravarPin } from '@/lib/cofrePin';
import { confirmar } from '@/lib/confirmar';
import { criarRegistroPin } from '@/lib/pin';
import { bloqueioDe, DISFARCES, disfarceDe, protegerTelaDe } from '@/lib/preferencias';
import type { Disfarce } from '@/lib/tipos';
import { useMare } from '@/store';
import { comAlfa, cores, fontes } from '@/theme';
import { disfarceDisponivel, trocarDisfarce } from '../../modules/disfarce';

type Status = { tipo: 'ok' | 'erro'; texto: string } | null;

/** Bloqueio por PIN ou digital, disfarce de nome e ícone e telas protegidas (spec 7.1). */
export default function Privacidade() {
  const router = useRouter();
  const ajustes = useMare((e) => e.ajustes);
  const setAjustes = useMare((e) => e.setAjustes);
  const bloqueio = bloqueioDe(ajustes);
  const disfarce = disfarceDe(ajustes);
  const protegida = protegerTelaDe(ajustes);

  // Com o bloqueio ligado, mexer aqui pede o PIN (uma vez por visita a esta tela).
  const [liberado, setLiberado] = useState(!bloqueio.ligado);
  const [criando, setCriando] = useState<'ligar' | 'mudar' | null>(null);
  const [bioOk, setBioOk] = useState(false);
  const [trocando, setTrocando] = useState<Disfarce | null>(null);
  const [statusDisfarce, setStatusDisfarce] = useState<Status>(null);
  const [statusBloqueio, setStatusBloqueio] = useState<Status>(null);

  useEffect(() => {
    biometriaDisponivel().then(setBioOk);
  }, []);

  const guardarPin = async (pin: string) => {
    // O PIN nunca é guardado: só o hash com sal, no cofre do aparelho.
    await gravarPin(await criarRegistroPin(pin, bytesAleatorios));
    if (criando === 'ligar') {
      setAjustes({ bloqueio: { ...bloqueio, ligado: true } });
      setStatusBloqueio({ tipo: 'ok', texto: 'Bloqueio ligado. O app vai pedir o PIN quando você voltar a ele.' });
    } else {
      setStatusBloqueio({ tipo: 'ok', texto: 'PIN trocado.' });
    }
    setLiberado(true);
    setCriando(null);
  };

  const mudarBloqueio = (ligar: boolean) => {
    setStatusBloqueio(null);
    if (ligar) {
      setCriando('ligar');
      return;
    }
    confirmar(
      'Desligar o bloqueio?',
      'O Maré deixa de pedir PIN ou digital ao abrir, e o PIN guardado é apagado.',
      'Desligar',
      async () => {
        await apagarPin();
        setAjustes({ bloqueio: { ...bloqueio, ligado: false } });
        setStatusBloqueio({ tipo: 'ok', texto: 'Bloqueio desligado.' });
      },
      false,
    );
  };

  const escolherDisfarce = async (id: Disfarce) => {
    if (id === disfarce || trocando) return;
    setTrocando(id);
    setStatusDisfarce(null);
    try {
      await trocarDisfarce(id);
      setAjustes({ disfarce: id });
      setStatusDisfarce({
        tipo: 'ok',
        texto: disfarceDisponivel()
          ? 'Pronto. O ícone pode levar alguns segundos para mudar, e alguns launchers fecham o app ao trocar.'
          : 'Escolha guardada. A troca do ícone só acontece no app instalado no Android.',
      });
    } catch {
      setStatusDisfarce({ tipo: 'erro', texto: 'Não consegui trocar o ícone agora. Tente de novo.' });
    } finally {
      setTrocando(null);
    }
  };

  const mensagem = (status: Status) =>
    status ? (
      <View style={styles.mensagem} accessible accessibilityLiveRegion="polite">
        {status.tipo === 'ok' ? <Icone nome="check" tamanho={16} cor={cores.foam} /> : null}
        <Texto tipo="legenda" cor={status.tipo === 'ok' ? cores.foam : cores.sand} style={styles.flex}>
          {status.texto}
        </Texto>
      </View>
    ) : null;

  // Telas inteiras no lugar da lista: criar PIN e pedir o PIN.
  if (criando) {
    return (
      <Fundo>
        <Tela>
          <TopoTela titulo={criando === 'ligar' ? 'Bloquear o app' : 'Mudar o PIN'} />
          <CriarPin aoConcluir={guardarPin} aoCancelar={() => setCriando(null)} />
        </Tela>
      </Fundo>
    );
  }
  if (!liberado) {
    return (
      <Fundo>
        <Tela>
          <TopoTela titulo="Bloqueio e disfarce" />
          <PedirPin
            titulo="Digite o seu PIN"
            descricao="Para mudar estas opções, confirme que é você."
            aoConfirmar={() => setLiberado(true)}
            aoCancelar={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
        </Tela>
      </Fundo>
    );
  }

  return (
    <Fundo>
      <Tela>
        <TopoTela titulo="Bloqueio e disfarce" />
        <ScrollView style={styles.flex} contentContainerStyle={styles.rolagem} showsVerticalScrollIndicator={false}>
          <Texto tipo="legenda">
            Tudo fica só neste celular. Estas opções ajudam a manter o Maré discreto, para você usar com tranquilidade.
          </Texto>

          <GrupoAjuste>Bloqueio</GrupoAjuste>
          <LinhaAjuste
            titulo="Bloquear o app"
            subtitulo="pede PIN (ou digital) ao abrir e ao voltar"
            icone="cadeado"
            direita={<Interruptor ligado={bloqueio.ligado} aoMudar={mudarBloqueio} accessibilityLabel="Bloquear o app" />}
          />
          {mensagem(statusBloqueio)}
          {bloqueio.ligado ? (
            <>
              <DivisorAjuste />
              {bioOk ? (
                <LinhaAjuste
                  titulo="Usar digital ou rosto"
                  subtitulo="o PIN continua sendo a reserva"
                  icone="digital"
                  direita={
                    <Interruptor
                      ligado={bloqueio.biometria}
                      aoMudar={(v) => setAjustes({ bloqueio: { ...bloqueio, biometria: v } })}
                      accessibilityLabel="Usar digital ou rosto"
                    />
                  }
                />
              ) : (
                <LinhaAjuste titulo="Digital ou rosto" subtitulo="este aparelho não tem digital ou rosto cadastrados" icone="digital" />
              )}
              <DivisorAjuste />
              <View style={styles.bloco}>
                <Texto style={styles.titulo}>Bloquear depois de</Texto>
                <Segmento
                  opcoes={OPCOES_APOS}
                  valor={bloqueio.aposMinutos}
                  onChange={(v) => setAjustes({ bloqueio: { ...bloqueio, aposMinutos: v } })}
                  accessibilityLabel="Bloquear depois de"
                />
                <Texto tipo="legenda">Quanto tempo o app pode ficar fora da tela antes de pedir o PIN de novo.</Texto>
              </View>
              <DivisorAjuste />
              <LinhaAjuste
                titulo="Abrir a onda na tela de bloqueio"
                subtitulo="a tela de bloqueio ganha um botão que abre só a onda, sem liberar o resto do app, para uma hora difícil"
                icone="onda"
                direita={
                  <Interruptor
                    ligado={bloqueio.ondaLivre}
                    aoMudar={(v) => setAjustes({ bloqueio: { ...bloqueio, ondaLivre: v } })}
                    accessibilityLabel="Abrir a onda na tela de bloqueio"
                  />
                }
              />
              <DivisorAjuste />
              <LinhaAjuste titulo="Mudar o PIN" icone="lapis" onPress={() => setCriando('mudar')} />
            </>
          ) : null}

          <GrupoAjuste>Telas protegidas</GrupoAjuste>
          <LinhaAjuste
            titulo="Proteger telas"
            subtitulo="impede capturas de tela e esconde o app na lista de apps recentes"
            icone="olhoOculto"
            direita={<Interruptor ligado={protegida} aoMudar={(v) => setAjustes({ protegerTela: v })} accessibilityLabel="Proteger telas" />}
          />
          {bloqueio.ligado && !protegida ? (
            <Texto tipo="legenda" cor={cores.sand} style={styles.aviso} accessibilityLiveRegion="polite">
              Com as telas desprotegidas, o conteúdo do app pode aparecer na lista de apps recentes.
            </Texto>
          ) : null}

          <GrupoAjuste>Nome e ícone</GrupoAjuste>
          <Texto tipo="legenda">
            Muda como o Maré aparece na tela inicial do celular (e o nome nos lembretes). Em Configurações do Android, o nome real do app continua aparecendo.
          </Texto>
          <View style={styles.opcoes} accessibilityRole="radiogroup" accessibilityLabel="Nome e ícone do app">
            {DISFARCES.map((d) => {
              const ativo = d.id === disfarce;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => escolherDisfarce(d.id)}
                  disabled={trocando !== null}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: ativo, checked: ativo, disabled: trocando !== null }}
                  accessibilityLabel={`${d.nome}, ${d.descricao}`}
                  style={[styles.opcao, ativo && { borderColor: comAlfa(cores.aqua, 0.5), backgroundColor: comAlfa(cores.aqua, 0.07) }]}
                >
                  <Image source={ICONE_DISFARCE[d.id]} style={styles.previa} accessibilityIgnoresInvertColors />
                  <View style={styles.flex}>
                    <Texto style={styles.titulo}>{d.nome}</Texto>
                    <Texto tipo="legenda">{d.descricao}</Texto>
                  </View>
                  <View style={[styles.radio, ativo && { borderColor: cores.aqua }]}>
                    {ativo ? <View style={styles.radioMiolo} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
          {mensagem(statusDisfarce)}
          <Texto tipo="legenda" style={styles.aviso}>
            {disfarceDisponivel()
              ? 'O ícone pode levar alguns segundos para mudar. Alguns launchers fecham o app ao trocar: é só abrir de novo.'
              : 'Neste ambiente a escolha só é guardada; o ícone muda no app instalado no Android.'}
          </Texto>
        </ScrollView>
      </Tela>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rolagem: { paddingTop: 14, paddingBottom: 48 },
  mensagem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 6 },
  aviso: { marginTop: 8 },
  bloco: { paddingVertical: 14, gap: 10 },
  titulo: { fontFamily: fontes.uiMedia, fontSize: 14.5, lineHeight: 20 },
  opcoes: { gap: 8, marginTop: 12 },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: cores.line,
    backgroundColor: 'rgba(255,255,255,.02)',
  },
  previa: { width: 44, height: 44, borderRadius: 10 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: cores.line2, alignItems: 'center', justifyContent: 'center' },
  radioMiolo: { width: 10, height: 10, borderRadius: 5, backgroundColor: cores.aqua },
});
