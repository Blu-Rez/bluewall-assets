#!/usr/bin/env python3
"""age_sword.py SRC DST [strength] — make the loader sword duller, older and more real (2-D post-process of the path-traced render).
Geometry/mask stay identical, so the progress-fill mask (ld_sword_m.webp) still fits."""
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

SRC, DST = sys.argv[1], sys.argv[2]; K = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
rng = np.random.default_rng(11)
im = Image.open(SRC).convert('RGBA'); a = np.asarray(im).astype(np.float32) / 255
rgb = a[..., :3].copy(); al = a[..., 3].copy(); H, W = al.shape
B0 = int(0.222 * W)                                   # blade starts here (from index.html: b0)
X = np.arange(W)[None, :].repeat(H, 0); Y = np.arange(H)[:, None].repeat(W, 1)
solid = al > 0.5
dist = ndi.distance_transform_edt(solid)              # px to the nearest empty pixel
lum = lambda c: c @ np.array([.299, .587, .114], np.float32)

def fbm(h, w, cells, seed, aniso=1.0):
    """smooth value noise, 0..1; aniso>1 stretches it along x (brushed streaks)"""
    r = np.random.default_rng(seed); out = np.zeros((h, w), np.float32); amp = 1.0; tot = 0
    for c in cells:
        sh, sw = max(2, int(h / c / 1.0)), max(2, int(w / (c * aniso)))
        n = r.random((sh, sw)).astype(np.float32)
        out += amp * np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32) / 255; tot += amp; amp *= 0.55
    return out / tot

blade = solid & (X >= B0)
guard = solid & (X >= B0 - 52) & (X < B0)
grip = solid & (X >= 112) & (X < B0 - 52)
pom = solid & (X < 112)
gray = lum(rgb)[..., None]
cy0 = blade & ((rgb[..., 2] - rgb[..., 0]) > 0.16) & (rgb[..., 2] > 0.42)

# 1 -- fade: calmer highlights, less saturation (steel goes gunmetal), the blue cord / gems stay deep but quiet
rgb = np.clip(rgb, 0, 1) ** (1 + 0.20 * K)
gray = lum(rgb)[..., None]
sat = np.where(blade, 0.42, np.where(grip, 0.90, 0.50))[..., None]
rgb = gray + (rgb - gray) * (1 - (1 - sat) * K)
rgb *= np.where(blade, 0.80, np.where(grip, 0.58, 0.72))[..., None] ** K

# 2 -- the glowing runes: etched, only faintly lit (cyan, bright, inside the blade)
soft = ndi.gaussian_filter(cy0.astype(np.float32), 0.7)[..., None]
rune_col = np.array([0.30, 0.52, 0.66], np.float32) * (0.75 + 0.5 * fbm(H, W, [14, 6], 77, aniso=2.5))[..., None]
rgb = rgb * (1 - soft * K) + soft * K * rune_col

# 3 -- tarnish: big soft mottling + warm darkening, stronger toward the hilt and along the edges
mott = fbm(H, W, [60, 28, 12], 3, aniso=3.0)
near_guard = np.clip(1 - (X - B0) / 520.0, 0, 1)
edge = np.clip(1 - dist / 9.0, 0, 1)
T = 1 - K * np.clip((0.62 - mott) * 1.7, 0, 0.55) * (0.5 + 0.8 * near_guard) - 0.22 * K * edge
rgb = np.where(solid[..., None], rgb * T[..., None] * np.array([1.0, 0.985, 0.95], np.float32) ** (K * (1 - mott[..., None] * 0.6)), rgb)
dull = 0.28 * K * np.clip(edge * 1.2, 0, 1)[..., None]
rgb = np.where(blade[..., None], rgb * (1 - dull), rgb)       # the bright "sharpened edge" lines go dull

# 4 -- brushed micro-streaks and real scratches along the blade
streak = fbm(H, W, [3, 1.2], 9, aniso=40.0) - 0.5
rgb = np.where(blade[..., None], rgb * (1 + 0.20 * K * streak[..., None]), rgb)
scr = Image.new('L', (W, H), 0); dk = Image.new('L', (W, H), 0); ds, dd = ImageDraw.Draw(scr), ImageDraw.Draw(dk)
ys, xs = np.nonzero(blade)
for i in range(int(330 * K)):
    k = rng.integers(len(xs)); x0, y0 = xs[k], ys[k]; L = rng.uniform(25, 260); ang = rng.normal(0, 0.035) + (rng.random() < 0.12) * rng.normal(0, 0.35)
    x1, y1 = x0 + L * np.cos(ang), y0 + L * np.sin(ang)
    (ds if rng.random() < 0.6 else dd).line([(x0, y0), (x1, y1)], fill=int(rng.uniform(70, 235)), width=1)
