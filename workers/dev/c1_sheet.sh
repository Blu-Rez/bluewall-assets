#!/bin/bash
# c1_sheet.sh [OUT.png] — ONE sheet: every C1 kind x levels 1 / 15 / 30 from the game-like camera, rendered by the real code path (wsbuild + wslife + smoke) on the real terrain, numbered 1..9.
OUT=${1:-/home/claude/work/c1_sheet.png}; D=/home/claude/work/c1sheet; mkdir -p $D; cd /home/claude/dev
bash c1_ws_dev_build.sh && bash up.sh
AIM=0,6 SIM=14 W=900 H=560 python3 c1_wsshot.py $D/f fishery_lake:1:0.7:52:0.95:1 fishery_lake:15:0.7:52:0.95:1 fishery_lake:30:0.7:52:0.95:1 | grep -E "^err|PAGEERR|error"
AIM=0,3 SIM=14 W=900 H=560 python3 c1_wsshot.py $D/p panning1:1:0.7:50:0.95:1 panning1:15:0.7:50:0.95:1 panning1:30:0.7:50:0.95:1 | grep -E "^err|PAGEERR|error"
AIM=0,1 SIM=14 W=900 H=560 python3 c1_wsshot.py $D/s smokehouse1:1:0.7:50:0.95:2 smokehouse1:15:0.7:50:0.95:2 smokehouse1:30:0.7:50:0.95:2 | grep -E "^err|PAGEERR|error"
python3 - "$D" "$OUT" <<'PY'
import sys
from PIL import Image, ImageDraw
D, OUT = sys.argv[1], sys.argv[2]
rows = [('f_fishery_lake_%d.png', 'ماهیگیری / fishery'), ('p_panning1_%d.png', 'طلاشویی / panning'), ('s_smokehouse1_%d.png', 'دودخانه / smokehouse')]
W, H = 640, 400; sheet = Image.new('RGB', (W * 3, H * 3), (20, 24, 32)); d = ImageDraw.Draw(sheet); n = 0
for r, (pat, name) in enumerate(rows):
    for c, lv in enumerate([1, 15, 30]):
        n += 1; sheet.paste(Image.open(D + '/' + pat % lv).convert('RGB').resize((W, H), Image.LANCZOS), (c * W, r * H))
        d.rectangle([c * W, r * H, c * W + 250, r * H + 26], fill=(0, 0, 0)); d.text((c * W + 8, r * H + 8), f'#{n}  {name.split(" / ")[-1]}  lv {lv}', fill=(255, 255, 255))
sheet.save(OUT); print('sheet', OUT, sheet.size)
PY
