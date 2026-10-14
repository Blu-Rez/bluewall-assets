import sys, numpy as np; sys.path.insert(0, '/home/claude/dev')
from a2_plot import *
acc=np.load('/home/claude/work/a2/acc.npy'); x0a,z0a=-420,-620
x0, x1, z0, z1, S = -330, 130, -540, -120, 3.0
im, hh = base_image(x0, x1, z0, z1, S)
draw_base_overlays(im, x0, z0, S)
d = ImageDraw.Draw(im, 'RGBA')
ny,nx=acc.shape
for j in range(ny):
    for i in range(nx):
        a=acc[j,i]
        if a>60:
            x=x0a+i*STEP; z=z0a+j*STEP; cx,cy=(x-x0)*S,(z-z0)*S
            if 0<=cx<im.size[0] and 0<=cy<im.size[1]:
                w=1+min(3,np.log10(a)-1.2); d.ellipse([cx-w,cy-w,cx+w,cy+w],fill=(0,220,255,200))
im.save('/home/claude/work/a2/north_acc.png')
