# ui1r4_photos_extra.py — the before | after pairs that are not census cells: the «+43K ruby» toast (position / lifetime) and the 3D gem pill of the mines in hero mode
import sys, os
sys.path.insert(0, '/home/claude/dev')
from ui1r4_photos import font, OUT, R
from PIL import Image, ImageDraw
def mk(b, a, name, lb, la):
    A = Image.open(a).convert('RGB'); B = Image.open(b).convert('RGB'); bar = 30; gap = 8
    im = Image.new('RGB', (A.width + B.width + gap, max(A.height, B.height) + bar), (12, 12, 14)); d = ImageDraw.Draw(im); f = font(16)
    d.text((8, 6), lb, fill=(255, 190, 120), font=f); d.text((B.width + gap + 8, 6), la, fill=(150, 235, 150), font=f)
    im.paste(B, (0, bar)); im.paste(A, (B.width + gap, bar)); im.save(OUT + name, quality=88, subsampling=0); print(name)
mk(R + 'toast_before_home_844x390.png', R + 'toast_home_844x390.png', 'pair_toast_home_844x390.jpg', 'BEFORE · the «+43K ruby» toast sat at --st+112 px (mid-screen) · 844x390', 'AFTER (UI1_R4) · a pill in the top strip, gone after 2.1 s / text removed 2.5 s')
mk(R + '43k_before2/ruby_d90_a0.6.png', R + '43k_after/ruby_d90_a0.6.png', 'pair_43k_gem_pill_hero_844x390.jpg', 'BEFORE · hero mode: the mine\'s 3D «+7834» gem pill hangs in the view', 'AFTER (UI1_R4) · every gem pill hidden while the hero is out')
mk(R + '43k_before2/ruby_d130_a0.6.png', R + '43k_after/ruby_d130_a0.6.png', 'pair_43k_gem_pill_hero_far_844x390.jpg', 'BEFORE · hero mode, far from the mine', 'AFTER (UI1_R4)')
