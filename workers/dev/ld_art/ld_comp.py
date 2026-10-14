# ld_comp.py <key P|L> <wall prefix> <mtn prefix> <out size WxH> [far scale] [preview.png]
# Grades the offline renders into the loader plates: near (wall, alpha), far (mountains, alpha), emis (window light on black, screen-blended)
# and writes/updates out/ld_meta.json with the plate geometry + torch / flag / gate positions (normalised plate coords).
import sys, json, os, numpy as np
from PIL import Image, ImageFilter
from scipy.ndimage import gaussian_filter, maximum_filter
D = '/home/claude/dev/ld_art/out/'
key, wpre, mpre = sys.argv[1], sys.argv[2], sys.argv[3]
OW, OH = map(int, sys.argv[4].split('x'))
FS = float(sys.argv[5]) if len(sys.argv) > 5 else 0.6
PREV = sys.argv[6] if len(sys.argv) > 6 else None
P = json.loads(os.environ.get('LDP', '{}'))      # grading knobs

def load(path):
    return np.asarray(Image.open(path).convert('RGBA')).astype(np.float32) / 255

def resize_rgba(a, w, h):
    pm = a.copy(); pm[..., :3] *= pm[..., 3:4]
    ch = [np.asarray(Image.fromarray(pm[..., i]).resize((w, h), Image.LANCZOS)) for i in range(4)]
    o = np.dstack(ch); al = np.clip(o[..., 3:4], 0, 1)
    o[..., :3] = np.where(al > 1e-4, o[..., :3] / np.maximum(al, 1e-4), 0); o[..., 3:4] = al
    return np.clip(o, 0, 1)

def lum(c): return c[..., 0] * .2126 + c[..., 1] * .7152 + c[..., 2] * .0722
def ss(e0, e1, x): t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

def grade(rgb, lift=(0.02, 0.045, 0.10), gain=1.0, gamma=1.0, sat=1.0, cool=0.0):
    l = lum(rgb)[..., None]
    rgb = l + (rgb - l) * sat
    rgb = np.clip(rgb * gain, 0, None) ** gamma
    lift = np.array(lift)[None, None, :]
    rgb = rgb + lift * (1 - np.clip(rgb, 0, 1))
    if cool: rgb = rgb * (1 - cool) + rgb * np.array([0.86, 0.97, 1.12])[None, None, :] * cool
    return rgb

def save(rgb, a, path, q, aq=90):
    if a is None:
        Image.fromarray((np.clip(rgb, 0, 1) * 255 + .5).astype(np.uint8), 'RGB').save(path, 'WEBP', quality=q, method=6)
    else:
        im = np.dstack([np.clip(rgb, 0, 1), np.clip(a, 0, 1)])
        Image.fromarray((im * 255 + .5).astype(np.uint8), 'RGBA').save(path, 'WEBP', quality=q, method=6, alpha_quality=aq)
    return os.path.getsize(path)

# ------------------------------------------------------------------ near plate (wall)
wb = resize_rgba(load(wpre + '_beauty.png'), OW, OH)
rgb, a = wb[..., :3], wb[..., 3]
H, W = a.shape
# warm practical bloom (torches, gate) baked in
br = (np.clip(lum(rgb) - P.get('bthr', 0.6), 0, None) * np.clip((rgb[..., 0] - rgb[..., 2]) * 3 + 0.2, 0, 1))[..., None] * np.array([1.0, 0.68, 0.34])[None, None, :]   # warm practicals only, gold tint
bl = sum(gaussian_filter(br, (s, s, 0)) * k for s, k in ((2, 1.2), (6, 1.0), (16, 0.8), (36, 0.5)))
rgb = grade(rgb, lift=P.get('lift', (0.018, 0.04, 0.09)), gain=P.get('gain', 1.08), gamma=P.get('gamma', 1.04), sat=P.get('sat', 1.05), cool=P.get('cool', 0.25))
yy = np.linspace(0, 1, H)[:, None, None]
# ground haze: the far end of the snowfield (just in front of the wall) gets a cool moonlit veil; the foreground darkens toward the UI
hz = P.get('hz', 0.0)
rgb = rgb * (1 - P.get('fgdark', 0.45) * ss(P.get('fg0', 0.78), 1.0, yy))
rgb = rgb * (1 - P.get('topdark', 0.0) * (1 - ss(P.get('td0', 0.25), P.get('td1', 0.6), yy)))
rgb = rgb + bl * P.get('bloom', 0.9)
ba = np.clip(lum(bl) * 1.4, 0, 1)
a2 = np.maximum(a, ba * (1 - a))
rgb = np.where(a2[..., None] > 1e-4, (rgb * a[..., None] + np.clip(bl, 0, 1) * (ba * (1 - a))[..., None]) / np.maximum(a2[..., None], 1e-4), 0)
img = Image.fromarray((np.clip(rgb, 0, 1) * 255 + .5).astype(np.uint8)).filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
rgb = np.asarray(img).astype(np.float32) / 255
nb = save(rgb, a2, D + f'ld_{key}_near.webp', P.get('qn', 80))
near_rgba = np.dstack([rgb, a2])

