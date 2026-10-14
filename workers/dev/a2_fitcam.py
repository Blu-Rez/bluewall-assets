# fit the owner's camera (azim, target, dist, polar) to landmarks read off his screenshot (1999x923 scale)
import numpy as np, math
from scipy.optimize import least_squares
W,H=1999,923; fov=math.radians(52); f=(H/2)/math.tan(fov/2)
ring=lambda a,r:(math.cos(math.radians(a))*r*1.2, math.sin(math.radians(a))*r*1.2)
A=[(11.6,132),(41.6,132),(72,140),(102,128),(133,142),(163,134),(194,140),(224,130),(254,142),(284,132),(314,138),(344,130)]
C=[ring(a,r) for a,r in A]
# T0 = mid of seg 0
T0=((C[0][0]+C[1][0])/2,(C[0][1]+C[1][1])/2)
LM=[ (C[0],12,(1320,590)), (C[1],12,(870,595)), (C[2],12,(560,490)), (C[3],12,(605,385)), (C[4],12,(672,318)), (C[10],12,(1675,420)), (C[11],12,(1590,525)), (T0,3,(1085,650)) ]
def cam(p):
    az,tx,tz,d,pol=p
    T=np.array([tx,2.5,tz]); u=np.array([math.sin(az),0,math.cos(az)])
    Cp=T+np.array([d*math.sin(pol)*u[0], d*math.cos(pol), d*math.sin(pol)*u[2]])
    fw=T-Cp; fw/=np.linalg.norm(fw); rt=np.array([-fw[2],0,fw[0]]); rt/=np.linalg.norm(rt); up=np.cross(rt,fw)
    return Cp,fw,rt,up
def proj(p,x,y,z):
    Cp,fw,rt,up=cam(p); d=np.array([x,y,z])-Cp; zc=d@fw
    return W/2+f*(d@rt)/zc, H/2-f*(d@up)/zc
def res(p):
    r=[]
    for (x,z),y,(px,py) in LM:
        u,v=proj(p,x,y,z); r+= [u-px,v-py]
    return r
best=None
for az in np.linspace(0.6,1.8,7):
  for d in (200,240,280,320):
    for pol in (1.0,1.15,1.25,1.35):
      s=least_squares(res,[az,20,10,d,pol],bounds=([0,-200,-200,80,0.5],[3.2,200,200,600,1.5]))
      if best is None or s.cost<best.cost: best=s
print('cost',best.cost,'params az=%.3f tx=%.1f tz=%.1f dist=%.1f polar=%.3f'%tuple(best.x))
for ((x,z),y,(px,py)),i in zip(LM,range(99)):
    u,v=proj(best.x,x,y,z); print(i,'want',(px,py),'got',(round(u),round(v)))
np.save('/home/claude/work/a2/cam_fit.npy',best.x)
