import { randomUUID } from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { BotaoIcone } from '@/components/BotaoIcone';
import { Campo } from '@/components/Campo';
import { Icone } from '@/components/Icone';
import { Interruptor } from '@/components/Interruptor';
import { DivisorAjuste, GrupoAjuste, LinhaAjuste } from '@/components/LinhaAjuste';
import { TelaPasso } from '@/components/TelaPasso';
import { Texto } from '@/components/Texto';
import { GRUPOS_APOIO, RECURSOS, TEXTO_PROFISSIONAL, type Recurso } from '@/conteudo/apoio';
import { abrirLink } from '@/lib/abrir';
import { confirmar } from '@/lib/confirmar';
import { contatosPorNome, urlLigar, validarContato } from '@/lib/contatos';
import { useVoltar } from '@/lib/useVoltar';
import { useMare } from '@/store';
import { comAlfa, cores, fontes } from '@/theme';

/** Apoio (spec 6.6): ligar e falar com pessoas de verdade, sem precisar de IA nem de internet. */
export default function Apoio() {
  const voltar = useVoltar();
  const router = useRouter();
  const contatos = useMare((e) => e.contatos);
  const emergencia = useMare((e) => e.ajustes.contatosEmergencia);
  const setAjustes = useMare((e) => e.setAjustes);
  const salvarContato = useMare((e) => e.salvarContato);
  const removerContato = useMare((e) => e.removerContato);
  const [adicionando, setAdicionando] = useState(false);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState<string | undefined>();

  const adicionar = () => {
    const r = validarContato(nome, telefone);
    if ('erro' in r) {
      setErro(r.erro);
      return;
    }
    salvarContato({ id: randomUUID(), nome: r.nome, telefone: r.telefone, criadoEm: Date.now() });
    setAdicionando(false);
    setNome('');
    setTelefone('');
    setErro(undefined);
  };

  return (
    <TelaPasso
      aoVoltar={voltar}
      topo={
        <Texto style={styles.titulo} accessibilityRole="header">
          Apoio
        </Texto>
      }
      rodape={null}
    >
      <Texto style={styles.sub}>
        Pedir ajuda é um passo de coragem. Estas ligações são gratuitas e você não precisa explicar tudo.
      </Texto>

      {GRUPOS_APOIO.map((grupo) => (
        <View key={grupo}>
          <GrupoAjuste>{grupo}</GrupoAjuste>
          {RECURSOS.filter((r) => r.grupo === grupo).map((r, i) => (
            <CartaoRecurso key={r.id} recurso={r} separado={i > 0} destaque={grupo === 'Ajuda agora'} />
          ))}
        </View>
      ))}

      <GrupoAjuste>{TEXTO_PROFISSIONAL.titulo}</GrupoAjuste>
      <Texto style={styles.corpo}>{TEXTO_PROFISSIONAL.corpo}</Texto>
      {TEXTO_PROFISSIONAL.passos.map((p, i) => (
        <View key={p} style={styles.passo}>
          <Texto style={styles.numero}>{String(i + 1)}</Texto>
          <Texto style={styles.passoTexto}>{p}</Texto>
        </View>
      ))}
      <Botao variante="secundario" onPress={() => router.push('/aprender/ajuda-no-sus')} style={styles.maisSus}>
        Como encontrar ajuda gratuita
      </Botao>

      <GrupoAjuste>Contatos de confiança</GrupoAjuste>
      <Texto tipo="legenda" style={styles.legenda}>
        Pessoas para quem você pode ligar, também em “Ainda difícil”, durante a onda. Ficam só neste celular e nunca vão para a IA.
      </Texto>
      {contatos.length === 0 && !adicionando ? (
        <Texto style={styles.corpo}>
          Ainda não há ninguém. Pense em alguém que acolhe você sem julgar, e guarde o telefone aqui.
        </Texto>
      ) : null}
      {contatosPorNome(contatos).map((c, i) => (
        <View key={c.id} style={[styles.contato, i > 0 && styles.separado]}>
          <View style={styles.contatoTexto}>
            <Texto style={styles.nome}>{c.nome}</Texto>
            <Texto tipo="legenda">{c.telefone}</Texto>
          </View>
          <BotaoIcone
            icone="telefone"
            accessibilityLabel={`Ligar para ${c.nome}`}
            onPress={() => abrirLink(urlLigar(c.telefone))}
            style={styles.botaoContato}
          />
          <BotaoIcone
            icone="lixeira"
            accessibilityLabel={`Remover ${c.nome} dos contatos`}
            onPress={() =>
              confirmar('Remover contato?', `${c.nome} deixa de aparecer aqui.`, 'Remover', () => removerContato(c.id))
            }
            style={styles.botaoContato}
          />
        </View>
      ))}
      {adicionando ? (
        <View style={styles.formulario}>
          <Campo
            rotulo="Nome"
            valor={nome}
            aoMudar={(t) => {
              setNome(t);
              if (erro) setErro(undefined);
            }}
            maxLength={40}
            placeholder="Como você chama essa pessoa"
            autoFoco
          />
          <Campo
            rotulo="Telefone"
            valor={telefone}
            aoMudar={(t) => {
              setTelefone(t);
              if (erro) setErro(undefined);
            }}
            erro={erro}
            teclado="phone-pad"
            maxLength={20}
            placeholder="(11) 98888-7777"
          />
          <Botao onPress={adicionar}>Salvar contato</Botao>
          <Botao
            variante="texto"
            onPress={() => {
              setAdicionando(false);
              setErro(undefined);
            }}
          >
            Cancelar
          </Botao>
        </View>
      ) : (
        <Botao variante="secundario" onPress={() => setAdicionando(true)} style={styles.adicionar}>
          Adicionar contato
        </Botao>
      )}

      <GrupoAjuste>Privacidade</GrupoAjuste>
      <LinhaAjuste
        titulo="Contatos de emergência"
        subtitulo="mostra CVV 188 e SAMU 192 na onda e quando o app notar sinais de risco"
        icone="telefone"
        direita={
          <Interruptor
            ligado={emergencia}
            aoMudar={(v) => setAjustes({ contatosEmergencia: v })}
            accessibilityLabel="Contatos de emergência"
          />
        }
      />
      <DivisorAjuste />
      <Texto tipo="legenda" style={styles.aviso}>
        Telefones e links podem mudar com o tempo. O Maré não substitui um profissional de saúde.
      </Texto>
    </TelaPasso>
  );
}

