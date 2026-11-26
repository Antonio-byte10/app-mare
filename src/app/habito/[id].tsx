import { randomUUID } from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Chip } from '@/components/Chip';
import { Fundo } from '@/components/Fundo';
import { Icone } from '@/components/Icone';
import { Segmento } from '@/components/Segmento';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { confirmar } from '@/lib/confirmar';
import { dataLocal } from '@/lib/datas';
import {
  centavosParaTexto,
  diasAntesDeTexto,
  inteiroPositivo,
  isoParaBr,
  paraCentavos,
  recalculaHistorico,
  validarInicio,
} from '@/lib/formulario';
import type { Habito, TipoHabito } from '@/lib/tipos';
import { useMare } from '@/store';
import { cores, fontes } from '@/theme';

const TIPOS: { id: TipoHabito; rotulo: string }[] = [
  { id: 'tabaco', rotulo: 'Cigarro / nicotina' },
  { id: 'alcool', rotulo: 'Álcool' },
  { id: 'sexual', rotulo: 'Pornografia / masturbação' },
];
const CORES: Habito['cor'][] = ['aqua', 'peri', 'coral', 'sand', 'foam'];
const NOMES_COR: Record<Habito['cor'], string> = {
  aqua: 'Água',
  peri: 'Lavanda',
  coral: 'Coral',
  sand: 'Areia',
  foam: 'Espuma',
};
const UNIDADE_PADRAO: Record<TipoHabito, string> = { tabaco: 'cigarros', alcool: 'doses', sexual: 'vezes' };

