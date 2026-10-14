import json, sys, math
import numpy as np
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, Polygon, Rectangle
d = json.load(open('/tmp/cmp/wsmap.json')); R, st = d['R'], d['st']; g = np.array(d['g'])
extra = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else []
fig, ax = plt.subplots(figsize=(11, 11), dpi=100)
ax.imshow(np.clip(g, -3, 60), extent=[-R, R, R, -R], cmap='terrain', vmin=-3, vmax=60, origin='upper')
ax.contour(np.linspace(-R, R, g.shape[1]), np.linspace(-R, R, g.shape[0]), g, levels=[2, 6, 12, 20, 35], colors='k', linewidths=0.3, alpha=0.5)
ax.add_patch(Polygon(d['town'], fill=False, ec='white', lw=1.5)); ax.add_patch(Polygon(d['outer'], fill=False, ec='white', lw=1.5))
for r in d['roads']:
    p = np.array(r['pts']); ax.plot(p[:, 0], p[:, 1], color='#d9c9a0' if r['kind'] == 'dirt' else '#ffffff', lw=1 if r['kind'] == 'dirt' else 1.6, alpha=0.9)
rv = np.array(d['river']); ax.plot(rv[:, 0], rv[:, 1], color='#3b78ff', lw=3)
L = d['lake']; ax.add_patch(Circle((L['x'], L['z']), L['r'], color='#3b78ff', alpha=0.8))
for F in d['farms']:
    c, s = math.cos(F['rot']), math.sin(F['rot']); pts = [(F['x'] + ox * c + oz * s, F['z'] - ox * s + oz * c) for ox, oz in [(-F['w']/2, -F['d']/2), (F['w']/2, -F['d']/2), (F['w']/2, F['d']/2), (-F['w']/2, F['d']/2)]]
    ax.add_patch(Polygon(pts, fc='#e8d36a', ec='k', lw=0.6, alpha=0.8))
for k, col in (('pasture', '#7fd07f'), ('camp', '#ff9a4d'), ('muster', '#ff4d4d'), ('lair', '#a040c0')):
    Z = d[k]; ax.add_patch(Circle((Z['x'], Z['z']), Z['r'], fc=col, ec='k', alpha=0.45)); ax.text(Z['x'], Z['z'], k, fontsize=8, ha='center')
for M in d['mines']: ax.plot(M['x'], M['z'], 'v', color='#00e5ff' if M['id'] == 'turq' else '#ff3060' if M['id'] == 'ruby' else '#22dd55', ms=12, mec='k'); ax.text(M['x'] + 8, M['z'], M['id'], fontsize=8)
W = d['windmill']; ax.plot(W['x'], W['z'], '*', color='w', ms=12, mec='k'); ax.text(W['x'] + 6, W['z'], 'windmill', fontsize=8)
for H in d['hamlets']: ax.add_patch(Circle((H['x'], H['z']), 14, fc='#8a5a2a', alpha=0.7)); 
for C in d['nomads']: ax.add_patch(Circle((C['x'], C['z']), 12, fc='#222', alpha=0.7))
if d.get('stable'): ax.plot(d['stable']['x'], d['stable']['z'], 's', color='#c08040', ms=9, mec='k')
for e in extra:
    ax.add_patch(Circle((e['x'], e['z']), e.get('r', 10), fc=e.get('c', 'magenta'), ec='k', alpha=0.85)); ax.text(e['x'] + e.get('r', 10) + 2, e['z'], e['n'], fontsize=8, color='k', bbox=dict(fc='white', alpha=0.7, pad=0.5))
ax.set_xlim(-R, R); ax.set_ylim(R, -R); ax.set_aspect('equal'); ax.grid(alpha=0.2)
plt.tight_layout(); plt.savefig(sys.argv[1]); print('saved', sys.argv[1])
