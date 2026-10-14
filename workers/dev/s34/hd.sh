#!/bin/bash
# hd.sh OUT "query": the peasant head lab
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/s34/hd_lab.js --bundle --format=iife --target=es2020 --log-level=warning --outfile=/home/claude/dev/s34/hd_lab.bundle.js || exit 1
cd /home/claude/dev && python3 - "$1" "$2" <<'PY'
import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    out, q = sys.argv[1], sys.argv[2]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width': 1200, 'height': 520}); logs=[]
        pg.on('pageerror', lambda e: logs.append('ERR '+str(e)[:300])); pg.on('console', lambda m: logs.append(m.text[:200]) if m.type=='error' else None)
        await pg.goto('http://127.0.0.1:8777/s34/hd_lab.html?'+q)
        for k in range(100):
            await asyncio.sleep(0.4)
            if await pg.evaluate('!!window.__ready || !!window.__err'): break
        await pg.screenshot(path=out); print(logs[-3:], await pg.evaluate('window.__err||""')); await b.close()
asyncio.run(main())
PY
