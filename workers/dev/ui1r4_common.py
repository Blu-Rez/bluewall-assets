# ui1r4_common.py — helpers for UI1_R4 (menu census at 844x390 / 800x360 / 932x430 with Telegram margins).  Reuses the R2/R3 rig: page ui1r2_<tag>.html on the CDP chromium (:9222).
import asyncio, json, os, re, sys, time
from playwright.async_api import async_playwright
from ui1r2_common import get_page as _get_page, PREP
SIZES = [(844, 390), (800, 360), (932, 430)]
# Telegram fullscreen landscape on a notched phone (worst case): header buttons in the top 52 px, notch 47 px each side, home bar 21 px
TG = {'top': 52, 'side': 47, 'bottom': 21}
TGJS = """([top, side, bottom]) => { const R = document.documentElement.style;
  R.setProperty('--tg-content-safe-area-inset-top', top + 'px'); R.setProperty('--tg-safe-area-inset-top', '0px');
  R.setProperty('--tg-safe-area-inset-left', side + 'px'); R.setProperty('--tg-safe-area-inset-right', side + 'px'); R.setProperty('--tg-safe-area-inset-bottom', bottom + 'px');
  let m = document.getElementById('tgmock'); if (m) m.remove();
  if (top || side) { m = document.createElement('div'); m.id = 'tgmock'; m.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;font:600 13px system-ui,sans-serif;color:#fff';
    m.innerHTML = '<div style="position:absolute;left:' + side + 'px;top:8px;height:34px;padding:0 14px;border-radius:17px;background:rgba(38,38,42,.78);display:flex;align-items:center;gap:6px">✕ Close</div><div style="position:absolute;right:' + side + 'px;top:8px;height:34px;padding:0 14px;border-radius:17px;background:rgba(38,38,42,.78);display:flex;align-items:center;gap:14px"><span>⌄</span><span>⋮</span></div>'; document.body.appendChild(m); }
  window.dispatchEvent(new Event('resize')); }"""
KEEP = """() => { if (document.getElementById('x-keep')) return; const s = document.createElement('style'); s.id = 'x-keep'; s.textContent = '@keyframes xk{from{transform:translateX(0)}to{transform:translateX(2px)}}#xk{position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none;z-index:1;animation:xk .5s linear infinite alternate}'; document.head.appendChild(s); const d = document.createElement('div'); d.id = 'xk'; document.body.appendChild(d); }"""
CLOSE = """() => { const S = ['.bsh-dlg.on .bsh-b','.bsh.on .bsh-x','.bwa-ov.on','.bwh.on .bwh-x','.bwu.on .bwu-x','.bwa.on .bwa-x','.bws.on .bws-x','.bwk.on .bwk-x','.bw-set.on [data-a=setclose]','.bw-sheet.on .bw-x'];
  let n = 0; for (let i = 0; i < 6; i++) { let any = false; for (const s of S) { const e = document.querySelector(s); if (e && e.offsetParent !== null) { e.click(); any = true; n++; } } if (!any) break; } return n; }"""
async def js_click(pg, sel, nth=0):
    return await pg.evaluate("([s, n]) => { const e = document.querySelectorAll(s)[n]; if (!e) return false; e.scrollIntoView({block:'nearest'}); e.click(); return true; }", [sel, nth])
async def settle(pg, t=0.45): await asyncio.sleep(t)
async def get_page(p, tag):
    """the loaded game tab, brought to the front (a headless tab behind another one is throttled: its screenshots time out)"""
    b, pg = await _get_page(p, tag)
    if pg is not None:
        try: await pg.bring_to_front()
        except Exception: pass
        pg.set_default_timeout(240000)       # UI3: a busy 2-core box (software GL) needs more than the 30 s default for a screenshot
    return b, pg
async def close_all(pg):
    for _ in range(3): await pg.evaluate(CLOSE); await asyncio.sleep(0.35)
    # the hero picker (.rp-pick) is a full-screen layer outside .bw-ui: if a previous scene left it open it covers every later close button (this made `old_info_card` fail in BEFORE and AFTER runs — a measurement error, not a game bug)
    await pg.evaluate("() => { const p = document.querySelector('.rp-pick'); if (p) { const x = p.querySelector('.rp-x'); if (x) x.click(); p.remove(); } }"); await asyncio.sleep(0.35)
    await pg.evaluate("() => { document.querySelectorAll('.bwu-pan,.bwa-pan,.bws-pan,.bwk-pan,.bw-panel,.bwu-body,.bwa-body,.bws-body,.bwk-body,.bw-body').forEach(e => e.scrollTop = 0); }")
async def via_hub(pg, tile):
    await close_all(pg); await js_click(pg, '.bwh-btn'); await settle(pg, .6)
    ok = await js_click(pg, f'.bwh-t[data-a="{tile}"]'); await settle(pg, .8); return ok
async def rerender(pg, need=6):
    await pg.evaluate(KEEP)
    f0 = await pg.evaluate('() => __bw.frames'); await pg.evaluate('() => __bw.pause(false)')
    for _ in range(120):
        await asyncio.sleep(0.5)
        if (await pg.evaluate('() => __bw.frames')) - f0 >= need: break
    await asyncio.sleep(1.0); await pg.evaluate('() => __bw.pause(true)'); await settle(pg, .5)
async def set_size(pg, w, h, tg=True):
    await pg.set_viewport_size({'width': w, 'height': h}); await asyncio.sleep(.8)
    await pg.evaluate(TGJS, [TG['top'], TG['side'], TG['bottom']] if tg else [0, 0, 0]); await asyncio.sleep(.5)
    await rerender(pg, 6)
