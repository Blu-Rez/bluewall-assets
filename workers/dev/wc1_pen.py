# WC1: clip penetration table.  usage: python3 wc1_pen.py [sister|elina] [class ...] [--quick]  -> /home/claude/work/wc1/out/pen_<sister>.json + a printed table (cm, worst over every clip sampled every 0.1 s).
import asyncio, sys, json, time
sys.path.insert(0, '/home/claude/dev')
from wc1_shot import *
OUT = '/home/claude/work/wc1/out/'
P = lambda pack, name, kind, len, **k: dict(pack=pack, name=name, kind=kind, len=len, **k)
CLASSES = {   # the classes of the owner's rule, on the sister's rig with LIBRARY weapons (test only)
 'short_sword': [P('weapons_swords_medium', 'sword_med_arming', 'sword', 0.95)],
 'big_sword':   [P('weapons_swords_xlong', 'sword_xl_claymore', 'big_sword', 1.45)],
 'dagger_pair': [P('weapons_daggers_1', 'dagger_kris', 'dagger', 0.40, slot='L'), P('weapons_daggers_1', 'dagger_kris', 'dagger', 0.40, slot='R')],
 'staff':       [P('weapons_staffs_magic', 'staff_wizard', 'staff', 1.65)],
 'bow_quiver':  [P('weapons_bows', 'bow_persian', 'bow', 1.25), P('weapons_arrows_quivers', 'quiver_persian', 'quiver', 0.62)],
 'spear':       [P('weapons_spears', 'spear_long', 'spear', 1.85)],
 'hammer':      [P('weapons_hammers_big', 'hammer_maul', 'hammer', 1.05)],
}
DEFAULTS = {'elina': 'short_sword', 'elika': 'dagger_pair', 'melika': 'bow_quiver', 'mobina': 'hammer', 'aylin': 'staff', 'aylar': 'spear'}
async def run(p, sister, cls, quick=False):
    b, pg, logs = await open_page(p, 844, 390); out = {}
    items = CLASSES[cls]; await pg.evaluate("(o) => __wc1.dress(o)", dict(sister=sister, items=items, drawn=False, nogem=False))
    kinds = await pg.evaluate("() => __wc1.getCtl().state().map(s => s.kind + ':' + s.carry)")
    clips = None
    if quick: clips = ['idle', 'walk', 'run', 'sit_idle']
    handOnly = all(k.endswith(':hand') for k in kinds)
    t0 = time.time()
    if not handOnly:
        out['carried'] = await pg.evaluate("(o) => __wc1.pen(o)", dict(stepSec=0.1, clips=clips, drawn=False, stride=2, maxPer=220))
    out['hand'] = await pg.evaluate("(o) => __wc1.pen(o)", dict(stepSec=0.1, clips=clips, drawn=True, stride=2, maxPer=220))
    out['kinds'] = kinds; out['sec'] = round(time.time() - t0, 1); out['logs'] = [l for l in logs if 'toNonIndexed' not in l][:3]
    await b.close(); return out
async def main():
    a = [x for x in sys.argv[1:] if not x.startswith('--')]; quick = '--quick' in sys.argv
    sister = a[0] if a else 'elina'; classes = a[1:] or list(CLASSES)
    res = {}
    async with async_playwright() as p:
        for c in classes:
            r = await run(p, sister, c, quick); res[c] = r
            def f(x): return f"worst {x['worst']['cm']:5.2f} cm | weapon {x['wpn']['cm']:5.2f} cm @ {x['wpn'].get('clip','-')} t={x['wpn'].get('t','-')} | fittings {x['fit']['cm']:5.2f} cm @ {x['fit'].get('clip','-')} t={x['fit'].get('t','-')} | samples {x['samples']}, >0.5cm {x['over05']}, >1cm {x['over1']}"
            print(f"{c:12s} {r['kinds']} {r['sec']}s")
            if 'carried' in r: print('   carried:', f(r['carried']))
            print('   in hand:', f(r['hand']))
            for st in ('carried', 'hand'):
                if st in r: print('   ', st, 'per clip (fit/weapon cm):', ' '.join(f"{k}={v['fit']:.1f}/{v['wpn']:.1f}" for k, v in sorted(r[st]['clips'].items(), key=lambda kv: -max(kv[1]['fit'], kv[1]['wpn']))[:12]))
    json.dump(res, open(f"{OUT}pen_{sister}{'_quick' if quick else ''}.json", 'w'), indent=1)
if __name__ == "__main__": asyncio.run(main())
