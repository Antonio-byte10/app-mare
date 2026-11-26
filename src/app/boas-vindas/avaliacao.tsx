import { Redirect, useRouter } from 'expo-router';
import { FluxoAvaliacao } from '@/components/avaliacao/FluxoAvaliacao';
import { Fundo } from '@/components/Fundo';
import { proximaDepoisDaAvaliacao } from '@/lib/primeiroUso';
import { useRascunhoPrimeiroUso } from '@/lib/rascunhoPrimeiroUso';
import { useVoltar } from '@/lib/useVoltar';

export default function Avaliacao() {
  const router = useRouter();
  const voltar = useVoltar();
  const habitos = useRascunhoPrimeiroUso((e) => e.habitos);
  const respostas = useRascunhoPrimeiroUso((e) => e.respostas);
  const responder = useRascunhoPrimeiroUso((e) => e.responder);
  const concluir = useRascunhoPrimeiroUso((e) => e.concluirAvaliacao);
  const pular = useRascunhoPrimeiroUso((e) => e.pularAvaliacao);

  // Link direto sem ter escolhido hábitos: volta ao começo.
  if (habitos.length === 0) return <Redirect href="/boas-vindas" />;

  return (
    <Fundo>
      <FluxoAvaliacao
        habitos={habitos}
        respostas={respostas}
        aoResponder={responder}
        aoConcluir={() => {
          concluir();
          router.push('/boas-vindas/resultado');
        }}
        aoSair={voltar}
        aoPular={() => {
          pular();
          router.push(proximaDepoisDaAvaliacao(habitos));
        }}
      />
    </Fundo>
  );
}
