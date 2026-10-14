# offline renderer for the loader mountains (numpy + PIL). Output: transparent webp, 780 x 1088 (stage y 300..844 at 2x)
import sys, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, gaussian_filter1d
S = 2; W, H = 390 * S, 544 * S; Y0 = 300           # stage coords -> image: y_img = (y - Y0) * S
def hnoise(seed, n=256):
    r = np.random.default_rng(seed); return r.random((n, n)).astype(np.float32)
def vnoise(tab, X, Y):
    n = tab.shape[0]; xi = np.floor(X).astype(np.int32); yi = np.floor(Y).astype(np.int32); fx = X - xi; fy = Y - yi
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy)
    a = tab[yi % n, xi % n]; b = tab[yi % n, (xi + 1) % n]; c = tab[(yi + 1) % n, xi % n]; d = tab[(yi + 1) % n, (xi + 1) % n]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy
def fbm(tab, X, Y, oct=5, ridged=False, gain=.5):
    s = 0; a = 1; tot = 0
    for i in range(oct):
        v = vnoise(tab, X * 2 ** i + i * 17.3, Y * 2 ** i + i * 9.1)
        if ridged: v = 1 - np.abs(2 * v - 1); v = v * v
        s += a * v; tot += a; a *= gain
    return s / tot
def smooth(a, b, x): t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def mix(c0, c1, t): return c0 + (c1 - c0) * t[..., None]
def hexc(h): h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255
def render(layers, seed, out):
    Xg, Yg = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    img = np.zeros((H, W, 4), np.float32)
    tab = hnoise(seed)
    xs = np.arange(W, dtype=np.float32)
    for li, L in enumerate(layers):
        # crest profile (ridged 1-D fBm) -> y in image px
        rr = np.zeros(W, np.float32); a = 1; tot = 0
        t1 = hnoise(seed + 100 + li)[0:8]
        for o in range(6):
            v = vnoise(t1, (xs / S) * L['f'] * 2 ** o / 260 + 7.3 * o + li * 3.1, np.full(W, 1.5 + o, np.float32))
            if o >= 1: v = 1 - np.abs(2 * v - 1)
            rr += a * v; tot += a; a *= L.get('rough', .46)
        rr = rr / tot; rr = (rr - rr.min()) / (rr.max() - rr.min() + 1e-6)
        rr = rr ** L.get('pow', 1.0)
        crest = (L['y'] - Y0) * S - rr * L['amp'] * S                     # image y of the crest at each x
        cs = gaussian_filter1d(crest, 9 * S)
        slope = np.clip(np.gradient(cs), -1.2, 1.2); sl2 = gaussian_filter1d(crest, 12 * S); slope2 = np.gradient(sl2)                                     # dy/dx (px/px)
        d = Yg - crest[None, :]                                           # depth below the crest (px)
        amp = L['amp'] * S
        # rock texture: ridged noise stretched vertically (gullies run down the slopes)
        Xs = Xg - .55 * np.clip(d, 0, None) * np.tanh(3.0 * slope2)[None, :]
        Hf = fbm(tab, Xs / (30 * S / 2) * L.get('tx', 1), (Yg + crest[None, :] * .35) / (44 * S / 2), 6, True)
        Hf = gaussian_filter(Hf, .6)
        gy, gx = np.gradient(Hf)
        det = np.clip(.5 + 9 * (-gx * .85 - gy * .5), 0, 1)
        large = 1 / (1 + np.exp(1.7 * slope))                             # slopes descending to the left are lit
        large = gaussian_filter1d(large, 10 * S); large = np.repeat(large[None, :], H, axis=0)
        I = np.clip(.62 * large + .38 * det, 0, 1)
        I *= 1 - .5 * smooth(0, amp * 1.5, d)
        col = mix(hexc(L['shadow']), hexc(L['lit']), I.astype(np.float32))
        # snow
        snowline = L.get('snow', .5) * amp
        sn = smooth(0, 1, (snowline * (.65 + .7 * Hf) - d) / (amp * .25 + 1)) * (rr[None, :] > L.get('snowmin', .25))
        snowc = mix(hexc(L['shadow']) * 1.6, hexc('#e9f6ff'), np.clip(.25 + .85 * I, 0, 1).astype(np.float32))
        col = mix(col, snowc, (sn * .9).astype(np.float32))
        # rim light on the crest
        rim = np.exp(-np.clip(d, 0, None) / (1.6 * S)) * .32 * (.4 + .6 * large)
        col = col + rim[..., None] * hexc('#cfe8ff')
        # atmospheric haze: far = hazy, valleys fill with mist
        hz = L['haze'] + .55 * smooth(.25 * amp, 1.5 * amp, d)
        col = mix(col, hexc(L['hazec']), np.clip(hz, 0, 1).astype(np.float32))
        al = np.clip(d / 1.3 + .5, 0, 1)
        # alpha-over
        ia = img[..., 3:4]; la = al[..., None]
        outa = la + ia * (1 - la)
        img[..., :3] = (col * la + img[..., :3] * ia * (1 - la)) / np.maximum(outa, 1e-5)
        img[..., 3:4] = outa
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8), 'RGBA')
    im.save(out, quality=84, method=6); print(out)
PRESETS = {
 'A': [dict(y=560, amp=92, f=2.2, shadow='#0c2552', lit='#5f8fd2', hazec='#4d7fc4', haze=.52, snow=.55),
       dict(y=606, amp=78, f=3.0, shadow='#0a1f48', lit='#4678c0', hazec='#2f60aa', haze=.30, snow=.45),
       dict(y=650, amp=56, f=4.0, shadow='#07142f', lit='#2a579e', hazec='#16356f', haze=.12, snow=.25)],
 'B': [dict(y=470, amp=120, f=2.0, shadow='#0c2552', lit='#6a9ada', hazec='#4d7fc4', haze=.55, snow=.58),
       dict(y=530, amp=96, f=2.8, shadow='#0a1f48', lit='#4a7dc6', hazec='#2f60aa', haze=.32, snow=.5),
       dict(y=600, amp=64, f=3.8, shadow='#07142f', lit='#2c5aa0', hazec='#16356f', haze=.12, snow=.3)],
 'C': [dict(y=520, amp=150, f=1.8, shadow='#0c2552', lit='#6f9fe0', hazec='#4d7fc4', haze=.55, snow=.6),
       dict(y=586, amp=110, f=2.6, shadow='#0a1f48', lit='#4a7dc6', hazec='#2f60aa', haze=.32, snow=.5),
       dict(y=650, amp=70, f=3.6, shadow='#07142f', lit='#2c5aa0', hazec='#16356f', haze=.12, snow=.3)],
}
if __name__ == '__main__':
    for k in sys.argv[1:]: render(PRESETS[k], {'A': 11, 'B': 23, 'C': 37}[k], f'/home/claude/dev/pub/lw_mtn_{k}.webp')
