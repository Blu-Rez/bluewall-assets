# ui3_crown.py <tag> [sizes] — UI3: what is under the middle of the crown button (.rp-open) at each size?  (the census skipped hero_picker@844x390: «the crown button is covered»)
import asyncio, json, sys
from playwright.async_api import async_playwright
from ui1r4_common import *
TAG = sys.argv[1]
SZ = [tuple(map(int, s.split('x'))) for s in sys.argv[2].split(',')] if len(sys.argv) > 2 else SIZES
JS = """() => { const b = document.querySelector('.rp-open'); if (!b) return 'no .rp-open'; const r = b.getBoundingClientRect(); const out = {rect:[r.left,r.top,r.width,r.height].map(Math.round), disp:getComputedStyle(b).display, pe:getComputedStyle(b).pointerEvents};
  const pts = [[.5,.5],[.25,.25],[.75,.75],[.5,.2],[.5,.8]];
  out.at = pts.map(([fx,fy]) => { const t = document.elementFromPoint(r.left+r.width*fx, r.top+r.height*fy); if (!t) return null; const c = t.className && t.className.baseVal !== undefined ? t.className.baseVal : t.className; const q = t.getBoundingClientRect(); return [t.tagName, String(c).slice(0,40), t.id||'', [q.left,q.top,q.width,q.height].map(Math.round), t === b || b.contains(t)]; });
  out.hud = document.documentElement.getAttribute('data-hud'); return out; }"""
async def main():
    async with async_playwright() as p:
        b, pg = await get_page(p, TAG); assert pg
        b.contexts[0].on('page', lambda q: asyncio.ensure_future(q.close()))
        await pg.evaluate(PREP)
        for (W, H) in SZ:
            await set_size(pg, W, H, True); await close_all(pg); await settle(pg, .8)
            print(W, H, json.dumps(await pg.evaluate(JS)), flush=True)
asyncio.run(main())
