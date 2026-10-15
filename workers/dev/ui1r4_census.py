# ui1r4_census.py <tag-of-page> <out-tag> [scene-regex] [sizes e.g. 844x390,800x360,932x430] — UI1_R4 menu census: opens every menu by its real button at each size WITH the Telegram margins (--tg-*), probes it, shoots it.
# results: $OUT/<out-tag>/results.json , frames $OUT/<out-tag>/<scene>_<W>x<H>.png   (default OUT=/home/claude/work/ui1r4/)
import asyncio, json, os, re, sys, time
from playwright.async_api import async_playwright
from ui1r4_common import *
import ui1r4_scenes as S
PAGE = sys.argv[1]; OUTTAG = sys.argv[2]; ONLY = re.compile(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] else None
SZ = [tuple(map(int, s.split('x'))) for s in sys.argv[4].split(',')] if len(sys.argv) > 4 else SIZES
OUT = os.environ.get('OUT', '/home/claude/work/ui1r4/') + OUTTAG + '/'; os.makedirs(OUT, exist_ok=True)
NOSHOT = bool(os.environ.get('NOSHOT')); TGON = os.environ.get('TG', '1') != '0'
async def main():
    res = {}
    if os.path.exists(OUT + 'results.json') and os.environ.get('MERGE'): res = json.load(open(OUT + 'results.json'))
    async with async_playwright() as p:
        b, pg = await get_page(p, PAGE); assert pg, 'page not loaded (python3 ui1_r3_load.py <tag> 844 390)'
        b.contexts[0].on('page', lambda q: asyncio.ensure_future(q.close()))
        css = os.environ.get('CSSFILE')
        if css: await pg.evaluate("(c) => { let s = document.getElementById('k-kit4-live'); if (!s) { s = document.createElement('style'); s.id = 'k-kit4-live'; document.head.appendChild(s); } s.textContent = c; }", open(css).read())
        for (W, H) in SZ:
            await pg.evaluate(PREP); await set_size(pg, W, H, TGON); await close_all(pg)
            safe = {'t': TG['top'], 'r': TG['side'], 'b': TG['bottom'], 'l': TG['side']} if TGON else {'t': 0, 'r': 0, 'b': 0, 'l': 0}
            for sc in S.SC:
                if ONLY and not ONLY.search(sc['name']): continue
                key = f"{sc['name']}|{W}x{H}"
                t0 = time.time()
                r = await S.run_scene(pg, sc, W, H, safe, None if NOSHOT else f"{OUT}{sc['name']}_{W}x{H}.png")
                r['group'] = sc['group']; r['t'] = round(time.time() - t0, 1); res[key] = r
                st = 'SKIP ' + r['skip'] if 'skip' in r else ('ERR ' + r['error'] if 'error' in r else ('ok' if r.get('ok') else 'FAIL ' + ' | '.join(r['fail'])[:230]))
                print(f"{key:42s} {st}", flush=True)
                if 'skip' in r and sc['name'] == 'zz_end': pass
                json.dump(res, open(OUT + 'results.json', 'w'), indent=0)
            await S.ensure_clean(pg); await close_all(pg)
asyncio.run(main())
