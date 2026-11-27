import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { AnelAgua } from '@/components/AnelAgua';
import { Botao } from '@/components/Botao';
import { Icone } from '@/components/Icone';
import { LinhaPendente } from '@/components/LinhaPendente';
import { SeletorHabito } from '@/components/SeletorHabito';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { Trio } from '@/components/Trio';
import { Vazio } from '@/components/Vazio';
import { resumoHabito } from '@/lib/contador';
import { dataLocal } from '@/lib/datas';
import {
  dataPorExtenso,
  escolherSugestao,
  heroContador,
  saudacao,
  textoEconomia,
  textoFaltam,
  textoPendente,
} from '@/lib/inicio';
import { deveSugerirBackup, primeiroUsoEm } from '@/lib/lembreteBackup';
import { proximoMarco } from '@/lib/marcos';
import { chaveDaReflexao, deveMostrarCartaoReflexao, ehDiaDaReflexao, resumoDaSemana } from '@/lib/reflexao';
import { useAgora } from '@/lib/useAgora';
import { useHabitoAtivo } from '@/lib/useHabitoAtivo';
import { useMare } from '@/store';
import { comAlfa, cores, fontes, raio } from '@/theme';

export default function Inicio() {
  const { habitos, ativo, escolher } = useHabitoAtivo();
  const relatos = useMare((e) => e.relatos);
  const fissuras = useMare((e) => e.fissuras);
  const recomecos = useMare((e) => e.recomecos);
  const ajustes = useMare((e) => e.ajustes);
  const avisoRecomeco = useMare((e) => e.avisoRecomeco);
  const dispensarAviso = useMare((e) => e.dispensarAvisoRecomeco);
  const setAjustes = useMare((e) => e.setAjustes);
  const router = useRouter();
  const agora = useAgora();

  if (!ativo) {
    return (
      <Tela>
        {avisoRecomeco ? <FaixaRecomeco aoDispensar={dispensarAviso} /> : null}
        <Vazio />
      </Tela>
    );
  }

  const hoje = dataLocal(agora);
  const resumo = resumoHabito(ativo, relatos, hoje);
  const proximo = proximoMarco(resumo.sequenciaAtual);
  const pendente = textoPendente(resumo, hoje);
  const oculto = ajustes.ocultarNumeros;
  const faltam = textoFaltam(proximo);
  // Só calcula a semana nos dias em que o cartão pode aparecer.
  const mostrarReflexao =
    ehDiaDaReflexao(hoje) &&
    deveMostrarCartaoReflexao(hoje, ajustes.reflexaoVistaEm, resumoDaSemana(habitos, relatos, fissuras, recomecos, hoje));
  const sugerirBackup = deveSugerirBackup({
    agora,
    primeiroUsoEm: primeiroUsoEm(habitos, relatos),
    ultimoBackupEm: ajustes.ultimoBackupEm,
    backupSugeridoEm: ajustes.backupSugeridoEm,
  });
  // Só uma sugestão por vez, para o Início não virar uma lista de tarefas.
  const sugestao = escolherSugestao({
    avisoRecomeco,
    dicaOnda: ajustes.dicaOndaVista !== true,
    pendente: pendente !== null,
    reflexao: mostrarReflexao,
    backup: sugerirBackup,
  });
  // Depois de um deslize, o número grande é o total de dias e a sequência segue no trio.
  const recomecando = heroContador(resumo.sequenciaAtual, resumo.totalLivres).recomecando;

  return (
    <Tela rolavel>
      {sugestao === 'recomeco' ? <FaixaRecomeco aoDispensar={dispensarAviso} /> : null}

      <View>
        <Texto tipo="legenda" style={styles.data}>
          {dataPorExtenso(agora)}
        </Texto>
        <Texto tipo="titulo" style={styles.saudacao} accessibilityRole="header">
          {saudacao(new Date(agora).getHours())}.
        </Texto>
      </View>

      <SeletorHabito habitos={habitos} ativoId={ativo.id} onEscolher={escolher} style={styles.chips} />

      <AnelAgua sequencia={resumo.sequenciaAtual} totalLivres={resumo.totalLivres} proximo={proximo} oculto={oculto} />

      {oculto ? null : (
        <>
          <Texto tipo="legenda" style={styles.faltam}>
            {faltam.antes}
            <Texto tipo="legenda" cor={cores.aqua} style={styles.destaque}>
              {faltam.destaque}
            </Texto>
            {faltam.depois}
          </Texto>
          <Trio
            itens={[
              recomecando
                ? { valor: String(resumo.sequenciaAtual), rotulo: 'dias seguidos' }
                : { valor: String(resumo.totalLivres), rotulo: 'dias no total' },
              { valor: String(resumo.recorde), rotulo: 'seu recorde' },
              { valor: textoEconomia(ativo, relatos, hoje), rotulo: 'economizados', cor: cores.sand },
            ]}
          />
        </>
      )}

      {sugestao === 'dica-onda' ? <CartaoDicaOnda aoEntender={() => setAjustes({ dicaOndaVista: true })} /> : null}

      {sugestao === 'pendente' && pendente ? (
        <View style={oculto ? styles.pendenteOculto : null}>
          <LinhaPendente
            titulo={pendente.titulo}
            subtitulo={pendente.subtitulo}
            onPress={() => router.push(`/relato/${pendente.dia}`)}
          />
        </View>
      ) : null}

      {sugestao === 'reflexao' ? (
        <CartaoReflexao
          aoAbrir={() => router.push('/reflexao')}
          aoAdiar={() => setAjustes({ reflexaoVistaEm: chaveDaReflexao(hoje) })}
        />
      ) : null}

      {sugestao === 'backup' ? (
        <CartaoBackup
          aoFazer={() => router.push('/dados')}
          aoAdiar={() => setAjustes({ backupSugeridoEm: Date.now() })}
        />
      ) : null}
    </Tela>
  );
}

