# ld_tex.py <outdir> : procedural loader textures (horizontally tileable): moonlit cloud band, valley mist band, snow tiles
import sys, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
out = sys.argv[1]
rs = np.random.RandomState(7)

def fbm(h, w, sig, oct=6, sx=1.0, sy=1.0, gain=0.55, seed=0):
    r = np.random.RandomState(seed)
    acc = np.zeros((h, w)); a = 1.0; norm = 0
    for o in range(oct):
        s = sig / (2 ** o)
        n = gaussian_filter(r.randn(h, w), (max(s * sy, .6), max(s * sx, .6)), mode='wrap')
        n /= n.std() + 1e-9
        acc += a * n; norm += a; a *= gain
    return acc / norm

def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

def save(rgb, a, path, q=82):
    im = np.dstack([np.clip(rgb, 0, 1), np.clip(a, 0, 1)])
    Image.fromarray((im * 255 + .5).astype(np.uint8), 'RGBA').save(path, 'WEBP', quality=q, method=6, alpha_quality=70)

# ---------------- clouds: wispy moonlit stratus band (tile 1400 x 420), thin streaks + a few denser banks
H, W = 420, 1400
y = np.linspace(0, 1, H)[:, None]
warp = fbm(H, W, 120, 3, sx=3, sy=1, seed=9)
n1 = fbm(H, W, 46, 6, sx=3.6, sy=0.9, seed=3)
n2 = fbm(H, W, 90, 5, sx=3.0, sy=0.9, seed=4)
env = ss(0.05, 0.4, y) * (1 - ss(0.62, 0.98, y))
streak = ss(0.15, 1.1, n1 * 0.9 + warp * 0.5)
bank = ss(0.35, 1.4, n2 + 0.3 * warp)
d = np.clip((streak * 0.65 + bank * 0.75) * env, 0, 1)
d = gaussian_filter(d, (2.0, 3.5), mode='wrap')
sh = np.roll(d, 5, axis=0)
lit = np.clip((d - sh) * 4.0 + 0.25, 0, 1)
body = np.array([0.13, 0.19, 0.33]); edge = np.array([0.55, 0.66, 0.86])
rgb = body[None, None, :] * (1 - lit[..., None]) + edge[None, None, :] * lit[..., None]
a = np.clip(d * 1.1, 0, 1) ** 1.2 * 0.7
save(rgb, a, f'{out}/ld_clouds.webp', 74)

# ---------------- mist: soft valley mist band (tile 1200 x 240), dense at the bottom
H, W = 240, 1200
n = fbm(H, W, 46, 5, sx=3.5, sy=1.0, seed=21)
y = np.linspace(0, 1, H)[:, None]
env = ss(0.0, 0.6, y) * (1 - ss(0.85, 1.0, y) * 0.3)
d = np.clip((n * 0.5 + 0.55) * env, 0, 1)
d = ss(0.1, 0.95, d)
rgb = np.ones((H, W, 3)) * np.array([0.55, 0.68, 0.88])[None, None, :] * (0.8 + 0.3 * (1 - y[..., None]))
save(rgb, d * 0.8, f'{out}/ld_mist.webp', 70)
print('ok')

# ---------------- snow: tileable flakes (256 x 256), soft discs of a few sizes
S = 256
yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
acc = np.zeros((S, S), np.float32)
r = np.random.RandomState(5)
for i in range(46):
    cx, cy = r.rand() * S, r.rand() * S
    rad = 0.7 + r.rand() ** 2.5 * 2.6
    big = r.rand() < 0.08
    if big: rad = 3.2 + r.rand() * 1.5
    dx = np.minimum(np.abs(xx - cx), S - np.abs(xx - cx)); dy = np.minimum(np.abs(yy - cy), S - np.abs(yy - cy))
    d = np.sqrt(dx * dx + (dy * 0.8) ** 2)
    f = np.clip(1 - d / (rad + 0.8), 0, 1) ** (1.6 if not big else 1.1)
    acc = np.maximum(acc, f * ((0.35 + 0.65 * r.rand()) if not big else 0.28))
rgb = np.ones((S, S, 3)) * np.array([0.88, 0.94, 1.0])[None, None, :]
save(rgb, acc, f'{out}/ld_snow.webp', 80)
print('snow ok')
