# ui3_loader_shot.py <web-dir> <out.png> [W H] — UI3: the real web/index.html loader screen (fonts, bar, tip) with the game bundle blocked so the loader stays up.  Uses its own headless chromium (no CDP tab, no game).
import asyncio, sys, functools, http.server, threading, os
from playwright.async_api import async_playwright
WEB, OUT = sys.argv[1], sys.argv[2]; W = int(sys.argv[3]) if len(sys.argv) > 3 else 844; H = int(sys.argv[4]) if len(sys.argv) > 4 else 390
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
h = functools.partial(Q, directory=WEB); srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), h); port = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': W, 'height': H})
        await pg.route('**/app/**', lambda r: r.abort())
        await pg.goto(f'http://127.0.0.1:{port}/index.html', wait_until='domcontentloaded'); await asyncio.sleep(2.5)
        await pg.evaluate("() => document.fonts.ready.then(() => 1)"); await asyncio.sleep(.5)
        fonts = await pg.evaluate("() => [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight)")
        print('loaded fonts:', fonts)
        await pg.screenshot(path=OUT); await b.close()
asyncio.run(main())
