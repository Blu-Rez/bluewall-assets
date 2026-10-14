# ld_mtn.py <out.png> <W> <H> <cam "px,py,pz,tx,ty,tz,fov"> [seed] : offline mountain-range plate (no browser):
# ridged multifractal heightfield → voxel-space renderer (front-to-back spans with a y-buffer) with moonlight, snow, rim light,
# aerial perspective and valley mist. Same camera convention as three.js (vertical fov, lookAt), so it sits behind the wall render.
import sys, os, json, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter
out, W, H = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
cam = [float(v) for v in sys.argv[4].split(',')]
seed = int(sys.argv[5]) if len(sys.argv) > 5 else 11
K = json.loads(os.environ.get('LDM', '{}'))
C = np.array(cam[:3]); T = np.array(cam[3:6]); FOV = cam[6]

# ---------------------------------------------------------------- perlin noise (vectorised)
rs = np.random.RandomState(seed)
perm = np.arange(256); rs.shuffle(perm); perm = np.concatenate([perm, perm])
ang = rs.rand(256) * np.pi * 2; GX, GY = np.cos(ang), np.sin(ang)
def perlin(x, y):
    xi = np.floor(x).astype(int); yi = np.floor(y).astype(int); xf = x - xi; yf = y - yi
    xi &= 255; yi &= 255
    u = xf * xf * xf * (xf * (xf * 6 - 15) + 10); v = yf * yf * yf * (yf * (yf * 6 - 15) + 10)
    def g(ix, iy, dx, dy):
        h = perm[perm[ix] + iy]; return GX[h] * dx + GY[h] * dy
    n00 = g(xi, yi, xf, yf); n10 = g(xi + 1, yi, xf - 1, yf); n01 = g(xi, yi + 1, xf, yf - 1); n11 = g(xi + 1, yi + 1, xf - 1, yf - 1)
    return (n00 + u * (n10 - n00)) * (1 - v) + (n01 + u * (n11 - n01)) * v      # ~[-0.7, 0.7]
def fbm(x, y, o=4, lac=2.0, gain=0.5):
    s = 0; a = 1; n = 0
    for i in range(o): s = s + a * perlin(x * lac ** i + i * 17.3, y * lac ** i - i * 9.1); n += a; a *= gain
    return s / n
def ridged(x, y, o=7, lac=2.03):
    s = 0; a = 0.5; w = 1.0
    for i in range(o):
        n = 1 - np.abs(perlin(x * lac ** i + i * 5.7, y * lac ** i + i * 3.1) * 1.45); n = np.clip(n, 0, 1) ** 2
        n = n * w; w = np.clip(n * 2.2, 0, 1); s = s + n * a; a *= 0.5
    return s
def ss(e0, e1, x): t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)

# ---------------------------------------------------------------- heightfield (x across, z into the distance; metres)
DX = K.get('dx', 7.0)
X = np.arange(-5200, 5200, DX); Z = np.arange(K.get('z0', -650), K.get('z1', -7200), -DX)
XX, ZZ = np.meshgrid(X, Z)
wx = XX + fbm(XX / 2600, ZZ / 2600, 3) * 700; wz = ZZ + fbm(XX / 2600 + 4, ZZ / 2600, 3) * 700
rid = ridged(wx / K.get('wl', 1500), wz / K.get('wl', 1500), 7)
mass = 0.5 + 0.9 * fbm(XX / 4200 + 9, ZZ / 4200, 2)
dist = -ZZ
# amplitude: low foothills right behind the valley, high ranges far away; a lower saddle behind the castle so the far peaks show through the pass
amp = K.get('peak', 1700) * ss(500, 3200, dist) * (0.55 + 0.6 * np.clip(mass, 0, 1.3))
amp *= 1 - K.get('saddle', 0.35) * np.exp(-(XX / K.get('sw', 900)) ** 2) * (1 - ss(1800, 4200, dist))
det = ridged(wx / K.get('dwl', 420) + 31, wz / K.get('dwl', 420) - 17, 5)
h = amp * (rid ** K.get('rp', 1.25)) * (1 + K.get('det', 0.25) * (det - 0.35)) + 180 * ss(400, 2500, dist) * np.clip(mass, 0, 1.2) - 40
# a crisp hero massif behind-left (catches the moon) and a second one right
for cx, cz, r, k in K.get('hero', [[-900, -3600, 1300, 900], [1700, -3000, 1000, 600]]):
    d2 = ((XX - cx) / r) ** 2 + ((ZZ - cz) / (r * 0.8)) ** 2
    h += k * np.exp(-d2 * 1.6) * (0.55 + 0.6 * rid)
