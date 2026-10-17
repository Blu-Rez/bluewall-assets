# ui3_warm.py [files...] — UI3: list the warm (brown / gold / orange / yellow) hex colours left in the UI sources.  Exit 0 always; prints file:line:hex.
import re, sys, colorsys, glob, os
files = sys.argv[1:] or sorted(glob.glob('/home/claude/bot/bluebot_v2/bluewall/client/src/*.js'))
UI = ['ui.js','ui_theme.js','ui_theme_r2.js','ui_theme_r3.js','ui_theme_r4.js','bsheet.js','unitcards.js','assist.js','shopui.js','armyui.js','upgradeui.js','rankui.js','socialui.js','coach.js','logos.js','resultinfo.js','edge_strip.js']
def warm(h):
    h = h.lstrip('#')
    if len(h) == 3: h = ''.join(c*2 for c in h)
    r, g, b = [int(h[i:i+2], 16)/255 for i in (0, 2, 4)]
    hh, ll, ss = colorsys.rgb_to_hls(r, g, b)
    return 12 <= hh*360 <= 62 and ss > .25 and .06 < ll < .97
tot = 0
for f in files:
    if os.path.basename(f) not in UI and len(sys.argv) == 1: continue
    n = 0
    for i, line in enumerate(open(f, encoding='utf-8'), 1):
        hs = [h for h in re.findall(r'#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b', line) if warm(h)]
        rg = [m for m in re.findall(r'rgba?\((\d+),\s*(\d+),\s*(\d+)', line) if warm('#%02x%02x%02x' % tuple(int(x) for x in m))]
        if hs or rg: n += len(hs) + len(rg); print(f'{os.path.basename(f)}:{i}: ' + ' '.join(hs + ['rgb(%s,%s,%s)' % m for m in rg])[:150])
    if n: print(f'== {os.path.basename(f)}: {n}'); tot += n
print('TOTAL', tot)
