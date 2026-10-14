# ld_crownpost.py <render prefix> <out width> : crop the crown render to its alpha bbox, downscale, sharpen, save webp (alpha) + gem sparkle positions into ld_meta.json
import sys, json, os, numpy as np
from PIL import Image, ImageFilter
D = '/home/claude/dev/ld_art/out/'
pre, OWc = sys.argv[1], int(sys.argv[2])
im = Image.open(pre + '_img.png').convert('RGBA')
a = np.asarray(im)[..., 3]
ys, xs = np.where(a > 8)
pad = 0.04
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
pw, ph = (x1 - x0) * pad, (y1 - y0) * pad
x0, x1, y0, y1 = int(max(0, x0 - pw)), int(min(im.width, x1 + pw)), int(max(0, y0 - ph)), int(min(im.height, y1 + ph))
c = im.crop((x0, y0, x1, y1))
# premultiplied resize
arr = np.asarray(c).astype(np.float32) / 255; arr[..., :3] *= arr[..., 3:4]
OH = round(OWc * c.height / c.width)
ch = [np.asarray(Image.fromarray(arr[..., i]).resize((OWc, OH), Image.LANCZOS)) for i in range(4)]
o = np.clip(np.dstack(ch), 0, 1); al = o[..., 3:4]; o[..., :3] = np.where(al > 1e-4, o[..., :3] / np.maximum(al, 1e-4), 0)
rgb = Image.fromarray((np.clip(o[..., :3], 0, 1) * 255 + .5).astype(np.uint8)).filter(ImageFilter.UnsharpMask(radius=1.0, percent=70, threshold=1))
out = Image.merge('RGBA', (*rgb.split(), Image.fromarray((al[..., 0] * 255 + .5).astype(np.uint8))))
out.save(D + 'ld_crown.webp', 'WEBP', quality=int(os.environ.get('Q', 86)), method=6, alpha_quality=85)
gems = json.load(open(pre + '_pts.json')).get('gems', [])
W0, H0 = im.size
g2 = [[round((gx * W0 - x0) / (x1 - x0), 4), round((gy * H0 - y0) / (y1 - y0), 4), k] for gx, gy, gz, k in gems]
meta = json.load(open(D + 'ld_meta.json')) if os.path.exists(D + 'ld_meta.json') else {}
meta['crown'] = {'src': '/pub/ld_crown.webp', 'w': OWc, 'h': OH, 'gems': g2}
json.dump(meta, open(D + 'ld_meta.json', 'w'), indent=0)
print('crown', out.size, os.path.getsize(D + 'ld_crown.webp'), 'gems', len(g2))
if len(sys.argv) > 3:
    bg = Image.new('RGBA', out.size, (10, 24, 56, 255)); bg.alpha_composite(out); bg.convert('RGB').save(sys.argv[3])
