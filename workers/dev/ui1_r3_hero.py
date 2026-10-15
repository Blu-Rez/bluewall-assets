# ui1_r3_hero.py [sizes] — UI1-R3: the hero HUD in the REAL game (page ui1r2_r3after.html): kit as it was (no data-hud) vs the new arc, same scene; also the strategic crown after leaving hero mode.
import asyncio, sys, os, time
from playwright.async_api import async_playwright
from ui1r2_common import get_page
SIZES = [tuple(map(int, s.split('x'))) for s in (sys.argv[1] if len(sys.argv) > 1 else '844x390').split(',')]
OUT = '/home/claude/work/ui1r3/hero/'; os.makedirs(OUT, exist_ok=True)
KEEP = """() => { if (document.getElementById('x-keep')) return; const s = document.createElement('style'); s.id = 'x-keep'; s.textContent = '@keyframes xk{from{transform:translateX(0)}to{transform:translateX(2px)}}#xk{position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none;z-index:1;animation:xk .5s linear infinite alternate}'; document.head.appendChild(s); const d = document.createElement('div'); d.id = 'xk'; document.body.appendChild(d); }"""
TG = """([top, side]) => { const R = document.documentElement.style; R.setProperty('--tg-content-safe-area-inset-top', top + 'px'); R.setProperty('--tg-safe-area-inset-left', side + 'px'); R.setProperty('--tg-safe-area-inset-right', side + 'px');
  let m = document.getElementById('tgmock'); if (!m) { m = document.createElement('div'); m.id = 'tgmock'; m.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;font:600 13px system-ui,sans-serif;color:#fff';
    m.innerHTML = '<div style="position:absolute;left:8px;top:8px;height:34px;padding:0 14px;border-radius:17px;background:rgba(38,38,42,.78);display:flex;align-items:center;gap:6px">✕ Close</div><div style="position:absolute;right:8px;top:8px;height:34px;padding:0 14px;border-radius:17px;background:rgba(38,38,42,.78);display:flex;align-items:center;gap:14px"><span>⌄</span><span>⋮</span></div>'; document.body.appendChild(m); } }"""
async def main():
    async with async_playwright() as p:
        b, pg = await get_page(p, 'r3after'); assert pg
        await pg.evaluate(KEEP)
        css = os.environ.get('CSSFILE')
        if css: await pg.evaluate("(c) => { let s = document.getElementById('k-hud3'); if (!s) { s = document.createElement('style'); s.id = 'k-hud3'; document.head.appendChild(s); } s.textContent = c; }", open(css).read())
        W, H = SIZES[0]; await pg.set_viewport_size({'width': W, 'height': H}); await asyncio.sleep(1); await pg.evaluate(TG, [56, 0])
        t0 = time.time()
        await pg.evaluate("(async () => { await __rpLoad('?v=' + Date.now()); await __rp.start('elina'); await new Promise(r => setTimeout(r, 4000)); return 1; })()")
        print('hero started', round(time.time() - t0), flush=True)
        await pg.evaluate("() => { const a = document.querySelector('[data-rp=act]'); if (a) a.style.display = 'flex'; }")        # test only: show the contextual «use» button so its place is visible
        for (W, H) in SIZES:
            await pg.set_viewport_size({'width': W, 'height': H}); await asyncio.sleep(1.5); await pg.evaluate(TG, [56, 0])
            for L in (['0', '3'] if (W, H) == SIZES[0] else ['3']):
                if L == '0': await pg.evaluate("() => document.documentElement.removeAttribute('data-hud')")
                else: await pg.evaluate("() => window.__bwHud(3)")
                await asyncio.sleep(1.2)
                await pg.screenshot(path=f'{OUT}hero_{L}_{W}x{H}.png', timeout=240000); print('shot hero', L, W, H, flush=True)
        await pg.evaluate("() => { __rp.exit(); }"); await asyncio.sleep(2.5)
        print('crown after exit:', await pg.evaluate("() => { const e = document.querySelector('.rp-open'); return e ? getComputedStyle(e).display : null; }"))
asyncio.run(main())
