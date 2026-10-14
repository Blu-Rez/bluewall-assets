# sheet.py out.png "label1=path1" "label2=path2" ... [cols=2]  — contact sheet of full frames (each scaled to 640 px wide), labelled
import sys
from PIL import Image, ImageDraw
out = sys.argv[1]; items = [a.split('=', 1) for a in sys.argv[2:]]; cols = 2; W = 640
ims = []
for lab, p in items:
    im = Image.open(p).convert('RGB'); h = int(im.height * W / im.width); im = im.resize((W, h), Image.LANCZOS)
    d = ImageDraw.Draw(im); d.rectangle([0, 0, 8 + 7 * len(lab), 18], fill=(0, 0, 0)); d.text((4, 3), lab, fill=(255, 255, 255)); ims.append(im)
rows = (len(ims) + cols - 1) // cols; H = max(i.height for i in ims)
sheet = Image.new('RGB', (W * cols, H * rows), (20, 20, 20))
for k, im in enumerate(ims): sheet.paste(im, ((k % cols) * W, (k // cols) * H))
sheet.save(out); print(out, sheet.size)
