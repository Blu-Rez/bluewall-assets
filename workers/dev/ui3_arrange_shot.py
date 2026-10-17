# ui3_arrange_shot.py <out.png> [W H] — UI3: the Arrange editor's toolbar (real CSS + real markup copied from layout_ui.js) on the loaded rig page, over the map photo.
import asyncio, re, sys, json
from playwright.async_api import async_playwright
from ui1r4_common import *
OUT = sys.argv[1]; W, H = (int(sys.argv[2]), int(sys.argv[3])) if len(sys.argv) > 3 else (844, 390)
src = open('/home/claude/bot/bluebot_v2/bluewall/client/src/layout_ui.js', encoding='utf-8').read()
css = re.search(r"const CSS = `(.*?)`;", src, re.S).group(1)
html = re.search(r"el\.innerHTML = `(.*?)`;", src, re.S).group(1)
async def main():
    async with async_playwright() as p:
        b, pg = await get_page(p, 'rig'); assert pg
        await pg.evaluate(PREP); await close_all(pg); await set_size(pg, W, H, True)
        await pg.evaluate("""([css, html]) => { document.getElementById('x-arr') && document.getElementById('x-arr').remove(); const s = document.createElement('style'); s.id = 'x-arr'; s.textContent = css; document.head.appendChild(s);
          document.querySelectorAll('.bwl').forEach(e => e.style.display = 'none'); const el = document.createElement('div'); el.className = 'bwl'; el.id = 'x-arr-el'; el.innerHTML = html; el.querySelector('[data-k="hint"]').textContent = 'Tap a building to pick it'; el.querySelector('[data-k="why"]').style.display = ''; el.querySelector('[data-k="why"]').textContent = '✓ It fits here'; el.querySelector('[data-k="why"]').className = 'pill g'; document.body.appendChild(el); }""", [css, html])
        await settle(pg, .8)
        for _ in range(2): await pg.screenshot(clip={'x': 0, 'y': 0, 'width': 2, 'height': 2}); await asyncio.sleep(.35)
        await pg.screenshot(path=OUT, timeout=240000)
        await pg.evaluate("() => { const e = document.getElementById('x-arr-el'); if (e) e.remove(); const s = document.getElementById('x-arr'); if (s) s.remove(); document.querySelectorAll('.bwl').forEach(e => e.style.display = ''); }")
asyncio.run(main())
