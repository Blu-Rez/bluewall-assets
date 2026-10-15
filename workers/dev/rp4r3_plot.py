#!/usr/bin/env python3
# rp4r3_plot.py — RP4_R3: proof pictures from the measurements on the real game.
#   topdown (8 directions, before dashed / after solid, a dot every 0.05 s), wall (stop-at-wall case in the wall's own frame), speed (speed curve), film (side filmstrip before / after)
import json, math, sys
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Circle
from PIL import Image, ImageDraw
O = '/home/claude/work/rp4r3/'
OUT = O + 'proof/'
def L(p): return json.load(open(O + 'out/' + p))
bef, aft = L('before2_home.json'), L('after4_home.json')
def roll_pts(d):                      # trace until the roll ends (state != dodge), screen coords: right = -x, up = +z (camera looks along +z)
    pts = [(0.0, 0.0, 0.0)]
    for t, x, z, st, v, b in d['trace']:
        pts.append((t, -x, z))
        if st != 'dodge': break
    return pts
# 1. top-down, 8 directions
fig, ax = plt.subplots(figsize=(8.4, 8.4), dpi=130)
for r, c in ((2.6, '#2a9d8f'), (3.2, '#2a9d8f')): ax.add_patch(Circle((0, 0), r, fill=False, ls=':', lw=1.2, color=c))
cols = plt.cm.tab10.colors
for k, (db, da) in enumerate(zip(bef['dirs'], aft['dirs'])):
    pb, pa = roll_pts(db), roll_pts(da)
    ax.plot([p[1] for p in pb], [p[2] for p in pb], '--', color='#555', lw=1.3, zorder=2, label='before: ~2.3 m (x = where it ended)' if k == 0 else None)
    ax.plot(pb[-1][1], pb[-1][2], 'x', color='#555', ms=7, mew=2, zorder=4)
    ax.plot([p[1] for p in pa], [p[2] for p in pa], '-o', color=cols[k], lw=1.6, ms=2.8, zorder=3)
    ax.annotate('%d°' % (k * 45), (pa[-1][1] * 1.09, pa[-1][2] * 1.09), ha='center', va='center', fontsize=9, color=cols[k], weight='bold')
ax.plot(0, 0, 'k*', ms=12, zorder=5); ax.plot([], [], '-o', color='#1f77b4', ms=3, label='after: 2.90 m'); ax.legend(loc='lower left', fontsize=8)
ax.set_aspect('equal'); ax.set_xlim(-3.7, 3.7); ax.set_ylim(-3.7, 3.7); ax.grid(alpha=0.25)
ax.set_xlabel('screen right (m)'); ax.set_ylabel('away from the camera (m)')
ax.set_title('RP4_R3 roll, top-down, 8 stick directions, dot every 0.05 s\nsolid = after (2.90 m, ends at 0.14 m/s)  ·  dashed grey = before (2.31 m, ends at 1.5 m/s)  ·  dotted rings 2.6 / 3.2 m = the asked range', fontsize=9)
fig.tight_layout(); fig.savefig(OUT + 'rp4r3_topdown_8dir.png'); plt.close(fig)
# 2. speed curve
fig, ax = plt.subplots(figsize=(8.4, 3.6), dpi=130)
for d, c, ls, lab in ((bef['dirs'][0], '#999', '--', 'before'), (aft['dirs'][0], '#e76f51', '-', 'after')):
    tr = [q for q in d['trace']]; t = [0.0] + [q[0] for q in tr]; v = [d['v0']] + [q[4] for q in tr]
    n = next((i for i, q in enumerate(tr) if q[3] != 'dodge'), len(tr)); ax.plot(t[:n + 1], v[:n + 1], ls, color=c, lw=2, label=lab + ' (%.2f m)' % d['dist'])
