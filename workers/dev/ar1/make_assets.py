#!/usr/bin/env python3
"""AR1 asset builder: web/assets/units/c_<look>.webp (card 768x1152 -> 384x576, q80) + s_<look>.webp (sheet as is) for every look used by units_looks.json,
plus credits_units.json.  Usage: python3 make_assets.py [--cast]   (--cast adds the 24 story characters as c_/s_ <key>, Part B)"""
import json, os, shutil, sys
from PIL import Image
SRC = '/home/claude/work/units_sparse/v5/lib'
GAME = '/home/claude/bot/bluebot_v2/bluewall'
OUT = GAME + '/web/assets/units'
MAP = json.load(open(GAME + '/client/src/units_looks.json'))
os.makedirs(OUT, exist_ok=True)
looks = []
for k, e in MAP['kinds'].items():
    for l in (e['low'], e['high']):
        if l not in looks: looks.append(l)
items = []
tot = 0
def build(folder, key, kind):
    global tot
    d = f'{SRC}/{folder}/{key}'
    im = Image.open(d + '/card.webp').convert('RGB')
    assert im.size == (768, 1152), (key, im.size)
    im = im.resize((384, 576), Image.LANCZOS)
    im.save(f'{OUT}/c_{key}.webp', 'WEBP', quality=80, method=6)
    if folder == 'rpg_cast':        # (the story sheets are re-encoded smaller: 24 of them as they are would push the folder over the 22 MB budget)
        Image.open(d + '/sheet.webp').convert('RGB').save(f'{OUT}/s_{key}.webp', 'WEBP', quality=70, method=6)
    else: shutil.copyfile(d + '/sheet.webp', f'{OUT}/s_{key}.webp')
    s = Image.open(f'{OUT}/s_{key}.webp'); assert s.size == (1024, 1536), (key, s.size)
    tot += os.path.getsize(f'{OUT}/c_{key}.webp') + os.path.getsize(f'{OUT}/s_{key}.webp')
    it = {'id': key, 'name': f'{key} (Blue Wall {kind} card + design sheet)', 'by': 'the game owner', 'group': 'Art (made for the game)',
          'license': 'AI-generated concept art made for the Blue Wall owner from his own text prompts (RP0U art batches, Oct 2026); owned by the game',
          'files': [f'units/c_{key}.webp', f'units/s_{key}.webp']}
    cj = d + '/credit.json'
    if os.path.exists(cj): it['credit_json'] = json.load(open(cj))      # (the infantry folders carry the credit of their 3D props)
    items.append(it)
for l in looks: build('rpg_units', l, 'unit')
if '--cast' in sys.argv:
    for k in sorted(os.listdir(SRC + '/rpg_cast')): build('rpg_cast', k, 'story character')
json.dump({'_note': 'AR1: credits of web/assets/units/*. group / by / license are the keys of the in-game credits.json items so the mother can merge either way. Nothing here is third-party.', 'items': items},
          open(GAME + '/web/assets/credits_units.json', 'w'), indent=1, ensure_ascii=False)
print(len(looks), 'unit looks', len(items), 'items', round(tot / 1e6, 2), 'MB')
