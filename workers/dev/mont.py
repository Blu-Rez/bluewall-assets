import sys
from PIL import Image
out=sys.argv[1]; files=sys.argv[2:]
ims=[Image.open(f).convert('RGB') for f in files]
w,h=ims[0].size; cols=2 if len(ims)>1 else 1; rows=(len(ims)+cols-1)//cols
sc=0.62 if w>700 else 1.0
tw,th=int(w*sc),int(h*sc)
M=Image.new('RGB',(tw*cols,th*rows))
for i,im in enumerate(ims): M.paste(im.resize((tw,th)),((i%cols)*tw,(i//cols)*th))
M.save(out)
