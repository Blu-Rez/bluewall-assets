import sys, json
from PIL import Image, ImageDraw
import mkport3
FR = json.load(open(mkport3.D + '/fr.json'))
types = sys.argv[2].split(',') if len(sys.argv) > 2 else list(FR)
S = 200; cols = 6; rows = (len(types) + cols - 1) // cols
sheet = Image.new('RGB', (cols * S, rows * S), (60, 90, 120)); dr = ImageDraw.Draw(sheet)
for i, t in enumerate(types):
    try: im = mkport3.make(t, S - 20)
    except Exception as e: print(t, 'ERR', e); continue
    x, y = (i % cols) * S, (i // cols) * S
    dr.ellipse((x + 4, y + 4, x + S - 4, y + S - 4), fill=(30, 48, 80))
    sheet.paste(im, (x + 10, y + 10), im); dr.text((x + 8, y + 6), t, fill=(255, 255, 255))
sheet.save(sys.argv[1]); print('saved', sys.argv[1], types)
