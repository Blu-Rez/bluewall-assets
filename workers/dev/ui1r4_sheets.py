# ui1r4_sheets.py <tag-of-page> <out-tag> [scene-regex] [sizes] — like the census, but each BUILDING SHEET is opened ONCE by its real tap (that is the slow part: 30-55 s) and then probed + shot at every size (the sheet stays open while the viewport changes)
# results: $OUT/<out-tag>/results.json (merged into an existing file), frames $OUT/<out-tag>/<scene>_<W>x<H>.png
import asyncio, json, os, re, sys, time
from playwright.async_api import async_playwright
from ui1r4_common import *
import ui1r4_scenes as S
PAGE = sys.argv[1]; OUTTAG = sys.argv[2]; ONLY = re.compile(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] else re.compile('^sheet_')
SZ = [tuple(map(int, s.split('x'))) for s in sys.argv[4].split(',')] if len(sys.argv) > 4 and sys.argv[4] else SIZES
OUT = os.environ.get('OUT', '/home/claude/work/ui1r4/') + OUTTAG + '/'; os.makedirs(OUT, exist_ok=True)
TGON = os.environ.get('TG', '1') != '0'
async def main():
    res = json.load(open(OUT + 'results.json')) if os.path.exists(OUT + 'results.json') else {}
    async with async_playwright() as p:
        b, pg = await get_page(p, PAGE); assert pg, 'page not loaded'
        b.contexts[0].on('page', lambda q: asyncio.ensure_future(q.close()))
        css = os.environ.get('CSSFILE')
        if css: await pg.evaluate("(c) => { let s = document.getElementById('k-kit4-live'); if (!s) { s = document.createElement('style'); s.id = 'k-kit4-live'; document.head.appendChild(s); } s.textContent = c; }", open(css).read())
        await pg.evaluate(PREP); W0, H0 = SZ[0]; await set_size(pg, W0, H0, TGON); await close_all(pg)
        for sc in S.SC:
            if not ONLY.search(sc['name']) or sc['name'] == 'zz_end': continue
            t0 = time.time(); W0, H0 = SZ[0]; await set_size(pg, W0, H0, TGON)
            try: await pg.evaluate(S.RESTORE); await sc['fn'](pg); skip = None
            except S.Skip as ex: skip = str(ex)
            except Exception as ex: skip = 'ERR ' + str(ex)[:160]
            for (W, H) in SZ:
                key = f"{sc['name']}|{W}x{H}"
                if skip: r = {'skip': skip} if not skip.startswith('ERR') else {'error': skip}
                else:
                    await set_size(pg, W, H, TGON)
                    # a sheet that stays open while the viewport changes keeps its inner scroll position (scroll anchoring): a real user opens it at the top, so every probe starts from scrollTop 0
                    await pg.evaluate("(sel) => { const r = document.querySelector(sel); if (!r) return; for (const e of [r, ...r.querySelectorAll('*')]) if (e.scrollTop) e.scrollTop = 0; }", sc['root']); await asyncio.sleep(.4)
                    safe = {'t': TG['top'], 'r': TG['side'], 'b': TG['bottom'], 'l': TG['side']} if TGON else {'t': 0, 'r': 0, 'b': 0, 'l': 0}
                    r = await S.probe_scene(pg, sc, W, H, safe, f"{OUT}{sc['name']}_{W}x{H}.png")
                r['group'] = sc['group']; r['t'] = round(time.time() - t0, 1); res[key] = r
                st = 'SKIP ' + r['skip'] if 'skip' in r else ('ERR ' + r['error'] if 'error' in r else ('ok' if r.get('ok') else 'FAIL ' + ' | '.join(r['fail'])[:230]))
                print(f"{key:42s} {st}", flush=True); json.dump(res, open(OUT + 'results.json', 'w'), indent=0)
            await S.ensure_clean(pg); await close_all(pg)
asyncio.run(main())
