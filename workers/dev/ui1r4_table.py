# ui1r4_table.py <results.json> [more.json ...] [-o out.md] [-t title] [--bare] — builds the census table (UI1_R4_menus.md) from the probe results of dev/ui1r4_census.py / ui1r4_sheets.py (several files are merged; later ones win)
import json, sys, re, collections
from ui1r4_rules import verdict
def build(R, title, bare=False, base=''):
    rows = collections.OrderedDict()
    for k, v in R.items():
        name, size = k.split('|'); W, H = map(int, size.split('x')); rows.setdefault(name, {})[size] = (v, H)
    def cell(v, H): return None if 'skip' in v else ('ERR' if 'error' in v else verdict(v, H))
    sym = lambda b: '✅' if b else '❌'
    L = [] if bare else [f'# {title}', '', 'Sizes: 844×390, 800×360, 932×430, all with the Telegram margins (`--tg-content-safe-area-inset-top` 52 px, left/right 47 px, bottom 21 px) and the two Telegram buttons drawn on top.', '',
         'Columns: **opens** (settled, visible) · **fits** (panel inside the screen) · **scrolls inside** (what scrolls: height of the list / content height) · **close** (button ≥ 44 px, reachable, not under a Telegram button) · **clipped** (text or content cut and unreachable) · **targets** (taps < 44 px / under notch) · **cols** (cards side by side) · **list px** (visible height of the scrolling list).', '']
    L += ['| menu | group | size | opens | fits | scrolls inside | close | clipped | targets <44 / under notch | cols | list px | verdict |', '|---|---|---|---|---|---|---|---|---|---|---|---|']
    nfail = 0; ntot = 0; skipped = []; failing = collections.OrderedDict()
    for name, d in rows.items():
        if name.startswith('zz_end'): continue
        for size, (v, H) in d.items():
            if 'skip' in v: skipped.append(f'{name} @ {size}: {v["skip"]}'); continue
            ntot += 1; f = cell(v, H)
            if f == 'ERR': L.append(f'| {name} | {v.get("group","")} | {size} | – | – | – | – | – | – | – | – | ERROR {v.get("error","")[:60]} |'); nfail += 1; failing.setdefault(name, []).append(size); continue
            sc = v.get('scrollers') or []; main = max(sc, key=lambda s: s['sh'], default=None)
            scr = f"{main['ch']} / {main['sh']}" if main else 'no (fits)'
            cl = v.get('closeInfo'); close = ('—' if cl is None and not v.get('note') else ('tap outside' if cl is None else (sym(v.get('closeOk')) + f" {cl['w']}×{cl['h']}")))
            clipped = sym(not (v.get('cutN') or v.get('textCutN'))) + (f" {v.get('cutN',0)}+{v.get('textCutN',0)}" if (v.get('cutN') or v.get('textCutN')) else '')
            tg = f"{len(v.get('small') or [])} / {len(v.get('under') or [])}"
            ok = not f; nfail += (not ok)
            if not ok: failing.setdefault(name, []).append(size)
            L.append(f"| {name} | {v.get('group','')} | {size} | {sym(v.get('opens'))} | {sym(v.get('fits') and not v.get('pageScroll'))} | {scr} | {close} | {clipped} | {tg} | {v.get('cols','')} | {main['ch'] if main else '–'} | {'✅ OK' if ok else '❌ ' + '; '.join(f)[:170]} |")
    L += ['', f'**{ntot - nfail} of {ntot} menu × size cells are fine, {nfail} fail.**', '']
    if skipped: L += ['Not opened by its real button in this run: ' + '; '.join(skipped), '']
    return '\n'.join(L), ntot, nfail, skipped, failing
if __name__ == '__main__':
    a = sys.argv[1:]; out = None; title = 'UI1_R4 menu census'; bare = False; files = []
    while a:
        x = a.pop(0)
        if x == '-o': out = a.pop(0)
        elif x == '-t': title = a.pop(0)
        elif x == '--bare': bare = True
        else: files.append(x)
    R = {}
    for f in files: R.update(json.load(open(f)))
    txt, ntot, nfail, _, _ = build(R, title, bare)
    open(out, 'w').write(txt) if out else print(txt)
    print(f'{ntot - nfail}/{ntot} fine, {nfail} fail', file=sys.stderr)
