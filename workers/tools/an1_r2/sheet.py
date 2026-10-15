import sys
from PIL import Image
def sheet(prefix, n, out, cols=3, crop=None):
    ims=[Image.open('%s_%d.png'%(prefix,i)) for i in range(n)]
    if crop: ims=[im.crop(crop) for im in ims]
    W,H=ims[0].size; rows=(n+cols-1)//cols; s=Image.new('RGB',(W*cols,H*rows))
    for i,im in enumerate(ims): s.paste(im,((i%cols)*W,(i//cols)*H))
    s.save(out); return s.size
if __name__=='__main__': print(sheet(sys.argv[1],int(sys.argv[2]),sys.argv[3]))
