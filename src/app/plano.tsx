import { randomUUID } from 'expo-crypto';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { BotaoIcone } from '@/components/BotaoIcone';
import { Campo } from '@/components/Campo';
import { CartaoCrise } from '@/components/CartaoCrise';
import { Chip } from '@/components/Chip';
import { Icone } from '@/components/Icone';
import { GrupoAjuste } from '@/components/LinhaAjuste';
import { TelaPasso } from '@/components/TelaPasso';
import { Texto } from '@/components/Texto';
import { confirmar } from '@/lib/confirmar';
import { detectarCriseEmTextos } from '@/lib/crise';
import {
  frasePlano,
  maisNovosPrimeiro,
  MAX_PLANO,
  MAX_PORQUE,
  SUGESTOES_ENTAO,
  SUGESTOES_SE,
  sugestoesLivres,
  validarPlano,
  validarPorque,
} from '@/lib/plano';
import { useVoltar } from '@/lib/useVoltar';
import { useMare } from '@/store';
import { cores, fontes } from '@/theme';

const param = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

/** Meu plano: os porquês (aparecem na Fissura) e os planos "Se..., então...". */
export default function MeuPlano() {
  const voltar = useVoltar();
  const { se: seParam, entao: entaoParam } = useLocalSearchParams<{ se?: string; entao?: string }>();
  const porques = useMare((e) => e.porques);
  const planos = useMare((e) => e.planos);
  const salvarPorque = useMare((e) => e.salvarPorque);
  const removerPorque = useMare((e) => e.removerPorque);
  const salvarPlano = useMare((e) => e.salvarPlano);
  const removerPlano = useMare((e) => e.removerPlano);

  // Porquê: 'novo' = adicionando, um id = editando, null = só a lista.
  const [editando, setEditando] = useState<string | 'novo' | null>(null);
  const [textoPorque, setTextoPorque] = useState('');
  const [erroPorque, setErroPorque] = useState<string | undefined>();

  // Plano: se veio do "Recomeçar com cuidado", o formulário já abre preenchido.
  const veioPronto = param(seParam) !== '' || param(entaoParam) !== '';
  const [novoPlano, setNovoPlano] = useState(veioPronto);
  const [se, setSe] = useState(param(seParam));
  const [entao, setEntao] = useState(param(entaoParam));
  const [erroPlano, setErroPlano] = useState<string | undefined>();

  const crise = detectarCriseEmTextos([textoPorque, se, entao]);

  const abrirPorque = (id: string | 'novo', texto = '') => {
    setEditando(id);
    setTextoPorque(texto);
    setErroPorque(undefined);
  };

  const salvarTextoPorque = () => {
    const r = validarPorque(textoPorque);
    if (r.erro !== undefined) {
      setErroPorque(r.erro);
      return;
    }
    const existente = porques.find((p) => p.id === editando);
    salvarPorque({ id: existente?.id ?? randomUUID(), texto: r.valor, criadoEm: existente?.criadoEm ?? Date.now() });
    setEditando(null);
    setTextoPorque('');
  };

  const salvarNovoPlano = () => {
    const r = validarPlano(se, entao);
    if ('erro' in r) {
      setErroPlano(r.erro);
      return;
    }
    salvarPlano({ id: randomUUID(), se: r.se, entao: r.entao, criadoEm: Date.now() });
    setNovoPlano(false);
    setSe('');
    setEntao('');
    setErroPlano(undefined);
  };

  const sugestoesEntao = sugestoesLivres(SUGESTOES_ENTAO, planos.map((p) => p.entao));

  return (
    <TelaPasso
      aoVoltar={voltar}
      topo={
        <Texto style={styles.titulo} accessibilityRole="header">
          Meu plano
        </Texto>
      }
      rodape={null}
    >
      <Texto style={styles.sub}>
        Decidir antes, com calma, ajuda a atravessar o momento difícil. Tudo fica só neste celular.
      </Texto>

      <GrupoAjuste>Meus porquês</GrupoAjuste>
      <Texto tipo="legenda" style={styles.legenda}>
        Aparecem na hora da onda, para lembrar o que importa.
      </Texto>
      {porques.length === 0 && editando === null ? (
        <Texto style={styles.vazio}>
          Ainda não há nenhum por aqui. Um porquê pode ser uma pessoa, um sonho, um jeito de se sentir.
        </Texto>
      ) : null}
      {maisNovosPrimeiro(porques).map((p, i) =>
        editando === p.id ? null : (
          <View key={p.id} style={[styles.item, i > 0 && styles.itemSeparado]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Editar o porquê: ${p.texto}`}
              onPress={() => abrirPorque(p.id, p.texto)}
              style={styles.itemTexto}
            >
              <Texto style={styles.porque}>{`“${p.texto}”`}</Texto>
            </Pressable>
            <BotaoIcone
              icone="lixeira"
              accessibilityLabel={`Remover o porquê: ${p.texto}`}
              onPress={() =>
                confirmar('Remover este porquê?', 'Ele deixa de aparecer na hora da onda.', 'Remover', () => removerPorque(p.id))
              }
              style={styles.botaoPequeno}
            />
          </View>
        ),
      )}
      {editando !== null ? (
        <View style={styles.formulario}>
          <Campo
            rotulo={editando === 'novo' ? 'Meu porquê' : 'Editar o porquê'}
            valor={textoPorque}
            aoMudar={(t) => {
              setTextoPorque(t);
              if (erroPorque) setErroPorque(undefined);
            }}
            erro={erroPorque}
            multilinha
            maxLength={MAX_PORQUE}
            placeholder="Ex.: Quero subir a escada com meu filho sem perder o fôlego."
            autoFoco
          />
          <View style={styles.acoes}>
            <Botao onPress={salvarTextoPorque}>Salvar</Botao>
            <Botao variante="texto" onPress={() => setEditando(null)}>
              Cancelar
            </Botao>
          </View>
        </View>
      ) : (
        <Botao variante="secundario" onPress={() => abrirPorque('novo')} style={styles.adicionar}>
          Adicionar um porquê
        </Botao>
      )}

      <GrupoAjuste>Se... então...</GrupoAjuste>
      <Texto tipo="legenda" style={styles.legenda}>
        Combine com você mesmo o que fazer numa situação difícil. Ações prontas são mais fáceis de seguir.
      </Texto>
      {planos.length === 0 && !novoPlano ? (
        <Texto style={styles.vazio}>
          Nenhum plano ainda. Por exemplo: “Se eu sentir ansiedade à noite, então respirar fundo e beber água”.
        </Texto>
      ) : null}
      {maisNovosPrimeiro(planos).map((p, i) => (
        <View key={p.id} style={[styles.item, i > 0 && styles.itemSeparado]}>
          <View style={styles.itemTexto}>
            <Texto style={styles.plano}>{frasePlano(p)}</Texto>
          </View>
          <BotaoIcone
            icone="lixeira"
            accessibilityLabel={`Remover o plano: ${frasePlano(p)}`}
            onPress={() => confirmar('Remover este plano?', frasePlano(p), 'Remover', () => removerPlano(p.id))}
            style={styles.botaoPequeno}
          />
        </View>
      ))}
      {novoPlano ? (
        <View style={styles.formulario}>
          <Campo
            rotulo="Se..."
            valor={se}
            aoMudar={(t) => {
              setSe(t);
              if (erroPlano) setErroPlano(undefined);
            }}
            maxLength={MAX_PLANO}
            placeholder="eu sentir vontade logo depois do café"
            ajuda="Em que situação isso vale?"
          />
          <View style={styles.sugestoes}>
            {SUGESTOES_SE.map((s) => (
              <Chip key={s} ativo={se === s} onPress={() => setSe(s)}>
                {s}
              </Chip>
            ))}
          </View>
          <View style={styles.espaco} />
          <Campo
            rotulo="Então..."
            valor={entao}
            aoMudar={(t) => {
              setEntao(t);
              if (erroPlano) setErroPlano(undefined);
            }}
            erro={erroPlano}
            maxLength={MAX_PLANO}
            placeholder="beber um copo de água e respirar fundo"
            ajuda="O que você vai fazer?"
          />
          <View style={styles.sugestoes}>
            {sugestoesEntao.map((s) => (
              <Chip key={s} ativo={entao === s} onPress={() => setEntao(s)}>
                {s}
              </Chip>
            ))}
          </View>
          <View style={[styles.acoes, styles.espaco]}>
            <Botao onPress={salvarNovoPlano}>Adicionar plano</Botao>
            <Botao
              variante="texto"
              onPress={() => {
                setNovoPlano(false);
                setSe('');
                setEntao('');
                setErroPlano(undefined);
              }}
            >
              Cancelar
            </Botao>
          </View>
        </View>
      ) : (
        <Botao variante="secundario" onPress={() => setNovoPlano(true)} style={styles.adicionar}>
          Adicionar um plano
        </Botao>
      )}

      {crise ? (
        <View style={styles.crise}>
          <CartaoCrise tipo={crise} />
        </View>
      ) : null}
      <View style={styles.rodapeIcone}>
        <Icone nome="cadeado" tamanho={14} cor={cores.faint} />
        <Texto tipo="legenda" style={{ color: cores.faint }}>
          Guardado só neste celular. Nunca vai para a IA.
        </Texto>
      </View>
    </TelaPasso>
  );
}

const styles = StyleSheet.create({
  titulo: { fontFamily: fontes.display, fontSize: 24, lineHeight: 29, letterSpacing: -0.48 },
  sub: { fontSize: 14, lineHeight: 21, color: cores.muted },
  legenda: { marginTop: 4, marginBottom: 6 },
  vazio: { marginVertical: 10, fontSize: 14, lineHeight: 21, color: cores.muted },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
  itemSeparado: { borderTopWidth: 1, borderTopColor: cores.line },
  itemTexto: { flex: 1, minHeight: 48, justifyContent: 'center' },
  porque: { fontFamily: fontes.display, fontSize: 16, lineHeight: 23 },
  plano: { fontSize: 14.5, lineHeight: 22 },
  botaoPequeno: { width: 44, height: 44 },
  adicionar: { marginTop: 10 },
  formulario: { marginTop: 14 },
  acoes: { gap: 6 },
  sugestoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: -8 },
  espaco: { marginTop: 18 },
  crise: { marginTop: 18 },
  rodapeIcone: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 },
});
