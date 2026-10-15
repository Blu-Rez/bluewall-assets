#!/usr/bin/env python3
# ST1_R3 — full-size before / after sheets from the QA1 walk frames.
#   python3 st1r3_sheet.py OUTDIR            writes OUTDIR/ST1_R3_<name>.png  (each row = BEFORE | AFTER at 844x390, nothing scaled)
# frames: /home/claude/work/qa1/out/<base_|r3c_><day|dusk|night>/frames/Sxx_<name>__<cam>__<tag>.png
import os, sys, glob
from PIL import Image, ImageDraw, ImageFont
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
R = '/home/claude/work/qa1/out/'
def frame(tag, st, cam):
    g = glob.glob(f'{R}{tag}/frames/S{st:02d}_*__{cam}__{tag}.png')
    return Image.open(g[0]).convert('RGB') if g else None
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
except Exception: F = ImageFont.load_default()
def sheet(name, rows, hour):          # rows = [(station, cam, caption)]
    b, a = f'base_{hour}', f'r3c_{hour}'
    ims = []
    for st, cam, cap in rows:
        x, y = frame(b, st, cam), frame(a, st, cam)
        if x is None or y is None: print('missing', hour, st, cam); continue
        w, h = x.size; im = Image.new('RGB', (w * 2 + 6, h + 26), (10, 14, 28)); im.paste(x, (0, 26)); im.paste(y, (w + 6, 26))
        d = ImageDraw.Draw(im); d.text((6, 3), f'BEFORE  S{st:02d} {cam} {hour}  {cap}', fill=(255, 200, 120), font=F); d.text((w + 12, 3), 'AFTER (ST1_R3)', fill=(150, 255, 170), font=F)
        ims.append(im)
    if not ims: return
    W = ims[0].size[0]; H = sum(i.size[1] for i in ims) + 6 * (len(ims) - 1)
    out = Image.new('RGB', (W, H), (0, 0, 0)); y = 0
    for i in ims: out.paste(i, (0, y)); y += i.size[1] + 6
    p = f'{OUT}/ST1_R3_{name}.png'; out.save(p); print(p, out.size)
for hour in ('day', 'dusk', 'night'):
    sheet(f'poles_{hour}', [(6, 'third', 'QA1-018/019 banner poles'), (6, 'first', ''), (8, 'first', 'QA1-023'), (12, 'first', 'QA1-033')], hour)
    sheet(f'heaps_{hour}', [(7, 'third', 'QA1-020/021/022 stone heap'), (7, 'first', ''), (10, 'third', 'QA1-030 oil drums'), (10, 'first', ''), (9, 'third', 'QA1-096/097 gold bars')], hour)
    sheet(f'lamps_{hour}', [(9, 'first', 'QA1-026/027 brazier'), (10, 'first', 'QA1-024 lantern'), (11, 'third', 'QA1-101'), (8, 'third', '')], hour)
    sheet(f'court_{hour}', [(8, 'third', 'QA1-025/095 forecourt edge'), (14, 'third', 'QA1-106'), (12, 'third', 'QA1-102/103 basin'), (13, 'first', 'QA1-104'), (6, 'third', '')], hour)
    sheet(f'strat_{hour}', [(6, 'strat', 'QA1 strat overview'), (8, 'strat', ''), (10, 'strat', ''), (14, 'strat', '')], hour)
