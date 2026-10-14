# c2_sheet.py OUT.png [W H]  — the C2 sample sheet: rows = kinds (numbered), columns = levels 1 / 15 / 30, every tile shot by the real builder on the real terrain (dev/c2_wsshot.py).
import subprocess, sys, os
from PIL import Image, ImageDraw, ImageFont
out = sys.argv[1]; W = int(sys.argv[2]) if len(sys.argv) > 2 else 640; H = int(sys.argv[3]) if len(sys.argv) > 3 else 460
ROWS = [  # (number, site id, label, camera distance per level, aim z)
  (1, 'c2_sawmill', 'sawmill  NEW', (36, 40, 44), 1), (2, 'c2_masonry', 'masonry  NEW', (36, 40, 44), 1), (3, 'c2_smelter', 'smelter  NEW', (38, 42, 46), 2),
  (4, 'lumber1', 'lumber  (+1 piece)', (42, 46, 50), 3), (5, 'quarry', 'quarry  (unchanged)', (42, 46, 50), 3), (6, 'iron', 'iron  (+2 pieces)', (42, 46, 50), 3)]
LV = (1, 15, 30)
jobs = [f'{sid}:{lv}:0.6:{d[i]}:0.95:2.5' for _, sid, _, d, _ in ROWS for i, lv in enumerate(LV)]
env = dict(os.environ, AIM='0,2', SIM='16', W=str(W), H=str(H))
r = subprocess.run(['python3', '/home/claude/dev/c2_wsshot.py', '/tmp/c2sheet'] + jobs, env=env, capture_output=True, text=True)
print('\n'.join(l[:230] for l in (r.stdout + r.stderr).splitlines() if 'PCFSoft' not in l))
S = 0.8; tw, th = int(W * S), int(H * S)
sheet = Image.new('RGB', (tw * 3 + 70, th * len(ROWS)), (18, 24, 38)); d = ImageDraw.Draw(sheet)
try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22); fs = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
except Exception: f = fs = ImageFont.load_default()
for ri, (n, sid, lab, _, _) in enumerate(ROWS):
    d.rectangle([0, ri * th, 69, (ri + 1) * th], fill=(30, 52, 92)); d.text((22, ri * th + th // 2 - 14), str(n), font=f, fill=(255, 255, 255))
    for ci, lv in enumerate(LV):
        im = Image.open(f'/tmp/c2sheet_{sid}_{lv}.png').convert('RGB').resize((tw, th), Image.LANCZOS); sheet.paste(im, (70 + ci * tw, ri * th))
        d.rectangle([70 + ci * tw, ri * th, 70 + ci * tw + 230, ri * th + 24], fill=(10, 16, 30)); d.text((76 + ci * tw, ri * th + 4), f'{n}  {lab}  lv{lv}', font=fs, fill=(190, 225, 255))
        d.rectangle([70 + ci * tw, ri * th, 70 + (ci + 1) * tw - 1, (ri + 1) * th - 1], outline=(10, 14, 24))
sheet.save(out); print('sheet', out, sheet.size)
