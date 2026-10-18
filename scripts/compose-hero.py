"""Compositions héros « lumière du matin » autour du VRAI packshot détouré.

Le packshot n'est jamais retouché (étiquetage intact) : seul le décor est généré.
Usage : python hero.py <packshot-cutout.webp> <dossier_sortie>
"""
import math
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

CUT, OUT = sys.argv[1], sys.argv[2]
rng = np.random.default_rng(11)


def rgb(*c):
    return np.array(c, dtype=np.float32) / 255.0


def to_L(a):
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), "L")


def from_L(im):
    return np.asarray(im).astype(np.float32) / 255.0


def blur(a, r):
    return from_L(to_L(a).filter(ImageFilter.GaussianBlur(max(0.1, r)))) if r > 0 else a


def noise(W, H, sx, sy=None, r=0):
    sy = sy or sx
    n = rng.random((max(2, int(H / sy)), max(2, int(W / sx)))).astype(np.float32)
    im = to_L(n).resize((W, H), Image.BICUBIC)
    if r:
        im = im.filter(ImageFilter.GaussianBlur(r))
    return from_L(im)


def poly(W, H, pts, fill=255, base=None):
    m = base or Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).polygon([(x * W, y * H) for x, y in pts], fill=fill)
    return m


def ellipse_pts(cx, cy, rx, ry, ang, n=28):
    ca, sa = math.cos(ang), math.sin(ang)
    out = []
    for k in range(n):
        t = 2 * math.pi * k / n
        x, y = rx * math.cos(t), ry * math.sin(t)
        out.append((cx + x * ca - y * sa, cy + x * sa + y * ca))
    return out


def branch(draw, W, x0, y0, ang, length, n, leaf, curve, side_bias=0.0):
    """Branche d'olivier : tige courbe + feuilles étroites alternées (ombre portée)."""
    pts = []
    for i in range(48):
        t = i / 47
        a = ang + curve * t
        x0 += math.cos(a) * length / 47
        y0 += math.sin(a) * length / 47
        pts.append((x0, y0, a))
    draw.line([(p[0], p[1]) for p in pts], fill=255, width=max(2, int(W * 0.0022)))
    for k in range(n):
        i = int(4 + (len(pts) - 6) * k / max(1, n - 1))
        x, y, a = pts[i]
        side = 1 if k % 2 == 0 else -1
        la = a + side * (0.75 + 0.25 * rng.random()) + side_bias
        L = leaf * (0.75 + 0.45 * rng.random())
        cx, cy = x + math.cos(la) * L * 0.55, y + math.sin(la) * L * 0.55
        draw.polygon(ellipse_pts(cx, cy, L * 0.55, L * 0.13, la), fill=255)


def towels(W, H, cx, base_y, width, layers):
    """Pile de serviettes pliées vue de face : texture éponge, plis, liseré sauge."""
    layer = np.zeros((H, W, 4), np.float32)
    y = base_y
    yy_all = np.arange(H, dtype=np.float32)[:, None]
    xx_all = np.arange(W, dtype=np.float32)[None, :]
    offsets = [0.0, 0.018, -0.012]
    top_y0 = None
    for k, (h, tint, stripe) in enumerate(layers):
        w = width * (1 - 0.03 * k)
        ox = offsets[k % 3] * width
        x0, x1 = cx - w / 2 + ox, cx + w / 2 + ox
        y1, y0 = y, y - h
        m = Image.new("L", (W, H), 0)
        ImageDraw.Draw(m).rounded_rectangle([x0, y0, x1, y1], radius=h * 0.30, fill=255)
        mk = from_L(m.filter(ImageFilter.GaussianBlur(W * 0.0006)))
        v = np.clip((yy_all - y0) / max(1, h), 0, 1)
        # modelé « cylindre » du pli : haut éclairé, ventre lumineux, dessous rentré dans l'ombre
        shade = 0.86 + 0.20 * np.sin(np.pi * np.clip(v * 0.95 + 0.08, 0, 1)) - 0.16 * v ** 3
        # extrémités gauche/droite légèrement ombrées (épaisseur du tissu)
        u = np.clip((xx_all - x0) / max(1, w), 0, 1)
        shade = shade * (1 - 0.07 * (np.exp(-u / 0.05) + np.exp(-(1 - u) / 0.05)))
        col = tint * shade[..., None]
        if stripe:
            band = np.exp(-((v - 0.80) ** 2) / 0.0012)[..., None]
            col = col * (1 - 0.5 * band) + rgb(146, 166, 134) * 0.5 * band
        layer[..., :3] = layer[..., :3] * (1 - mk[..., None]) + col * mk[..., None]
        layer[..., 3] = np.maximum(layer[..., 3], mk)
        y = y0 + h * 0.08  # léger chevauchement
        top_y0, top_x = y0, (x0, x1)
    # surface supérieure de la pile, vue légèrement en plongée
    th = layers[-1][0] * 0.42
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        [top_x[0] + width * 0.02, top_y0 - th, top_x[1] - width * 0.02, top_y0 + th * 0.5], radius=th * 0.6, fill=255
    )
    mk = from_L(m.filter(ImageFilter.GaussianBlur(W * 0.0008))) * (1 - layer[..., 3])
    col = rgb(251, 249, 245) * (0.97 + 0.03 * np.clip((yy_all - (top_y0 - th)) / max(1, th), 0, 1))[..., None]
    layer[..., :3] = layer[..., :3] * (1 - mk[..., None]) + col * mk[..., None]
    layer[..., 3] = np.maximum(layer[..., 3], mk)
    # texture éponge : grain fin + fibres verticales
    terry = (noise(W, H, 1.3, 1.3, 0.4) - 0.5) * 0.09 + (noise(W, H, 1.2, 6, 0.3) - 0.5) * 0.05
    layer[..., :3] += terry[..., None] * layer[..., 3:4]
    return layer


