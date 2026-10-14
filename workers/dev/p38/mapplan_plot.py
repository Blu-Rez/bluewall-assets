import json, numpy as np, matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
D=json.load(open('/tmp/cmp/mapplan.json')); S=D['S']; H=np.array(D['H']); F=np.array(D['F'])
fig,ax=plt.subplots(figsize=(13,13))
ax.imshow(H,extent=[-S,S,-S,S],origin='lower',cmap='terrain',vmin=-4,vmax=60,alpha=0.9)
ax.contourf(np.linspace(-S,S,H.shape[1]),np.linspace(-S,S,H.shape[0]),F,levels=[0.35,2],colors=['#0a3d0a'],alpha=0.45)
for r in D['roads']:
    p=np.array(r['p']); ax.plot(p[:,0],p[:,1],'-',c='#e8d8a8' if r['k']!='dirt' else '#b09060',lw=1.6)
t=np.array(D['town']+[D['town'][0]]); ax.plot(t[:,0],t[:,1],'k-',lw=2)
o=np.array(D['outer']+[D['outer'][0]]); ax.plot(o[:,0],o[:,1],'k-',lw=2)
rv=np.array(D['river']); ax.plot(rv[:,0],rv[:,1],'-',c='#1e6fd0',lw=3)
L=D['lake']; ax.add_patch(plt.Circle((L['x'],L['z']),L['r'],color='#1e6fd0',alpha=.7))
for m in D['mines']: ax.plot(m['x'],m['z'],'r^',ms=12); ax.text(m['x'],m['z'],m['id'],color='r')
for k,c in [('pasture','g'),('camp','m'),('muster','c'),('lair','r')]:
    z=D[k]; ax.add_patch(plt.Circle((z['x'],z['z']),z.get('fr',z['r']),fill=False,ec=c,ls='--')); ax.text(z['x'],z['z'],k,color=c)
for f in D['farms']: ax.plot(f['x'],f['z'],'ys',ms=10)
ax.plot(D['windmill']['x'],D['windmill']['z'],'wo',mec='k',ms=8)
for h in D['ham']: ax.plot(h['x'],h['z'],'o',c='#ff8800',ms=7)
for h in D['nom']: ax.plot(h['x'],h['z'],'*',c='#ff00aa',ms=9)
ax.add_patch(plt.Circle((0,0),D['mount'],fill=False,ec='k',ls=':'))
import os
if os.path.exists('/tmp/cmp/wsplan.json'):
    for w in json.load(open('/tmp/cmp/wsplan.json')):
        ax.plot(w['x'],w['z'],'o',c='white',mec='k',ms=11,zorder=9); ax.text(w['x']+5,w['z']+5,w['kind']+(':'+w['variant'] if 'variant' in w else ''),color='k',fontsize=9,weight='bold',zorder=10)
        ax.plot([w['x'],w['link'][0]],[w['z'],w['link'][1]],'--',c='k',lw=1)
ax.set_xlim(-S,S); ax.set_ylim(-S,S); ax.set_aspect('equal'); ax.grid(alpha=.25)
ax.set_xticks(range(-500,501,100)); ax.set_yticks(range(-500,501,100))
plt.tight_layout(); plt.savefig('/home/claude/work/p38_mapplan.png',dpi=70)
