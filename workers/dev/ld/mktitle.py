# mktitle.py : turn the title text into plain SVG path data (no font needed at run time, no JS fitting)
import json, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
P = '/home/claude/bot/bluebot_v2/bluewall/web/pub/'
def make(font, text, track=0):
    f = TTFont(P + font + '.woff2'); gs = f.getGlyphSet(); cm = f.getBestCmap(); hm = f['hmtx']
    x = 0; pen = SVGPathPen(gs); bp = BoundsPen(gs); words = []
    for ch in text:
        g = cm[ord(ch)]
        for p in (pen, bp):
            tp = TransformPen(p, (1, 0, 0, -1, x, 0)); gs[g].draw(tp)
        x += hm[g][0] + track
    x0, y0, x1, y1 = bp.bounds
    return {'d': pen.getCommands(), 'x0': x0, 'y0': y0, 'x1': x1, 'y1': y1}
out = {}
for key, font, track in [('cinzel', 'cinzel-900', 30), ('exo', 'exo2-700', 20), ('bask', 'baskerville-700', 10)]:
    out[key] = make(font, 'Blue Wall', track)
json.dump(out, open('title_paths.json', 'w'))
for k, v in out.items(): print(k, len(v['d']), v['x0'], v['y0'], v['x1'], v['y1'])
