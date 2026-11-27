import { randomUUID } from 'expo-crypto';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { FotoPorque } from '@/components/FotoPorque';
import { Icone } from '@/components/Icone';
import { SeletorFoto } from '@/components/SeletorFoto';
import { TelaPasso } from '@/components/TelaPasso';
import { Texto } from '@/components/Texto';
import { montarAvaliacao } from '@/lib/avaliacao';
import { aplicarHabito } from '@/lib/estado';
import { apagarFoto } from '@/lib/fotos';
import { lembretesDisponiveis, lerPermissao, pedirPermissao } from '@/lib/lembretes/agendador';
import { descreverPorque, MAX_PORQUE, validarPorqueOuFoto } from '@/lib/plano';
import { passoDoPrimeiroUso } from '@/lib/primeiroUso';
import { useRascunhoPrimeiroUso } from '@/lib/rascunhoPrimeiroUso';
import { semBloquear } from '@/lib/useBloqueio';
import { useVoltar } from '@/lib/useVoltar';
import { useMare } from '@/store';
import { cores, fontes } from '@/theme';

/**
 * Grava tudo o que foi montado no primeiro uso e libera o app. Chamado uma vez, no fim.
 * Uma única gravação: se o app for fechado no meio, ou fica tudo ou não fica nada (antes dava
 * para perder o "concluído" e criar os hábitos de novo, em dobro).
 */
function concluirPrimeiroUso() {
  const rascunho = useRascunhoPrimeiroUso.getState();
  const agora = Date.now();
  useMare.setState((e) => {
    const comHabitos = rascunho.habitos.reduce(aplicarHabito, e);
    const avaliacoes =
      rascunho.resultados.length > 0
        ? [...e.avaliacoes, montarAvaliacao(randomUUID(), agora, rascunho.resultados)]
        : e.avaliacoes;
    const porques = [
      ...e.porques,
      ...rascunho.porques.map(({ texto, foto }, i) => ({ id: randomUUID(), texto, criadoEm: agora + i, ...(foto ? { foto } : {}) })),
    ];
    // Com `onboardingConcluido` verdadeiro, o layout raiz troca o primeiro uso pelas abas (Início).
    const ajustes = { ...e.ajustes, habitoAtivo: rascunho.habitos[0]?.id, onboardingConcluido: true };
    return { habitos: comHabitos.habitos, avaliacoes, porques, ajustes };
  });
  rascunho.reiniciar();
}

/**
 * Os lembretes já vêm ligados, mas sem a permissão do sistema nenhum chega. Pergunta uma vez aqui,
 * com a explicação antes. Recusar não muda nada no resto do app.
 */
async function oferecerLembretes(): Promise<void> {
  if (!lembretesDisponiveis || (await lerPermissao()) !== 'pendente') return;
  const aceitou = await new Promise<boolean>((resolver) =>
    Alert.alert(
      'Quer receber lembretes?',
      'Um aviso por dia para o relato e outro antes dos seus horários difíceis. O texto é discreto e nunca cita o hábito. Dá para mudar tudo em Mais, Lembretes.',
      [
        { text: 'Agora não', style: 'cancel', onPress: () => resolver(false) },
        { text: 'Quero', onPress: () => resolver(true) },
      ],
      { cancelable: true, onDismiss: () => resolver(false) },
    ),
  );
  if (aceitou) await semBloquear(pedirPermissao);
}

