# builds the pick-screen art from the owner's six character sheets: the front-view figure cut free of the sheet text (inpainted with the sheet's own background) + the element emblem
import numpy as np, os
from PIL import Image, ImageFilter
from scipy import ndimage as ndi
U='/root/.claude/uploads/daf94d1f-e13b-5060-a959-6cccba53caad/'; OUT='/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/'
S={ # key: (file, seed(x,y), search window x0,y0,x1,y1, emblem box, accent)
 'melika':('ea2a5e20-image.jpg',(315,330),(120,0,490,740),(28,255,155,505),(127,224,106)),
 'elika':('1474800c-image.jpg',(330,340),(150,40,500,770),(20,215,145,300),(159,232,255)),
 'aylar':('1b7263a0-image.jpg',(330,420),(150,0,480,900),(45,225,130,325),(207,238,255)),
 'mobina':('556efd5d-image.jpg',(300,300),(120,0,470,830),(22,215,152,312),(240,166,102)),
 'aylin':('c4566363-image.jpg',(280,520),(40,30,455,975),(35,248,112,355),(79,176,255)),
 'elina':('32055b8b-image.jpg',(300,330),(0,0,480,880),(38,282,128,412),(255,106,58)),
}
W,H=360,720; tiles=[]
for k,(f,seed,win,eb,ac) in S.items():
    im=Image.open(U+f).convert('RGB'); a=np.asarray(im).astype(np.float32); h,w,_=a.shape
    L=np.median(a[:,0:5],axis=1); R=np.median(a[:,w-5:w],axis=1); t=np.linspace(0,1,w)[None,:,None]
    bg=L[:,None,:]*(1-t)+R[:,None,:]*t                                         # the sheet's own smooth backdrop
    diff=np.abs(a-bg).max(axis=2); fg=diff>26; fg[960:]=False
    x0,y0,x1,y1=win; m=np.zeros_like(fg); m[y0:y1,x0:x1]=fg[y0:y1,x0:x1]
    m=ndi.binary_closing(m,iterations=2); lab,n=ndi.label(ndi.binary_dilation(m,iterations=3)); keep=lab==lab[seed[1],seed[0]]
    keep=ndi.binary_fill_holes(keep)&ndi.binary_dilation(m,iterations=1)|(keep&m); keep=ndi.binary_fill_holes(keep)
    al=ndi.gaussian_filter(keep.astype(np.float32),0.9)[...,None]
    clean=a*al+bg*(1-al)
    ys,xs=np.where(keep); bx0,bx1,by0,by1=xs.min(),xs.max(),ys.min(),ys.max()
    cx=(bx0+bx1)/2; hh=max((by1-by0)*1.07, (bx1-bx0)*1.1*2); ww=hh*W/H; cy=(by0+by1)/2
    X0=int(round(cx-ww/2)); Y0=int(round(cy-hh/2)); X1=int(round(cx+ww/2)); Y1=int(round(cy+hh/2))
    pad=np.pad(clean,((max(0,-Y0),max(0,Y1-h)),(max(0,-X0),max(0,X1-w)),(0,0)),mode='edge'); X0p=X0+max(0,-X0); Y0p=Y0+max(0,-Y0)
    crop=pad[Y0p:Y0p+(Y1-Y0),X0p:X0p+(X1-X0)]
    out=Image.fromarray(np.clip(crop,0,255).astype(np.uint8)).resize((W,H),Image.LANCZOS); out.save(OUT+'c_'+k+'.webp',quality=84)
    # emblem: dark ink on the sheet -> glowing accent colour with alpha
    ex0,ey0,ex1,ey1=eb; e=a[ey0:ey1,ex0:ex1]; ebg=bg[ey0:ey1,ex0:ex1]; ea=np.clip((np.abs(e-ebg).max(axis=2)-14)/70,0,1)**0.8
    ys2,xs2=np.where(ea>0.25); ea=ea[ys2.min():ys2.max()+1,xs2.min():xs2.max()+1]
    rgba=np.zeros(ea.shape+(4,),np.uint8); rgba[...,0],rgba[...,1],rgba[...,2]=ac; rgba[...,3]=(ea*255).astype(np.uint8)
    em=Image.fromarray(rgba,'RGBA'); s=96/max(em.size); em=em.resize((max(1,round(em.width*s)),max(1,round(em.height*s))),Image.LANCZOS); em.save(OUT+'e_'+k+'.png',optimize=True)
    tiles.append((out,em,ac)); print(k,'figure bbox',bx0,by0,bx1,by1,'cardKB',os.path.getsize(OUT+'c_'+k+'.webp')//1024,'emblemB',os.path.getsize(OUT+'e_'+k+'.png'))
m=Image.new('RGB',(W*6,H),(10,16,24))
for i,(o,em,ac) in enumerate(tiles):
    m.paste(o,(i*W,0)); m.paste(em,(i*W+10,10),em)
m.save('/home/claude/work/rp1/cards_check.png')
