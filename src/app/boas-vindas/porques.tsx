import { randomUUID } from 'expo-crypto';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Icone } from '@/components/Icone';
import { TelaPasso } from '@/components/TelaPasso';
import { Texto } from '@/components/Texto';
import { montarAvaliacao } from '@/lib/avaliacao';
import { MAX_PORQUE, validarPorque } from '@/lib/plano';
import { useRascunhoPrimeiroUso } from '@/lib/rascunhoPrimeiroUso';
import { useVoltar } from '@/lib/useVoltar';
import { useMare } from '@/store';
import { cores, fontes } from '@/theme';

/** Grava tudo o que foi montado no primeiro uso e libera o app. Chamado uma vez, no fim. */
function concluirPrimeiroUso() {
  const loja = useMare.getState();
  const rascunho = useRascunhoPrimeiroUso.getState();
  const agora = Date.now();
  rascunho.habitos.forEach((h) => loja.salvarHabito(h));
  if (rascunho.resultados.length > 0) loja.salvarAvaliacao(montarAvaliacao(randomUUID(), agora, rascunho.resultados));
  rascunho.porques.forEach((texto, i) => loja.salvarPorque({ id: randomUUID(), texto, criadoEm: agora + i }));
  // Com `onboardingConcluido` verdadeiro, o layout raiz troca o primeiro uso pelas abas (Início).
  loja.setAjustes({ habitoAtivo: rascunho.habitos[0]?.id, onboardingConcluido: true });
  rascunho.reiniciar();
}

/** "Meus porquês" (pode pular) e fim do primeiro uso. */
export default function PorquesPrimeiroUso() {
  const voltar = useVoltar();
  const porques = useRascunhoPrimeiroUso((e) => e.porques);
  const adicionar = useRascunhoPrimeiroUso((e) => e.adicionarPorque);
  const remover = useRascunhoPrimeiroUso((e) => e.removerPorque);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | undefined>();

  const adicionarTexto = () => {
    const r = validarPorque(texto);
    if (r.erro !== undefined) {
      setErro(r.erro);
      return;
    }
    adicionar(r.valor);
    setTexto('');
    setErro(undefined);
  };

  // Quem digitou e esqueceu de tocar em "Adicionar" não perde o texto ao concluir.
  const concluir = () => {
    const pendente = validarPorque(texto);
    if (pendente.erro === undefined) adicionar(pendente.valor);
    concluirPrimeiroUso();
  };
  const temAlgo = porques.length > 0 || validarPorque(texto).erro === undefined;

  return (
    <TelaPasso
      aoVoltar={voltar}
      rodape={
        <>
          <Botao onPress={concluir}>{temAlgo ? 'Concluir' : 'Pular por agora'}</Botao>
          {temAlgo ? (
            <Botao variante="texto" onPress={concluirPrimeiroUso}>
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
        Escreva o que importa para você. Esse porquê vai aparecer na hora da onda, quando a vontade apertar. Você
        pode pular e escrever depois, em Meu plano.
      </Texto>

      {porques.length > 0 ? (
        <View style={styles.lista} accessibilityLiveRegion="polite">
          {porques.map((p, i) => (
            <View key={`${i}-${p}`} style={[styles.item, i > 0 && styles.itemSeparado]}>
              <Texto style={styles.itemTexto}>{`“${p}”`}</Texto>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remover o porquê: ${p}`}
                onPress={() => remover(i)}
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