h = gaussian_filter(h, 0.6)
# ---------------------------------------------------------------- shading on the grid
hs = gaussian_filter(h, K.get('nblur', 1.6))
gz, gx = np.gradient(hs, DX)       # gz along rows (z decreasing!), gx along x
gz = -gz                           # rows go toward -z
nrm = np.dstack([-gx, np.ones_like(h), -gz]); nrm /= np.linalg.norm(nrm, axis=2, keepdims=True)
L = np.array(K.get('moon', [-0.62, 0.42, -0.42])); L = L / np.linalg.norm(L)
ndl = np.clip((nrm * L).sum(2), 0, 1)
# cast shadows from the moon (march toward the light along x/z on the heightfield)
sh = np.ones_like(h)
if K.get('shadow', 1):
    lx, ly, lz = L; hor = np.hypot(lx, lz); stepx, stepz = lx / hor * DX * 2, lz / hor * DX * 2; rise = ly / hor * DX * 2
    for k in range(1, 70):
        ox = int(round(stepx * k / DX)); oz = int(round(-stepz * k / DX))      # row index grows toward -z
        sx = np.roll(np.roll(h, -oz, axis=0), -ox, axis=1)
        sh = np.minimum(sh, np.clip(1 - (sx - (h + rise * k)) / 25, 0, 1))
    sh = gaussian_filter(sh, 1.0)
sn = fbm(XX / 300, ZZ / 300, 4)
from scipy.ndimage import laplace
gm = np.hypot(gx, gz) + 1e-6
uu = (gx * XX + gz * ZZ) / gm; vv = (-gz * XX + gx * ZZ) / gm          # along / across the fall line
streak = fbm(vv / K.get('sw2', 28), uu / K.get('sl2', 260), 3)
cav = np.clip(laplace(gaussian_filter(h, 2.0)) / (DX * DX) * K.get('cavk', 60), -1, 1)   # + = gully (snow collects), - = crest
snow = ss(K.get('snowslope', 0.62), K.get('snowslope', 0.62) + 0.2, nrm[..., 1] + sn * 0.12 + streak * K.get('streak', 0.25) + cav * K.get('cavs', 0.18)) * ss(K.get('snowline', 260), K.get('snowline', 260) + 380, h + sn * 300)
rockc = np.array([0.10, 0.12, 0.17]) * (0.75 + 0.5 * (0.5 + 0.5 * fbm(XX / 220, ZZ / 220, 3)))[..., None]
snowc = np.array([0.80, 0.88, 1.0]) * (0.9 + 0.1 * sn[..., None])
alb = rockc * (1 - snow[..., None]) + snowc * snow[..., None]
moonc = np.array(K.get('moonc', [0.78, 0.86, 1.0])) * K.get('mi', 1.35)
skyc = np.array([0.10, 0.16, 0.30]) * K.get('ai', 1.0)
amb = skyc * (0.45 + 0.55 * nrm[..., 1:2])
col = alb * (moonc * (ndl * sh)[..., None] + amb)
col = gaussian_filter(col, (K.get('cblur', 1.0), K.get('cblur', 1.0), 0))
# rim: grazing moonlight on crests (normals facing up-and-toward the light), strongest on snow
rim = ss(0.15, 0.6, (nrm[..., 0] * L[0] + nrm[..., 2] * L[2]) / max(np.hypot(L[0], L[2]), 1e-3)) * ss(0.25, 0.8, nrm[..., 1]) * sh
col += rim[..., None] * np.array([0.25, 0.32, 0.45]) * (0.3 + 0.7 * snow[..., None]) * K.get('rim', 1.0)