ax.axvspan(0.04, 0.34, color='#2a9d8f', alpha=0.12, label='i-frames 0.04–0.34 s (unchanged)')
ax.set_xlabel('time since the press (s)'); ax.set_ylabel('speed (m/s)'); ax.grid(alpha=0.25); ax.legend(fontsize=8); ax.set_title('roll speed curve, real game (home map)', fontsize=10)
fig.tight_layout(); fig.savefig(OUT + 'rp4r3_speed.png'); plt.close(fig)
# 3. wall case, in the wall's own frame (along the wall = horizontal axis, across = vertical)
wb, wa = L('before_wall.json'), L('after_wall2.json'); W = wa['wall']
def loc(x, z): dx, dz = x - W['x'], z - W['z']; return dx * W['ux'] + dz * W['uz'], dx * W['vx'] + dz * W['vz']
COL = {(0, 3.0): '#e76f51', (0, 1.2): '#264653', (45, 3.0): '#2a9d8f', (-45, 3.0): '#9b5de5', (45, 1.2): '#f4a261', (-45, 1.2): '#c1121f', (70, 1.2): '#0077b6'}
fig, axs = plt.subplots(1, 2, figsize=(12, 5.4), dpi=130, sharey=True)
for ax, side in zip(axs, (1, -1)):
    allx = []
    for ca in wa['cases']:
        if ca['side'] != side: continue
        cb = next((c for c in wb['cases'] if c['name'] == ca['name']), None); col = COL[(ca['ang'], ca['d'])]
        if cb:
            p = [loc(q[1], q[2]) for q in cb['trace']]; ax.plot([q[0] for q in p], [q[1] for q in p], '--', color='#777', lw=1.0)
        p = [loc(q[1], q[2]) for q in ca['trace']]; allx += [q[0] for q in p]
        ax.plot([q[0] for q in p], [q[1] for q in p], '-o', color=col, lw=1.4, ms=2.5, label='%d°, start %.1f m from the face: %.2f m, min gap %.2f' % (ca['ang'], ca['d'], ca['rollDist'], ca['minGap']))
    ax.add_patch(Rectangle((-W['hw'], -W['hd']), 2 * W['hw'], 2 * W['hd'], color='#6c757d', alpha=0.75, zorder=1))
    ax.add_patch(Rectangle((-W['hw'], -W['hd'] - 0.5), 2 * W['hw'], 2 * (W['hd'] + 0.5), fill=False, ls=':', color='#c1121f', lw=1))
    cx = 0.5 * (min(allx) + max(allx)); ax.set_xlim(cx - 4.6, cx + 4.6); ax.set_ylim(-8.2, 8.2); ax.set_aspect('equal'); ax.grid(alpha=0.25)
    ax.set_title('side %s of the longest wall (%.0f m long, 3.8 m thick, h %.1f m)' % ('A' if side > 0 else 'B', 2 * W['hw'], W['h']), fontsize=9); ax.set_xlabel('along the wall (m)'); ax.legend(fontsize=6.5, loc='upper center' if side < 0 else 'lower center')
axs[0].set_ylabel('across the wall (m)')
fig.suptitle('RP4_R3 roll against the longest wall, stick held: solid = after (the old 2.31 m roll, dashed grey, lies under it and never reached the wall from 3 m); red dotted = wall + 0.5 m body radius, nothing ever goes inside it', fontsize=9)
fig.tight_layout(); fig.savefig(OUT + 'rp4r3_wall.png'); plt.close(fig)
# 4. side filmstrip: 5 frames x 2 rows (before / after), each frame cropped to its middle band; annotated with t and hero metres
sb, sa = json.load(open(O + 'shots/before_side.json')), json.load(open(O + 'shots/after_side.json'))
pick = [0, 2, 4, 6, 9]
W2, H2 = 844, 390; cw, ch = W2 // 2 + 150, 300; y0 = 60
rows = []
for lab, s in (('BEFORE', sb), ('AFTER', sa)):
    row = Image.new('RGB', (cw * len(pick), ch + 22), (20, 20, 24)); dr = ImageDraw.Draw(row)
    for j, i in enumerate(pick):
        im = Image.open(s[i]['file']).convert('RGB').crop((W2 // 2 - cw // 2 - 30, y0, W2 // 2 + cw // 2 - 30, y0 + ch)); row.paste(im, (j * cw, 22))
        dr.text((j * cw + 6, 5), '%s  t=%.2fs  rolled %.2f m  (%s)' % (lab, s[i]['t'], math.hypot(s[i]['x'], s[i]['z']), s[i]['st']), fill=(255, 255, 255))
    rows.append(row)
film = Image.new('RGB', (rows[0].width, sum(r.height for r in rows) + 4), (0, 0, 0)); y = 0
for r in rows: film.paste(r, (0, y)); y += r.height + 4
film.save(OUT + 'rp4r3_film_side.png'); print('film', film.size)
print('done')
