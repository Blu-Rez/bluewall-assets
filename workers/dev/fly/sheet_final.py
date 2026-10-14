from PIL import Image, ImageDraw, ImageFont
import os
W = '/home/claude/dev/s35/fly/work/'; B = '/home/claude/bw/p35_art/'
CW, CH = 600, 433
rows = [
 [('cs8_g_side', 'GRYPHON - side, hover'), ('cs8_g_q', 'GRYPHON - 3/4, hover'), ('cs8_g_atk', 'GRYPHON - melee strike')],
 [('cs8_k_side', 'GRYPHON KNIGHT (hero) - side'), ('cs8_k_q', 'GRYPHON KNIGHT - 3/4'), ('cs11_k_dive', 'GRYPHON KNIGHT - Dive Strike (mid-swoop)')],
 [('cs8_d_side', 'DARK RIDER (hero) - side'), ('cs8_d_q', 'DARK RIDER - 3/4'), ('cs8_d_fire', 'DARK RIDER - shadow breath')],
 [('cs9_b_side', 'BABY (right) vs BABY3 (left) - side [3-head = x1.35]'), ('cs9_b_q', 'BABY vs BABY3 - 3/4'), ('cs9_b_fire', 'BABY3 - one breath per head (3 streams)')],
 [('cs10_r_side', 'DRAGON (right) vs DRAGON3 (left) - side [x1.35]'), ('cs10_r_q', 'DRAGON vs DRAGON3 - 3/4'), ('cs10_r_fire', 'DRAGON3 - one breath per head (3 streams)')],
 [('cs6_b_front', 'BABY3 - front: three necks / heads'), ('cs7_r_front', 'DRAGON3 - front: three necks / heads'), (B + 'c1_row_b', 'REAL BATTLE (battle.js): pegasus, gryphon, gryphon knight, dark rider')],
 [(B + 'c1_row_a', 'REAL BATTLE: baby, baby3, dragon, dragon3 (row)'), (B + 'c1_dragon3_front', 'REAL BATTLE: dragon3 over the gate'), (B + 'c1_dragon3_rear', 'REAL BATTLE: dragon3 from behind')],
]
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 15); FT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22)
except Exception: F = FT = ImageFont.load_default()
TOP = 44
sheet = Image.new('RGB', (CW * 3, TOP + CH * len(rows)), (18, 22, 34))
d = ImageDraw.Draw(sheet)
d.text((12, 10), 'BLUE WALL - p35 flyers through the real path (bunits.js -> createUnitViews). Rows 1-5 lab (real views + bfx), last two rows: real battle.js on dev page', font=FT if False else F, fill=(220, 232, 255))
for r, row in enumerate(rows):
    for c, (name, cap) in enumerate(row):
        p = name if name.startswith('/') else W + name
        im = Image.open(p + '.png').convert('RGB').resize((CW, CH), Image.LANCZOS)
        x, y = c * CW, TOP + r * CH
        sheet.paste(im, (x, y))
        tw = d.textlength(cap, font=F)
        d.rectangle([x, y, x + tw + 14, y + 24], fill=(10, 14, 26))
        d.text((x + 7, y + 4), cap, font=F, fill=(235, 242, 255))
out = '/home/claude/dev/s35/fly/flyers_contact_sheet.png'
sheet.save(out); print(out, sheet.size)
