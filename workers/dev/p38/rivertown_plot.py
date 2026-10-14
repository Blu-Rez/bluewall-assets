import json, numpy as np, matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon, Circle
d = json.load(open('/tmp/cmp/wsmap.json')); r = json.load(open('/tmp/cmp/rivertown.json'))
fig, ax = plt.subplots(figsize=(10,10), dpi=100)
ax.add_patch(Polygon(d['town'], fill=False, ec='k', lw=2.5)); ax.add_patch(Polygon(d['outer'], fill=False, ec='k', lw=2.5))
for q in d['roads']:
    p=np.array(q['pts'])
    if q['kind']=='cobble': ax.plot(p[:,0],p[:,1],color='#666',lw=1.2)
    elif not q['name'].startswith('hamlet'): ax.plot(p[:,0],p[:,1],color='#a58c5a',lw=1)
f=np.array(r['full']); ax.plot(f[:,0],f[:,1],color='#2f6bff',lw=9,alpha=.9,solid_capstyle='round'); ax.plot(f[:,0],f[:,1],'.',color='w',ms=3)
L=d['lake']; ax.add_patch(Circle((L['x'],L['z']),L['r'],color='#3b78ff'))
for b in r['bridges']: ax.plot(b['x'],b['z'],'s',color='#ff9a1f',mec='k',ms=10); ax.text(b['x']+4,b['z']-4,b['road'],fontsize=7)
for w in r['wall']: ax.plot(w['x'],w['z'],'D',color='#e0203a',mec='k',ms=10)
ax.set_xlim(-250,250); ax.set_ylim(250,-250); ax.set_aspect('equal'); ax.grid(alpha=.25)
plt.tight_layout(); plt.savefig('/home/claude/work/p38_rivertown_check.png')