export default function EditarHabito() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const existente = useMare((e) => e.habitos.find((h) => h.id === id));
  const salvarHabito = useMare((e) => e.salvarHabito);
  const removerHabito = useMare((e) => e.removerHabito);
  const edicao = id !== 'novo';
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const [tipo, setTipo] = useState<TipoHabito>(existente?.tipo ?? 'tabaco');
  const [apelido, setApelido] = useState(existente?.apelido ?? '');
  const [cor, setCor] = useState<Habito['cor']>(existente?.cor ?? 'aqua');
  const [reduzir, setReduzir] = useState(existente?.meta.tipo === 'reduzir');
  const [maxPorDia, setMaxPorDia] = useState(
    existente?.meta.tipo === 'reduzir' ? String(existente.meta.maxPorDia) : '',
  );
  const [unidade, setUnidade] = useState(existente?.meta.tipo === 'reduzir' ? existente.meta.unidade : '');
  const [inicio, setInicio] = useState(isoParaBr(existente?.inicio ?? dataLocal(new Date())));
  const [custo, setCusto] = useState(
    existente?.custoPorDiaCentavos != null ? centavosParaTexto(existente.custoPorDiaCentavos) : '',
  );
  const [unidadesPorDia, setUnidadesPorDia] = useState(
    existente?.unidadesPorDia != null ? String(existente.unidadesPorDia) : '',
  );
  const [diasAntes, setDiasAntes] = useState(existente?.diasAntes ? String(existente.diasAntes) : '');
  const [tocados, setTocados] = useState<Record<string, boolean>>({});
  const tocar = (campo: string) => setTocados((t) => (t[campo] ? t : { ...t, [campo]: true }));

  if (edicao && !existente) {
    return (
      <Fundo>
        <Tela>
          <Texto>Hábito não encontrado.</Texto>
          <Botao variante="texto" onPress={() => voltar()}>
            Voltar
          </Botao>
        </Tela>
      </Fundo>
    );
  }

  const erros = {
    apelido: apelido.trim() === '' ? 'Dê um apelido ao hábito.' : undefined,
    maxPorDia: reduzir ? inteiroPositivo(maxPorDia, true).erro : undefined,
    unidade: reduzir && unidade.trim() === '' ? 'Informe a unidade (ex.: cigarros).' : undefined,
    inicio: validarInicio(inicio).erro,
    custo: paraCentavos(custo).erro,
    unidadesPorDia: inteiroPositivo(unidadesPorDia).erro,
    diasAntes: diasAntesDeTexto(diasAntes).erro,
  };
  const temErro = Object.values(erros).some(Boolean);
  const mostrar = (c: keyof typeof erros) => (tocados[c] ? erros[c] : undefined);
  const campo = (c: keyof typeof erros, set: (t: string) => void) => ({
    aoMudar: (t: string) => {
      set(t);
      tocar(c);
    },
    aoSair: () => tocar(c),
    erro: mostrar(c),
  });

  const salvar = () => {
    if (temErro) return;
    const habito: Habito = {
      id: existente?.id ?? randomUUID(),
      tipo,
      apelido: apelido.trim(),
      cor,
      meta: reduzir
        ? { tipo: 'reduzir', maxPorDia: inteiroPositivo(maxPorDia).valor as number, unidade: unidade.trim() }
        : { tipo: 'parar' },
      inicio: validarInicio(inicio).valor as string,
      custoPorDiaCentavos: paraCentavos(custo).valor,
      unidadesPorDia: inteiroPositivo(unidadesPorDia).valor,
      diasAntes: diasAntesDeTexto(diasAntes).valor,
      criadoEm: existente?.criadoEm ?? Date.now(),
    };
    const gravar = () => {
      salvarHabito(habito);
      voltar();
    };
    // Os dias anteriores são lidos com a meta e o início atuais: avisa antes de recalcular.
    if (existente && recalculaHistorico(existente, habito)) {
      confirmar(
        'Recalcular seus dias?',
        'Isso recalcula seus dias anteriores com a nova meta.',
        'Salvar e recalcular',
        gravar,
        false,
      );
      return;
    }
    gravar();
  };

  const remover = () =>
    confirmar(
      'Remover hábito',
      'O hábito e os relatos dele serão apagados. Isso não pode ser desfeito.',
      'Remover',
      () => {
        if (!existente) return;
        removerHabito(existente.id);
        voltar();
      },
    );

  return (
    <Fundo>
      <Tela rolavel>
        <View style={styles.topo}>
          <Pressable onPress={() => voltar()} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={14}>
            <Icone nome="voltar" />
          </Pressable>
          <Texto tipo="titulo">{edicao ? 'Editar hábito' : 'Novo hábito'}</Texto>
        </View>

        <View style={styles.campo}>
          <Texto style={styles.rotulo}>Tipo</Texto>
          <View style={styles.chips}>
            {TIPOS.map((t) => (
              <Chip key={t.id} ativo={tipo === t.id} onPress={() => setTipo(t.id)}>
                {t.rotulo}
              </Chip>
            ))}
          </View>
        </View>

        <Campo
          rotulo="Apelido"
          valor={apelido}
          {...campo('apelido', setApelido)}
          placeholder="Como você quer chamar"
          maxLength={20}
        />

        <View style={styles.campo}>
          <Texto style={styles.rotulo}>Cor</Texto>
          <View style={styles.chips}>
            {CORES.map((c) => (
              <Chip key={c} ativo={cor === c} cor={cores[c]} ponto onPress={() => setCor(c)}>
                {NOMES_COR[c]}
              </Chip>
            ))}
          </View>
        </View>

        <View style={styles.campo}>
          <Texto style={styles.rotulo}>Meta</Texto>
          <Segmento
            opcoes={[
              { valor: false, rotulo: 'Parar' },
              { valor: true, rotulo: 'Reduzir' },
            ]}
            valor={reduzir}
            onChange={(v) => {
              setReduzir(v);
              if (v && unidade.trim() === '') setUnidade(UNIDADE_PADRAO[tipo]);
            }}
            accessibilityLabel="Meta"
          />
        </View>

        {reduzir ? (
          <>
            <Campo
              rotulo="Limite por dia"
              valor={maxPorDia}
              {...campo('maxPorDia', setMaxPorDia)}
              teclado="number-pad"
              placeholder="Ex.: 5"
            />
            <Campo
              rotulo="Unidade"
              valor={unidade}
              {...campo('unidade', setUnidade)}
              placeholder="cigarros, doses..."
              maxLength={20}
            />
          </>
        ) : null}

        <Campo
          rotulo="Início"
          valor={inicio}
          {...campo('inicio', setInicio)}
          placeholder="DD/MM/AAAA"
          teclado="numbers-and-punctuation"
          maxLength={10}
        />
        <Campo
          rotulo="Já estou há N dias (opcional)"
          valor={diasAntes}
          {...campo('diasAntes', setDiasAntes)}
          teclado="number-pad"
          placeholder="Ex.: 12"
          ajuda="Se você já estava sem usar antes de começar aqui, esses dias entram no seu total, na sua sequência e no seu recorde."
          maxLength={4}
        />
        <Campo
          rotulo="Custo por dia em R$ (opcional)"
          valor={custo}
          {...campo('custo', setCusto)}
          placeholder="Ex.: 15,50"
          teclado="decimal-pad"
        />
        <Campo
          rotulo="Unidades por dia (opcional)"
          valor={unidadesPorDia}
          {...campo('unidadesPorDia', setUnidadesPorDia)}
          teclado="number-pad"
          placeholder="Quanto você usava por dia"
        />

        <View style={styles.acoes}>
          <Botao onPress={salvar} desabilitado={temErro}>
            Salvar
          </Botao>
          {edicao ? (
            <Botao variante="texto" onPress={remover}>
              Remover hábito
            </Botao>
          ) : null}
        </View>
      </Tela>
    </Fundo>
  );
}

const styles = StyleSheet.create({
  topo: { gap: 14, marginBottom: 22 },
  campo: { marginBottom: 20, gap: 8 },
  rotulo: { fontFamily: fontes.uiForte, fontSize: 13.5, lineHeight: 18, color: cores.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  acoes: { gap: 8, marginTop: 8 },
});
