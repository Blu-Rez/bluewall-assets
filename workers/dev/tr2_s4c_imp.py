#!/usr/bin/env python3
# TR2-S4c: python3 tr2_s4c_imp.py OUTPREFIX [query]   -> OUT_main.png (trees on flat ground) + OUT_atlas.png (the impostor atlases)
import asyncio, sys, subprocess
from playwright.async_api import async_playwright
out = sys.argv[1]; qs = sys.argv[2] if len(sys.argv) > 2 else ''
subprocess.run('cd /home/claude/bot/bluebot_v2/bluewall/client && npx esbuild /home/claude/dev/tr2_s4c/imp.js --bundle --format=iife --target=es2020 --define:__BUILD__=\\"0\\" --outfile=/home/claude/dev/tr2_s4c/imp.bundle.js --log-level=error', shell=True, check=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 640}); logs = []
        pg.on('pageerror', lambda e: logs.append(str(e)[:300])); pg.on('console', lambda m: logs.append(m.text[:200]) if m.type in ('error', 'warning') else None)
        await pg.goto('http://127.0.0.1:8777/tr2_s4c_imp.html?' + qs)
        for i in range(240):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__done'): break
        print(await pg.evaluate('JSON.stringify(window.__done)'), logs[:4])
        await pg.screenshot(path=out + '_main.png')
        await pg.evaluate('window.__atlas()'); await asyncio.sleep(0.5); await pg.screenshot(path=out + '_atlas.png')
        await b.close()
asyncio.run(main())
