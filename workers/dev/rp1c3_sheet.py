# rp1c3_sheet.py: stack frames into a numbered sheet.  usage: rp1c3_sheet.py out.png cols x0 x1 label=file ...   (each crop = x0..x1 full height)
import sys
from PIL import Image, ImageDraw, ImageFont
out, cols, x0, x1 = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]); items = [a.split('=', 1) for a in sys.argv[5:]]
ims = [(l, Image.open(f).convert('RGB').crop((x0, 0, x1, 390))) for l, f in items]; w = x1 - x0; h = 390; rows = (len(ims) + cols - 1) // cols
try: ft = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 26)
except Exception: ft = ImageFont.load_default()
sh = Image.new('RGB', (cols * w + (cols - 1) * 6, rows * h + (rows - 1) * 6), (20, 20, 24)); d = ImageDraw.Draw(sh)
for i, (l, im) in enumerate(ims):
    x, y = (i % cols) * (w + 6), (i // cols) * (h + 6); sh.paste(im, (x, y)); d.rectangle((x + 6, y + 6, x + 6 + 14 * len(l) + 16, y + 40), fill=(0, 0, 0)); d.text((x + 12, y + 8), l, fill=(255, 255, 255), font=ft)
sh.save(out); print(out, sh.size)
