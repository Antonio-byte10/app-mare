"""
Gera os ícones dos disfarces (Maré, Diário, Notas, Calma) em duas formas:
  - plugins/disfarce/res/**   recursos Android que o plugin plugins/with-disfarce.js copia para o
                              projeto nativo (ícone adaptativo + reserva para Android < 8);
  - assets/disfarces/<id>.png prévia mostrada na tela "Bloqueio e disfarce";
  - assets/notification-icon.png ícone das notificações (96x96, branco sobre transparente).
Uso (Pillow): python scripts/gerar-icones-disfarce.py
Os ícones são abstratos e neutros de propósito: nada neles lembra um app de sobriedade.
"""
import math
import os
import sys

from PIL import Image, ImageChops, ImageDraw

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(RAIZ, 'plugins', 'disfarce', 'res')
PREVIAS = os.path.join(RAIZ, 'assets', 'disfarces')
SS = 4  # supersampling para bordas suaves

# Cor de fundo do ícone adaptativo de cada disfarce.
FUNDOS = {
    'mare': '#071526',
    'diario': '#2E3F5E',
    'notas': '#F2C94C',
    'calma': '#1F6F78',
}

DENSIDADES = {'mdpi': 1.0, 'hdpi': 1.5, 'xhdpi': 2.0, 'xxhdpi': 3.0, 'xxxhdpi': 4.0}


def rgba(hex_, a=255):
    h = hex_.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def bezier(p0, p1, p2, p3, n=24):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        x = u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0]
        y = u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1]
        pts.append((x, y))
    return pts


class Tela:
    """Desenha em coordenadas de uma grade de 108 unidades (o tamanho do ícone adaptativo)."""

    def __init__(self, px):
        self.px = px
        self.k = px * SS / 108.0
        self.img = Image.new('RGBA', (px * SS, px * SS), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.img)

    def p(self, x, y):
        return (x * self.k, y * self.k)

    def poligono(self, pts, cor):
        self.d.polygon([self.p(*q) for q in pts], fill=cor)

    def retangulo(self, x0, y0, x1, y1, raio, cor):
        self.d.rounded_rectangle([*self.p(x0, y0), *self.p(x1, y1)], radius=raio * self.k, fill=cor)

    def circulo(self, cx, cy, r, cor=None, contorno=None, largura=0):
        self.d.ellipse(
            [*self.p(cx - r, cy - r), *self.p(cx + r, cy + r)],
            fill=cor,
            outline=contorno,
            width=max(1, round(largura * self.k)) if contorno else 0,
        )

    def linha(self, x0, y0, x1, y1, largura, cor):
        w = max(1, round(largura * self.k))
        self.d.line([self.p(x0, y0), self.p(x1, y1)], fill=cor, width=w)
        for x, y in ((x0, y0), (x1, y1)):  # pontas arredondadas
            self.circulo(x, y, largura / 2, cor)

    def mascara_circulo(self, cx, cy, r):
        m = Image.new('L', self.img.size, 0)
        ImageDraw.Draw(m).ellipse([*self.p(cx - r, cy - r), *self.p(cx + r, cy + r)], fill=255)
        return m

    def colar(self, camada, mascara):
        self.img.paste(camada, (0, 0), mascara)

    def pronta(self):
        return self.img.resize((self.px, self.px), Image.LANCZOS)


# --- Maré: o símbolo do app (lua e onda dentro de um aro) -------------------------------------
def desenhar_mare(t):
    cx = cy = 54
    k = 26 / 24.0  # raio do aro no símbolo (24) -> 26 na grade

    def m(x, y):  # coordenadas do símbolo (viewBox 64) -> grade de 108
        return (cx + (x - 32) * k, cy + (y - 32) * k)

    # Água: a onda do símbolo, recortada pelo aro.
    onda = []
    onda += bezier(m(2, 41), m(11, 35), m(19, 35), m(27, 40))
    onda += bezier(m(27, 40), m(35, 45), m(43, 46), m(51, 40))
    onda += bezier(m(51, 40), m(59, 34), m(60, 35), m(64, 37))
    onda += [m(64, 64), m(2, 64)]
    agua = Image.new('RGBA', t.img.size, (0, 0, 0, 0))
    da = ImageDraw.Draw(agua)
    da.polygon([t.p(*q) for q in onda], fill=rgba('#68C4DC'))
    t.colar(agua, t.mascara_circulo(cx, cy, 26))
    t.circulo(cx, cy, 26, contorno=rgba('#9BE8F0'), largura=2.6)
    # Lua em crescente (sand), com o recorte do símbolo.
    lua = Image.new('RGBA', t.img.size, rgba('#F2C98A'))
    mascara = Image.new('L', t.img.size, 0)
    dm = ImageDraw.Draw(mascara)
    (lx, ly), (rx, ry) = m(40, 20.5), m(44, 17.5)
    dm.ellipse([*t.p(lx - 6.6 * k, ly - 6.6 * k), *t.p(lx + 6.6 * k, ly + 6.6 * k)], fill=255)
    dm.ellipse([*t.p(rx - 6.2 * k, ry - 6.2 * k), *t.p(rx + 6.2 * k, ry + 6.2 * k)], fill=0)
    t.colar(lua, mascara)


