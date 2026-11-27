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
import { dataPorExtenso, saudacao, textoEconomia, textoFaltam, textoPendente } from '@/lib/inicio';
import { deveSugerirBackup, primeiroUsoEm } from '@/lib/lembreteBackup';
import { proximoMarco } from '@/lib/marcos';
import { useAgora } from '@/lib/useAgora';
import { useHabitoAtivo } from '@/lib/useHabitoAtivo';
import { useMare } from '@/store';
import { comAlfa, cores, fontes, raio } from '@/theme';

export default function Inicio() {
  const { habitos, ativo, escolher } = useHabitoAtivo();
  const relatos = useMare((e) => e.relatos);
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
  const sugerirBackup = deveSugerirBackup({
    agora,
    primeiroUsoEm: primeiroUsoEm(habitos, relatos),
    ultimoBackupEm: ajustes.ultimoBackupEm,
    backupSugeridoEm: ajustes.backupSugeridoEm,
  });

  return (
    <Tela rolavel>
      {avisoRecomeco ? <FaixaRecomeco aoDispensar={dispensarAviso} /> : null}

      <View>
        <Texto tipo="legenda" style={styles.data}>
          {dataPorExtenso(agora)}
        </Texto>
        <Texto tipo="titulo" style={styles.saudacao} accessibilityRole="header">
          {saudacao(new Date(agora).getHours())}.
        </Texto>
      </View>

      <SeletorHabito habitos={habitos} ativoId={ativo.id} onEscolher={escolher} style={styles.chips} />

      <AnelAgua sequencia={resumo.sequenciaAtual} proximo={proximo} oculto={oculto} />

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
              { valor: String(resumo.totalLivres), rotulo: 'dias no total' },
              { valor: String(resumo.recorde), rotulo: 'seu recorde' },
              { valor: textoEconomia(ativo, relatos, hoje), rotulo: 'economizados', cor: cores.sand },
            ]}
          />
        </>
      )}

      {pendente ? (
        <View style={oculto ? styles.pendenteOculto : null}>
          <LinhaPendente
            titulo={pendente.titulo}
            subtitulo={pendente.subtitulo}
            onPress={() => router.push(`/relato/${pendente.dia}`)}
          />
        </View>
      ) : null}

      {sugerirBackup ? (
        <CartaoBackup
          aoFazer={() => router.push('/dados')}
          aoAdiar={() => setAjustes({ backupSugeridoEm: Date.now() })}
        />
      ) : null}
    </Tela>
  );
}

/** Sugestão gentil de backup: o app não guarda nada fora do celular, então trocar de aparelho apaga tudo. */
function CartaoBackup({ aoFazer, aoAdiar }: { aoFazer: () => void; aoAdiar: () => void }) {
  return (
    <View style={styles.cartaoBackup}>
      <Texto tipo="legenda" cor={cores.text}>
        Seus registros ficam só neste celular. Que tal guardar uma cópia cifrada? Se você trocar de aparelho, ela evita começar do zero.
      </Texto>
      <View style={styles.cartaoBackupAcoes}>
        <Botao onPress={aoFazer} style={styles.cartaoBackupBotao}>
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
  cartaoBackupAcoes: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartaoBackupBotao: { minHeight: 44, flex: 1 },
});
