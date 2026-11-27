import { create } from 'zustand';

/**
 * Estado de sessão do bloqueio (nunca vai para o disco). Quem decide e conecta tudo é
 * `GuardaPrivacidade`; as regras puras ficam em `bloqueioRegras.ts` e `pin.ts`.
 */
type Bloqueio = {
  /** `true` quando já se sabe se há PIN guardado. Antes disso nada do app aparece. */
  pronto: boolean;
  /** O app está trancado: só a tela de bloqueio aparece. Começa trancado, por segurança. */
  bloqueado: boolean;
  /** O app saiu da tela (apps recentes, ligação...): uma cobertura esconde o conteúdo. */
  coberto: boolean;
  /** A pessoa pediu a onda na tela de bloqueio; ainda esperando a Fissura abrir. */
  ondaPedida: boolean;
  /** Só a Fissura está liberada (sem desbloquear o resto). Sai ao deixar a `/fissura`. */
  ondaAtiva: boolean;
  /** O cofre não respondeu ao ler o PIN: a tela de bloqueio avisa e oferece tentar de novo. */
  erroCofre: boolean;
  /** Muda a cada trancada, para a tela de bloqueio recomeçar do zero. */
  rodada: number;
  concluirInicio: (bloquear: boolean, erroCofre?: boolean) => void;
  travar: () => void;
  destravar: () => void;
  cobrir: (coberto: boolean) => void;
  pedirOnda: () => void;
  ativarOnda: () => void;
};

export const useBloqueio = create<Bloqueio>()((set) => ({
  pronto: false,
  bloqueado: true,
  coberto: false,
  ondaPedida: false,
  ondaAtiva: false,
  erroCofre: false,
  rodada: 0,
  concluirInicio: (bloquear, erroCofre = false) => set((e) => ({ pronto: true, bloqueado: bloquear, erroCofre, rodada: e.rodada + 1 })),
  travar: () => set((e) => ({ bloqueado: true, ondaAtiva: false, ondaPedida: false, rodada: e.rodada + 1 })),
  destravar: () => set({ bloqueado: false, coberto: false, ondaAtiva: false, ondaPedida: false, erroCofre: false }),
  cobrir: (coberto) => set({ coberto }),
  pedirOnda: () => set({ ondaPedida: true }),
  ativarOnda: () => set({ ondaPedida: false, ondaAtiva: true }),
}));

/** Quantas telas do sistema (compartilhar, escolher arquivo) estão abertas por nossa causa. */
let suspensoes = 0;
export const bloqueioSuspenso = () => suspensoes > 0;

/**
 * Executa `fn` sem que a ida e a volta do app (por causa de uma tela do sistema, como o seletor
 * de arquivos ou o "compartilhar") conte como sair do app. Com "bloquear ao sair", sem isto o
 * app trancaria no meio de um backup. A folga final cobre o evento de volta, que pode chegar
 * depois da promessa resolver.
 */
export async function semBloquear<T>(fn: () => Promise<T>): Promise<T> {
  suspensoes += 1;
  try {
    return await fn();
  } finally {
    setTimeout(() => {
      suspensoes -= 1;
    }, 1500);
  }
}
