#!/usr/bin/env python3
"""age_title.py SRC DST [strength] — age the path-traced loader title (sapphire lacquer + black-chrome rim) the way age_sword.py aged the sword.
Same glyph shapes / size / colour family; alpha only gets a few tiny chips."""
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

SRC, DST = sys.argv[1], sys.argv[2]; K = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
rng = np.random.default_rng(28)
im = Image.open(SRC).convert('RGBA'); a = np.asarray(im).astype(np.float32) / 255
rgb = a[..., :3].copy(); al = a[..., 3].copy(); H, W = al.shape
solid = al > 0.5
lum = lambda c: c @ np.array([.299, .587, .114], np.float32)
blu = (rgb[..., 2] - rgb[..., 0])
face = solid & (blu > 0.10) & (rgb[..., 2] > 0.30)
face = ndi.binary_opening(face, iterations=1)
rim = solid & ~face
dface = ndi.distance_transform_edt(face)               # px inside the lacquer from its edge
drim = ndi.distance_transform_edt(~face)               # px outside the lacquer (rim side)
dsol = ndi.distance_transform_edt(solid)

def fbm(h, w, cells, seed, aniso=1.0):
    r = np.random.default_rng(seed); out = np.zeros((h, w), np.float32); amp = 1.0; tot = 0
    for c in cells:
        sh, sw = max(2, int(h / c)), max(2, int(w / (c * aniso)))
        n = r.random((sh, sw)).astype(np.float32)
        out += amp * np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32) / 255; tot += amp; amp *= 0.55
    return out / tot

# 1 -- fade: calmer highlights, less saturation; the sapphire stays deep blue, the bronze chrome reflections go dull steel
rgb = np.clip(rgb, 0, 1) ** (1 + 0.16 * K)
g = lum(rgb)[..., None]
sat = np.where(face, 0.80, 0.55)[..., None]
rgb = g + (rgb - g) * (1 - (1 - sat) * K)
rgb *= np.where(face, 0.90, 0.80)[..., None] ** K

# 2 -- worn lacquer: big soft mottling (duller, greyer patches where the gloss wore off) + fine orange-peel
mott = fbm(H, W, [70, 30, 12], 5, aniso=1.6)
worn = np.clip((mott - 0.50) * 2.4, 0, 1) * face * K
g = lum(rgb)[..., None]
rgb = rgb * (1 - 0.45 * worn[..., None]) + 0.45 * worn[..., None] * (g * 0.9 + np.array([0.02, 0.04, 0.07], np.float32))
orange = fbm(H, W, [2.2, 1.1], 15) - 0.5
rgb = np.where(face[..., None], rgb * (1 + 0.10 * K * orange[..., None]), rgb)
# the specular streak highlights on the face -> calmer
hi = np.clip((lum(rgb) - 0.42) * 2.0, 0, 1) * face
rgb = rgb * (1 - 0.30 * K * hi[..., None])

# 3 -- micro-scratches (light and dark), mostly on the lacquer, a few on the rim
scr = Image.new('L', (W, H), 0); dk = Image.new('L', (W, H), 0); ds, dd = ImageDraw.Draw(scr), ImageDraw.Draw(dk)
ys, xs = np.nonzero(solid)
for i in range(int(520 * K)):
    k = rng.integers(len(xs)); x0, y0 = xs[k], ys[k]; L = rng.uniform(5, 46)
    ang = rng.choice([0.0, 0.5, -0.5, 1.1, 2.2]) + rng.normal(0, 0.25)
    (ds if rng.random() < 0.65 else dd).line([(x0, y0), (x0 + L * np.cos(ang), y0 + L * np.sin(ang))], fill=int(rng.uniform(60, 200)), width=1)
scr = np.asarray(scr.filter(ImageFilter.GaussianBlur(0.4))).astype(np.float32) / 255 * solid
dk = np.asarray(dk.filter(ImageFilter.GaussianBlur(0.4))).astype(np.float32) / 255 * solid
rgb = rgb + 0.24 * K * scr[..., None] * (0.35 + lum(rgb)[..., None]) * np.array([0.85, 0.95, 1.1], np.float32)
rgb = rgb * (1 - 0.30 * K * dk[..., None])

