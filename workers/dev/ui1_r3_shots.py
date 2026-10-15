# ui1_r3_shots.py <tag> <layouts> [sizes] — UI1-R3 frames of the REAL game (page ui1r2_<tag>.html, loaded once by ui1_r3_load.py) at landscape sizes, with a Telegram fullscreen header simulated
#   (content safe-area top 56 px + a test-only mock of Telegram's «Close» and «⌄ ⋮» pills).   layouts = '0' (kit as it was) or '1,2,3' (html[data-hud]).   sizes default 844x390 (also 800x360, 932x430).
#   scenes per layout: hud (home), hub (Assist hub open), sheet (a building sheet open: reached via __bw sheets when available).   OUT=/home/claude/work/ui1r3/<tag>/
import asyncio, sys, os, json
from playwright.async_api import async_playwright
from ui1r2_common import get_page
TAG = sys.argv[1]; LAY = sys.argv[2].split(','); SIZES = [tuple(map(int, s.split('x'))) for s in (sys.argv[3] if len(sys.argv) > 3 else '844x390').split(',')]
SCENES = (os.environ.get('SCENES') or 'hud,hub').split(',')
OUT = f'/home/claude/work/ui1r3/{TAG}/'; os.makedirs(OUT, exist_ok=True)
KEEP = """() => { if (document.getElementById('x-keep')) return; const s = document.createElement('style'); s.id = 'x-keep'; s.textContent = '@keyframes xk{from{transform:translateX(0)}to{transform:translateX(2px)}}#xk{position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none;z-index:1;animation:xk .5s linear infinite alternate}'; document.head.appendChild(s); const d = document.createElement('div'); d.id = 'xk'; document.body.appendChild(d); }"""
TG = """([top, side]) => { const R = document.documentElement.style; R.setProperty('--tg-content-safe-area-inset-top', top + 'px'); R.setProperty('--tg-safe-area-inset-left', side + 'px'); R.setProperty('--tg-safe-area-inset-right', side + 'px');
  let m = document.getElementById('tgmock'); if (!m) { m = document.createElement('div'); m.id = 'tgmock'; m.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;font:600 13px system-ui,sans-serif;color:#fff';
    m.innerHTML = '<div style="position:absolute;left:8px;top:8px;height:34px;padding:0 14px;border-radius:17px;background:rgba(38,38,42,.78);display:flex;align-items:center;gap:6px">✕ Close</div><div style="position:absolute;right:8px;top:8px;height:34px;padding:0 14px;border-radius:17px;background:rgba(38,38,42,.78);display:flex;align-items:center;gap:14px"><span>⌄</span><span>⋮</span></div>'; document.body.appendChild(m); }
  const l = m.children[0], r = m.children[1]; l.style.left = (8 + side) + 'px'; r.style.right = (8 + side) + 'px'; }"""
CLOSE = """() => { const S = ['.bwh.on .bwh-x','.bsh.on .bsh-x','.bwa.on .bwa-x','.bwu.on .bwu-x','.bws.on .bws-x','.bwk.on .bwk-x']; for (const s of S) { const e = document.querySelector(s); if (e && e.offsetParent !== null) e.click(); } }"""
async def main():
    async with async_playwright() as p:
        b, pg = await get_page(p, TAG)
        assert pg, 'page not loaded: run ui1_r3_load.py ' + TAG
        await pg.evaluate(KEEP)
        if os.environ.get('CSSFILE'): await pg.evaluate("(c) => { let s = document.getElementById('k-hud3'); if (!s) { s = document.createElement('style'); s.id = 'k-hud3'; document.head.appendChild(s); } s.textContent = c; }", open(os.environ['CSSFILE']).read())
        side = int(os.environ.get('SIDE', 0))
        for (W, H) in SIZES:
            await pg.set_viewport_size({'width': W, 'height': H}); await asyncio.sleep(1.2)
            await pg.evaluate(TG, [56, side]); await asyncio.sleep(0.6)
            for L in LAY:
                if L == '0': await pg.evaluate("() => document.documentElement.removeAttribute('data-hud')")        # no data-hud = every UI1-R3 rule is off = the kit as it was
                else: await pg.evaluate('(n) => window.__bwHud && window.__bwHud(n)', int(L))
                await pg.evaluate(CLOSE); await asyncio.sleep(0.8)
                for sc in SCENES:
                    if sc == 'hud':
                        pass
                    elif sc == 'hub':
                        await pg.evaluate("() => document.querySelector('.bwh-btn').click()"); await asyncio.sleep(0.9)
                    await asyncio.sleep(0.5)
                    await pg.screenshot(path=f'{OUT}{sc}_{L}_{W}x{H}{"_side" if side else ""}.png', timeout=240000); print('shot', sc, L, W, H, flush=True)
                    if sc == 'hub': await pg.evaluate(CLOSE); await asyncio.sleep(0.6)
asyncio.run(main())
