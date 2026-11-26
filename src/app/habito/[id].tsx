import { randomUUID } from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { Botao } from '@/components/Botao';
import { Chip } from '@/components/Chip';
import { Fundo } from '@/components/Fundo';
import { Icone } from '@/components/Icone';
import { Tela } from '@/components/Tela';
import { Texto } from '@/components/Texto';
import { confirmar } from '@/lib/confirmar';
import { dataLocal } from '@/lib/datas';
import { centavosParaTexto, inteiroPositivo, isoParaBr, paraCentavos, validarInicio } from '@/lib/formulario';
import type { Habito, TipoHabito } from '@/lib/tipos';
import { useMare } from '@/store';
import { comAlfa, cores, fontes } from '@/theme';

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

type CampoProps = {
  rotulo: string;
  valor: string;
  aoMudar: (t: string) => void;
  aoSair: () => void;
  erro?: string;
  placeholder?: string;
  teclado?: KeyboardTypeOptions;
  maxLength?: number;
};

function Campo({ rotulo, valor, aoMudar, aoSair, erro, placeholder, teclado, maxLength }: CampoProps) {
  return (
    <View style={styles.campo}>
      <Texto style={styles.rotulo}>{rotulo}</Texto>
      <TextInput
        accessibilityLabel={rotulo}
        value={valor}
        onChangeText={aoMudar}
        onBlur={aoSair}
        placeholder={placeholder}
        placeholderTextColor={cores.faint}
        keyboardType={teclado}
        maxLength={maxLength}
        style={[styles.input, erro ? { borderColor: cores.sand } : null]}
      />
      {erro ? (
        <Texto tipo="legenda" cor={cores.sand} accessibilityLiveRegion="polite">
          {erro}
        </Texto>
      ) : null}
    </View>
  );
}

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
      criadoEm: existente?.criadoEm ?? Date.now(),
    };
    salvarHabito(habito);
    voltar();
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
          <Pressable onPress={() => voltar()} accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={12}>
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
          <View style={styles.seg}>
            {[
              { v: false, r: 'Parar' },
              { v: true, r: 'Reduzir' },
            ].map((o) => (
              <Pressable
                key={o.r}
                accessibilityRole="button"
                accessibilityState={{ selected: reduzir === o.v }}
                onPress={() => {
                  setReduzir(o.v);
                  if (o.v && unidade.trim() === '') setUnidade(UNIDADE_PADRAO[tipo]);
                }}
                style={[styles.segItem, reduzir === o.v && styles.segOn]}
              >
                <Texto style={styles.segTexto} cor={reduzir === o.v ? cores.foam : cores.muted}>
                  {o.r}
                </Texto>
              </Pressable>
            ))}
          </View>
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
  input: {
    height: 52,
    borderRadius: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: cores.line2,
    backgroundColor: 'rgba(255,255,255,.03)',
    color: cores.text,
    fontFamily: fontes.ui,
    fontSize: 14.5,
  },
  seg: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: cores.line,
    backgroundColor: 'rgba(255,255,255,.02)',
  },
  segItem: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segOn: { backgroundColor: comAlfa(cores.foam, 0.13), borderColor: comAlfa(cores.foam, 0.35) },
  segTexto: { fontFamily: fontes.uiForte, fontSize: 14, lineHeight: 18 },
  acoes: { gap: 8, marginTop: 8 },
});
