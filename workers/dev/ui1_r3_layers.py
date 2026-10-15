# ui1_r3_layers.py <layouts> [sizes] — UI1-R3 sheet frames with ONE world per size: the real game's world is captured once with the HUD hidden, every layout is captured as a transparent HUD layer
# (canvas hidden, page background transparent; Telegram header mock included) and alpha-composited over that world -> the four cells differ only in the HUD (the software-GL world otherwise changes its LOD between shots).
#   env: SIDE=47 (notch), CSSFILE=<css> (live CSS)   out: /home/claude/work/ui1r3/r3after/comp_<L>_<W>x<H>[_side].png (+ world_ / ov_)
import asyncio, sys, os
from playwright.async_api import async_playwright
from PIL import Image
from ui1r2_common import get_page
LAY = sys.argv[1].split(','); SIZES = [tuple(map(int, s.split('x'))) for s in (sys.argv[2] if len(sys.argv) > 2 else '844x390').split(',')]
OUT = '/home/claude/work/ui1r3/r3after/'; SIDE = int(os.environ.get('SIDE', 0)); SUF = '_side' if SIDE else ''
KEEP = """() => { if (document.getElementById('x-keep')) return; const s = document.createElement('style'); s.id = 'x-keep'; s.textContent = '@keyframes xk{from{transform:translateX(0)}to{transform:translateX(2px)}}#xk{position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none;z-index:1;animation:xk .5s linear infinite alternate}'; document.head.appendChild(s); const d = document.createElement('div'); d.id = 'xk'; document.body.appendChild(d); }"""
TG = """([top, side]) => { const R = document.documentElement.style; R.setProperty('--tg-content-safe-area-inset-top', top + 'px'); R.setProperty('--tg-safe-area-inset-left', side + 'px'); R.setProperty('--tg-safe-area-inset-right', side + 'px');
  let m = document.getElementById('tgmock'); if (!m) { m = document.createElement('div'); m.id = 'tgmock'; m.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;font:600 13px system-ui,sans-serif;color:#fff';
    m.innerHTML = '<div style="position:absolute;left:8px;top:8px;height:34px;padding:0 14px;border-radius:17px;background:rgba(38,38,42,.78);display:flex;align-items:center;gap:6px">✕ Close</div><div style="position:absolute;right:8px;top:8px;height:34px;padding:0 14px;border-radius:17px;background:rgba(38,38,42,.78);display:flex;align-items:center;gap:14px"><span>⌄</span><span>⋮</span></div>'; document.body.appendChild(m); }
  const l = m.children[0], r = m.children[1]; l.style.left = (8 + side) + 'px'; r.style.right = (8 + side) + 'px'; }"""
CLOSE = """() => { const S = ['.bwh.on .bwh-x','.bsh.on .bsh-x']; for (const s of S) { const e = document.querySelector(s); if (e && e.offsetParent !== null) e.click(); } }"""
MODE = """(m) => { let s = document.getElementById('x-mode'); if (!s) { s = document.createElement('style'); s.id = 'x-mode'; document.head.appendChild(s); }
  s.textContent = m === 'world' ? '.bw-ui,.rp-open,#tgmock{visibility:hidden!important}' : m === 'hud' ? 'canvas{visibility:hidden!important}html,body,#game{background:transparent!important}' : ''; }"""
async def main():
    async with async_playwright() as p:
        b, pg = await get_page(p, 'r3after'); assert pg
        await pg.evaluate(KEEP)
        if os.environ.get('CSSFILE'): await pg.evaluate("(c) => { let s = document.getElementById('k-hud3'); if (!s) { s = document.createElement('style'); s.id = 'k-hud3'; document.head.appendChild(s); } s.textContent = c; }", open(os.environ['CSSFILE']).read())
        for (W, H) in SIZES:
            await pg.set_viewport_size({'width': W, 'height': H}); await asyncio.sleep(1.5); await pg.evaluate(TG, [56, SIDE]); await pg.evaluate(CLOSE); await asyncio.sleep(1.0)
            await pg.evaluate(MODE, 'world'); await asyncio.sleep(1.0)
            wp = f'{OUT}world_{W}x{H}.png'
            if not os.path.exists(wp) or SUF == '': await pg.screenshot(path=wp, timeout=240000); print('world', W, H, flush=True)
            await pg.evaluate(MODE, 'hud')
            for L in LAY:
                if L == '0': await pg.evaluate("() => document.documentElement.removeAttribute('data-hud')")
                else: await pg.evaluate('(n) => window.__bwHud(n)', int(L))
                await asyncio.sleep(0.9)
                op = f'{OUT}ov_{L}_{W}x{H}{SUF}.png'; await pg.screenshot(path=op, omit_background=True, timeout=240000)
                im = Image.alpha_composite(Image.open(wp).convert('RGBA'), Image.open(op).convert('RGBA')).convert('RGB'); im.save(f'{OUT}comp_{L}_{W}x{H}{SUF}.png'); print('comp', L, W, H, flush=True)
            await pg.evaluate(MODE, '')
asyncio.run(main())