function CartaoRecurso({ recurso: r, separado, destaque }: { recurso: Recurso; separado: boolean; destaque: boolean }) {
  return (
    <View style={[styles.recurso, separado && styles.separado]}>
      <View style={styles.recursoCabeca}>
        {destaque ? <Icone nome="telefone" tamanho={18} cor={cores.coral} /> : null}
        <Texto style={styles.nome}>{r.nome}</Texto>
      </View>
      <Texto style={styles.desc}>{r.descricao}</Texto>
      {r.nota ? <Texto tipo="legenda">{r.nota}</Texto> : null}
      {r.telefone || r.url ? (
        <View style={styles.botoes}>
          {r.telefone ? (
            <Botao
              variante={destaque ? 'primario' : 'secundario'}
              onPress={() => abrirLink(`tel:${r.telefone}`)}
              style={styles.botao}
              accessibilityLabel={`${r.rotuloTelefone ?? 'Ligar'} para ${r.nome}`}
            >
              {r.rotuloTelefone ?? 'Ligar'}
            </Botao>
          ) : null}
          {r.url ? (
            <Botao
              variante="secundario"
              onPress={() => abrirLink(r.url as string)}
              style={styles.botao}
              accessibilityLabel={`${r.rotuloUrl ?? 'Abrir o site'}, ${r.nome}. Abre no navegador.`}
            >
              {r.rotuloUrl ?? 'Abrir o site'}
            </Botao>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: { fontFamily: fontes.display, fontSize: 24, lineHeight: 29, letterSpacing: -0.48 },
  sub: { fontSize: 14, lineHeight: 21, color: cores.muted },
  legenda: { marginTop: 4, marginBottom: 6 },
  corpo: { marginTop: 6, fontSize: 14, lineHeight: 21, color: cores.muted },
  aviso: { marginTop: 8 },
  recurso: { paddingVertical: 14, gap: 6 },
  separado: { borderTopWidth: 1, borderTopColor: cores.line },
  recursoCabeca: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nome: { fontFamily: fontes.uiForte, fontSize: 15, lineHeight: 20, color: cores.text },
  desc: { fontSize: 14, lineHeight: 21, color: cores.muted },
  botoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  botao: { flexGrow: 1, flexBasis: 140, height: 48 },
  passo: { flexDirection: 'row', gap: 12, marginTop: 12, alignItems: 'flex-start' },
  numero: {
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: fontes.uiForte,
    fontSize: 12.5,
    color: cores.aqua,
    backgroundColor: comAlfa(cores.aqua, 0.12),
    overflow: 'hidden',
  },
  passoTexto: { flex: 1, fontSize: 14, lineHeight: 21, color: cores.text },
  maisSus: { marginTop: 16 },
  contato: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  contatoTexto: { flex: 1, gap: 2 },
  botaoContato: { width: 44, height: 44 },
  formulario: { marginTop: 14 },
  adicionar: { marginTop: 10 },
});
