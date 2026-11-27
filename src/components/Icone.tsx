import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { cores } from '@/theme';

type Elemento =
  | { p: string }
  | { c: [cx: number, cy: number, r: number] }
  | { r: [x: number, y: number, w: number, h: number, rx: number] };

/** Ícones do mockup v2 (viewBox 24, traço arredondado). */
const livro: Elemento[] = [{ p: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z' }, { p: 'M9 8h6M9 12h6' }];

const desenhos = {
  inicio: [{ p: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' }],
  diario: [{ r: [4, 5, 16, 16, 3] }, { p: 'M16 3v4M8 3v4M4 11h16' }],
  onda: [
    { p: 'M2 13c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-2.5 5-1' },
    { p: 'M2 18c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0' },
  ],
  ondaSimples: [{ p: 'M2 13c2.5-3 5-3 7.5 0s5 3 7.5 0 3.5-2.5 5-1' }],
  livro,
  // Alias: mesma figura do livro.
  aprender: livro,
  notas: [{ p: 'M6 4h12v16H6z' }, { p: 'M9 9h6M9 13h6M9 17h3' }],
  conversa: [{ p: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z' }],
  mais: [{ c: [12, 7, 1.2] }, { c: [12, 12, 1.2] }, { c: [12, 17, 1.2] }],
  sino: [{ p: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9' }, { p: 'M13.7 21a2 2 0 0 1-3.4 0' }],
  cadeado: [{ r: [5, 11, 14, 10, 3] }, { p: 'M8 11V8a4 4 0 0 1 8 0v3' }],
  voltar: [{ p: 'M15 18l-6-6 6-6' }],
  avancar: [{ p: 'M9 18l6-6-6-6' }],
  adicionar: [{ p: 'M12 5v14M5 12h14' }],
  fechar: [{ p: 'M18 6L6 18M6 6l12 12' }],
  lapis: [{ p: 'M12 20h9' }, { p: 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z' }],
  check: [{ p: 'M5 12.5l4.5 4.5L19 7.5' }],
  setaDireita: [{ p: 'M5 12h14M13 6l6 6-6 6' }],
  relogio: [{ c: [12, 13, 8] }, { p: 'M12 9v4l2 2M10 2h4' }],
  sol: [{ c: [12, 12, 4] }, { p: 'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2' }],
  estrela: [{ p: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z' }],
  olhoOculto: [{ p: 'M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z' }, { p: 'M4 4l16 16' }],
  telefone: [
    {
      p: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
    },
  ],
  lixeira: [{ p: 'M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14' }],
  folha: [{ p: 'M5 19c0-8 6-14 14-14 0 8-6 14-14 14z' }, { p: 'M5 19l8-8' }],
  // Os três eixos da avaliação.
  folego: [
    { p: 'M3 15c2.2-2 4.4-2 6.6 0s4.4 2 6.6 0 3.3-2 4.8-1' },
    { p: 'M8 10c0-2 2-2.5 2-4.5M12.5 10c0-2 2-2.5 2-4.5' },
  ],
  calmaria: [{ p: 'M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z' }],
  foco: [{ c: [12, 12, 8] }, { c: [12, 12, 3] }],
  // Humor, do melhor ao mais difícil.
  humor1: [{ c: [12, 12, 9] }, { p: 'M8 14c1.5 2.5 6.5 2.5 8 0M9 10h.01M15 10h.01' }],
  humor2: [{ c: [12, 12, 9] }, { p: 'M8.5 14.5c1.5.8 5.5.8 7 0M9 10h.01M15 10h.01' }],
  humor3: [{ c: [12, 12, 9] }, { p: 'M8.5 15h7M9 10h.01M15 10h.01' }],
  humor4: [{ c: [12, 12, 9] }, { p: 'M8.5 15.5c1.5-.8 5.5-.8 7 0M9 10h.01M15 10h.01' }],
  humor5: [{ c: [12, 12, 9] }, { p: 'M8 16.5c1.5-2 6.5-2 8 0M9 10h.01M15 10h.01' }],
  // Não existem no mockup: teclado numérico do PIN e digital, no mesmo traço.
  apagarTecla: [{ p: 'M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z' }, { p: 'M17 9.5l-5 5M12 9.5l5 5' }],
  digital: [
    { p: 'M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4' },
    { p: 'M14 13.12c0 2.38 0 6.38-1 8.88' },
    { p: 'M17.29 21.02c.12-.6.43-2.3.5-3.02' },
    { p: 'M2 12a10 10 0 0 1 18-6' },
    { p: 'M21.8 16c.2-2 .131-5.354 0-6' },
    { p: 'M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2' },
    { p: 'M8.65 22c.21-.66.45-1.32.57-2' },
    { p: 'M9 6.8a6 6 0 0 1 9 5.2v2' },
  ],
  // Controles deslizantes, no mesmo traço.
  ajustes: [{ p: 'M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10' }, { c: [15, 6, 2.2] }, { c: [9, 12, 2.2] }, { c: [17, 18, 2.2] }],
} satisfies Record<string, Elemento[]>;

export type NomeIcone = keyof typeof desenhos;

type Props = {
  nome: NomeIcone;
  tamanho?: number;
  cor?: string;
  /** Espessura do traço. Padrão 1,6 (o botão da onda usa 2). */
  traco?: number;
};

export function Icone({ nome, tamanho = 22, cor = cores.muted, traco = 1.6 }: Props) {
  const elementos: Elemento[] = desenhos[nome];
  return (
    <Svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke={cor}
      strokeWidth={traco}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {elementos.map((e, i) => {
        if ('p' in e) return <Path key={i} d={e.p} />;
        if ('c' in e) return <Circle key={i} cx={e.c[0]} cy={e.c[1]} r={e.c[2]} />;
        const [x, y, w, h, rx] = e.r;
        return <Rect key={i} x={x} y={y} width={w} height={h} rx={rx} />;
      })}
    </Svg>
  );
}
