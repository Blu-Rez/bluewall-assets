# ui3_photos.py <outdir> — UI3: BEFORE | AFTER pairs (JPEG q88, full-size frames side by side, a label bar on top) for EVERY menu x size that exists in both runs.
#   BEFORE = the kit as started (work/ui3/cens_before_all, work/ui3/before_extra*, work/ui3/hud_before);  AFTER = the real build (work/ui3/after/{census,sheets}, work/ui3/hud_after_real).
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
R = '/home/claude/work/ui3/'; OUT = sys.argv[1].rstrip('/') + '/'; os.makedirs(OUT, exist_ok=True)
AFTER = [R + 'after/census/', R + 'after/sheets/', R + 'after/extra/', R + 'hud_after_real/']
BEFORE = [R + 'cens_before_all/', R + 'before_extra/', R + 'before_sheets/', R + 'hud_before/']
def find(dirs, name):
    for d in dirs:
        if os.path.exists(d + name): return d + name
def font(sz):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'):
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default()
def pair(name):
    a = find(AFTER, name); b = find(BEFORE, name)
    if not a or not b: return None
    A = Image.open(a).convert('RGB'); B = Image.open(b).convert('RGB'); bar = 30; gap = 8
    W = A.width + B.width + gap; H = max(A.height, B.height) + bar
    im = Image.new('RGB', (W, H), (12, 12, 14)); d = ImageDraw.Draw(im); f = font(16); lab = name[:-4]
    d.text((8, 6), f'BEFORE (kit as started) · {lab}', fill=(255, 190, 120), font=f); d.text((B.width + gap + 8, 6), 'AFTER (UI3, look 1)', fill=(150, 235, 150), font=f)
    im.paste(B, (0, bar)); im.paste(A, (B.width + gap, bar)); out = f'{OUT}pair_{lab}.jpg'; im.save(out, quality=88, subsampling=0); return out
names = set()
for d in AFTER:
    if os.path.isdir(d): names |= {f for f in os.listdir(d) if f.endswith('.png')}
made = [pair(n) for n in sorted(names)]; made = [m for m in made if m]
print(len(made), 'pairs;', len(names) - len(made), 'after-only frames (no BEFORE):', sorted(n for n in names if not find(BEFORE, n))[:12])
