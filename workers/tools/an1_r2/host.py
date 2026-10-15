"""Page host for AN1_R2 measurements: loads the full game once (headless, 844x390) and keeps the page open.
   POST /eval   body = JS (function body, may use await, return a JSON-able value)  -> JSON result
   POST /shot   ?path=/abs/file.png  (screenshot of the viewport)
   GET  /errs   page errors so far
   GET  /ping
Usage: python3 host.py [port] [url-suffix]"""
import asyncio, os, sys, time, json, socket, subprocess
from aiohttp import web
from playwright.async_api import async_playwright

D = '/home/claude/dev/'; GAME_PORT = 8778
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8790
SUFFIX = sys.argv[2] if len(sys.argv) > 2 else 'q=low&w=clear&h=14&wa=0.1'
VW, VH = int(os.environ.get('VW', 844)), int(os.environ.get('VH', 390))
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')
STATE = {'page': None, 'errs': [], 'ready': False}


def up(port):
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', port)); return True
    except Exception: return False
    finally: s.close()


async def boot():
    if not up(GAME_PORT):
        subprocess.Popen(['python3', '-m', 'http.server', str(GAME_PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    p = await async_playwright().start()
    b = await p.chromium.launch(args=ARGS)
    pg = await b.new_page(viewport={'width': VW, 'height': VH}, device_scale_factor=1)
    pg.on('pageerror', lambda e: STATE['errs'].append(str(e)[:400]))
    pg.on('console', lambda m: STATE['errs'].append(('C:' if m.type == 'error' else 'W:') + m.text[:300]) if m.type in ('error', 'warning') else None)
    STATE['page'] = pg
    await pg.goto('http://127.0.0.1:%d/%s?%s' % (GAME_PORT, os.environ.get('PAGE','rp1_dev.html'), SUFFIX))
    for _ in range(1200):
        await asyncio.sleep(0.5)
        if await pg.evaluate('!!window.__ready'): break
    for _ in range(900):
        if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
        await asyncio.sleep(1)
    STATE['ready'] = True
    print('HOST READY', flush=True)


async def h_eval(req):
    if not STATE['ready']: return web.json_response({'error': 'not ready'}, status=503)
    src = await req.text()
    try:
        r = await STATE['page'].evaluate('(async()=>{' + src + '\n})()')
        return web.json_response({'ok': True, 'result': r})
    except Exception as e:
        return web.json_response({'ok': False, 'error': str(e)[:2000]})


async def h_shot(req):
    path = req.query['path']; os.makedirs(os.path.dirname(path), exist_ok=True)
    await STATE['page'].screenshot(path=path)
    return web.json_response({'ok': True, 'path': path})


async def h_errs(req): return web.json_response(STATE['errs'][-30:])
async def h_ping(req): return web.json_response({'ready': STATE['ready']})


async def main():
    app = web.Application(client_max_size=64 * 1024 * 1024)
    app.add_routes([web.post('/eval', h_eval), web.post('/shot', h_shot), web.get('/errs', h_errs), web.get('/ping', h_ping)])
    r = web.AppRunner(app); await r.setup(); await web.TCPSite(r, '127.0.0.1', PORT).start()
    print('HOST LISTEN', PORT, flush=True)
    await boot()
    while True: await asyncio.sleep(3600)

asyncio.run(main())
