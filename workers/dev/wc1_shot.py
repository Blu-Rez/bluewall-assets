# WC1 proof driver helper: opens dev/wc1_dev.html (software GL) from the serve dir.   Serve dir = a folder with assets/ -> bluewall/web/assets, packs/ -> lib-tripo weapons, wc1_dev.html + wc1_dev.bundle.js
#   mkdir -p /home/claude/work/wc1/serve && cd it && ln -s ... (wc1_dev_build.sh does all of this: bundle + serve dir + server) ;  python3 -m http.server 8778
import asyncio, sys, json, os
from playwright.async_api import async_playwright
URL = 'http://127.0.0.1:8778/wc1_dev.html'
async def open_page(p, w=844, h=390, extra=''):
    b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1); logs = []
    pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if m.type in ('error', 'warning') else None)
    await pg.goto(f'{URL}?w={w}&h={h}{extra}')
    try: await pg.wait_for_function('window.__ready===true', timeout=60000)
    except Exception as e: logs.append('WAIT ' + str(e)[:200])
    return b, pg, logs
