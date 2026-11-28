"""
Arte do ícone da Maré (usada por gerar-icones-disfarce.py): céu noturno em degradê, lua crescente
com um halo suave, duas ondas e o reflexo da lua na água. Tudo numa grade de 108 unidades, o tamanho
do ícone adaptativo do Android (a área sempre visível é o círculo de raio 33 no centro).

Camadas:
  - fundo(px):         o céu (vai como fundo do ícone adaptativo);
  - frente(px):        lua, ondas e reflexo, com transparência no resto;
  - mono(px):          a versão de uma cor só para o ícone temático (Android 13+): lua e duas linhas de onda;
  - completo(px):      fundo + frente, para o ícone legado, a prévia e a abertura.
"""
import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SS = 4  # supersampling para bordas suaves

CEU_TOPO = (7, 21, 38)  # #071526, a cor de fundo do app
CEU_HORIZONTE = (27, 52, 102)  # azul mais claro perto da água
AREIA = (242, 201, 138)  # #F2C98A, a lua
AGUA_FUNDO = ((126, 214, 228), (78, 140, 205))  # onda de trás: ciano claro -> azul
AGUA_FRENTE = ((62, 150, 200), (38, 52, 140))  # onda da frente, mais funda (azul -> índigo)
CRISTA = (205, 245, 250)

LUA = (63.0, 40.0, 11.5)  # centro e raio
RECORTE_LUA = (68.5, 35.5, 9.8)  # o círculo que "morde" a lua


def _onda(base, amp, fase, comp=54.0):
    """Pontos (x, y) de uma onda senoidal de ponta a ponta da grade."""
    return [(x, base + amp * math.sin(2 * math.pi * x / comp + fase)) for x in np.linspace(-2, 110, 160)]


ONDA_TRAS = dict(base=63.0, amp=2.6, fase=0.6)
ONDA_FRENTE = dict(base=71.0, amp=3.2, fase=2.4)


class _Tela:
    def __init__(self, px):
        self.n = px * SS
        self.k = self.n / 108.0

    def p(self, x, y):
        return (x * self.k, y * self.k)

    def mascara(self):
        return Image.new('L', (self.n, self.n), 0)

    def degrade_vertical(self, c0, c1, y0, y1):
        """Imagem RGB com degradê vertical de c0 (em y0) a c1 (em y1), em unidades da grade."""
        ys = (np.arange(self.n) / self.k - y0) / max(1e-6, y1 - y0)
        t = np.clip(ys, 0, 1)[:, None, None]
        c0, c1 = np.array(c0, float), np.array(c1, float)
        linha = c0 + (c1 - c0) * t
        arr = np.broadcast_to(linha, (self.n, self.n, 3)).astype(np.uint8)
        return Image.fromarray(arr, 'RGB').convert('RGBA')

    def poligono_onda(self, onda):
        m = self.mascara()
        pts = [self.p(*q) for q in _onda(**onda)] + [self.p(110, 112), self.p(-2, 112)]
        ImageDraw.Draw(m).polygon(pts, fill=255)
        return m

    def linha_onda(self, onda, largura, x0=-2, x1=110):
        m = self.mascara()
        pts = [self.p(x, y) for x, y in _onda(**onda) if x0 <= x <= x1]
        r = largura * self.k / 2
        d = ImageDraw.Draw(m)
        # Um disco a cada passo pequeno: traço grosso sem as quinas de `line` nas curvas.
        for (xa, ya), (xb, yb) in zip(pts, pts[1:]):
            passos = max(1, int(math.hypot(xb - xa, yb - ya) / max(1.0, r / 3)))
            for i in range(passos + 1):
                x, y = xa + (xb - xa) * i / passos, ya + (yb - ya) * i / passos
                d.ellipse([x - r, y - r, x + r, y + r], fill=255)
        return m

    def crescente(self):
        m = self.mascara()
        d = ImageDraw.Draw(m)
        (cx, cy, r), (rx, ry, rr) = LUA, RECORTE_LUA
        d.ellipse([*self.p(cx - r, cy - r), *self.p(cx + r, cy + r)], fill=255)
        d.ellipse([*self.p(rx - rr, ry - rr), *self.p(rx + rr, ry + rr)], fill=0)
        return m

    def reduzir(self, img, px):
        return img.resize((px, px), Image.LANCZOS)


