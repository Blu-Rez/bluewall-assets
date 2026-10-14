#!/bin/bash
# sp.sh OUT: spell orbs now vs aged
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/s34/sp_lab.js --bundle --format=iife --target=es2020 --log-level=warning --outfile=/home/claude/dev/s34/sp_lab.bundle.js || exit 1
cd /home/claude/dev && python3 - "$1" <<'PY'
import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 760, 'height': 480}, device_scale_factor=2); logs=[]
        pg.on('pageerror', lambda e: logs.append('ERR '+str(e)[:300]))
        await pg.goto('http://127.0.0.1:8777/s34/sp_lab.html')
        for k in range(50):
            await asyncio.sleep(0.2)
            if await pg.evaluate('!!window.__ready'): break
        await pg.screenshot(path=sys.argv[1], full_page=True); print(logs[-3:]); await b.close()
asyncio.run(main())
PY
