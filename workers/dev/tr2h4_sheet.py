# TR2_H_R4: before | after side by side at full size.  python3 tr2h4_sheet.py OUT.png beforeTag afterTag KEY [KEY ...]   (KEY = S22_house_yard__third)
import sys, os
from PIL import Image, ImageDraw
out, tb, ta, *keys = sys.argv[1:]
R = '/home/claude/work/qa1/out/'
ims = []
for k in keys:
    row = Image.new('RGB', (844 * 2 + 6, 390), (20, 20, 20))
    for i, t in enumerate((tb, ta)):
        p = R + t + '/frames/' + k + '__' + t + '.png'
        if os.path.exists(p): row.paste(Image.open(p).convert('RGB'), (i * 850, 0))
        ImageDraw.Draw(row).text((i * 850 + 6, 4), ('BEFORE ' if i == 0 else 'AFTER ') + k, fill=(255, 255, 0))
    ims.append(row)
sh = Image.new('RGB', (ims[0].width, sum(i.height + 4 for i in ims)), (0, 0, 0)); y = 0
for i in ims: sh.paste(i, (0, y)); y += i.height + 4
sh.save(out, quality=90)