# ---------------------------------------------------------------- camera
fwd = T - C; fwd /= np.linalg.norm(fwd); right = np.cross(fwd, [0, 1, 0]); right /= np.linalg.norm(right); up = np.cross(right, fwd)
F = (H / 2) / np.tan(np.radians(FOV / 2)); cx, cy = W / 2, H / 2
import cv2
SSR = K.get('ssr', 2)
Wr, Hr = W * SSR, H * SSR; Fr = F * SSR; cxr, cyr = Wr / 2, Hr / 2
rel = np.stack([XX - C[0], h - C[1], ZZ - C[2]], -1)
cz = rel @ fwd; okz = cz > 40; cz = np.maximum(cz, 40); sx = cxr + Fr * (rel @ right) / cz; sy = cyr - Fr * (rel @ up) / cz
sx = np.where(okz, sx, -1e6)
d = np.sqrt(((rel) ** 2).sum(-1))
fogc = np.array(K.get('fogc', [0.13, 0.2, 0.36])); fogk = K.get('fogk', 0.00028); mist = K.get('mist', 1.0)
f = 1 - np.exp(-d * fogk * (0.45 + 0.55 * np.exp(-np.maximum(h, 0) / 900)))
lowm = mist * ss(260, -40, h)[..., None] * 0.6
cc = col * (1 - f[..., None]) + fogc * f[..., None]
cc = cc * (1 - lowm) + (fogc * 1.6) * lowm
cc8 = np.clip(cc * 255, 0, 255).astype(np.float64)
canvas = np.zeros((Hr, Wr, 3), np.uint8); mask = np.zeros((Hr, Wr), np.uint8)
SH = 4; S16 = 1 << SH
P = np.stack([sx, sy], -1) * S16
NZ, NX = h.shape
for r in range(NZ - 2, -1, -1):                     # painter: far → near
    a, b = P[r + 1], P[r]                           # far row, near row
    xs = np.minimum(a[:, 0], b[:, 0])
    okq = okz[r, :-1] & okz[r, 1:] & okz[r + 1, :-1] & okz[r + 1, 1:]
    cols_ = np.nonzero(okq & (np.maximum(a[:-1, 0], b[1:, 0]) > -64 * S16) & (xs[:-1] < (Wr + 64) * S16) & (np.minimum(a[:-1, 1], b[:-1, 1]) < Hr * S16))[0]
    if len(cols_) == 0: continue
    q = np.stack([b[cols_], b[cols_ + 1], a[cols_ + 1], a[cols_]], 1).astype(np.int32)
    colr = cc8[r, cols_]
    for k in range(len(cols_)):
        c = colr[k]; cv2.fillConvexPoly(canvas, q[k], (c[0], c[1], c[2]), cv2.LINE_8, SH); cv2.fillConvexPoly(mask, q[k], 255, cv2.LINE_8, SH)
# below the nearest row: valley haze
o0 = np.argsort(sx[0]); ybot = np.interp(np.arange(Wr), sx[0][o0], sy[0][o0])
yy = np.arange(Hr)[:, None]
below = yy >= ybot[None, :]
canvas[below] = np.clip(fogc * 1.5 * 255, 0, 255).astype(np.uint8); mask[below] = 255
small = cv2.resize(np.dstack([canvas, mask]), (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
img, alpha = small[..., :3], small[..., 3]
im = np.dstack([np.clip(img, 0, 1), alpha])
Image.fromarray((im * 255 + .5).astype(np.uint8), 'RGBA').save(out)
print(out, W, H)
