import json,sys
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
d=json.load(open('/tmp/cmp/m3.json'))
names=sys.argv[1].split(',') if len(sys.argv)>1 else list(d)
fig,axs=plt.subplots(1,len(names),figsize=(7*len(names),6))
if len(names)==1: axs=[axs]
PL=[[0,-92,84],[60,-92,78],[80,-92,60],[100,-88,30],[112,-76,14],[130,-60,0]]
for ax,nm in zip(axs,names):
    R=d[nm]['rings']
    for t,r in R.items():
        ax.add_patch(plt.Circle((r['cx'],r['cz']),r['r'],fill=False,lw=1.5))
        for p in d[nm]['pos'][t]: ax.plot(p[0],p[1],'k.',ms=1.5)
        ax.text(r['cx'],r['cz'],t[:6],ha='center',va='center',fontsize=7)
    ax.plot([p[1] for p in PL],[p[0] for p in PL],'r-'); ax.plot([p[2] for p in PL],[p[0] for p in PL],'r-')
    ax.set_xlim(-110,100); ax.set_ylim(150,-10); ax.set_aspect('equal'); ax.set_title(nm); ax.grid(alpha=.3)
plt.tight_layout(); plt.savefig('/home/claude/work/ringmap.png',dpi=70)