def _ceu(t):
    ceu = t.degrade_vertical(CEU_TOPO, CEU_HORIZONTE, 8, 70)
    # Halo da lua: um brilho bem suave em volta dela.
    halo = Image.new('RGBA', ceu.size, (170, 200, 255, 0))
    m = t.mascara()
    cx, cy, r = LUA
    ImageDraw.Draw(m).ellipse([*t.p(cx - r * 1.9, cy - r * 1.9), *t.p(cx + r * 1.9, cy + r * 1.9)], fill=46)
    m = m.filter(ImageFilter.GaussianBlur(radius=t.k * 6))
    halo.putalpha(m)
    ceu = Image.alpha_composite(ceu, halo)
    # Algumas estrelas pequenas, longe da lua.
    d = ImageDraw.Draw(ceu)
    for x, y, r, a in ((30, 30, 0.9, 200), (41, 22, 0.6, 150), (24, 46, 0.55, 130), (47, 35, 0.5, 110), (80, 24, 0.5, 120)):
        d.ellipse([*t.p(x - r, y - r), *t.p(x + r, y + r)], fill=(230, 240, 255, a))
    return ceu


def _frente(t):
    img = Image.new('RGBA', (t.n, t.n), (0, 0, 0, 0))
    # Lua.
    lua = Image.new('RGBA', img.size, AREIA + (255,))
    img.paste(lua, (0, 0), t.crescente())
    # Onda de trás, um pouco transparente.
    tras = t.degrade_vertical(*AGUA_FUNDO, 60, 100)
    tras.putalpha(t.poligono_onda(ONDA_TRAS).point(lambda v: v * 0.75))
    img = Image.alpha_composite(img, tras)
    # Reflexo da lua na água: traços curtos que vão sumindo.
    reflexo = Image.new('RGBA', img.size, AREIA + (0,))
    m = t.mascara()
    d = ImageDraw.Draw(m)
    for y, meia, a in ((78.0, 6.0, 120), (84.0, 4.2, 90), (89.5, 2.6, 60)):
        r = 0.8 * t.k
        (x0, yy), (x1, _) = t.p(LUA[0] - meia, y), t.p(LUA[0] + meia, y)
        d.rounded_rectangle([x0, yy - r, x1, yy + r], radius=r, fill=a)
    reflexo.putalpha(m.filter(ImageFilter.GaussianBlur(radius=t.k * 0.35)))
    # Onda da frente, cobrindo parte do reflexo de trás.
    frente = t.degrade_vertical(*AGUA_FRENTE, 66, 104)
    frente.putalpha(t.poligono_onda(ONDA_FRENTE))
    img = Image.alpha_composite(img, frente)
    img = Image.alpha_composite(img, reflexo)
    # Crista clara na onda da frente.
    crista = Image.new('RGBA', img.size, CRISTA + (0,))
    crista.putalpha(t.linha_onda(ONDA_FRENTE, 1.1).point(lambda v: v * 0.6))
    img = Image.alpha_composite(img, crista)
    return img


def fundo(px):
    t = _Tela(px)
    return t.reduzir(_ceu(t), px)


def frente(px):
    t = _Tela(px)
    return t.reduzir(_frente(t), px)


def completo(px):
    t = _Tela(px)
    return t.reduzir(Image.alpha_composite(_ceu(t), _frente(t)), px)


def mono(px):
    """Lua e duas linhas de onda, brancas sobre transparente (o Android pinta com a cor do tema)."""
    t = _Tela(px)
    m = t.crescente()
    for onda, x0, x1 in ((dict(ONDA_TRAS, base=63.5), 30, 78), (dict(ONDA_FRENTE, base=75.0), 26, 82)):
        linha = t.linha_onda(onda, 4.4, x0, x1)
        m = Image.fromarray(np.maximum(np.asarray(m), np.asarray(linha)), 'L')
    img = Image.new('RGBA', (t.n, t.n), (255, 255, 255, 0))
    img.putalpha(m)
    return t.reduzir(img, px)


if __name__ == '__main__':
    import os
    import sys

    destino = sys.argv[1] if len(sys.argv) > 1 else '.'
    completo(512).save(os.path.join(destino, 'previa-completo.png'))
    mono(512).save(os.path.join(destino, 'previa-mono.png'))
