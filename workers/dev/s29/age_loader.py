#!/usr/bin/env python3
"""age_loader.py near|dragon SRC DST [K] [--mask OUT.png]
Ages the loader art the way age_sword.py / age_title.py did, WITHOUT moving the layout:
  near   = castle + pine trees layer (ld_P_near / ld_L_near): weathered, uneven brick, rain streaks, grime at the base, faded slate roofs,
           irregular (hand-grown) trees with patchy snow; torches / windows / gate glow are protected (the emis layer sits on top, pixel-aligned: warp <= 1.2 px)
  dragon = ld_dragon: worn leathery skin, scratches, scars, frayed + torn wing membranes, dulled rim glow, dust."""
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

mode, SRC, DST = sys.argv[1:4]
rest = [x for x in sys.argv[4:]]
MASKOUT = None
if '--mask' in rest:
    i = rest.index('--mask'); MASKOUT = rest[i + 1]; del rest[i:i + 2]
K = float(rest[0]) if rest else 1.0
rng = np.random.default_rng(29)
im = Image.open(SRC).convert('RGBA'); a = np.asarray(im).astype(np.float32) / 255
rgb = a[..., :3].copy(); al = a[..., 3].copy(); H, W = al.shape
lum = lambda c: c @ np.array([.299, .587, .114], np.float32)
gb = lambda x, s: ndi.gaussian_filter(x, s)

