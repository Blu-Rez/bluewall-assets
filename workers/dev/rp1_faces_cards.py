# pick-screen art v3: the FACE close-up panel of each sheet (4:5), light sharpen
from PIL import Image, ImageFilter
import os
U='/root/.claude/uploads/daf94d1f-e13b-5060-a959-6cccba53caad/'; OUT='/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/'
# key: (file, panel box in sheet px, crop box inside the panel)
P={'melika':('ea2a5e20-image.jpg',(15,760,277,1112),(0,8,262,335)),'elika':('1474800c-image.jpg',(15,780,337,1107),(50,0,312,327)),'aylar':('1b7263a0-image.jpg',(10,962,168,1440),(0,105,158,302)),
   'mobina':('556efd5d-image.jpg',(5,878,150,1390),(0,145,145,326)),'aylin':('c4566363-image.jpg',(3,998,158,1465),(0,90,155,284)),'elina':('32055b8b-image.jpg',(8,925,170,1448),(0,92,162,294))}
W,H=320,400; tiles=[]
for k,(f,pan,cb) in P.items():
    c=Image.open(U+f).convert('RGB').crop(pan).crop(cb).resize((W,H),Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.4,80,2))
    c.save(OUT+'c_'+k+'.webp',quality=88); tiles.append(c); print(k,os.path.getsize(OUT+'c_'+k+'.webp')//1024,'KB')
