# a2_plot.py : hillshaded top-down map of the REAL terrain (layout.height dump) with every map record + candidate stream courses
import json, math, sys, numpy as np
from PIL import Image, ImageDraw, ImageFont
D = json.load(open('/home/claude/work/a2/map.json')); R, STEP, n, LV = D['R'], D['STEP'], D['n'], D['LV']
Hm = np.fromfile('/home/claude/work/a2/map.bin', dtype=np.float32).reshape(n, n)
def load_font(sz):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf'):
        try: return ImageFont.truetype(p, sz)
        except Exception: pass
    return ImageFont.load_default()
def shade(Hm):
    gz, gx = np.gradient(Hm, STEP)
    nx, ny, nz = -gx, np.ones_like(gx), -gz; l = np.sqrt(nx * nx + ny * ny + nz * nz); nx, ny, nz = nx / l, ny / l, nz / l
    L_ = np.array([-0.5, 0.75, -0.45]); L_ /= np.linalg.norm(L_)
    return np.clip(nx * L_[0] + ny * L_[1] + nz * L_[2], 0, 1)
def base_image(x0, x1, z0, z1, S):
    """RGB image of the box, S px per metre (nearest/bilinear from the dump)"""
    w, h = int((x1 - x0) * S), int((z1 - z0) * S)
    xs = np.linspace(x0, x1, w); zs = np.linspace(z0, z1, h)
    fi = (xs + R) / STEP; fj = (zs + R) / STEP
    I, J = np.meshgrid(fi, fj)
    i0 = np.clip(np.floor(I).astype(int), 0, n - 2); j0 = np.clip(np.floor(J).astype(int), 0, n - 2); ti = I - i0; tj = J - j0
    def samp(A): return (A[j0, i0] * (1 - ti) * (1 - tj) + A[j0, i0 + 1] * ti * (1 - tj) + A[j0 + 1, i0] * (1 - ti) * tj + A[j0 + 1, i0 + 1] * ti * tj)
    hh = samp(Hm); sh = samp(shade(Hm))
    # hypsometric tint
    stops = [(-3, (30, 70, 120)), (-0.75, (70, 120, 170)), (-0.7, (88, 130, 70)), (3, (110, 150, 80)), (15, (150, 150, 90)), (40, (140, 120, 90)), (90, (130, 120, 115)), (200, (200, 200, 205))]
    rgb = np.zeros((h, w, 3))
    for c in range(3):
        rgb[..., c] = np.interp(hh, [s[0] for s in stops], [s[1][c] for s in stops])
    rgb *= (0.45 + 0.75 * sh)[..., None]
    water = hh < LV
    rgb[water] = np.array([40, 110, 215]) * (0.75 + 0.25 * sh[water])[..., None]
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8)), hh
def draw_base_overlays(im, x0, z0, S, labels=True):
    d = ImageDraw.Draw(im, 'RGBA'); f = load_font(max(10, int(11)))
    P = lambda x, z: ((x - x0) * S, (z - z0) * S)
    def poly(pts, col, w=2, closed=False):
        q = [P(*p) for p in pts]; 
        if closed: q.append(q[0])
        d.line(q, fill=col, width=w)
    poly(D['TOWN'], (230, 230, 240, 255), 2, True); poly(D['OUTER'], (200, 200, 210, 220), 1, True)
    for r in D['ROADS']:
        if r['name'].startswith(('ring', 'lane', 'mainst', 'westst')): continue
        poly(r['pts'], (225, 190, 120, 200), 1)
    # river
    poly(D['RIVER'], (255, 255, 255, 255), 1)
    for b in D['RBRIDGES']:
        a = P(b['x'] - b['nx'] * b['len'] / 2, b['z'] - b['nz'] * b['len'] / 2); c = P(b['x'] + b['nx'] * b['len'] / 2, b['z'] + b['nz'] * b['len'] / 2); d.line([a, c], fill=(255, 140, 0, 255), width=3)
    def circ(o, col, r=None, txt=None):
        rr = (r if r is not None else o.get('r', 10)) * S; cx, cy = P(o['x'], o['z']); d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=col, width=2)
        if txt and labels: d.text((cx + rr + 2, cy - 6), txt, fill=col, font=f)
    for m in D['MINES']: circ(m, (255, 60, 60, 255), 14, m['id'])
    for s in D['SITES']: circ(s, (255, 255, 0, 255), s['r'], s['id'])
    for k in ('CAMP', 'PASTURE', 'MUSTER', 'LAIR'):
        o = D[k]; circ(o, (255, 160, 255, 255), o.get('fr', o['r']), k)
    for h in D['HAMLETS']: circ(h, (160, 255, 160, 255), h.get('r', 22), 'ham')
    for h in D['NOMADS']: circ(h, (160, 255, 255, 255), h.get('r', 14), 'nom')
    circ(D['LAKE'], (120, 200, 255, 255), D['LAKE']['r'], 'LAKE'); circ(D['FIELDS'] | {'r': 30}, (200, 255, 120, 255), 30, 'fields')
    # grid ticks
    for gx in range(int(math.ceil(x0 / 100) * 100), int(x0 + im.size[0] / S), 100):
        d.line([P(gx, z0), P(gx, z0 + 8 / S * 3)], fill=(255, 255, 255, 200)); d.text(P(gx + 2, z0 + 1), str(gx), fill=(255, 255, 255, 230), font=f)
    for gz in range(int(math.ceil(z0 / 100) * 100), int(z0 + im.size[1] / S), 100):
        d.text(P(x0 + 2, gz + 1), str(gz), fill=(255, 255, 255, 230), font=f); d.line([P(x0, gz), P(x0 + 24 / S, gz)], fill=(255, 255, 255, 200))
def draw_course(im, pts, x0, z0, S, col, w=3, label=None, dots=True):
    d = ImageDraw.Draw(im, 'RGBA'); P = lambda x, z: ((x - x0) * S, (z - z0) * S); f = load_font(16)
    q = [P(p[0], p[1]) for p in pts]; d.line(q, fill=col, width=w, joint='curve')
    if dots:
        for a in q: d.ellipse([a[0] - 2, a[1] - 2, a[0] + 2, a[1] + 2], fill=col)
    if label:
        a = q[len(q) // 2]; d.rectangle([a[0] + 6, a[1] - 11, a[0] + 8 + 11 * len(label), a[1] + 9], fill=(0, 0, 0, 190)); d.text((a[0] + 8, a[1] - 10), label, fill=col, font=f)
if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/work/a2/base_full.png'
    x0, x1, z0, z1, S = -640, 640, -640, 640, 1.4
    im, hh = base_image(x0, x1, z0, z1, S); draw_base_overlays(im, x0, z0, S); im.save(out); print(out, im.size)
