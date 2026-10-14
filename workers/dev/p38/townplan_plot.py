import json, math, numpy as np, matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Circle
d = json.load(open('/tmp/cmp/wsmap.json')); t = json.load(open('/tmp/cmp/townplan.json'))
fig, ax = plt.subplots(figsize=(11,11), dpi=100)
ax.add_patch(Polygon(d['town'], fill=False, ec='k', lw=2)); ax.add_patch(Polygon(d['outer'], fill=False, ec='k', lw=2))
for q in d['roads']:
    p=np.array(q['pts'])
    if q['kind']=='cobble': ax.plot(p[:,0],p[:,1],color='#777',lw=max(1,q['w']*0.9))
rv=np.array(d['river']); ax.plot(rv[:,0],rv[:,1],color='#3b78ff',lw=9,alpha=.8)
for h in t['houses']:
    c,s=math.cos(h['ry']),math.sin(h['ry'])
    pts=[(h['x']+lx*c+lz*s,h['z']-lx*s+lz*c) for lx,lz in [(-h['w']/2,-h['d']/2),(h['w']/2,-h['d']/2),(h['w']/2,h['d']/2),(-h['w']/2,h['d']/2)]]
    ax.add_patch(Polygon(pts,fc='#c97' if h['kind']=='house' else '#a55',ec='k',lw=.4))
for v in t['vaults']: ax.add_patch(Circle((v['x'],v['z']),v['r'],fc='#e44',alpha=.4,ec='k')); ax.text(v['x'],v['z'],v['id'][:2],ha='center')
m=t['market']; ax.add_patch(Circle((m['x'],m['z']),m['r'],fc='#fc8',alpha=.6,ec='k'))
for x,z in t['trees']: ax.plot(x,z,'g.',ms=4)
ax.set_xlim(-190,190); ax.set_ylim(190,-190); ax.set_aspect('equal'); ax.grid(alpha=.3, which='both'); ax.set_xticks(range(-180,181,20)); ax.set_yticks(range(-180,181,20))
plt.tight_layout(); plt.savefig('/home/claude/work/p38_townplan.png')
