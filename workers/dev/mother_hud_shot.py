# mother_hud_shot.py <tag> <outdir> [WxH,...] — the real game (dev/ui1r2_<tag>.html), landscape, HUD on, a Telegram-header mock; home frame, hero-mode frame, back home.
import asyncio, sys, os, time
from playwright.async_api import async_playwright
TAG, OUT = sys.argv[1], sys.argv[2]
SIZES = [tuple(map(int, s.split('x'))) for s in (sys.argv[3] if len(sys.argv) > 3 else '844x390').split(',')]
os.makedirs(OUT, exist_ok=True)
TG = """() => { const R = document.documentElement.style; R.setProperty('--tg-content-safe-area-inset-top', '56px');
  let m = document.getElementById('tgmock'); if (!m) { m = document.createElement('div'); m.id = 'tgmock'; m.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;font:600 13px system-ui,sans-serif;color:#fff';
  m.innerHTML = '<div style="position:absolute;left:8px;top:8px;height:34px;padding:0 14px;border-radius:17px;background:rgba(38,38,42,.78);display:flex;align-items:center">Close</div><div style="position:absolute;right:8px;top:8px;height:34px;padding:0 14px;border-radius:17px;background:rgba(38,38,42,.78);display:flex;align-items:center">&#8964; &#8942;</div>'; document.body.appendChild(m); } }"""
async def frames(pg, n=6):
    f0 = await pg.evaluate('__bw.frames')
    for i in range(200):
        await asyncio.sleep(0.25)
        if await pg.evaluate(f'__bw.frames >= {f0} + {n}'): break
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        W, H = SIZES[0]
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.goto(f'http://127.0.0.1:8777/ui1r2_{TAG}.html?q=low&w=clear' + ('' if os.environ.get('HOUR') == 'auto' else '&h=14') + '&wa=0.1&lv=30')
        for i in range(2400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) c.intro=null; }')
        for (W, H) in SIZES:
            await pg.set_viewport_size({'width': W, 'height': H}); await asyncio.sleep(1.2)
            await pg.evaluate(TG); await frames(pg)
            print('hud attr', await pg.evaluate("document.documentElement.getAttribute('data-hud')"), flush=True)
            await pg.screenshot(path=f'{OUT}/home_{W}x{H}.png', timeout=240000); print('shot home', W, H, flush=True)
        W, H = SIZES[0]
        await pg.set_viewport_size({'width': W, 'height': H}); await asyncio.sleep(1)
        t0 = time.time()
        try:
            await pg.evaluate("(async () => { await __rpLoad('?v=' + Date.now()); await __rp.start('elina'); await new Promise(r => setTimeout(r, 4500)); return 1; })()")
            await frames(pg, 8)
            await pg.screenshot(path=f'{OUT}/hero_{W}x{H}.png', timeout=240000); print('shot hero', round(time.time() - t0), flush=True)
            rects = await pg.evaluate("""() => [...document.querySelectorAll('.rp-b,.rp-k,[data-rp]')].filter(e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed').map(e => { const r = e.getBoundingClientRect(); return [e.getAttribute('data-rp') || e.className, Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; })""")
            for r in rects: print('  rect', r)
            await pg.evaluate("() => { try { __rp.stop && __rp.stop(); } catch (e) {} }"); await asyncio.sleep(2); await frames(pg, 4)
            await pg.screenshot(path=f'{OUT}/after_exit_{W}x{H}.png', timeout=240000); print('shot after exit', flush=True)
        except Exception as e:
            print('hero part failed', str(e)[:300], flush=True)
        print('pageerrors', errs[:5])
        await b.close()
asyncio.run(main())