# --- Diário: um caderno de capa creme com marcador ------------------------------------------
def desenhar_diario(t):
    t.retangulo(33, 27, 76, 81, 5, rgba('#F3EBDD'))
    t.retangulo(33, 27, 42, 81, 5, rgba('#D9CBB3'))
    t.d.rectangle([*t.p(38, 27), *t.p(42, 81)], fill=rgba('#D9CBB3'))
    for y in (36, 46, 56, 66, 76):  # furos do espiral
        t.circulo(37.5, y, 1.7, rgba('#8E7F68'))
    for i, y in enumerate((46, 56, 66)):
        t.linha(48, y, 68 - (6 if i == 2 else 0), y, 2.4, rgba('#BDB2A0'))
    t.poligono([(63, 27), (71, 27), (71, 41), (67, 37.5), (63, 41)], rgba('#E0A96D'))


# --- Notas: uma folha amarela de bloco, com a ponta dobrada ----------------------------------
def desenhar_notas(t):
    t.poligono([(34, 27), (74, 27), (74, 67), (60, 81), (34, 81)], rgba('#FFFDF6'))
    t.poligono([(74, 67), (60, 67), (60, 81)], rgba('#E6DAB0'))
    t.retangulo(34, 27, 74, 35, 0, rgba('#F6E7A8'))
    for i, y in enumerate((44, 53, 62)):
        t.linha(41, y, 67 - (10 if i == 2 else 0), y, 2.4, rgba('#C9BE98'))


# --- Calma: círculos que crescem, como um guia de respiração ---------------------------------
def desenhar_calma(t):
    t.circulo(54, 54, 8, rgba('#FFFFFF', 245))
    for r, a, w in ((15, 190, 2.8), (22, 125, 2.5), (29, 70, 2.2)):
        t.circulo(54, 54, r, contorno=rgba('#FFFFFF', a), largura=w)


DESENHOS = {'mare': desenhar_mare, 'diario': desenhar_diario, 'notas': desenhar_notas, 'calma': desenhar_calma}


def primeiro_plano(id_, px):
    t = Tela(px)
    DESENHOS[id_](t)
    return t.pronta()


def legado(id_, px):
    """Ícone para Android < 8 e prévia: quadrado arredondado com a arte maior (o adaptativo corta mais)."""
    grande = px * SS
    base = Image.new('RGBA', (grande, grande), (0, 0, 0, 0))
    ImageDraw.Draw(base).rounded_rectangle([0, 0, grande - 1, grande - 1], radius=grande * 0.22, fill=rgba(FUNDOS[id_]))
    t = Tela(px)
    DESENHOS[id_](t)
    arte = t.img.resize((round(grande * 1.3),) * 2, Image.LANCZOS)
    off = (grande - arte.width) // 2
    camada = Image.new('RGBA', (grande, grande), (0, 0, 0, 0))
    camada.paste(arte, (off, off))
    base = Image.alpha_composite(base, camada)
    # Mantém o recorte arredondado.
    forma = Image.new('L', (grande, grande), 0)
    ImageDraw.Draw(forma).rounded_rectangle([0, 0, grande - 1, grande - 1], radius=grande * 0.22, fill=255)
    base.putalpha(ImageChops.multiply(base.getchannel('A'), forma))
    return base.resize((px, px), Image.LANCZOS)


def icone_notificacao(px=96):
    """Ícone pequeno das notificações: só branco sobre transparente (o Android pinta com a cor do app).
    Uma onda simples, neutra: nada de lua, marca ou o que lembre o hábito."""
    t = Tela(px)
    for y, largura in ((43, 5.5), (60, 5.5)):
        pts = []
        pts += bezier((20, y), (30, y - 12), (38, y - 12), (54, y))
        pts += bezier((54, y), (70, y + 12), (78, y + 12), (88, y - 6))
        for a, b in zip(pts, pts[1:]):
            t.linha(a[0], a[1], b[0], b[1], largura, rgba('#FFFFFF'))
    return t.pronta()


XML_ADAPTATIVO = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/ic_disfarce_{id}_bg"/>
  <foreground android:drawable="@mipmap/ic_disfarce_{id}_fg"/>
</adaptive-icon>
"""


def main():
    os.makedirs(PREVIAS, exist_ok=True)
    cores = ['<?xml version="1.0" encoding="utf-8"?>', '<resources>']
    for id_, fundo in FUNDOS.items():
        for dens, k in DENSIDADES.items():
            pasta = os.path.join(RES, f'mipmap-{dens}')
            os.makedirs(pasta, exist_ok=True)
            primeiro_plano(id_, round(108 * k)).save(os.path.join(pasta, f'ic_disfarce_{id_}_fg.png'), optimize=True)
            legado(id_, round(48 * k)).save(os.path.join(pasta, f'ic_disfarce_{id_}.png'), optimize=True)
        pasta = os.path.join(RES, 'mipmap-anydpi-v26')
        os.makedirs(pasta, exist_ok=True)
        with open(os.path.join(pasta, f'ic_disfarce_{id_}.xml'), 'w', encoding='utf-8', newline='\n') as f:
            f.write(XML_ADAPTATIVO.format(id=id_))
        cores.append(f'  <color name="ic_disfarce_{id_}_bg">{fundo}</color>')
        legado(id_, 192).save(os.path.join(PREVIAS, f'{id_}.png'), optimize=True)
    cores.append('</resources>')
    pasta = os.path.join(RES, 'values')
    os.makedirs(pasta, exist_ok=True)
    with open(os.path.join(pasta, 'ic_disfarce_cores.xml'), 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(cores) + '\n')
    icone_notificacao().save(os.path.join(RAIZ, 'assets', 'notification-icon.png'), optimize=True)
    print('ok:', RES, PREVIAS)


if __name__ == '__main__':
    sys.exit(main())
