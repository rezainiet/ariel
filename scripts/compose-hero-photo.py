"""Visuels lifestyle : le packshot Ariel RÉEL posé dans une vraie photo de buanderie.

Photo : « in7u-CJYHyA » de Mariana Rascão, Unsplash License (assets-src/stock/CREDITS.md).
- Retouche de la photo : effacement des inscriptions de marque tierce du lave-linge ;
  les flacons d'une autre marque et l'étagère du haut sont exclus par le cadrage.
- Le packshot n'est jamais retouché : mise à l'échelle, ombres et étalonnage global uniquement.

Usage : python scripts/compose-hero-photo.py assets-src/stock/unsplash-in7u-CJYHyA-laundry-nook.jpg \
          public/images/packshot-cutout.webp public/images   (Pillow ≥ 10 avec AVIF, numpy)
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

PHOTO, CUT, OUT = sys.argv[1:4]


def arr(im):
    return np.asarray(im).astype(np.float32) / 255.0


def img(a):
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))


def retouched_base():
    A = arr(Image.open(PHOTO).convert("RGB")).copy()

    def clone(dst, src_dx, feather=6):
        # recopie depuis la même ligne (acier brossé horizontal) avec bord progressif
        x0, y0, x1, y1 = dst
        patch = A[y0:y1, x0 + src_dx:x1 + src_dx].copy()
        m = np.zeros((y1 - y0, x1 - x0), np.float32)
        m[feather:-feather, feather:-feather] = 1
        m = arr(img(m).filter(ImageFilter.GaussianBlur(feather / 2)))[..., None]
        A[y0:y1, x0:x1] = A[y0:y1, x0:x1] * (1 - m) + patch * m

    # coordonnées mesurées sur l'original 2400 × 3200
    clone((968, 2736, 1078, 2780), -110)  # logo du fabricant
    clone((975, 2878, 1070, 2908), -105)  # nom du modèle
    clone((1765, 2722, 1850, 2750), -95)  # mention technique
    return A


CUTOUT = Image.open(CUT).convert("RGBA")


def place(A, cx, base, width, light=1.0):
    """Pose un sachet (centre x, ligne de contact y, largeur px). Appeler de l'arrière vers l'avant."""
    H, W = A.shape[:2]
    ph = round(CUTOUT.height * width / CUTOUT.width)
    P = arr(CUTOUT.resize((width, ph), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6)))
    rgb, alpha = P[..., :3], P[..., 3:4]
    # étalonnage global : la photo est douce, peu contrastée, aux noirs relevés et légèrement chaude
    lum = (rgb * np.array([0.299, 0.587, 0.114])).sum(-1, keepdims=True)
    rgb = lum + (rgb - lum) * 0.86
    rgb = 0.06 + rgb * 0.88
    rgb = rgb * np.array([1.02, 1.0, 0.965]) * light
    # lumière de fenêtre venant de la gauche + rebond chaud du bois sur le bas du sachet
    gx = np.linspace(1.04, 0.90, width, dtype=np.float32)[None, :, None]
    gy = np.linspace(0, 1, ph, dtype=np.float32)[:, None, None]
    rgb = rgb * gx
    rgb = rgb * (1 - 0.10 * gy ** 3) + np.array([0.06, 0.035, 0.0]) * gy ** 4

    x0, y0 = cx - width // 2, base - ph

    def mask(draw_fn, radius):
        m = Image.new("L", (W, H), 0)
        draw_fn(ImageDraw.Draw(m))
        return arr(m.filter(ImageFilter.GaussianBlur(radius)))[..., None]

    # le fond du sachet est arrondi : contact au centre, occlusion douce, ombre portée arrière-droite
    contact = mask(lambda d: d.ellipse([x0 + width * 0.10, base - ph * 0.02, x0 + width * 0.90, base + ph * 0.012], fill=255), 6)
    occl = mask(lambda d: d.ellipse([x0 - width * 0.02, base - ph * 0.07, x0 + width * 1.04, base + ph * 0.035], fill=255), 22)
    flat = Image.fromarray((alpha[..., 0] * 255).astype(np.uint8)).resize((width, max(1, int(ph * 0.22))))
    cast = Image.new("L", (W, H), 0)
    for i, dx in enumerate(range(0, int(width * 0.30), 4)):
        cast.paste(255, (x0 + dx, base - flat.height - i // 3), flat)
    cast = arr(cast.filter(ImageFilter.GaussianBlur(30)))[..., None]
    A *= 1 - 0.18 * cast
    A *= 1 - 0.22 * occl
    A *= 1 - 0.38 * contact
    region = A[y0:y0 + ph, x0:x0 + width]
    A[y0:y0 + ph, x0:x0 + width] = region * (1 - alpha) + rgb * alpha
    return A


def finish(A, focus):
    """Étalonnage d'ensemble : lumière chaude et aérée, vignettage centré sur le produit, grain commun."""
    H, W = A.shape[:2]
    A = np.clip(A * np.array([1.025, 1.0, 0.97]), 0, 1)
    A = 1 - (1 - A) ** 1.08
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    v = ((xx - focus[0]) / W) ** 2 + ((yy - focus[1]) / H) ** 2
    A *= (1 - 0.35 * np.clip(v, 0, 1))[..., None]
    A += (np.random.default_rng(3).random((H, W, 1)).astype(np.float32) - 0.5) * 0.014
    return img(A)


def export(full, name, box, widths, folder):
    os.makedirs(folder, exist_ok=True)
    c = full.crop(box)
    for w in widths:
        r = c.resize((w, round(c.height * w / c.width)), Image.LANCZOS)
        r.save(f"{folder}/{name}-{w}.webp", quality=80, method=6)
        r.save(f"{folder}/{name}-{w}.avif", quality=58)
        print(f"{name}-{w}", r.size)
    return c


base = retouched_base()

# 1 — Héros : un sachet devant les serviettes
hero = finish(place(base.copy(), 1500, 2600, 410), (1623, 2290))
export(hero, "hero-desktop", (1000, 1685, 2300, 2660), [800, 1200, 1300], f"{OUT}/hero")
export(hero, "hero-mobile", (1060, 1360, 2100, 2660), [780, 1040], f"{OUT}/hero")
hero.crop((1000, 1790, 2400, 2525)).resize((1200, 630), Image.LANCZOS).save(f"{OUT}/../og-image.jpg", quality=86)

# 2 — Offre 3 sachets : trois sachets identiques sur la même tablette
trio = base.copy()
trio = place(trio, 1335, 2566, 360, light=0.97)
trio = place(trio, 1745, 2570, 360, light=0.95)
trio = place(trio, 1545, 2620, 415)
trio = finish(trio, (1545, 2330))
export(trio, "trio-wide", (1000, 1700, 2300, 2660), [800, 1300], f"{OUT}/scene")
export(trio, "trio-tall", (1080, 1498, 2010, 2660), [640, 930], f"{OUT}/scene")
