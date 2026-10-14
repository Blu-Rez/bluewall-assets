# tileable procedural cliff rock: colour + normal (512 px): domain-warped ridged relief, horizontal strata, a few cleavage cracks, grain, staining.
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, map_coordinates
N = 512
Y0, X0 = np.mgrid[0:N, 0:N].astype(np.float32) / N
def pn(fx, fy, seed, X=None, Y=None):
    X = X0 if X is None else X; Y = Y0 if Y is None else Y
    r = np.random.default_rng(seed); g = r.random((fy, fx)).astype(np.float32)
    x = X * fx; y = Y * fy; xi = np.floor(x).astype(int); yi = np.floor(y).astype(int); tx = x - xi; ty = y - yi
    tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty)
    a = g[yi % fy, xi % fx]; b = g[yi % fy, (xi + 1) % fx]; c = g[(yi + 1) % fy, xi % fx]; d = g[(yi + 1) % fy, (xi + 1) % fx]
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty
def fbm(fx, fy, seed, o=5, g=.5, X=None, Y=None, ridged=False):
    s = 0; a = 1; t = 0
    for i in range(o):
        v = pn(fx * 2 ** i, fy * 2 ** i, seed + i * 11, X, Y)
        if ridged: v = 1 - np.abs(2 * v - 1); v = v * v
        s += a * v; t += a; a *= g
    return s / t
# domain warp (keeps tiling: warp is periodic)
wx = (fbm(3, 3, 101, 4) - .5) * .22; wy = (fbm(3, 3, 131, 4) - .5) * .22
Xw = (X0 + wx) % 1.0; Yw = (Y0 + wy) % 1.0
relief = fbm(3, 3, 5, 6, .55, Xw, Yw, ridged=True)                      # chunky ridged relief
strata = fbm(2, 22, 21, 4, .5, Xw, Yw)                                  # horizontal bedding
grain = fbm(40, 40, 41, 4, .6)
c1 = np.abs(fbm(4, 4, 61, 4, .5, Xw, Yw) - .5); crack1 = 1 - np.clip(c1 / .025, 0, 1)    # cleavage cracks (thin, sparse)
c2 = np.abs(fbm(9, 7, 71, 3, .5, Xw, Yw) - .5); crack2 = 1 - np.clip(c2 / .018, 0, 1)
H = 0.70 * relief + 0.22 * strata + 0.10 * grain - 0.30 * crack1 - 0.14 * crack2
H = (H - H.min()) / (H.max() - H.min())
ao = gaussian_filter(H, 6, mode='wrap'); cav = np.clip((ao - H) * 4 + .5, 0, 1)                 # cavities darker
# colour: dark grey-brown, strata tint + staining
tint = fbm(2, 5, 81, 4)[..., None]
cool = np.array([.33, .35, .39], np.float32); warm = np.array([.44, .38, .31], np.float32)
col = (cool * (1 - tint) + warm * tint) * (0.55 + 0.9 * H[..., None]) * (0.7 + 0.5 * (1 - cav[..., None]))
col *= (0.9 + 0.2 * grain[..., None]) * (1 - 0.55 * (crack1 + .6 * crack2)[..., None].clip(0, 1))
sl = np.clip((fbm(2, 14, 91, 3) - .5) * 3, 0, 1)[..., None]; col = col * (1 - sl * .25) + sl * .25 * np.array([.52, .46, .40]) * col.mean(-1, keepdims=True) / .4
col = np.clip(col * 1.15, 0, 1)
img = Image.fromarray((col ** (1 / 2.2) * 255).astype(np.uint8)); img.save('/home/claude/bot/bluebot_v2/bluewall/web/assets/tex/ph_crag.webp', quality=82, method=6)
Hs = gaussian_filter(H, .8, mode='wrap'); dx = (np.roll(Hs, -1, 1) - np.roll(Hs, 1, 1)) * .5; dy = (np.roll(Hs, -1, 0) - np.roll(Hs, 1, 0)) * .5
s = 7.0; nx = -dx * s * N / 40; ny = dy * s * N / 40; nz = np.ones_like(nx); l = np.sqrt(nx * nx + ny * ny + nz * nz)
nm = np.stack([nx / l, ny / l, nz / l], -1) * .5 + .5
Image.fromarray((nm * 255).astype(np.uint8)).save('/home/claude/bot/bluebot_v2/bluewall/web/assets/tex/ph_crag_n.webp', quality=88, method=6)
big = Image.new('RGB', (N * 2, N * 2)); [big.paste(img, (i * N, j * N)) for i in (0, 1) for j in (0, 1)]
big.resize((768, 768)).save('/tmp/claude-0/-home-claude/f1defe4a-d564-51fb-b3f4-8e39cac67238/scratchpad/crag_prev.png'); print('ok')
