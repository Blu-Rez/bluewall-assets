import json, math, sys
import numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Circle
d = json.load(open('/tmp/cmp/wsmap.json'))
# ---- the new river inside the town (polar anchor points: angle deg (atan2(z,x), z down), radius) -> smooth path
old = [tuple(p) for p in d['river']]
wall_in = (131.0, -84.0)                   # where the river meets the town wall (NE)
anch = [(-33, 150), (-36, 128), (-44, 114), (-62, 109), (-82, 112), (-104, 114), (-126, 111), (-148, 108), (-170, 111), (-192, 113), (-208, 112)]
pts = [wall_in] + [(r * math.cos(math.radians(a)), r * math.sin(math.radians(a))) for a, r in anch]
# exit through the wall at ~147 deg then south to the lake's north shore
ex = (-135.0, 86.0)
L = d['lake']
tail = [ex, (-150.0, 128.0), (-152.0, 165.0), (L['x'] + 5, L['z'] - L['r'] + 6)]
raw = old[-3:] + pts + tail
def catmull(P, n=14):
    P = [np.array(p) for p in P]; out = []
    P = [P[0]] + P + [P[-1]]
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(P[-2]); return np.array(out)
path = catmull(raw)
json.dump({'old': old, 'path': path.tolist(), 'raw': raw}, open('/tmp/cmp/riverplan.json', 'w'))
def segs(poly):
    return [(np.array(poly[i]), np.array(poly[(i + 1) % len(poly)])) for i in range(len(poly))]
def inter(a, b, c, e):
    r = b - a; s = e - c; den = r[0] * s[1] - r[1] * s[0]
    if abs(den) < 1e-9: return None
    t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den; u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den
    return (a + r * t) if 0 <= t <= 1 and 0 <= u <= 1 else None
cross = []
for r_ in d['roads']:
    if r_['kind'] != 'cobble': continue
    P = r_['pts']
    for i in range(len(P) - 1):
        for j in range(len(path) - 1):
            x = inter(np.array(P[i]), np.array(P[i + 1]), path[j], path[j + 1])
            if x is not None: cross.append((r_['name'], x))
gates = []
for i in range(len(d['town'])):
    a, b = np.array(d['town'][i]), np.array(d['town'][(i + 1) % len(d['town'])])
    for j in range(len(path) - 1):
        x = inter(a, b, path[j], path[j + 1])
        if x is not None: gates.append((i, x))
print('street crossings:', [(n, [round(v) for v in x]) for n, x in cross])
print('wall crossings:', [(i, [round(v) for v in x]) for i, x in gates])
def dpoly(p, poly):
    best = 1e9
    for a, b in segs(poly):
        t = max(0, min(1, np.dot(p - a, b - a) / max(1e-9, np.dot(b - a, b - a)))); best = min(best, np.linalg.norm(p - (a + (b - a) * t)))
    return best
print('min dist river-citadel wall:', round(min(dpoly(p, d['outer']) for p in path if np.hypot(*p) < 160), 1))
print('river length inside the town:', round(sum(np.linalg.norm(path[i + 1] - path[i]) for i in range(len(path) - 1) if np.hypot(*path[i]) < 165)))
for nm, p in (('church', (-31, 87)), ('T1 gate', (d['tgates'][1]['x'], d['tgates'][1]['z'])), ('T0 gate', (d['tgates'][0]['x'], d['tgates'][0]['z'])), ('market', (d['market']['x'], d['market']['z']))):
    print(nm, 'min dist to river', round(min(np.linalg.norm(np.array(p) - q) for q in path), 1))
# ---- draw
fig, ax = plt.subplots(figsize=(11, 11), dpi=100)
R = d['R']; g = np.array(d['g'])
ax.imshow(np.clip(g, -3, 40), extent=[-R, R, R, -R], cmap='terrain', vmin=-3, vmax=40, origin='upper', alpha=0.55)
ax.add_patch(Polygon(d['town'], fill=False, ec='k', lw=2.5)); ax.add_patch(Polygon(d['outer'], fill=False, ec='k', lw=2.5))
for r_ in d['roads']:
    p = np.array(r_['pts']); 
    if r_['kind'] == 'dirt' and not r_['name'].startswith('hamlet'): ax.plot(p[:, 0], p[:, 1], color='#a58c5a', lw=1.4)
    if r_['kind'] == 'cobble': ax.plot(p[:, 0], p[:, 1], color='#555', lw=1.1)
ax.plot(*zip(*old), color='#3b78ff', lw=7, alpha=0.85, solid_capstyle='round')
ax.plot(path[:, 0], path[:, 1], color='#2f6bff', lw=7, solid_capstyle='round', label='new river')
ax.plot(path[:, 0], path[:, 1], color='#bcd8ff', lw=1.2)
ax.add_patch(Circle((L['x'], L['z']), L['r'], color='#3b78ff', alpha=0.9)); ax.text(L['x'], L['z'], 'lake\nfishing', ha='center', va='center', color='w', fontsize=10, weight='bold')
for n, x in cross: ax.plot(x[0], x[1], 's', color='#ff9a1f', ms=11, mec='k'); ax.text(x[0] + 4, x[1] - 5, 'bridge', fontsize=7)
for i, x in gates: ax.plot(x[0], x[1], 'D', color='#e0203a', ms=11, mec='k'); ax.text(x[0] + 5, x[1] + 8, 'water gate', fontsize=8, color='#a00')
mk = d['market']; ax.add_patch(Circle((mk['x'], mk['z']), mk['r'], fc='#ffd27a', ec='k', alpha=0.8)); ax.text(mk['x'], mk['z'], 'market', ha='center', fontsize=8)
for v in d['vaults']: ax.plot(v['x'], v['z'], '^', color='#c0392b', ms=9, mec='k')
ax.text(-31, 87, 'church', fontsize=8)
for tg, nm in zip(d['tgates'], ('gate E', 'gate W')): ax.plot(tg['x'], tg['z'], 'o', color='w', mec='k', ms=9); ax.text(tg['x'] + 4, tg['z'], nm, fontsize=8)
ax.text(0, 0, 'Blue Wall\ncitadel', ha='center', va='center', fontsize=11, weight='bold')
ax.text(80, -190, 'river from the\nNE mountains', color='#1a3fb0', fontsize=9, ha='center')
ax.set_xlim(-260, 260); ax.set_ylim(260, -260); ax.set_aspect('equal'); ax.grid(alpha=0.25)
ax.set_title('Blue Wall — the river through the town (plan, top view, north = up)')
plt.tight_layout(); plt.savefig('/home/claude/work/p38_riverplan.png'); print('saved')
