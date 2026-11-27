import * as Linking from 'expo-linking';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, AppState, Pressable, StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Icone, type NomeIcone } from '@/components/Icone';
import { Interruptor } from '@/components/Interruptor';
import { DivisorAjuste, GrupoAjuste, LinhaAjuste } from '@/components/LinhaAjuste';
import { SeletorHorario } from '@/components/SeletorHorario';
import { TelaPasso } from '@/components/TelaPasso';
import { Texto } from '@/components/Texto';
import { dataLocal } from '@/lib/datas';
import { habitoAtivoDe } from '@/lib/inicio';
import {
  calcularAntesDaOnda,
  textoSugestao,
  TEXTO_POUCOS_DADOS,
  TEXTO_SEM_PICO,
} from '@/lib/lembretes/antesDaOnda';
import { lembretesDisponiveis, lerPermissao, pedirPermissao, type Permissao } from '@/lib/lembretes/agendador';
import { semBloquear } from '@/lib/useBloqueio';
import { pedirReagendamento } from '@/lib/lembretes/sincronizar';
import { lembretesDe, nomeDisfarce } from '@/lib/preferencias';
import type { AjustesLembretes } from '@/lib/tipos';
import { useAgora } from '@/lib/useAgora';
import { useVoltar } from '@/lib/useVoltar';
import { useMare } from '@/store';
import { comAlfa, cores, fontes, raio } from '@/theme';

type Rotina = 'relato' | 'bomDia';

const EXPLICACAO =
  'O Maré só avisa nos horários que você escolher. Para isso, precisa da sua permissão de notificações. Os avisos usam um texto discreto e nunca citam o hábito.';

/** Pergunta, com a explicação na frente, se pode pedir a permissão ao sistema. */
const explicar = () =>
  new Promise<boolean>((resolver) => {
    Alert.alert(
      'Permitir notificações?',
      EXPLICACAO,
      [
        { text: 'Agora não', style: 'cancel', onPress: () => resolver(false) },
        { text: 'Continuar', onPress: () => resolver(true) },
      ],
      { cancelable: true, onDismiss: () => resolver(false) },
    );
  });

