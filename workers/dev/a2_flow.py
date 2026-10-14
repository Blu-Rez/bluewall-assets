# D8 flow accumulation on the real heightmap (north sector): where do the natural gullies come down to the plain?
import sys, numpy as np; sys.path.insert(0,'/home/claude/dev')
from a2_plot import *
from scipy import ndimage
# fill pits crudely: priority-flood is slow in python; use a smoothed copy and iterative min-fill on the sector
x0,x1,z0,z1=-420,160,-620,-120; S=4
i0,i1=int((x0+R)/STEP),int((x1+R)/STEP); j0,j1=int((z0+R)/STEP),int((z1+R)/STEP)
H=Hm[j0:j1,i0:i1].copy(); ny,nx=H.shape
H=ndimage.gaussian_filter(H,1.0)
# priority flood (heapq)
import heapq
filled=np.full(H.shape,np.inf); heap=[]
for j in range(ny):
    for i in range(nx):
        if i in (0,nx-1) or j in (0,ny-1): filled[j,i]=H[j,i]; heapq.heappush(heap,(H[j,i],j,i))
nb=[(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]
done=np.zeros(H.shape,bool)
while heap:
    h,j,i=heapq.heappop(heap)
    if done[j,i]: continue
    done[j,i]=True
    for dj,di in nb:
        jj,ii=j+dj,i+di
        if 0<=jj<ny and 0<=ii<nx and not done[jj,ii]:
            nh=max(H[jj,ii],h+1e-3); 
            if nh<filled[jj,ii]: filled[jj,ii]=nh; heapq.heappush(heap,(nh,jj,ii))
F=filled
# D8 receivers
order=np.argsort(-F.ravel()); acc=np.ones(H.shape)
for k in order:
    j,i=divmod(k,nx); best=None;bd=0
    for dj,di in nb:
        jj,ii=j+dj,i+di
        if 0<=jj<ny and 0<=ii<nx:
            d=(F[j,i]-F[jj,ii])/(np.hypot(dj,di))
            if d>bd: bd=d;best=(jj,ii)
    if best: acc[best]+=acc[j,i]
np.save('/home/claude/work/a2/acc.npy',acc)
# list cells at the plain edge (h between 6 and 14 m, z<-330) with accumulation > 60 cells (= ~1 km2 at 4 m? no: 60*16 m2)
res=[]
for j in range(ny):
    for i in range(nx):
        x=x0+i*STEP; z=z0+j*STEP
        if acc[j,i]>40 and 8<H[j,i]<14 and -480<z<-300 and abs(x+60)<260: res.append((acc[j,i],x,z,H[j,i]))
res.sort(reverse=True); print(len(res)); 
seen=[]
for a,x,z,h in res:
    if all(np.hypot(x-sx,z-sz)>30 for sx,sz in seen): seen.append((x,z)); print('gully foot x=%d z=%d h=%.1f acc=%d ang=%.0f r=%.0f'%(x,z,h,a,np.degrees(np.arctan2(z,x)),np.hypot(x,z)))
    if len(seen)>=12: break
