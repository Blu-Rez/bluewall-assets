#!/bin/bash
# LD1b test: loader sword picture + mask (sizes, 1400x300, b0/b1 consistent with the mask, hilt margins, credits). Prints "LD1 OK".
python3 -I - <<'PY'
import re, json, os, sys
import numpy as np
from PIL import Image
W='/home/claude/bot/bluebot_v2/bluewall/web'; bad=[]
def chk(c,m):
    if not c: bad.append(m)
sw=W+'/pub/ld_sword.webp'; mk=W+'/pub/ld_sword_m.webp'
chk(os.path.exists(sw) and os.path.exists(mk),'files missing')
tot=os.path.getsize(sw)+os.path.getsize(mk); chk(tot<=60*1024,f'total {tot} B > 60 KB')
im=Image.open(sw); m=Image.open(mk); chk(im.size==(1400,300) and m.size==(1400,300),f'size {im.size} {m.size}')
a=np.asarray(im.convert('RGBA'))[...,3].astype(float)/255; ma=np.asarray(m.convert('RGBA'))[...,3].astype(float)/255
chk(a[:, :6].max()==0,'left 6 columns not empty'); chk(a[:3].max()==0 and a[-3:].max()==0,'top/bottom 3 rows not empty')
ys,xs=np.where(a>0.05); chk(xs.min()>=8 and ys.min()>=8 and ys.max()<=291,f'hilt margin: x0={xs.min()} y0={ys.min()} y1={ys.max()}')
html=open(W+'/index.html',encoding='utf-8').read()
g=re.search(r"SW = \{ src: '/pub/ld_sword\.webp\?v=(\d+)', w: 1400, h: 300, b0: ([0-9.]+), b1: ([0-9.]+) \}",html); chk(g,'SW constants not found')
mv=re.findall(r'/pub/ld_sword_m\.webp\?v=(\d+)',html); chk(len(mv)==2 and len(set(mv))==1,'mask ?v= urls')
if g:
    b0,b1=float(g.group(2)),float(g.group(3)); css=re.findall(r'#ld-sw (?:\.lit i|\.lit b|\.sp)\{[^}]*?left:([0-9.]+)%',html); chk(len(css)==3 and all(abs(float(c)-b0*100)<0.011 for c in css),f'css left {css} != b0 {b0}'); chk(0.2<=b0<=0.4,'b0 out of range')
    # tip of the mask silhouette on the blade axis (rows 140..160)
    cols=np.where(ma[140:160].max(0)>0.5)[0]; tip=cols.max()/1400
    chk(abs(b1-tip)<0.004,f'b1 {b1} vs mask tip {tip:.4f}')
    chk(not any(abs(x-311)<0 for x in []),'')
    # blade continuous on the axis from the guard (311) to the tip, horizontal around y=150
    ax=ma[135:165,int(b0*1400):int(b1*1400)-2].max(0); chk(ax.min()>0.5,'blade axis broken in the mask')
    cy=[np.where(ma[:,x]>0.5)[0].mean() for x in range(int(b0*1400)+60,int(b1*1400)-20,10)]; chk(abs(np.mean(cy)-150)<6,f'blade not centred: {np.mean(cy):.1f}')
    chk(int(g.group(1))>=8 and int(mv[0])>=7,'?v= not bumped')
c=json.load(open(W+'/assets/credits.json',encoding='utf-8'))['items']; chk(any(i.get('name')=='Gradient Fantasy Sword' and i.get('by','').startswith('Miko') for i in c),'credits item missing')
if bad: print('LD1 FAIL:',*bad,sep='\n  '); sys.exit(1)
print(f'LD1 OK  (total {tot} B, tip {tip:.4f}, margins x0={xs.min()} y0={ys.min()} y1={ys.max()})')
PY