scr = np.asarray(scr.filter(ImageFilter.GaussianBlur(0.45))).astype(np.float32) / 255 * blade
dk = np.asarray(dk.filter(ImageFilter.GaussianBlur(0.45))).astype(np.float32) / 255 * blade
rgb = rgb + 0.30 * K * scr[..., None] * (0.4 + lum(rgb)[..., None]) ; rgb = rgb * (1 - 0.34 * K * dk[..., None])

# 5 -- pitting (more near the guard) and a few rust-brown blotches around the hilt, the edges and the tip
pit = Image.new('L', (W, H), 0); dp = ImageDraw.Draw(pit); rim = Image.new('L', (W, H), 0); dr = ImageDraw.Draw(rim)
pn = fbm(H, W, [30, 12], 55, aniso=2.0)
for i in range(int(170 * K)):
    k = rng.integers(len(xs)); x0, y0 = xs[k], ys[k]
    if rng.random() > (0.15 + 0.85 * np.exp(-(x0 - B0) / 380.0)) * np.clip((pn[y0, x0] - 0.35) * 3, 0, 1): continue
    r = rng.uniform(0.5, 1.5); dp.ellipse([x0 - r, y0 - r, x0 + r, y0 + r], fill=int(rng.uniform(120, 255))); dr.ellipse([x0 - r + 1, y0 - r - 1, x0 + r + 1, y0 + r - 1], fill=int(rng.uniform(40, 120)))
pit = np.asarray(pit.filter(ImageFilter.GaussianBlur(0.5))).astype(np.float32) / 255 * solid
rim = np.asarray(rim.filter(ImageFilter.GaussianBlur(0.6))).astype(np.float32) / 255 * solid
rgb = rgb * (1 - 0.38 * K * pit[..., None]) + 0.10 * K * np.clip(rim - pit, 0, 1)[..., None]
rn = fbm(H, W, [22, 9, 4], 21, aniso=1.6)
w_hilt = np.where(solid, np.clip(1 - (X - B0) / 700.0, 0, 1) * 0.9 + 0.25 * edge + 0.5 * (X < B0), 0)
rust = np.clip((rn * w_hilt * 1.5 - 0.70) * 3.0, 0, 1) * solid * ~grip * K * 0.8
rcol = np.array([0.30, 0.19, 0.12], np.float32) * (0.7 + 0.6 * fbm(H, W, [3], 5))[..., None]
rgb = rgb * (1 - 0.5 * rust[..., None]) + 0.5 * rust[..., None] * rcol * (0.6 + 0.8 * lum(rgb)[..., None])

# 6 -- the leather-cord grip: worn, dark, a touch of grime; the guard and the pommel: dull, scuffed
gw = fbm(H, W, [5, 2], 31, aniso=0.6)
rgb = np.where(grip[..., None], rgb * (0.78 + 0.34 * gw[..., None]), rgb)
gem = (rgb[..., 2] > 0.30) & ((rgb[..., 2] - rgb[..., 0]) > 0.22) & ~blade & ~grip
rgb = np.where(gem[..., None], rgb * 0.72 + 0.02, rgb)
scuff = np.clip((fbm(H, W, [6, 2.5], 41) - 0.55) * 3, 0, 1) * (guard | pom) * K
rgb = rgb * (1 - 0.35 * scuff[..., None]) + 0.06 * scuff[..., None]

# 7 -- nicks in the edge (alpha) and a very light sensor grain so nothing looks CG-clean
al2 = al.copy()
for i in range(int(16 * K)):
    x0 = int(rng.uniform(B0 + 40, W * 0.93)); col = np.nonzero(solid[:, x0])[0]
    if len(col) < 6: continue
    for top in (True, False):
        if rng.random() < 0.5: continue
        y0 = col[0] if top else col[-1]; d = rng.integers(1, 4); wd = rng.integers(2, 7)
        for dx in range(-wd, wd + 1):
            xx = x0 + dx
            if not (0 <= xx < W): continue
            depth = int(round(d * (1 - abs(dx) / (wd + 0.5))))
            for dy in range(depth):
                yy = y0 + dy if top else y0 - dy
                if 0 <= yy < H: al2[yy, xx] = 0
rgb = np.clip(rgb + rng.normal(0, 0.010, rgb.shape).astype(np.float32) * solid[..., None], 0, 1)
out = np.dstack([rgb, al2]); Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA').save(DST)
print('saved', DST)