/** Lembretes (spec 6.9): rotina, inteligentes e privacidade, com texto discreto. */
export default function Lembretes() {
  const voltar = useVoltar();
  const ajustes = useMare((e) => e.ajustes);
  const habitos = useMare((e) => e.habitos);
  const relatos = useMare((e) => e.relatos);
  const fissuras = useMare((e) => e.fissuras);
  const setAjustes = useMare((e) => e.setAjustes);
  const hoje = dataLocal(useAgora());

  const lembretes = lembretesDe(ajustes);
  const [permissao, setPermissao] = useState<Permissao | null>(null);
  const [aberto, setAberto] = useState<Rotina | null>(null);

  // Lê a permissão ao abrir e ao voltar das configurações do aparelho.
  const atualizarPermissao = useCallback(() => {
    lerPermissao().then(setPermissao);
  }, []);
  useEffect(() => {
    atualizarPermissao();
    const assinatura = AppState.addEventListener('change', (s) => {
      if (s === 'active') atualizarPermissao();
    });
    return () => assinatura.remove();
  }, [atualizarPermissao]);

  const habito = habitoAtivoDe(habitos, ajustes.habitoAtivo);
  const onda = useMemo(
    () => (habito ? calcularAntesDaOnda(relatos, fissuras, habito.id, hoje) : ({ status: 'poucosDados' } as const)),
    [habito, relatos, fissuras, hoje],
  );

  const gravar = (parcial: Partial<AjustesLembretes>) => setAjustes({ lembretes: { ...lembretes, ...parcial } });

  /** Pede a permissão ao sistema (com a explicação antes, se `comExplicacao`). `true` se concedida. */
  const permitir = async (comExplicacao: boolean): Promise<boolean> => {
    const atual = await lerPermissao();
    if (atual === 'concedida' || atual === 'indisponivel') return true;
    if (atual === 'negada') {
      setPermissao('negada');
      return false;
    }
    if (comExplicacao && !(await explicar())) return false;
    // O pedido do sistema não conta como sair do app (senão, com "bloquear ao sair", trancaria).
    const resultado = await semBloquear(pedirPermissao);
    setPermissao(resultado);
    if (resultado === 'concedida') pedirReagendamento();
    return resultado === 'concedida';
  };

  /** Ao ligar um lembrete, garante a permissão primeiro; se ela não vier, o interruptor fica desligado. */
  const ligarSe = async (ligar: boolean, aplicar: () => void) => {
    if (ligar && !(await permitir(true))) return;
    aplicar();
  };

  const alternarRotina = (chave: Rotina, ligar: boolean) =>
    ligarSe(ligar, () => gravar({ [chave]: { ...lembretes[chave], ligado: ligar } }));
  const mudarHora = (chave: Rotina, hora: string) => gravar({ [chave]: { ...lembretes[chave], hora } });

  const algumLigado = lembretes.relato.ligado || lembretes.bomDia.ligado || lembretes.antesDaOnda || lembretes.marcos;
  const faltaPermissao = lembretesDisponiveis && algumLigado && (permissao === 'pendente' || permissao === 'negada');

  const subtituloOnda = onda.status === 'ok' ? textoSugestao(onda) : onda.status === 'semPico' ? TEXTO_SEM_PICO : TEXTO_POUCOS_DADOS;

  return (
    <TelaPasso
      aoVoltar={voltar}
      topo={
        <Texto style={styles.titulo} accessibilityRole="header">
          Lembretes
        </Texto>
      }
      rodape={null}
    >
      {!lembretesDisponiveis ? (
        <Aviso titulo="Lembretes funcionam no app do celular">
          Aqui no navegador você pode ajustar as opções, mas os avisos só chegam no Android e no iPhone.
        </Aviso>
      ) : null}

      {faltaPermissao && permissao === 'pendente' ? (
        <Aviso titulo="Permitir notificações">
          {EXPLICACAO}
          <Botao onPress={() => permitir(false)} style={styles.botaoAviso}>
            Permitir notificações
          </Botao>
        </Aviso>
      ) : null}

      {faltaPermissao && permissao === 'negada' ? (
        <Aviso titulo="As notificações estão desligadas no aparelho">
          Para os lembretes chegarem, ative as notificações do Maré nas configurações do celular. Volte aqui depois: eu confiro de novo.
          <Botao
            variante="secundario"
            onPress={() => Linking.openSettings().catch(() => undefined)}
            style={styles.botaoAviso}
            accessibilityLabel="Abrir as configurações do aparelho"
          >
            Abrir configurações
          </Botao>
        </Aviso>
      ) : null}

      <GrupoAjuste>Rotina</GrupoAjuste>
      <LinhaLembrete
        icone="lapis"
        titulo="Relato do dia"
        subtitulo={`todo dia às ${lembretes.relato.hora}`}
        ligado={lembretes.relato.ligado}
        aoMudar={(v) => alternarRotina('relato', v)}
        aberto={aberto === 'relato'}
        aoAbrir={() => setAberto(aberto === 'relato' ? null : 'relato')}
      >
        <SeletorHorario valor={lembretes.relato.hora} aoMudar={(h) => mudarHora('relato', h)} rotulo="Relato do dia" />
      </LinhaLembrete>
      <DivisorAjuste />
      <LinhaLembrete
        icone="sol"
        titulo="Bom dia"
        subtitulo={`uma frase calma às ${lembretes.bomDia.hora}`}
        ligado={lembretes.bomDia.ligado}
        aoMudar={(v) => alternarRotina('bomDia', v)}
        aberto={aberto === 'bomDia'}
        aoAbrir={() => setAberto(aberto === 'bomDia' ? null : 'bomDia')}
      >
        <SeletorHorario valor={lembretes.bomDia.hora} aoMudar={(h) => mudarHora('bomDia', h)} rotulo="Bom dia" />
      </LinhaLembrete>
      <Texto tipo="legenda" style={styles.dica}>
        Toque no nome de uma rotina para mudar o horário.
      </Texto>

      <GrupoAjuste>Inteligentes</GrupoAjuste>
      <LinhaLembrete
        icone="ondaSimples"
        titulo="Antes da onda"
        subtitulo={subtituloOnda}
        ligado={lembretes.antesDaOnda}
        aoMudar={(v) => ligarSe(v, () => gravar({ antesDaOnda: v }))}
      />
      <DivisorAjuste />
      <LinhaLembrete
        icone="estrela"
        titulo="Marcos e conquistas"
        subtitulo="quando um marco chegar"
        ligado={lembretes.marcos}
        aoMudar={(v) => ligarSe(v, () => gravar({ marcos: v }))}
      />

      <GrupoAjuste>Privacidade</GrupoAjuste>
      <LinhaAjuste
        icone="olhoOculto"
        titulo="Texto discreto"
        subtitulo="nunca cita o hábito"
        direita={
          <Texto tipo="legenda" accessibilityLabel="Sempre ligado">
            sempre ligado
          </Texto>
        }
      />
      <DivisorAjuste />
      <LinhaLembrete
        icone="telefone"
        titulo="Contatos de emergência"
        subtitulo={`CVV e SAMU · ${ajustes.contatosEmergencia ? 'ligado' : 'desligado'}`}
        ligado={ajustes.contatosEmergencia}
        aoMudar={(v) => setAjustes({ contatosEmergencia: v })}
      />
      <Texto tipo="legenda" style={styles.dica}>
        {`Os avisos aparecem com o nome “${nomeDisfarce(ajustes)}”, o mesmo do disfarce escolhido em Bloqueio e disfarce.`}
      </Texto>
    </TelaPasso>
  );
}