def render(W, H, L):
    yy = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    xx = np.linspace(0, 1, W, dtype=np.float32)[None, :]
    yc = L["counter_y"]

    # ── Mur : enduit chaud, dégradé doux ──
    t = np.clip(yy / yc, 0, 1)
    wall = rgb(229, 221, 207) * (1 - t)[..., None] + rgb(238, 231, 219) * t[..., None]
    img = np.broadcast_to(wall, (H, W, 3)).copy()
    img += ((noise(W, H, W / 260, W / 260, 1.5) - 0.5) * 0.022)[..., None]

    # ── Plan de travail : pierre calcaire claire, veinage horizontal ──
    ct = np.clip((yy - yc) / (1 - yc), 0, 1)
    stone = rgb(216, 203, 184) * (1 - ct)[..., None] + rgb(196, 182, 162) * ct[..., None]
    stone = np.broadcast_to(stone, (H, W, 3)).copy()
    grain = noise(W, H, W / 90, H / 900, 1.0) - 0.5
    stone += grain[..., None] * 0.035
    cmask = np.broadcast_to((yy >= yc).astype(np.float32), (H, W))
    img = img * (1 - cmask[..., None]) + stone * cmask[..., None]
    # arête lumineuse + occlusion au pied du mur
    edge = np.exp(-((yy - yc) * H) ** 2 / (2 * (H * 0.0018) ** 2))
    img += (edge * 0.06)[..., None]
    ao = np.clip(1 - (yc - yy) * H / (H * 0.03), 0, 1) * (yy < yc)
    img *= (1 - 0.10 * ao)[..., None]

    # ── Soleil du matin : bande de fenêtre + croisillons + ombres de feuillage ──
    sun = poly(W, H, L["sun"])
    d = ImageDraw.Draw(sun)
    for bar in L["mullions"]:
        d.polygon([(x * W, y * H) for x, y in bar], fill=0)
    leaves = Image.new("L", (W, H), 0)
    ld = ImageDraw.Draw(leaves)
    for b in L["branches"]:
        branch(ld, W, b[0] * W, b[1] * H, b[2], b[3] * W, b[4], b[5] * W, b[6])
    S = from_L(sun) * (1 - from_L(leaves.filter(ImageFilter.GaussianBlur(W * 0.0035))))
    S = blur(S, W * 0.006)
    warm = np.array([1.05, 1.0, 0.91], np.float32)
    light = 0.87 + 0.24 * S[..., None] * warm
    img *= light

    # ── Serviettes (arrière-plan, légèrement floues) ──
    if L.get("towels"):
        tx, tb, tw, layers = L["towels"]
        # hauteurs exprimées en fraction de H → pixels
        tl = towels(W, H, tx * W, tb * H, tw * W, [(h * H, c, s) for h, c, s in layers])
        # ombre de contact sous la pile
        tsh = Image.new("L", (W, H), 0)
        ImageDraw.Draw(tsh).ellipse(
            [(tx - tw * 0.55) * W, tb * H - H * 0.012, (tx + tw * 0.62) * W, tb * H + H * 0.016], fill=255
        )
        tsh = blur(from_L(tsh), W * 0.01)
        img *= (1 - 0.28 * tsh)[..., None]
        tl[..., :3] *= light  # même lumière que la scène
        # flou de profondeur de champ : la pile est au second plan, le produit reste net
        dof = W * L.get("towel_blur", 0.0026)
        a = blur(tl[..., 3], dof)[..., None]
        rgb_l = np.stack([blur(tl[..., c] * tl[..., 3], dof) for c in range(3)], -1) / np.maximum(a, 1e-3)
        img = img * (1 - a) + rgb_l * a

    # ── Produit réel ──
    prod = Image.open(CUT).convert("RGBA")
    ph = int(L["prod_h"] * H)
    pw = int(prod.width * ph / prod.height)
    prod = prod.resize((pw, ph), Image.LANCZOS)
    px = int(L["prod_cx"] * W - pw / 2)
    pb = int(L["prod_base"] * H)
    py = pb - ph
    alpha = np.zeros((H, W), np.float32)
    pa = np.asarray(prod).astype(np.float32) / 255.0
    alpha[py:py + ph, px:px + pw] = pa[..., 3]

    # ombre portée (lumière venant du haut-gauche → ombre vers la droite)
    sh = Image.new("L", (W, H), 0)
    sm = to_L(pa[..., 3]).resize((pw, max(2, int(ph * 0.22))))
    sh.paste(sm, (px + int(pw * 0.18), pb - int(ph * 0.12)), sm)
    sh = sh.transform(sh.size, Image.AFFINE, (1, 0.9, -0.9 * pb, 0, 1, 0), resample=Image.BILINEAR)
    sh = blur(from_L(sh), W * 0.012)
    img *= (1 - 0.30 * sh)[..., None]
    # ombre de contact serrée
    cs = Image.new("L", (W, H), 0)
    ImageDraw.Draw(cs).ellipse([px + pw * 0.05, pb - ph * 0.04, px + pw * 0.97, pb + ph * 0.012], fill=255)
    cs = blur(from_L(cs), W * 0.005)
    img *= (1 - 0.55 * cs)[..., None]

    full = np.zeros((H, W, 3), np.float32)
    full[py:py + ph, px:px + pw] = pa[..., :3]
    a = alpha[..., None]
    img = img * (1 - a) + full * a

    # ── Feuillage flou au premier plan (profondeur de champ) ──
    if L.get("fg_leaves"):
        fg = Image.new("L", (W, H), 0)
        fd = ImageDraw.Draw(fg)
        for b in L["fg_leaves"]:
            branch(fd, W, b[0] * W, b[1] * H, b[2], b[3] * W, b[4], b[5] * W, b[6])
        fga = blur(from_L(fg), W * 0.012) * 0.92
        green = rgb(64, 86, 58)
        img = img * (1 - fga[..., None]) + green * fga[..., None]

    # ── Étalonnage : vignette douce + grain fin ──
    vig = 1 - 0.10 * (((xx - 0.5) ** 2) * 1.2 + ((yy - 0.45) ** 2) * 1.6)
    img *= vig[..., None]
    img += ((rng.random((H, W)).astype(np.float32) - 0.5) * 0.012)[..., None]
    return Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), "RGB")


