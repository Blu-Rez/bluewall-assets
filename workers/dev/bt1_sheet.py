import sys, os
from PIL import Image, ImageDraw
# bt1_sheet.py SRC_DIR LV OUT_DIR : stacks home_<v>.png over atk_<v>.png (full size 844x390 each) with a label
src, lv, out = sys.argv[1], sys.argv[2], sys.argv[3]; os.makedirs(out, exist_ok=True)
for f in sorted(os.listdir(src)):
    if not f.startswith('home_'): continue
    v = f[5:-4]; a = f'{src}/atk_{v}.png'
    if not os.path.exists(a): continue
    H = Image.open(f'{src}/{f}').convert('RGB'); A = Image.open(a).convert('RGB')
    im = Image.new('RGB', (H.width, H.height * 2 + 4), (255, 0, 255)); im.paste(H, (0, 0)); im.paste(A, (0, H.height + 4))
    d = ImageDraw.Draw(im)
    for y, t in ((0, f'HOME lv{lv} {v}'), (H.height + 4, f'ATTACK lv{lv} {v}')): d.rectangle((0, y, 170, y + 14), fill=(0, 0, 0)); d.text((3, y + 2), t, fill=(255, 255, 255))
    im.save(f'{out}/lv{lv}_{v}.png'); print(f'{out}/lv{lv}_{v}.png')
