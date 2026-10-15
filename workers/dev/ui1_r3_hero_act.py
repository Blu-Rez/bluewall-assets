# ui1_r3_hero_act.py — hero HUD with the contextual «use» button FORCED visible (rpg.js hides it every frame unless a door is near): all 7 buttons at once, layout 3, 844x390 / 800x360 / 932x430, + the crown must be hidden in hero mode
import asyncio, sys, os
from playwright.async_api import async_playwright
from ui1r2_common import get_page
TGJS = open('/home/claude/dev/ui1_r3_hero.py').read().split('TG = """')[1].split('"""')[0]
KEEPJS = open('/home/claude/dev/ui1_r3_hero.py').read().split('KEEP = """')[1].split('"""')[0]
OUT = '/home/claude/work/ui1r3/hero/'
async def main():
    async with async_playwright() as p:
        b, pg = await get_page(p, 'r3after'); assert pg
        await pg.evaluate(KEEPJS)
        css = os.environ.get('CSSFILE')
        if css: await pg.evaluate("(c) => { let s = document.getElementById('k-hud3'); if (!s) { s = document.createElement('style'); s.id = 'k-hud3'; document.head.appendChild(s); } s.textContent = c; }", open(css).read())
        await pg.evaluate("() => window.__bwHud(3)")
        await pg.set_viewport_size({'width': 844, 'height': 390}); await asyncio.sleep(1); await pg.evaluate(TGJS, [56, 0])
        await pg.evaluate("(async () => { await __rpLoad('?v=' + Date.now()); await __rp.start('elina'); await new Promise(r => setTimeout(r, 3000)); return 1; })()")
        await pg.evaluate("() => { window.__forceAct = setInterval(() => { document.querySelectorAll('[data-rp=act]').forEach(a => { if (a.getBoundingClientRect().width || a === [...document.querySelectorAll('[data-rp=act]')].pop()) a.style.display = 'flex'; }); }, 30); }")
        print('crown in hero:', await pg.evaluate("() => { const e = document.querySelector('.rp-open'); return e ? [getComputedStyle(e).display, getComputedStyle(e).visibility] : null; }"))
        for (W, H) in [(844, 390), (800, 360), (932, 430)]:
            await pg.set_viewport_size({'width': W, 'height': H}); await asyncio.sleep(1.5); await pg.evaluate(TGJS, [56, 0]); await asyncio.sleep(0.5)
            await pg.screenshot(path=f'{OUT}heroact_3_{W}x{H}.png', timeout=240000); print('shot', W, H, flush=True)
            print(await pg.evaluate("() => [...document.querySelectorAll('.rp-b')].map(e => { const r = e.getBoundingClientRect(); return e.dataset.rp + ':' + [r.left, r.top, r.width, r.height].map(v => Math.round(v)).join(','); }).join(' | ')"))
        await pg.evaluate("() => clearInterval(window.__forceAct)")
        await pg.evaluate("() => { __rp.exit(); }"); await asyncio.sleep(2.5)
        print('crown after exit:', await pg.evaluate("() => { const e = document.querySelector('.rp-open'); return e ? getComputedStyle(e).display : null; }"))
asyncio.run(main())
