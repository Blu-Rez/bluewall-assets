import os, sys, shutil
from PIL import Image, ImageDraw
# bt1_photos.py : assembles /home/claude/work/bt1/photos (the BT1 frame set, everything full size) from the capture dirs.
W = '/home/claude/work/bt1'; P = f'{W}/photos'
shutil.rmtree(P, ignore_errors=True); os.makedirs(P)
def lab(im, t, y=0):
    d = ImageDraw.Draw(im); d.rectangle((0, y, 7 * len(t) + 8, y + 14), fill=(0, 0, 0)); d.text((3, y + 2), t, fill=(255, 255, 255))
def stack(top, bot, tt, tb, out):
    a = Image.open(top).convert('RGB'); b = Image.open(bot).convert('RGB')
    im = Image.new('RGB', (a.width, a.height * 2 + 4), (255, 0, 255)); im.paste(a, (0, 0)); im.paste(b, (0, a.height + 4)); lab(im, tt, 0); lab(im, tb, a.height + 4); im.save(out)
def pair_dir(src, lv, views, tag):
    for v in views:
        h, a = f'{W}/{src}/home_{v}.png', f'{W}/{src}/atk_{v}.png'
        if os.path.exists(h) and os.path.exists(a): stack(h, a, f'HOME lv{lv} {v}', f'ATTACK lv{lv} {v}', f'{P}/{tag}_lv{lv}_{v}.png')
        else: print('missing', src, v)
# 01 the matrix lv 1 / 13 / 30 / 50 x town castle fields worksites(works, mine)
os.makedirs(P, exist_ok=True)
S = {1: 'lv1r', 13: 'lv13', 30: 'lv30', 50: 'lv50'}
for lv, d in S.items():
    pair_dir(d, lv, ['town', 'castle', 'fields', 'works', 'mine'] if lv != 30 else ['town', 'castle', 'fields'], '01')
pair_dir('lv30w', 30, ['works', 'mine'], '01')
if os.path.exists(f'{W}/lv50r/home_fields.png'): stack(f'{W}/lv50r/home_fields.png', f'{W}/lv50/atk_fields.png', 'HOME lv50 fields (retake)', 'ATTACK lv50 fields', f'{P}/01_lv50_fields.png')
# 02 lv30 extra views (the places the bug was)
pair_dir('lv30', 30, ['top', 'lower', 'hamlet', 'hamlet2'], '02')
# 03 attack BEFORE the fix vs AFTER (same camera, lv 30)
for v in ['top', 'town', 'castle', 'fields', 'lower', 'hamlet', 'hamlet2']:
    b, a = f'{W}/before_fix/atk_{v}.png', f'{W}/lv30/atk_{v}.png'
    if os.path.exists(b) and os.path.exists(a): stack(b, a, f'ATTACK BEFORE the fix lv30 {v}', f'ATTACK AFTER the fix lv30 {v}', f'{P}/03_before_after_{v}.png')
# 04 destroy: intact / half / ruin full size, + a strip per kind
D = f'{W}/destroy30'
kinds = sorted({f.rsplit('_', 1)[0] for f in os.listdir(D) if f.endswith('.png')})
for k in kinds:
    fs = [(n, f'{D}/{k}_{n}.png') for n in ('1intact', '2half', '3ruin') if os.path.exists(f'{D}/{k}_{n}.png')]
    for n, f in fs: shutil.copy(f, f'{P}/04_destroy_{k}_{n}.png')
    if len(fs) == 3:
        ims = [Image.open(f).convert('RGB') for _, f in fs]; im = Image.new('RGB', (sum(i.width for i in ims) + 8, ims[0].height), (255, 0, 255)); x = 0
        for (n, _), i in zip(fs, ims): im.paste(i, (x, 0)); lab(im, f'{k} {n[1:]}', 0); x += i.width + 4
        im.save(f'{P}/04_destroy_{k}_strip.png')
print(len(os.listdir(P)), 'files')