/** Dica única depois do primeiro uso: onde fica o botão para a hora da vontade. Só texto e um "Entendi" discreto. */
function CartaoDicaOnda({ aoEntender }: { aoEntender: () => void }) {
  return (
    <View style={styles.cartaoBackup}>
      <Texto tipo="legenda" cor={cores.text}>
        Quando a vontade apertar, toque na onda aqui embaixo. Ela te guia em 3 minutos.
      </Texto>
      <View style={styles.cartaoBackupAcoes}>
        <Botao variante="texto" onPress={aoEntender}>
          Entendi
        </Botao>
      </View>
    </View>
  );
}

/** Convite para olhar a semana (domingo e segunda). "Agora não" some com o cartão até o próximo domingo. */
function CartaoReflexao({ aoAbrir, aoAdiar }: { aoAbrir: () => void; aoAdiar: () => void }) {
  return (
    <View style={styles.cartaoReflexao}>
      <Texto style={styles.cartaoReflexaoTitulo} accessibilityRole="header">
        Sua semana
      </Texto>
      <Texto tipo="legenda" cor={cores.text}>
        Que tal um olhar gentil sobre os últimos 7 dias? Leva um minuto.
      </Texto>
      <View style={styles.cartaoBackupAcoes}>
        <Botao variante="secundario" onPress={aoAbrir} style={styles.cartaoBackupBotao}>
          Ver minha semana
        </Botao>
        <Botao variante="texto" onPress={aoAdiar}>
          Agora não
        </Botao>
      </View>
    </View>
  );
}

/** Sugestão gentil de backup: o app não guarda nada fora do celular, então trocar de aparelho apaga tudo. */
function CartaoBackup({ aoFazer, aoAdiar }: { aoFazer: () => void; aoAdiar: () => void }) {
  return (
    <View style={styles.cartaoBackup}>
      <Texto tipo="legenda" cor={cores.text}>
        Seus registros ficam só neste celular. Que tal guardar uma cópia protegida por senha? Se você trocar de aparelho, ela evita começar do zero.
      </Texto>
      <View style={styles.cartaoBackupAcoes}>
        <Botao variante="secundario" onPress={aoFazer} style={styles.cartaoBackupBotao}>
          Fazer backup
        </Botao>
        <Botao variante="texto" onPress={aoAdiar}>
          Agora não
        </Botao>
      </View>
    </View>
  );
}

/** Faixa dispensável: o Maré começou do zero porque a chave dos dados antigos sumiu. */
function FaixaRecomeco({ aoDispensar }: { aoDispensar: () => void }) {
  return (
    <View style={styles.faixa} accessibilityRole="alert">
      <Texto tipo="legenda" style={styles.faixaTexto}>
        Não encontramos a chave dos seus dados antigos, então o Maré começou do zero.
      </Texto>
      <Pressable
        onPress={aoDispensar}
        accessibilityRole="button"
        accessibilityLabel="Dispensar aviso"
        hitSlop={12}
        style={styles.faixaFechar}
      >
        <Icone nome="fechar" tamanho={18} cor={cores.muted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  data: { fontSize: 13, lineHeight: 18 },
  saudacao: { fontSize: 24, lineHeight: 29, marginTop: 4 },
  chips: { marginTop: 16 },
  faltam: { textAlign: 'center', marginTop: 10 },
  destaque: { fontFamily: fontes.uiForte },
  pendenteOculto: { marginTop: 22 },
  faixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingLeft: 14,
    marginBottom: 14,
    borderRadius: raio.md,
    backgroundColor: comAlfa(cores.sand, 0.07),
    borderWidth: 1,
    borderColor: comAlfa(cores.sand, 0.28),
  },
  faixaTexto: { flex: 1, color: cores.text },
  faixaFechar: { padding: 4 },
  cartaoBackup: {
    gap: 10,
    padding: 14,
    marginTop: 22,
    borderRadius: raio.md,
    backgroundColor: comAlfa(cores.aqua, 0.06),
    borderWidth: 1,
    borderColor: comAlfa(cores.aqua, 0.22),
  },
  cartaoReflexao: {
    gap: 8,
    padding: 14,
    marginTop: 22,
    borderRadius: raio.md,
    backgroundColor: comAlfa(cores.peri, 0.07),
    borderWidth: 1,
    borderColor: comAlfa(cores.peri, 0.26),
  },
  cartaoReflexaoTitulo: { fontFamily: fontes.display, fontSize: 18, lineHeight: 24 },
  cartaoBackupAcoes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartaoBackupBotao: { minHeight: 44, flex: 1 },
});