function Aviso({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={styles.aviso} accessibilityLiveRegion="polite">
      <Texto style={styles.avisoTitulo} accessibilityRole="header">
        {titulo}
      </Texto>
      {typeof children === 'string' ? <Texto style={styles.avisoTexto}>{children}</Texto> : children}
    </View>
  );
}

type PropsLinha = {
  icone: NomeIcone;
  titulo: string;
  subtitulo: string;
  ligado: boolean;
  aoMudar: (ligado: boolean) => void;
  /** Linhas de rotina abrem o seletor de horário ao tocar no texto. */
  aoAbrir?: () => void;
  aberto?: boolean;
  children?: ReactNode;
};

/**
 * Linha de ajuste com interruptor (`.si` do mockup 11). O texto e o interruptor são botões
 * separados: um botão dentro de outro esconderia o interruptor dos leitores de tela.
 */
function LinhaLembrete({ icone, titulo, subtitulo, ligado, aoMudar, aoAbrir, aberto, children }: PropsLinha) {
  const corpo = (
    <>
      <View style={styles.icone}>
        <Icone nome={icone} tamanho={22} cor={cores.muted} />
      </View>
      <View style={styles.texto}>
        <Texto style={styles.linhaTitulo}>{titulo}</Texto>
        <Texto tipo="legenda">{subtitulo}</Texto>
      </View>
    </>
  );
  return (
    <View>
      <View style={styles.linha}>
        {aoAbrir ? (
          <Pressable
            onPress={aoAbrir}
            accessibilityRole="button"
            accessibilityLabel={`${titulo}, ${subtitulo}. Mudar o horário`}
            accessibilityState={{ expanded: !!aberto }}
            style={styles.corpo}
          >
            {corpo}
          </Pressable>
        ) : (
          <View style={styles.corpo}>{corpo}</View>
        )}
        <Interruptor ligado={ligado} aoMudar={aoMudar} accessibilityLabel={titulo} />
      </View>
      {aberto ? children : null}
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: { fontFamily: fontes.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.44 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  corpo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, minHeight: 56 },
  icone: { width: 22, alignItems: 'center' },
  texto: { flex: 1, gap: 2 },
  linhaTitulo: { fontFamily: fontes.uiMedia, fontSize: 14.5, lineHeight: 20 },
  dica: { marginTop: 4, marginBottom: 2 },
  aviso: {
    gap: 8,
    padding: 16,
    marginBottom: 4,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: comAlfa(cores.aqua, 0.3),
    backgroundColor: comAlfa(cores.aqua, 0.06),
  },
  avisoTitulo: { fontFamily: fontes.display, fontSize: 18, lineHeight: 24 },
  avisoTexto: { fontSize: 14, lineHeight: 21, color: cores.muted },
  botaoAviso: { marginTop: 8 },
});
