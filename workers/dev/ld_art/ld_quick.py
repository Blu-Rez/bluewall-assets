# quick preview composite: sky gradient + mtn + wall (alpha over), downscale /ss
import sys, numpy as np
from PIL import Image
R = sys.argv[1]; out = sys.argv[2]; ss = int(sys.argv[3]) if len(sys.argv) > 3 else 2
w = Image.open(R + '_wall_beauty.png' if False else sys.argv[4]).convert('RGBA')
m = Image.open(sys.argv[5]).convert('RGBA')
W, H = w.size
sky = np.zeros((H, W, 3), np.float32)
t = np.linspace(0, 1, H)[:, None]
top = np.array([4, 10, 26]); bot = np.array([40, 80, 140])
sky[:] = (top + (bot - top) * t ** 1.6)[:, None, :].squeeze(1)[:, None, :] if False else (top[None, :] + (bot - top)[None, :] * (t ** 1.6))[:, None, :]
img = Image.fromarray(sky.clip(0, 255).astype(np.uint8)).convert('RGBA')
img.alpha_composite(m); img.alpha_composite(w)
img = img.resize((W // ss, H // ss), Image.LANCZOS)
img.convert('RGB').save(out)
