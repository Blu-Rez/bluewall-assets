# ui3_sheetdom.py <id> <W> <H> [css-file] — UI3: open a building sheet in the rig, size the viewport, print the heights of its parts (and optionally inject a CSS override first)
import asyncio, json, sys
from playwright.async_api import async_playwright
from ui1r4_common import *
ID, W, H = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); CSS = open(sys.argv[4]).read() if len(sys.argv) > 4 else ''
JS = """() => { const s = document.querySelector('.bsh.on'); if (!s) return 'no sheet'; const r = (e) => { const q = e.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top - s.getBoundingClientRect().top), Math.round(q.width), Math.round(q.height)]; };
  const out = { sheet: r(s), scrollH: s.scrollHeight, clientH: s.clientHeight, kids: [] };
  const walk = (e, d) => { for (const k of e.children) { out.kids.push('  '.repeat(d) + k.tagName.toLowerCase() + '.' + String(k.className).replace(/ /g, '.').slice(0, 40) + ' ' + JSON.stringify(r(k))); if (d < 1 && (k.className + '').match(/bsh-main|bsh-act/)) walk(k, d + 1); } };
  walk(s, 0); return out; }"""
async def main():
    async with async_playwright() as p:
        b, pg = await get_page(p, 'rig'); assert pg
        await pg.evaluate(PREP); await set_size(pg, W, H, True); await close_all(pg)
        if CSS: await pg.evaluate("(c) => { let s = document.getElementById('k-ui3-live'); if (!s) { s = document.createElement('style'); s.id = 'k-ui3-live'; document.head.appendChild(s); } s.textContent = c; }", CSS)
        ok = await pg.evaluate("([id]) => !!__bw.sheets.open(id, __bw.SM)", [ID]); await settle(pg, .8)
        r = await pg.evaluate(JS); print(json.dumps(r, indent=1)[:3000] if isinstance(r, dict) else r)
        if len(sys.argv) > 5: await pg.screenshot(path=sys.argv[5])
asyncio.run(main())