def fbm(h, w, cells, seed):
    """value-noise fbm; cells = [(cell_h, cell_w), ...] or [cell, ...] (px per lattice cell)"""
    r = np.random.default_rng(seed); out = np.zeros((h, w), np.float32); amp = 1.0; tot = 0
    for c in cells:
        ch, cw = (c, c) if np.isscalar(c) else c
        n = r.random((max(2, int(h / ch)), max(2, int(w / cw)))).astype(np.float32)
        out += amp * np.asarray(Image.fromarray((n * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)).astype(np.float32) / 255
        tot += amp; amp *= 0.55
    return out / tot

def desat(c, g, k):                      # k = amount of colour kept (1 = unchanged)
    return g + (c - g) * k

def save(rgb, al):
    out = np.dstack([np.clip(rgb, 0, 1), np.clip(al, 0, 1)])
    Image.fromarray((out * 255 + 0.5).astype(np.uint8)).save(DST, quality=92, method=6)
    print('saved', DST, W, H)

# =========================================================================================================== NEAR (castle + trees)
if mode == 'near':
    L = lum(rgb); solid = al > 0.5
    yy = np.repeat((np.arange(H) / H)[:, None], W, 1)
    # ---- masks
    warm = ((rgb[..., 0] > rgb[..., 2] * 0.82) & (L > 0.22)) | (L > 0.80)                 # windows, gate, torch flames, hot highlights
    protect = np.clip(gb(ndi.binary_dilation(warm, iterations=3).astype(np.float32), 2.0) * 1.5, 0, 1)
    free = 1 - protect
    # stone: brick-scale detail inside the castle band (limited to y, minus the trees)
    d1 = gb(np.abs(L - gb(L, 1.0)), 2.5)
    ylo, yhi = (0.30, 0.74) if H > W else (0.34, 0.76)
    band = ((yy > ylo) & (yy < yhi)).astype(np.float32)
    stone0 = np.clip((gb(d1, 1.5) - 0.020) * 40, 0, 1) * band * solid
    # trees: dark blobs low in the picture (not the dark wall-foot, which has brick detail), grown a little to take their snowy lower tiers
    dark = ndi.binary_opening((L < 0.13) & solid & (yy > 0.60) & (stone0 < 0.4), iterations=1)
    lab, n = ndi.label(dark)
    sizes = ndi.sum(np.ones_like(lab), lab, range(1, n + 1))
    keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > 120])
    trees = ndi.binary_dilation(keep, iterations=4) & solid
    tree_w = np.clip(gb(trees.astype(np.float32), 1.5), 0, 1)
    stone = np.clip(gb(stone0 * (1 - tree_w), 1.2) * 1.1, 0, 1)
    sat0 = np.clip(rgb.max(-1) - rgb.min(-1), 0, 1)
    roof = np.clip((sat0 - 0.28) * 5, 0, 1) * (rgb[..., 2] > rgb[..., 0] + 0.15) * (1 - tree_w) * solid * band    # bright blue slate roofs
    roof = gb(roof, 1.0)
    if MASKOUT:
        v = np.dstack([stone, tree_w, np.clip(roof + protect * 0.5, 0, 1)]); Image.fromarray((v * 255).astype(np.uint8)).save(MASKOUT)

    # ---- 0. wobble: hand-laid brick courses and hand-grown tiers are never ruler-straight (<= 1.2 px stone, <= 2.2 px trees; protected pixels stay put)
    mv = np.clip(stone * 1.0 + tree_w * 1.9, 0, 2.0) * free
    dx = (fbm(H, W, [9, 4], 101) - 0.5) * 2 * 1.25 * mv * (0.9 + 0.1 * K)
    dy = (fbm(H, W, [9, 4], 102) - 0.5) * 2 * 1.25 * mv * (0.9 + 0.1 * K)
    gy, gx = np.mgrid[0:H, 0:W].astype(np.float32)
    def wp(c): return ndi.map_coordinates(c, [gy + dy, gx + dx], order=1, mode='nearest')
    rgb = np.dstack([wp(rgb[..., i]) for i in range(3)]); al = wp(al)
    stone, tree_w, roof = wp(stone), wp(tree_w), wp(roof)
    L = lum(rgb)

    # ---- 1. fade: calmer, a touch greyer, slate roofs lose their showroom saturation
    g = L[..., None]
    k_keep = 1 - (0.14 * stone + 0.10 * tree_w + 0.30 * roof) * K
    rgb = np.where(((stone + tree_w + roof) > 0.01)[..., None], desat(rgb, g, k_keep[..., None]), rgb)
    dim = 1 - (0.07 * stone + 0.05 * tree_w + 0.10 * roof) * K
    rgb = rgb * (1 - (1 - dim[..., None]) * free[..., None])

    # ---- 2. masonry: every brick a slightly different tone, big grimy patches where the weather got at it
    brick = fbm(H, W, [3.0, 1.6], 11) - 0.5
    patch = fbm(H, W, [(40, 40), (18, 18)], 12)
    grime = np.clip((patch - 0.48) * 2.6, 0, 1)
    sw = stone * free * K
    rgb = rgb * (1 + 0.22 * brick[..., None] * sw[..., None])
    rgb = rgb * (1 - 0.30 * grime[..., None] * sw[..., None])

    # ---- 3. rain streaks: dark runs down the wall below ledges / windows / battlements (stronger lower on the wall)
    streak = fbm(H, W, [(90, 3.0), (40, 1.6)], 21)
    sk = np.clip((streak - 0.52) * 3.2, 0, 1)
    low = np.clip((yy - ylo) / (yhi - ylo), 0, 1) ** 0.7
    sk = sk * (0.30 + 0.70 * low) * sw
    rgb = rgb * (1 - 0.38 * sk[..., None]) + 0.38 * sk[..., None] * np.array([0.018, 0.026, 0.050], np.float32)
    # pale mineral bloom (efflorescence) as thin pale runs
    pale = np.clip((fbm(H, W, [(60, 2.6)], 22) - 0.60) * 4.0, 0, 1) * sw * (0.4 + 0.6 * low)
    rgb = rgb + 0.07 * pale[..., None] * np.array([0.55, 0.65, 0.90], np.float32)

    # ---- 4. cold damp at the foot of the walls and towers: dull blue-grey lichen, not green
    foot = np.clip((yy - (yhi - 0.17)) / 0.17, 0, 1) ** 1.3
    lich = np.clip((fbm(H, W, [(14, 14), (6, 6)], 31) - 0.52) * 3.0, 0, 1) * foot * sw
    rgb = rgb * (1 - 0.35 * lich[..., None]) + 0.35 * lich[..., None] * np.array([0.050, 0.085, 0.100], np.float32)

    # ---- 5. cracks (thin, dark, jagged, mostly vertical) + a few chipped corners (light)
    cr = Image.new('L', (W, H), 0); dc = ImageDraw.Draw(cr)
    sy, sx = np.nonzero(stone > 0.6)
    for _ in range(int((H * W) / 1800 * K)):
        j = rng.integers(len(sx)); x, y = float(sx[j]), float(sy[j]); ang = np.pi / 2 + rng.normal(0, 0.45); pts = [(x, y)]
        for _s in range(int(rng.integers(3, 9))):
            ang += rng.normal(0, 0.55); x += np.cos(ang) * rng.uniform(1.5, 4.0); y += abs(np.sin(ang)) * rng.uniform(1.5, 4.0); pts.append((x, y))
        dc.line(pts, fill=int(rng.uniform(110, 230)), width=1)
    cr = np.asarray(cr.filter(ImageFilter.GaussianBlur(0.45))).astype(np.float32) / 255 * stone * free
    rgb = rgb * (1 - 0.55 * K * cr[..., None])
    chip = Image.new('L', (W, H), 0); dh = ImageDraw.Draw(chip)
    for _ in range(int((H * W) / 5200 * K)):
        j = rng.integers(len(sx)); x, y = float(sx[j]), float(sy[j]); r = rng.uniform(.8, 2.2)
        dh.polygon([(x + r * rng.uniform(.4, 1.3) * np.cos(t), y + r * rng.uniform(.4, 1.3) * np.sin(t)) for t in np.linspace(0, 6.28, 6)[:-1]], fill=255)
    chip = np.asarray(chip.filter(ImageFilter.GaussianBlur(0.5))).astype(np.float32) / 255 * stone * free
    rgb = rgb * (1 - 0.35 * chip[..., None]) + 0.10 * chip[..., None] * np.array([0.5, 0.6, 0.8], np.float32)

    # ---- 6. slate roofs: faded, patchy, a few darker missing-tile areas
    rp = np.clip((fbm(H, W, [(10, 10), (4, 4)], 41) - 0.45) * 2.6, 0, 1) * roof * free * K
    rgb = rgb * (1 - 0.30 * rp[..., None])
    rgb = rgb * (1 + 0.14 * (fbm(H, W, [2.0, 1.2], 42)[..., None] - 0.5) * (roof * free)[..., None] * K)

    # ---- 7. pine trees: break the perfect tiers - needle-fine tone noise, uneven snow clumps, darker undersides, dull blue-black needles
    tw = tree_w * free * K
    needle = fbm(H, W, [(1.4, 2.2), (3.0, 4.5)], 51) - 0.5
    rgb = rgb * (1 + 0.46 * needle[..., None] * tw[..., None])
    Lt = lum(rgb)
    snowy = np.clip((Lt - 0.22) * 3.0, 0, 1)                                       # the already-snowy parts of the tree
    clump = np.clip((fbm(H, W, [(7, 7), (3, 3)], 52) - 0.46) * 3.0, 0, 1)
    rgb = rgb * (1 + 0.22 * tw[..., None] * ((clump - 0.5) * snowy)[..., None])     # snow sits in clumps: some lighter, some bare
    under = np.clip(gb(1 - snowy, 1.2) * 0.5, 0, 1)
    rgb = rgb * (1 - 0.18 * under[..., None] * tw[..., None])

    # ---- 8. grain + a little dust haze on the stone; the snow stays clean
    gr = (rng.normal(0, 1, (H, W)).astype(np.float32))
    rgb = rgb + 0.020 * K * gb(gr, 0.5)[..., None] * 3 * np.clip(stone + tree_w, 0, 1)[..., None] * free[..., None]
    save(rgb, al)

