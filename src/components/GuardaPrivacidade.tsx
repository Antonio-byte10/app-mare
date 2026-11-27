import { usePathname } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { AppState, View } from 'react-native';
import { deveBloquear } from '@/lib/bloqueioRegras';
import { lerPin } from '@/lib/cofrePin';
import { bloqueioDe, disfarceDe, protegerTelaDe } from '@/lib/preferencias';
import { aplicarTelaProtegida } from '@/lib/telaProtegida';
import { bloqueioSuspenso, useBloqueio } from '@/lib/useBloqueio';
import { useMare } from '@/store';
import { cores } from '@/theme';
import { disfarceAtivo, trocarDisfarce } from '../../modules/disfarce';
import { CoberturaBloqueio, TelaBloqueio } from './TelaBloqueio';

type Props = {
  /** O app (o navegador de telas). Fica montado por baixo, então o estado de navegação não se perde ao bloquear. */
  children: ReactNode;
  /** Só aparece com o app desbloqueado (ex.: o gerenciador de lembretes). */
  desbloqueado?: ReactNode;
};

/**
 * Privacidade do app, no topo do layout raiz:
 * - bloqueio por PIN/digital: tranca ao abrir e ao voltar do segundo plano depois do tempo
 *   escolhido, e esconde o app com uma tela cheia opaca (e acessibilidade escondida por baixo);
 * - cobertura enquanto o app está fora da tela, para não vazar nos apps recentes;
 * - telas protegidas (FLAG_SECURE no Android);
 * - "Abrir a onda sem desbloquear": libera só a `/fissura`; ao sair dela, tranca de novo;
 * - mantém o ícone do launcher igual ao disfarce escolhido (por exemplo depois de restaurar).
 */
export function GuardaPrivacidade({ children, desbloqueado }: Props) {
  const ajustes = useMare((e) => e.ajustes);
  const setAjustes = useMare((e) => e.setAjustes);
  const { pronto, bloqueado, coberto, ondaPedida, ondaAtiva } = useBloqueio();
  const pathname = usePathname();
  const ligado = bloqueioDe(ajustes).ligado;

  // Ao abrir: se o bloqueio está ligado, começa trancado (a menos que o cofre prove que não há PIN).
  useEffect(() => {
    const estado = useBloqueio.getState();
    if (estado.pronto) return;
    if (!ligado) {
      estado.concluirInicio(false);
      return;
    }
    lerPin().then((pin) => {
      if (pin === 'erro') estado.concluirInicio(true, true);
      else if (pin === null) {
        // Bloqueio ligado sem PIN (cofre limpo): não há como pedir PIN, então desliga em vez de prender a pessoa.
        setAjustes({ bloqueio: { ...bloqueioDe(useMare.getState().ajustes), ligado: false } });
        estado.concluirInicio(false);
      } else estado.concluirInicio(true);
    });
    // Só no começo: ligar o bloqueio depois não tranca a sessão que está aberta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bloqueio desligado nas configurações: nada mais a esconder.
  useEffect(() => {
    if (pronto && !ligado && bloqueado) useBloqueio.getState().destravar();
  }, [pronto, ligado, bloqueado]);

  // Sair e voltar do app.
  useEffect(() => {
    let saiuEm: number | null = null;
    const sub = AppState.addEventListener('change', (estado) => {
      const e = useBloqueio.getState();
      const cfg = bloqueioDe(useMare.getState().ajustes);
      if (estado !== 'active') {
        if (saiuEm === null) saiuEm = Date.now();
        if (cfg.ligado && !bloqueioSuspenso()) e.cobrir(true);
        return;
      }
      const fora = saiuEm;
      saiuEm = null;
      if (fora === null) return;
      if (bloqueioSuspenso()) e.cobrir(false);
      else if (deveBloquear(cfg, fora, Date.now())) e.travar();
      else e.cobrir(false);
    });
    return () => sub.remove();
  }, []);

  // Telas protegidas. Antes de sabermos, o mais seguro é proteger.
  const proteger = protegerTelaDe(ajustes);
  useEffect(() => {
    aplicarTelaProtegida(proteger);
  }, [proteger]);

  // O ícone do launcher acompanha o disfarce guardado (só troca se estiver diferente).
  const disfarce = disfarceDe(ajustes);
  useEffect(() => {
    const atual = disfarceAtivo();
    if (atual && atual !== disfarce) trocarDisfarce(disfarce).catch(() => undefined);
    // Só ao abrir; a tela de privacidade troca na hora e mostra o resultado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // "Abrir a onda": a Fissura abre sem desbloquear, mas só ela.
  useEffect(() => {
    if (ondaPedida && pathname === '/fissura') useBloqueio.getState().ativarOnda();
  }, [ondaPedida, pathname]);
  useEffect(() => {
    if (ondaAtiva && pathname !== '/fissura') useBloqueio.getState().travar();
  }, [ondaAtiva, pathname]);

  if (!pronto) return <View style={{ flex: 1, backgroundColor: cores.bg }} />;

  const trancado = bloqueado && !ondaAtiva;
  const escondido = trancado || coberto;
  return (
    <View style={{ flex: 1, backgroundColor: cores.bg }}>
      <View
        style={{ flex: 1 }}
        importantForAccessibility={escondido ? 'no-hide-descendants' : 'auto'}
        accessibilityElementsHidden={escondido}
      >
        {children}
        {bloqueado ? null : desbloqueado}
      </View>
      {trancado ? <TelaBloqueio /> : coberto ? <CoberturaBloqueio /> : null}
    </View>
  );
}
