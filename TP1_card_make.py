# TP1_card_make.py - turn the picked CARD pictures into game cards (c_<key>.webp, 4:5).
# usage: python3 TP1_card_make.py OUTDIR elina=/path/elina_card.png aylin=/path/aylin_card.png ...
# A 4:5 picture is only resized; a 2:3 picture is cropped to 4:5 (top margin kept small, the bottom is cut).
# Writes OUTDIR/c_<key>.webp (320x400, same as today) and OUTDIR/c2_<key>.webp (640x800, sharper on phones). Nothing touches the game tree.
import os, sys
from PIL import Image

out = sys.argv[1]; os.makedirs(out, exist_ok=True)
for a in sys.argv[2:]:
    key, path = a.split("=", 1)
    im = Image.open(path).convert("RGB"); w, h = im.size
    th = round(w * 5 / 4)
    if h > th:
        top = round((h - th) * 0.25)   # a quarter of the extra height goes off the top, three quarters off the bottom
        im = im.crop((0, top, w, top + th))
    elif h < th:
        tw = round(h * 4 / 5); l = (w - tw) // 2; im = im.crop((l, 0, l + tw, h))
    for name, size, q in (("c_", (320, 400), 88), ("c2_", (640, 800), 86)):
        f = "%s/%s%s.webp" % (out, name, key)
        im.resize(size, Image.LANCZOS).save(f, "WEBP", quality=q, method=6)
        print(f, os.path.getsize(f), "bytes")
