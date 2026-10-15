# ui1r4_photos.py — builds the before | after pairs (JPEG q93 4:4:4, full-size frames side by side, a label bar on top) into /home/claude/work/ui1r4/photos
#   BEFORE = the kit as started (work/ui1r4/before3[,before3s]);  AFTER = the real build (the proof run of dev/ui1_menus_test.sh: /tmp/ui1r4_testrun/{census,sheets})
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
R = '/home/claude/work/ui1r4/'; OUT = R + 'photos/'; os.makedirs(OUT, exist_ok=True)
AFTER = [R + 'after_run/census/', R + 'after_run/sheets/', R + 'confirm/', '/tmp/ui1r4_testrun/census/', '/tmp/ui1r4_testrun/sheets/']
BEFORE = [R + 'before4q/', R + 'before4/', R + 'before4s/', R + 'before3/', R + 'before3s/', R + 'live3sheets/', R + 'live3sheets_b/']
BJSON = ['before3', 'live3sheets', 'live3sheets_b', 'before3s', 'before4', 'before4s', 'before4q']      # oldest first, the newest measurement of a cell wins (same order as ui1r4_menus_md.py)
def find(dirs, name):
    for d in dirs:
        if os.path.exists(d + name): return d + name
def font(sz):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'):
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default()
def pair(scene, size, note=''):
    fn = f'{scene}_{size}.png'; a = find(AFTER, fn); b = find(BEFORE, fn)
    if not a or not b: return None
    A = Image.open(a).convert('RGB'); B = Image.open(b).convert('RGB'); bar = 30; gap = 8
    W = A.width + B.width + gap; H = max(A.height, B.height) + bar
    im = Image.new('RGB', (W, H), (12, 12, 14)); d = ImageDraw.Draw(im); f = font(16)
    d.text((8, 6), f'BEFORE (kit as started) · {scene} · {size}' + (' · ' + note if note else ''), fill=(255, 190, 120), font=f); d.text((B.width + gap + 8, 6), 'AFTER (UI1_R4)', fill=(150, 235, 150), font=f)
    im.paste(B, (0, bar)); im.paste(A, (B.width + gap, bar)); out = f'{OUT}pair_{scene}_{size}.jpg'; im.save(out, quality=88, subsampling=0); return out
if __name__ == '__main__':
    sys.path.insert(0, '/home/claude/dev')
    from ui1r4_rules import verdict
    B = {}
    for d in BJSON:
        try: B.update(json.load(open(R + d + '/results.json')))
        except Exception as e: print('missing', d, e, file=sys.stderr)
    made = []
    for k, v in B.items():
        if 'skip' in v or 'error' in v or k.startswith('zz_'): continue
        scene, size = k.split('|')
        if not verdict(v, int(size.split('x')[1])): continue            # pairs only for the cells that FAILED before
        o = pair(scene, size)
        if o: made.append(o)
    print(len(made), 'pairs (every cell that failed BEFORE)')
