import sys, json, os
from PIL import Image, ImageDraw
# d1_strips.py TAG — cuts the D1 proof strips out of the full 390x844 frames of d1_proof.py (no browser): one strip per tier (t = 0 / 0.4 / 0.8 / 1.2 / 1.6 s) + the mass-death strip.
#   output: /home/claude/work/d1/d1_<tier>.png, d1_mass.png     CROP = per tier (width, height, centre x, centre y) in canvas pixels; the frames are untouched, only cut and labelled.
TAG = sys.argv[1] if len(sys.argv) > 1 else 'a'; D = '/home/claude/work/d1/'
CROP = json.loads(os.environ.get('CROP', '{}')); DEF = (200, 260, 195, 400)
data = json.load(open(D + TAG + '_data.json'))
names = {'common': 'common', 'rare': 'rare', 'epic': 'epic', 'legendary': 'legendary', 'mythic': 'mythic'}
AGES = [0, 0.4, 0.8, 1.2, 1.6]
def label(im, txt):
    d = ImageDraw.Draw(im); d.rectangle((0, 0, 118, 14), fill=(0, 0, 0)); d.text((3, 2), txt, fill=(255, 255, 255)); return im
for name in names:
    if name not in data['strips']: print('no strip', name); continue
    typ = data['strips'][name]['type']; w, h, cx, cy = CROP.get(name, DEF); tiles = []
    for k, age in enumerate(AGES):
        im = Image.open(f'{D}{TAG}_{name}_{k}.png').convert('RGB'); box = (max(0, cx - w // 2), max(0, cy - h // 2), min(im.width, cx + w // 2), min(im.height, cy + h // 2))
        tiles.append(label(im.crop(box), f'{name} {typ} t={age}s'))
    W = sum(t.width for t in tiles) + 2 * (len(tiles) - 1); H = max(t.height for t in tiles); out = Image.new('RGB', (W, H), (0, 0, 0)); x = 0
    for t in tiles: out.paste(t, (x, 0)); x += t.width + 2
    out.save(f'{D}d1_{name}.png'); print('wrote', f'd1_{name}.png', out.size)
# mass: frames at t = 0 / 0.4 / 0.8 / 1.2 / 1.6 s of the whole army dying at once (canvas halved so five fit side by side)
ms = [(0, 0), (0.4, 4), (0.8, 8), (1.2, 12), (1.6, 16)]; tiles = []
for age, k in ms:
    f = f'{D}{TAG}_mass_{k}.png'
    if os.path.exists(f): im = Image.open(f).convert('RGB'); im = im.resize((im.width * 6 // 10, im.height * 6 // 10)); tiles.append(label(im, f'mass t={age}s'))
if tiles:
    W = sum(t.width for t in tiles) + 2 * (len(tiles) - 1); out = Image.new('RGB', (W, tiles[0].height), (0, 0, 0)); x = 0
    for t in tiles: out.paste(t, (x, 0)); x += t.width + 2
    out.save(D + 'd1_mass.png'); print('wrote d1_mass.png', out.size)