# =========================================================================================================== DRAGON
elif mode == 'dragon':
    L = lum(rgb); solid = al > 0.5
    body = ndi.binary_opening(solid & (L < 0.30), iterations=1)           # the dark skin
    rimm = solid & ~body
    dsol = ndi.distance_transform_edt(solid)
    # ---- 1. fade: duller rim glow, less saturated skin
    g = L[..., None]
    rgb = np.where(solid[..., None], desat(rgb, g, 1 - 0.16 * K), rgb)
    rim_w = np.clip(1 - dsol / 7.0, 0, 1) * solid
    rgb = rgb * (1 - 0.20 * K * rim_w[..., None])
    # ---- 2. leathery skin: fine pebbling + big mottling + a few paler worn patches
    peb = fbm(H, W, [1.8, 3.5], 61) - 0.5
    mott = fbm(H, W, [(34, 34), (14, 14)], 62)
    worn = np.clip((mott - 0.52) * 2.8, 0, 1) * solid * K
    rgb = rgb * (1 + 0.17 * K * peb[..., None] * solid[..., None])
    rgb = rgb * (1 - 0.30 * worn[..., None]) + 0.30 * worn[..., None] * (lum(rgb)[..., None] * 0.9 + np.array([0.015, 0.03, 0.06], np.float32))
    # ---- 3. scratches / scars: light thin lines + dark healed scars, mostly across the wing membranes
    sc = Image.new('L', (W, H), 0); dk = Image.new('L', (W, H), 0); d1, d2 = ImageDraw.Draw(sc), ImageDraw.Draw(dk)
    ys, xs = np.nonzero(solid & (dsol > 6))
    for _ in range(int(240 * K)):
        j = rng.integers(len(xs)); x0, y0 = xs[j], ys[j]; Ln = rng.uniform(6, 40); ang = rng.normal(0.6, 1.0)
        (d1 if rng.random() < 0.6 else d2).line([(x0, y0), (x0 + Ln * np.cos(ang), y0 + Ln * np.sin(ang))], fill=int(rng.uniform(70, 210)), width=1)
    sc = np.asarray(sc.filter(ImageFilter.GaussianBlur(0.5))).astype(np.float32) / 255 * solid
    dk = np.asarray(dk.filter(ImageFilter.GaussianBlur(0.5))).astype(np.float32) / 255 * solid
    rgb = rgb + 0.20 * K * sc[..., None] * (0.30 + lum(rgb)[..., None]) * np.array([0.80, 0.95, 1.15], np.float32)
    rgb = rgb * (1 - 0.35 * K * dk[..., None])
    # ---- 4. frayed membrane edges: the outer few px erode with high-frequency noise (silhouette keeps its size, only the very rim is ragged)
    edge = np.clip(1 - dsol / 7.0, 0, 1)
    nz = fbm(H, W, [(3.2, 3.2), (6.0, 6.0)], 71)
    fr = np.clip((nz - (0.38 + 0.30 * (1 - edge))) * 6.0 + 1.0, 0, 1)
    al2 = al * np.where(edge > 0.05, np.clip(fr + (1 - edge) * 1.0, 0, 1), 1.0) * 1.0
    al = al * (1 - K * edge * 0.0) + (al2 - al) * K
    # ---- 5. small tears: a few irregular holes in the wing membranes (bright rim around each, as the glow catches the torn edge)
    hole = Image.new('L', (W, H), 0); dh = ImageDraw.Draw(hole)
    cand = np.nonzero(solid & (dsol > 14) & (dsol < 60))
    for _ in range(int(11 * K)):
        j = rng.integers(len(cand[0])); y0, x0 = float(cand[0][j]), float(cand[1][j]); r = rng.uniform(3.0, 8.5)
        pts = [(x0 + r * rng.uniform(.45, 1.5) * np.cos(t), y0 + r * rng.uniform(.4, 1.2) * np.sin(t)) for t in np.linspace(0, 6.28, 9)[:-1]]
        dh.polygon(pts, fill=255)
    hole = np.asarray(hole.filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255
    ring = np.clip(gb(hole, 2.0) * 2.2 - hole * 2.0, 0, 1)
    al = al * (1 - np.clip(hole * 1.4, 0, 1))
    rgb = rgb + 0.22 * ring[..., None] * np.array([0.30, 0.55, 1.0], np.float32) * (al[..., None] > 0.2)
    # ---- 6. dust on the upper surfaces
    dust = np.clip((fbm(H, W, [(16, 16), (6, 6)], 81) - 0.60) * 3.0, 0, 1) * solid * K
    rgb = rgb * (1 - 0.14 * dust[..., None]) + 0.14 * dust[..., None] * np.array([0.30, 0.36, 0.48], np.float32)
    save(rgb, al)