# ------------------------------------------------------------------ emissive overlay (windows), bloomed, on black
em = resize_rgba(load(wpre + '_emis.png'), OW, OH)[..., :3]
core = em * 1.0
eb = sum(gaussian_filter(em, (s, s, 0)) * k for s, k in ((1.5, 1.4), (5, 1.1), (14, 0.7), (30, 0.35)))
emis = np.clip(core * 0.9 + eb * 0.9, 0, 1) * np.array([1.0, 0.92, 0.82])[None, None, :]
ea = np.clip(emis.max(2) * 1.6, 0, 1)                       # straight-alpha glow: composited normally (no blend mode, no isolation issues)
eb_ = save(np.where(ea[..., None] > 1e-3, emis / np.maximum(ea[..., None], 1e-3), 0), ea, D + f'ld_{key}_emis.webp', P.get('qe', 70), 70)

# ------------------------------------------------------------------ far plate (mountains), smaller (hazy anyway)
FW, FH = int(OW * FS), int(OH * FS)
mb = resize_rgba(load(mpre if mpre.endswith('.png') else mpre + '_beauty.png'), FW, FH)
mrgb, ma = mb[..., :3], mb[..., 3]
mrgb = grade(mrgb, lift=P.get('mlift', (0.02, 0.04, 0.09)), gain=P.get('mgain', 0.85), gamma=1.0, sat=0.9, cool=0.3)
yy = np.linspace(0, 1, FH)[:, None, None]
haze = np.array(P.get('mhaze', (0.16, 0.25, 0.42)))[None, None, :]
hy0, hy1 = P.get('mh0', 0.45), P.get('mh1', 0.62)
hf = ss(hy0, hy1, yy) * P.get('mhk', 0.75)
mrgb = mrgb * (1 - hf) + haze * hf
fb = save(mrgb, ma, D + f'ld_{key}_far.webp', P.get('qf', 72), 80)

# ------------------------------------------------------------------ meta (positions in plate-normalised coords)
pts = json.load(open(wpre + '_pts.json'))['pts']
lum_b = lum(wb[..., :3]); warm = wb[..., 0] - wb[..., 2]
torch = []
for t in pts['torch']:
    x, y, z, big = t[:4]; sz = t[4] if len(t) > 4 else 0.012
    if not (0.01 < x < 0.99 and 0.01 < y < 0.99 and z < 1): continue
    px, py = int(x * W), int(y * H)
    r = max(2, int(sz * H * 0.25))
    win = lum_b[max(0, py - r):py + r + 1, max(0, px - r):px + r + 1]; ww = warm[max(0, py - r):py + r + 1, max(0, px - r):px + r + 1]
    if win.size == 0 or (win.max() < 0.55 and ww.max() < 0.25): continue        # occluded
    torch.append([round(x, 4), round(y - sz * 0.18, 4), round(sz * H * P.get('tglow', 2.2), 1)])
flag = []
for f in pts['flag']:
    x, y, z, d = f[:4]; ln = f[4] if len(f) > 4 else 0.03
    if 0.0 < x < 1.0 and 0.0 < y < 1.0 and z < 1: flag.append([round(x, 4), round(y, 4), d, round(ln * W, 1)])
g = pts.get('gate', [0.5, 0.7])
meta = json.load(open(D + 'ld_meta.json')) if os.path.exists(D + 'ld_meta.json') else {}
meta[key] = {'near': f'/pub/ld_{key}_near.webp', 'far': f'/pub/ld_{key}_far.webp', 'emis': f'/pub/ld_{key}_emis.webp', 'w': OW, 'h': OH,
             'hf': P.get('hf', 0.64), 'gate': [round(g[0], 4), round(g[1], 4)], 'torch': torch, 'flag': flag,
             'mist': P.get('mist', [0.3, 0.6, 0.14, 0.1]), 'drake': P.get('drake', 0.22), 'dy': P.get('dy', 0)}
json.dump(meta, open(D + 'ld_meta.json', 'w'), indent=0)
print(key, 'near', nb, 'emis', eb_, 'far', fb, 'torches', len(torch), 'flags', len(flag))
if PREV:
    sky = np.zeros((H, W, 3), np.float32); t = np.linspace(0, 1, H)[:, None, None]
    sky[:] = np.array([0.01, 0.03, 0.08]) + np.array([0.10, 0.2, 0.42]) * t ** 1.5
    far = np.asarray(Image.fromarray((np.clip(np.dstack([mrgb, ma]), 0, 1) * 255).astype(np.uint8), 'RGBA').resize((W, H), Image.BILINEAR)).astype(np.float32) / 255
    o = sky * (1 - far[..., 3:]) + far[..., :3] * far[..., 3:]
    o = o * (1 - a2[..., None]) + rgb * a2[..., None]
    o = 1 - (1 - o) * (1 - emis)
    Image.fromarray((np.clip(o, 0, 1) * 255).astype(np.uint8)).save(PREV)
