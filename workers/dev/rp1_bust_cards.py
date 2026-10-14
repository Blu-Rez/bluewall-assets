# pick-screen art v4: BUST (head to waist) of the front-view figure, cut free of the sheet text, 4:5
import numpy as np, os
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
U='/root/.claude/uploads/daf94d1f-e13b-5060-a959-6cccba53caad/'; OUT='/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/'
S={ # key: (file, seed, search window, bust box x0,y0,x1,y1 in sheet px (4:5))
 'melika':('ea2a5e20-image.jpg',(315,330),(120,0,490,740),(183,8,447,338)),
 'elika':('1474800c-image.jpg',(330,340),(150,40,500,770),(198,28,462,358)),
 'aylar':('1b7263a0-image.jpg',(330,420),(150,0,480,900),(178,22,458,372)),
 'mobina':('556efd5d-image.jpg',(300,300),(120,0,470,830),(170,38,442,378)),
 'aylin':('c4566363-image.jpg',(280,520),(40,30,455,975),(147,40,443,410)),
 'elina':('32055b8b-image.jpg',(300,330),(0,0,480,880),(168,26,448,376)),
}
W,H=320,400; tiles=[]
for k,(f,seed,win,box) in S.items():
    im=Image.open(U+f).convert('RGB'); a=np.asarray(im).astype(np.float32); h,w,_=a.shape
    L=np.median(a[:,0:5],axis=1); R=np.median(a[:,w-5:w],axis=1); t=np.linspace(0,1,w)[None,:,None]; bg=L[:,None,:]*(1-t)+R[:,None,:]*t
    fg=np.abs(a-bg).max(axis=2)>26; fg[960:]=False
    x0,y0,x1,y1=win; m=np.zeros_like(fg); m[y0:y1,x0:x1]=fg[y0:y1,x0:x1]
    m=ndi.binary_closing(m,iterations=2); lab,n=ndi.label(ndi.binary_dilation(m,iterations=3)); keep=lab==lab[seed[1],seed[0]]
    keep=ndi.binary_fill_holes(keep)&ndi.binary_dilation(m,iterations=1)|(keep&m); keep=ndi.binary_fill_holes(keep)
    al=ndi.gaussian_filter(keep.astype(np.float32),0.9)[...,None]; clean=a*al+bg*(1-al)
    X0,Y0,X1,Y1=box; crop=clean[Y0:Y1,X0:X1]
    out=Image.fromarray(np.clip(crop,0,255).astype(np.uint8)).resize((W,H),Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.2,60,2))
    out.save(OUT+'c_'+k+'.webp',quality=88); tiles.append(out); print(k,os.path.getsize(OUT+'c_'+k+'.webp')//1024,'KB')
m=Image.new('RGB',(W*6+50,H+10),(10,16,24)); [m.paste(t,(i*(W+10),5)) for i,t in enumerate(tiles)]; m.save('/home/claude/work/rp1/bust_check.png')
