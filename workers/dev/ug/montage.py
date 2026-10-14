import sys, os
from PIL import Image, ImageDraw
# usage: montage.py out.png cols label=file ...   (tiles screenshots, labels in the corner)
out, cols = sys.argv[1], int(sys.argv[2]); items = [a.split('=', 1) for a in sys.argv[3:]]
ims = [(l, Image.open(f).convert('RGB')) for l, f in items]
S = float(os.environ.get('S', 1)); C = os.environ.get('C')
if C: x0, y0, x1, y1 = [float(v) for v in C.split(',')]; ims = [(l, im.crop((int(x0 * im.width), int(y0 * im.height), int(x1 * im.width), int(y1 * im.height)))) for l, im in ims]
if S != 1: ims = [(l, im.resize((int(im.width * S), int(im.height * S)), Image.LANCZOS)) for l, im in ims]
w, h = ims[0][1].size; rows = (len(ims) + cols - 1) // cols
M = Image.new('RGB', (cols * w, rows * h), (20, 20, 24)); d = ImageDraw.Draw(M)
for i, (l, im) in enumerate(ims):
    x, y = (i % cols) * w, (i // cols) * h; M.paste(im, (x, y)); d.rectangle([x + 4, y + 4, x + 8 + 7 * len(l), y + 20], fill=(0, 0, 0)); d.text((x + 6, y + 6), l, fill=(255, 255, 255))
M.save(out); print(out, M.size)
