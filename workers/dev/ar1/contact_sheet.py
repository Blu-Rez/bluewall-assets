#!/usr/bin/env python3
"""AR1 contact sheet: number -> kind name -> its card(s), all 31 kinds, so the owner can answer by number ("#12 is wrong").  Output: /home/claude/work/ar1/contact_sheet.png"""
import json, re, os
from PIL import Image, ImageDraw, ImageFont
R = '/home/claude/bot/bluebot_v2/bluewall'
MAP = json.load(open(R + '/client/src/units_looks.json')); DEFS = json.load(open(R + '/client/src/unitdefs.json'))
src = open(R + '/client/src/armyui.js').read(); body = src[src.index('export const NAME = {'):]; body = body[:body.index('};')]
NAME = dict(re.findall(r"(\w+): '([^']+)'", body))
F = lambda s, b=True: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if b else ''), s)
COLS, CW, CH, TW, TH, PAD = 4, 420, 262, 118, 177, 16
order = DEFS['order']; rows = (len(order) + COLS - 1) // COLS
W, H = COLS * CW + PAD, 96 + rows * CH + PAD
im = Image.new('RGB', (W, H), (27, 20, 14)); d = ImageDraw.Draw(im)
d.text((PAD, 14), 'Blue Wall - soldier cards: number, kind, look(s)', fill=(244, 232, 204), font=F(26))
d.text((PAD, 52), 'Left card = look 1, right card = look 2 (shown from the level written next to it). Tell me the NUMBER of any wrong picture and what it should be.', fill=(201, 180, 138), font=F(15, False))
for i, k in enumerate(order):
    e = MAP['kinds'][k]; cx, cy = PAD + (i % COLS) * CW, 96 + (i // COLS) * CH
    d.rounded_rectangle([cx, cy, cx + CW - 12, cy + CH - 12], 14, fill=(48, 35, 24), outline=(138, 106, 58), width=2)
    two = e['low'] != e['high']
    for j, l in enumerate([e['low'], e['high']] if two else [e['low']]):
        t = Image.open(f"{R}/web/assets/units/c_{l}.webp").convert('RGB').resize((TW, TH), Image.LANCZOS)
        x = cx + 12 + j * (TW + 8); im.paste(t, (x, cy + 12)); d.rectangle([x - 1, cy + 11, x + TW, cy + 12 + TH], outline=(196, 154, 84), width=1)
        d.text((x + 2, cy + 14 + TH), l, fill=(201, 180, 138), font=F(11, False))
    tx = cx + 12 + (2 if two else 1) * (TW + 8) + 4 - (0 if two else 0)
    d.text((tx, cy + 8), '#%d' % (i + 1), fill=(245, 213, 131), font=F(30))
    nm = NAME.get(k, k); fs = 20
    while F(fs).getlength(nm) > cx + CW - 12 - tx - 8 and fs > 11: fs -= 1
    d.text((tx, cy + 48), nm, fill=(244, 232, 204), font=F(fs))
    d.text((tx, cy + 76), 'kind: ' + k, fill=(201, 180, 138), font=F(12, False))
    d.text((tx, cy + 94), '%s Lv %d' % (DEFS['units'][k]['fam'], DEFS['units'][k]['lv']), fill=(201, 180, 138), font=F(12, False))
    if two: d.text((tx, cy + 112), 'look 2 from Lv %d' % e['at'], fill=(224, 178, 85), font=F(12))
    else: d.text((tx, cy + 112), 'one look', fill=(224, 178, 85), font=F(12))
    if k in MAP.get('weak', {}): d.text((tx, cy + 134), 'WEAK MATCH?', fill=(255, 140, 120), font=F(13))
im.save('/home/claude/work/ar1/contact_sheet.png'); print(im.size)