# 4 -- lacquer chips along the face edge: tiny irregular bits where the sapphire flaked and bare dark steel shows (+ a light rim on one side)
chip = Image.new('L', (W, H), 0); chl = Image.new('L', (W, H), 0); dc, dl = ImageDraw.Draw(chip), ImageDraw.Draw(chl)
ey, ex = np.nonzero(face & (dface < 3.5) & (dface > 0.5))
for i in range(int(95 * K)):
    k = rng.integers(len(ex)); x0, y0 = ex[k], ey[k]
    r = rng.uniform(1.0, 3.2); pts = [(x0 + r * rng.uniform(.5, 1.4) * np.cos(t), y0 + r * rng.uniform(.5, 1.4) * np.sin(t)) for t in np.linspace(0, 6.28, 7)[:-1]]
    dc.polygon(pts, fill=255); dl.polygon([(px + 0.9, py - 0.9) for px, py in pts], fill=200)
chip = np.asarray(chip.filter(ImageFilter.GaussianBlur(0.5))).astype(np.float32) / 255 * face
chl = np.asarray(chl.filter(ImageFilter.GaussianBlur(0.5))).astype(np.float32) / 255 * face
steel = np.array([0.16, 0.18, 0.22], np.float32)
rgb = rgb * (1 - 0.85 * chip[..., None]) + 0.85 * chip[..., None] * steel
rgb = rgb + 0.10 * np.clip(chl - chip, 0, 1)[..., None]

# 5 -- dust / soot in the crevices: darker where the lacquer meets the chrome rim and in the deep grooves, mottled so it is not a clean outline
soot = np.clip(1 - dface / 7.0, 0, 1) * face + np.clip(1 - drim / 5.0, 0, 1) * rim
sn = fbm(H, W, [9, 4, 2], 61, aniso=1.4)
soot = soot * np.clip(0.35 + sn * 1.1, 0, 1) * K
scol = np.array([0.045, 0.043, 0.050], np.float32)
rgb = rgb * (1 - 0.50 * soot[..., None]) + 0.50 * soot[..., None] * scol
dust = np.clip((fbm(H, W, [14, 5], 71) - 0.62) * 3.2, 0, 1) * face * K      # pale dust haze on flat parts
rgb = rgb * (1 - 0.18 * dust[..., None]) + 0.18 * dust[..., None] * np.array([0.40, 0.45, 0.55], np.float32)

# 6 -- faint patina on the rim: warm bronze reflections cool toward a dull teal-grey in a few mottled spots, plus light scuffing
pn = fbm(H, W, [16, 7, 3], 81, aniso=1.2)
pat = np.clip((pn - 0.52) * 3.2, 0, 1) * rim * K
rgb = rgb * (1 - 0.40 * pat[..., None]) + 0.40 * pat[..., None] * (lum(rgb)[..., None] * 0.9 * np.array([0.78, 1.0, 1.0], np.float32) + 0.02)
sc2 = np.clip((fbm(H, W, [5, 2.2], 91) - 0.56) * 3, 0, 1) * rim * K
rgb = rgb * (1 - 0.30 * sc2[..., None])

# 7 -- tiny nicks in the outer silhouette (alpha) + sensor grain so nothing looks CG-clean
al2 = al.copy()
oy, ox = np.nonzero(solid & (dsol < 2.5) & (dsol > 0.5))
for i in range(int(38 * K)):
    k = rng.integers(len(ox)); x0, y0 = ox[k], oy[k]; r = rng.uniform(0.9, 2.1)
    yy, xx = np.ogrid[:H, :W]; m = (xx - x0) ** 2 + (yy - y0) ** 2 <= r * r
    al2[m] *= rng.uniform(0.0, 0.35)
rgb = np.clip(rgb + rng.normal(0, 0.012, rgb.shape).astype(np.float32) * solid[..., None], 0, 1)
out = np.dstack([rgb, al2]); Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA').save(DST, lossless=False, quality=94) if DST.endswith('.webp') else Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA').save(DST)
print('saved', DST, 'face px', int(face.sum()), 'rim px', int(rim.sum()))
