import sys
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src); W, H = im.size
for k, n in enumerate(['side', 'q']):
    r = im.crop((0, k * H // 2, W, (k + 1) * H // 2)); r.thumbnail((2000, 700)); r.save('%s_%s.png' % (out, n))