/** "Meus porquês" (pode pular) e fim do primeiro uso. */
export default function PorquesPrimeiroUso() {
  const voltar = useVoltar();
  const porques = useRascunhoPrimeiroUso((e) => e.porques);
  const habitos = useRascunhoPrimeiroUso((e) => e.habitos);
  const adicionar = useRascunhoPrimeiroUso((e) => e.adicionarPorque);
  const remover = useRascunhoPrimeiroUso((e) => e.removerPorque);
  const [texto, setTexto] = useState('');
  // Foto escolhida para o porquê que está sendo escrito (arquivo já cifrado, ainda sem dono).
  const [foto, setFoto] = useState<string | undefined>();
  const [erro, setErro] = useState<string | undefined>();

  const adicionarTexto = () => {
    const r = validarPorqueOuFoto(texto, foto !== undefined);
    if (r.erro !== undefined) {
      setErro(r.erro);
      return;
    }
    adicionar({ texto: r.valor, ...(foto ? { foto } : {}) });
    setTexto('');
    setFoto(undefined);
    setErro(undefined);
  };

  const mudarFoto = (nova: string | undefined) => {
    // A foto anterior (se havia) foi trocada ou tirada: ninguém mais a usa.
    if (foto) void apagarFoto(foto);
    setFoto(nova);
    setErro(undefined);
  };

  const removerPorque = (indice: number) => {
    const alvo = porques[indice];
    if (alvo?.foto) void apagarFoto(alvo.foto);
    remover(indice);
  };

  const pular = () => {
    if (foto) void apagarFoto(foto);
    concluirPrimeiroUso();
  };

  // Quem digitou e esqueceu de tocar em "Adicionar" não perde o texto ao concluir.
  const concluindo = useRef(false);
  const concluir = async () => {
    if (concluindo.current) return;
    // Chegou aqui sem hábitos (link direto): volta ao começo em vez de liberar o app vazio.
    if (useRascunhoPrimeiroUso.getState().habitos.length === 0) {
      router.replace('/boas-vindas');
      return;
    }
    concluindo.current = true;
    const pendente = validarPorqueOuFoto(texto, foto !== undefined);
    if (pendente.erro === undefined) adicionar({ texto: pendente.valor, ...(foto ? { foto } : {}) });
    try {
      await oferecerLembretes();
    } catch {
      // Sem a permissão o app segue igual; dá para ligar depois em Lembretes.
    }
    concluirPrimeiroUso();
  };
  const temAlgo = porques.length > 0 || validarPorqueOuFoto(texto, foto !== undefined).erro === undefined;

  return (
    <TelaPasso
      aoVoltar={voltar}
      topo={<Texto tipo="legenda">{passoDoPrimeiroUso('porques', habitos)?.texto}</Texto>}
      rodape={
        <>
          <Botao onPress={concluir}>{temAlgo ? 'Concluir' : 'Pular por agora'}</Botao>
          {temAlgo ? (
            <Botao variante="texto" onPress={pular}>
              Pular por agora
            </Botao>
          ) : null}
        </>
      }
    >
      <Texto style={styles.titulo} accessibilityRole="header">
        Por que você quer mudar?
      </Texto>
      <Texto style={styles.sub}>
        Escreva o que importa para você, se quiser com uma foto. Esse porquê vai aparecer na hora da onda, quando a
        vontade apertar. Você pode pular e fazer isso depois, em Meu plano.
      </Texto>

      {porques.length > 0 ? (
        <View style={styles.lista} accessibilityLiveRegion="polite">
          {porques.map((p, i) => (
            <View key={`${i}-${p.foto ?? ''}-${p.texto}`} style={[styles.item, i > 0 && styles.itemSeparado]}>
              {p.foto ? <FotoPorque nome={p.foto} altura={56} largura={56} raio={12} accessibilityLabel="Foto do porquê" /> : null}
              <Texto style={styles.itemTexto}>{p.texto.trim() !== '' ? `“${p.texto}”` : ''}</Texto>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remover o porquê: ${descreverPorque(p)}`}
                onPress={() => removerPorque(i)}
                hitSlop={8}
                style={styles.remover}
              >
                <Icone nome="fechar" tamanho={18} cor={cores.muted} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.campo}>
        <Campo
          rotulo={porques.length > 0 ? 'Mais um porquê' : 'Meu porquê'}
          valor={texto}
          aoMudar={(t) => {
            setTexto(t);
            if (erro) setErro(undefined);
          }}
          erro={erro}
          multilinha
          maxLength={MAX_PORQUE}
          placeholder="Ex.: Quero subir a escada com meu filho sem perder o fôlego."
        />
        <SeletorFoto foto={foto} aoMudar={mudarFoto} />
        <Botao variante="secundario" onPress={adicionarTexto}>
          Adicionar
        </Botao>
      </View>
    </TelaPasso>
  );
}

const styles = StyleSheet.create({
  titulo: { fontFamily: fontes.display, fontSize: 26, lineHeight: 31, letterSpacing: -0.52 },
  sub: { marginTop: 10, fontSize: 14, lineHeight: 21, color: cores.muted },
  lista: { marginTop: 18 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  itemSeparado: { borderTopWidth: 1, borderTopColor: cores.line },
  itemTexto: { flex: 1, fontFamily: fontes.display, fontSize: 16, lineHeight: 23 },
  remover: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  campo: { marginTop: 22 },
});
