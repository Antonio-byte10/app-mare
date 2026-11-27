import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { configurarNotificacoes, escutarToques } from '@/lib/lembretes/agendador';
import { aoPedirReagendamento, sincronizarLembretes } from '@/lib/lembretes/sincronizar';
import { rotaDaNotificacao } from '@/lib/lembretes/toque';
import { dataLocal } from '@/lib/datas';
import { habitoAtivoDe } from '@/lib/inicio';
import { lembretesDe, nomeDisfarce } from '@/lib/preferencias';
import { useAgora } from '@/lib/useAgora';
import { useMare } from '@/store';

/** Tenta ir até a rota; se o navegador do app ainda não está pronto (início a frio), tenta de novo. */
function irPara(rota: string, tentativas = 10) {
  try {
    if (rota === '/') router.navigate('/');
    else router.push(rota);
  } catch {
    if (tentativas > 0) setTimeout(() => irPara(rota, tentativas - 1), 300);
  }
}

/**
 * Mantém os lembretes locais agendados conforme os ajustes e o diário, e trata o toque numa
 * notificação. Fica montado no layout raiz (depois do desbloqueio). Não desenha nada.
 *
 * Reagenda (cancela tudo e agenda de novo, de forma idempotente) quando os ajustes, os hábitos, os
 * relatos ou as passagens pela Fissura mudam, quando vira o dia e quando o app volta ao primeiro plano.
 */
export function GerenciadorLembretes() {
  const ajustes = useMare((e) => e.ajustes);
  const habitos = useMare((e) => e.habitos);
  const relatos = useMare((e) => e.relatos);
  const fissuras = useMare((e) => e.fissuras);
  const hoje = dataLocal(useAgora());
  // Sobe a cada volta ao primeiro plano e a cada pedido da tela de Lembretes.
  const [rodada, setRodada] = useState(0);

  useEffect(() => {
    configurarNotificacoes().catch(() => undefined);
    const assinatura = AppState.addEventListener('change', (s) => {
      if (s === 'active') setRodada((n) => n + 1);
    });
    const fim = aoPedirReagendamento(() => setRodada((n) => n + 1));
    return () => {
      assinatura.remove();
      fim();
    };
  }, []);

  useEffect(() => {
    sincronizarLembretes({
      lembretes: lembretesDe(ajustes),
      titulo: nomeDisfarce(ajustes),
      habito: habitoAtivoDe(habitos, ajustes.habitoAtivo),
      relatos,
      fissuras,
    });
    // `ajustes` inteiro: mudar o disfarce ou o hábito ativo também muda os textos e o plano.
  }, [ajustes, habitos, relatos, fissuras, hoje, rodada]);

  const onboardingConcluido = ajustes.onboardingConcluido;
  useEffect(() => {
    if (!onboardingConcluido) return;
    return escutarToques((data) => {
      const rota = rotaDaNotificacao(data);
      if (rota) irPara(rota);
    });
  }, [onboardingConcluido]);

  return null;
}
