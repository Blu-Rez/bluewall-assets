# ld_dragon.py <src dragon.webp> <out.webp> [preview.png] : bake moon rim light + cool outer glow into the loader dragon (no runtime CSS filters)
import sys, numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter, shift as nshift
src, dst = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGBA')).astype(np.float32) / 255
P = 36
H, W = im.shape[0] + 2 * P, im.shape[1] + 2 * P
rgba = np.zeros((H, W, 4), np.float32); rgba[P:P + im.shape[0], P:P + im.shape[1]] = im
a = rgba[..., 3]; rgb = rgba[..., :3]
# rim: inside pixels whose neighbourhood toward the moon (upper-left) is empty
rim = np.zeros_like(a)
for d, k in ((2.0, .55), (4.0, .3), (7.0, .15)):
    sh = nshift(a, (d * 0.8, d * 0.6), order=1, mode='constant')     # content moved down-right → compare with up-left neighbour
    rim += k * np.clip(a - sh, 0, 1)
rim = gaussian_filter(rim, 0.7) * a
# opposite side: faint cool bounce
rim2 = np.clip(a - nshift(a, (-2.5, -2.0), order=1, mode='constant'), 0, 1) * a
rimc = np.array([0.80, 0.92, 1.0]); bounce = np.array([0.25, 0.45, 0.9])
lit = rgb * 1.08 + 0.02 + rim[..., None] * rimc * 1.25 + rim2[..., None] * bounce * 0.35
lit = np.clip(lit, 0, 1)
# outer glow (behind)
g = gaussian_filter(a, 9) * 0.5 + gaussian_filter(a, 22) * 0.3
gc = np.array([0.28, 0.6, 1.0])
out_a = a + g * (1 - a) * 0.75
out_rgb = (lit * a[..., None] + gc * (g * (1 - a) * 0.75)[..., None]) / np.maximum(out_a[..., None], 1e-4)
o = np.dstack([np.clip(out_rgb, 0, 1), np.clip(out_a, 0, 1)])
img = Image.fromarray((o * 255 + .5).astype(np.uint8), 'RGBA')
img.save(dst, 'WEBP', quality=84, method=6, alpha_quality=80)
print(img.size)
if len(sys.argv) > 3:
    bg = Image.new('RGBA', img.size, (12, 30, 70, 255)); bg.alpha_composite(img); bg.convert('RGB').save(sys.argv[3])
