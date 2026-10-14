#!/bin/bash
# rp.sh OUT "query"... : the ring-path lab (bare scene, real squadring.js + ringpath.js)
cd /home/claude/bot/bluebot_v2/bluewall/client && NODE_PATH=$PWD/node_modules npx esbuild /home/claude/dev/s34/rp_lab.js --bundle --format=iife --target=es2020 --log-level=warning --outfile=/home/claude/dev/s34/rp_lab.bundle.js --loader:.json=json || exit 1
cd /home/claude/dev && OUT=$1; shift; bash sem.sh python3 - "$OUT" "$@" <<'PY'
import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    out = sys.argv[1]; qs = sys.argv[2:]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        for i, q in enumerate(qs):
            pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
            logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.text[:300]) if m.type == 'error' else None)
            await pg.goto('http://127.0.0.1:8777/s34/rp_lab.html?' + q)
            for k in range(120):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            await asyncio.sleep(0.5); await pg.screenshot(path=f'{out}_{i}.png'); print(i, q, logs[-3:]); await pg.close()
        await b.close()
asyncio.run(main())
PY
