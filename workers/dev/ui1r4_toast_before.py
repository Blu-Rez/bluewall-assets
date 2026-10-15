import asyncio, sys
from playwright.async_api import async_playwright
from ui1r4_common import *
async def main():
    async with async_playwright() as p:
        b, pg = await get_page(p, sys.argv[1])
        for (W, H) in SIZES[:1]:
            await set_size(pg, W, H, True); await close_all(pg)
            # the OLD rules put back on the same build: top = --st + 78 px, 2.5 s timer, .6 s fade (simulation of the before state)
            await pg.evaluate("() => { const s = document.createElement('style'); s.id = 'k-oldtoast'; s.textContent = '.bw-ui.bw-ui .bw-toast{top:calc(var(--st) + 78px);max-width:86vw;padding:11px 20px}'; document.head.appendChild(s); const el = __bw.ui.toastEl; el.textContent = '+43K ruby — a gift from your games!'; el.classList.add('on'); clearTimeout(__bw.ui._tt); clearTimeout(__bw.ui._tt2); }")
            await pg.screenshot(clip={'x': 0, 'y': 0, 'width': 2, 'height': 2}); await asyncio.sleep(.8)
            await pg.screenshot(path=f"/home/claude/work/ui1r4/toast_before_home_{W}x{H}.png", timeout=240000)
            await pg.evaluate("() => { document.getElementById('k-oldtoast').remove(); const el = __bw.ui.toastEl; el.classList.remove('on'); el.textContent = ''; }")
asyncio.run(main())
