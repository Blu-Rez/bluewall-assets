import asyncio, os, time, subprocess, socket, sys, json
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; PORT = 8778
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
OUT = os.environ.get('OUT', '/home/claude/work/lamp'); os.makedirs(OUT, exist_ok=True)
HOUR = os.environ.get('HOUR', '1'); TAG = os.environ.get('TAG', 'a'); Q = os.environ.get('Q', 'low')
POS = json.loads(os.environ.get('POS', '[[58,34,2.4],[40,60,0.8]]'))   # x,z,yaw
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
async def main():
    srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
            extra = os.environ.get('QS', '')
            await pg.goto('http://127.0.0.1:%d/%s?q=%s&w=clear&h=%s&wa=0.1%s' % (PORT, os.environ.get('PAGE','rp1_dev.html'), Q, HOUR, extra))
            for i in range(1200):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            for i in range(600):
                if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
                await asyncio.sleep(1)
            await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,2500)); return 1; })()" % int(time.time()))
            await pg.evaluate("__rp.cam('third')"); await asyncio.sleep(1)
            if os.environ.get('LAMP'):
                L = await pg.evaluate("() => { const out = []; __bw.scene.traverse(o => { if (o.isPoints && o.geometry.attributes.size && o.geometry.attributes.col && o.material.blending === 2) { const p = o.geometry.attributes.position, s = o.geometry.attributes.size; for (let i = 0; i < p.count; i++) if (s.getX(i) > 1) out.push([p.getX(i), p.getY(i), p.getZ(i)]); } }); return out.filter(q => Math.hypot(q[0], q[2]) < 90).slice(0, 400); }")
                print('lamps near castle', len(L), L[:3], flush=True)
                import math
                pick = [q for q in L if 2.0 < q[1] < 4.6][int(os.environ.get('LAMP')) % max(1, len([q for q in L if 2.0 < q[1] < 4.6]))]
                POSL = []
                for d in (1.0, 2.5, 5.0):
                    POSL.append([pick[0] + d, pick[2], math.atan2(-d, 0)])
                POS[:] = POSL
            for i, (x, z, yaw) in enumerate(POS):
                await pg.evaluate(f"__rp.setPos({x},{z},{yaw})"); await asyncio.sleep(2.5)
                await pg.screenshot(path=f'{OUT}/{TAG}_{i}.png'); print('shot', i, flush=True)
            print('errors', errs[:4]); await b.close()
    finally:
        if srv: srv.terminate()
asyncio.run(main())
