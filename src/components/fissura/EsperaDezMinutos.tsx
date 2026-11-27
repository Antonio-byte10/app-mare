import { useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Texto } from '@/components/Texto';
import { ESPERA_SEG, falarTempo, formatarContagem, segundosRestantes } from '@/lib/fissura';
import { vibrarLeve } from '@/lib/haptica';
import { comAlfa, cores, fontes, raio } from '@/theme';

/**
 * "Esperar 10 minutos": ação opcional e discreta do passo 2. Começa com um botão de texto; ao tocar,
 * mostra uma contagem de 10 minutos dentro do passo. Quem manda é o relógio (`fim` em ms), e não a
 * soma de ticks: voltar do segundo plano mostra o tempo certo. Ao chegar a zero só convida a seguir
 * para "Passou" (não navega sozinha). Sem animação: o avanço da barra é por passo de 1 s.
 */
/** `aoMudar` avisa quando a espera começa ou é cancelada (o passo esconde o outro relógio). */
export function EsperaDezMinutos({ aoMudar }: { aoMudar?: (esperando: boolean) => void } = {}) {
  // Início da espera, em ms; `null` = ainda não começou (ou foi cancelada).
  const [fim, setFim] = useState<number | null>(null);
  const [restante, setRestante] = useState(ESPERA_SEG);
  // Só vibra uma vez por espera, mesmo que o app volte do segundo plano depois do fim.
  const avisou = useRef(false);

  useEffect(() => {
    if (fim === null) return undefined;
    const atualizar = () => {
      const r = segundosRestantes(fim, Date.now());
      setRestante(r);
      if (r === 0 && !avisou.current) {
        avisou.current = true;
        vibrarLeve();
      }
    };
    atualizar();
    const id = setInterval(atualizar, 500);
    // Ao voltar do segundo plano, atualiza na hora (os timers podem ter sido adiados).
    const sub = AppState.addEventListener('change', (e) => {
      if (e === 'active') atualizar();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [fim]);

  const comecar = () => {
    avisou.current = false;
    setRestante(ESPERA_SEG);
    setFim(Date.now() + ESPERA_SEG * 1000);
    aoMudar?.(true);
  };

  if (fim === null) {
    return (
      <Botao
        variante="texto"
        onPress={comecar}
        style={styles.comecar}
        accessibilityLabel="Esperar 10 minutos. Mostra uma contagem; você pode tocar em Passou a qualquer momento."
      >
        Esperar 10 minutos
      </Botao>
    );
  }

  const acabou = restante === 0;
  const progresso = Math.min(1, Math.max(0, 1 - restante / ESPERA_SEG));

  return (
    <View style={styles.cartao}>
      <Texto style={styles.rotulo}>{acabou ? 'Dez minutos' : 'Esperando'}</Texto>
      <Texto
        style={styles.tempo}
        accessible
        accessibilityLabel={acabou ? 'Os 10 minutos terminaram' : `Faltam ${falarTempo(restante)}`}
      >
        {formatarContagem(restante)}
      </Texto>
      <View style={styles.trilho} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <View style={[styles.preenchido, { width: `${Math.round(progresso * 100)}%` }]} />
      </View>
      {/* A mensagem é a única parte "viva": avisa o leitor de tela ao terminar, sem repetir a cada segundo. */}
      <Texto style={styles.texto} accessibilityLiveRegion="polite">
        {acabou
          ? 'Dez minutos se passaram. Se a vontade já desceu, toque em Passou. Se ainda não, tudo bem ficar mais um pouco.'
          : 'Quase toda onda sobe, chega ao pico e desce em poucos minutos. Você pode tocar em Passou a qualquer momento.'}
      </Texto>
      <Botao
        variante="texto"
        onPress={() => {
          setFim(null);
          aoMudar?.(false);
        }}
        accessibilityLabel={acabou ? 'Fechar a contagem de 10 minutos' : 'Cancelar a espera de 10 minutos'}
      >
        {acabou ? 'Fechar' : 'Cancelar'}
      </Botao>
    </View>
  );
}

const styles = StyleSheet.create({
  comecar: { alignSelf: 'center', marginTop: 14 },
  cartao: {
    marginTop: 22,
    padding: 16,
    alignItems: 'center',
    borderRadius: raio.lg,
    borderWidth: 1,
    borderColor: cores.line2,
    backgroundColor: 'rgba(255,255,255,.03)',
  },
  rotulo: {
    fontFamily: fontes.uiForte,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: cores.sand,
  },
  tempo: { marginTop: 6, fontFamily: fontes.displayLeve, fontSize: 40, lineHeight: 46, letterSpacing: -1.5, color: cores.text },
  trilho: { alignSelf: 'stretch', height: 3, marginTop: 10, borderRadius: 2, backgroundColor: comAlfa(cores.peri, 0.18), overflow: 'hidden' },
  preenchido: { height: 3, borderRadius: 2, backgroundColor: cores.aqua },
  texto: { marginTop: 12, textAlign: 'center', fontSize: 13.5, lineHeight: 20, color: cores.muted },
});