TOWELS = lambda h: [  # (hauteur, teinte, liseré)
    (h, rgb(244, 241, 235), False),
    (h * 0.92, rgb(246, 244, 239), True),
    (h * 0.86, rgb(248, 246, 242), False),
]

LAYOUTS = {
    # Galerie desktop (4:3) — produit au centre-droit, serviettes à gauche
    "hero-desktop": dict(
        size=(2400, 1800), counter_y=0.68, prod_cx=0.60, prod_h=0.58, prod_base=0.86,
        sun=[(0.12, -0.05), (0.66, -0.05), (1.02, 1.05), (0.42, 1.05)],
        mullions=[[(0.37, -0.05), (0.395, -0.05), (0.735, 1.05), (0.71, 1.05)],
                  [(0.10, 0.36), (0.80, 0.30), (0.81, 0.322), (0.11, 0.382)]],
        branches=[(0.86, -0.02, 2.25, 0.42, 14, 0.07, 0.5), (0.97, 0.10, 2.6, 0.30, 10, 0.06, -0.4)],
        towels=(0.24, 0.78, 0.30, TOWELS(0.085)),
        fg_leaves=[(-0.04, 1.02, -0.9, 0.22, 7, 0.09, 0.3)],
    ),
    # Héros mobile (4:5) — zone de texte libre en haut à gauche
    "hero-mobile": dict(
        size=(1200, 1500), counter_y=0.72, prod_cx=0.62, prod_h=0.455, prod_base=0.955,
        sun=[(0.10, -0.05), (0.70, -0.05), (1.10, 1.05), (0.42, 1.05)],
        mullions=[[(0.42, -0.05), (0.45, -0.05), (0.79, 1.05), (0.76, 1.05)]],
        branches=[(1.04, 0.24, 2.55, 0.42, 11, 0.09, 0.35)],
        towels=(0.21, 0.865, 0.36, TOWELS(0.066)),
        fg_leaves=[(1.06, 1.04, -2.3, 0.30, 6, 0.13, -0.3)],
    ),
    # Partage social (1.91:1) — produit à droite
    "og": dict(
        size=(2400, 1260), counter_y=0.70, prod_cx=0.74, prod_h=0.66, prod_base=0.90,
        sun=[(0.30, -0.05), (0.80, -0.05), (1.10, 1.05), (0.60, 1.05)],
        mullions=[[(0.55, -0.05), (0.57, -0.05), (0.87, 1.05), (0.85, 1.05)]],
        branches=[(0.98, -0.03, 2.3, 0.35, 12, 0.06, 0.5)],
        towels=(0.47, 0.80, 0.22, TOWELS(0.10)),
        fg_leaves=None,
    ),
}

if __name__ == "__main__":
    only = sys.argv[3] if len(sys.argv) > 3 else None
    for name, L in LAYOUTS.items():
        if only and only != name:
            continue
        W, H = L["size"]
        im = render(W, H, L)
        im.save(f"{OUT}/{name}-master.png")
        print(name, im.size)
