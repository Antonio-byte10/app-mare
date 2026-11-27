/**
 * Fala com o `expo-notifications` (Android e iOS). Fino de propósito: toda a decisão do que agendar
 * está em `plano.ts`. No navegador vale `agendador.web.ts`, que não faz nada.
 * API conferida em https://docs.expo.dev/versions/v58.0.0/sdk/notifications/
 */
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';
import { cores } from '@/theme';
import type { Notificacao } from './plano';
import type { Permissao } from './agendador.tipos';

export type { Permissao } from './agendador.tipos';

export const lembretesDisponiveis = true;

/** Canal do Android: importância padrão, sem som e com vibração curta, para não chamar atenção. */
const CANAL = 'lembretes';

let canalPronto: Promise<void> | null = null;

function garantirCanal(): Promise<void> {
  if (Platform.OS !== 'android') return Promise.resolve();
  canalPronto ??= Notifications.setNotificationChannelAsync(CANAL, {
    name: 'Lembretes',
    description: 'Lembretes discretos, sem som alto.',
    importance: AndroidImportance.DEFAULT,
    sound: null,
    enableVibrate: true,
    vibrationPattern: [0, 150],
    lightColor: cores.aqua,
    showBadge: false,
  }).then(() => undefined);
  return canalPronto.catch(() => {
    canalPronto = null;
  });
}

let configurado = false;

/** Mostra a notificação mesmo com o app aberto (sem som nem selo) e cria o canal. Pode repetir. */
export async function configurarNotificacoes(): Promise<void> {
  if (!configurado) {
    configurado = true;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }
  await garantirCanal();
}

function paraPermissao(p: Notifications.NotificationPermissionsStatus): Permissao {
  if (p.granted) return 'concedida';
  return p.canAskAgain ? 'pendente' : 'negada';
}

export async function lerPermissao(): Promise<Permissao> {
  try {
    return paraPermissao(await Notifications.getPermissionsAsync());
  } catch {
    return 'indisponivel';
  }
}

/** Abre o pedido do sistema. No Android 13+ o canal precisa existir antes, senão o pedido não aparece. */
export async function pedirPermissao(): Promise<Permissao> {
  try {
    await garantirCanal();
    const r = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: false, allowSound: false },
    });
    // Recusou agora: trate como negada para a tela mostrar o caminho das configurações.
    return r.granted ? 'concedida' : 'negada';
  } catch {
    return 'indisponivel';
  }
}

/** Cancela tudo do Maré e agenda de novo exatamente o plano recebido. */
export async function aplicarPlano(plano: Notificacao[]): Promise<void> {
  await garantirCanal();
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const n of plano) {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: n.id,
        content: { title: n.titulo, body: n.corpo, data: { rota: n.rota }, sound: false },
        trigger:
          n.quando.tipo === 'data'
            ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.quando.em, channelId: CANAL }
            : {
                type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
                weekday: n.quando.diaSemana,
                hour: n.quando.hora,
                minute: n.quando.minuto,
                channelId: CANAL,
              },
      });
    } catch {
      // Uma notificação que o sistema recusou não deve impedir as outras.
    }
  }
}

export async function cancelarTudo(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Sem módulo nativo (ex.: ambiente sem suporte): nada a cancelar.
  }
}

let ultimoTratado: string | null = null;

/**
 * Chama `aoTocar` com o `data` da notificação tocada, inclusive quando o toque abriu o app (início
 * a frio). Devolve a função que para de ouvir.
 */
export function escutarToques(aoTocar: (data: unknown) => void): () => void {
  let ativo = true;
  const tratar = (r: Notifications.NotificationResponse) => {
    if (r.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const chave = r.notification.request.identifier + ':' + r.notification.date;
    if (chave === ultimoTratado) return;
    ultimoTratado = chave;
    aoTocar(r.notification.request.content.data);
  };
  Notifications.getLastNotificationResponseAsync()
    .then((r) => {
      if (!ativo || !r) return;
      tratar(r);
      return Notifications.clearLastNotificationResponseAsync();
    })
    .catch(() => undefined);
  const assinatura = Notifications.addNotificationResponseReceivedListener(tratar);
  return () => {
    ativo = false;
    assinatura.remove();
  };
}
