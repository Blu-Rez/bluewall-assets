import sys
from PIL import Image
out=sys.argv[1]; files=sys.argv[2:]
ims=[Image.open(f).convert("RGB") for f in files]
w,h=ims[0].size; cols=min(len(ims),5); rows=(len(ims)+cols-1)//cols
M=Image.new("RGB",(w*cols,h*rows))
for i,im in enumerate(ims): M.paste(im,((i%cols)*w,(i//cols)*h))
M.save(out)
