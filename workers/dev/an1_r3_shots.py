#!/usr/bin/env python3
# an1r3_shots.py — AN1_R3: frames at 844x390 (the game is landscape-only), real rendering (software GL), LOD on and ?an1lod=0, same camera.  -> work/an1r3/shots/<view>_<on|off>.png
import asyncio, os, time, subprocess, socket
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; OUT = os.environ.get('AN1_OUT', '/home/claude/work/an1r3') + '/shots'; os.makedirs(OUT, exist_ok=True); PORT = int(os.environ.get('AN1_PORT', 8797))
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
CAM = "(a)=>{const B=__bw,c=B.ctl; if(c._skipIntro) c._skipIntro(); let x=a.x,z=a.z; if(a.pick){const p=B.world.picks.find(p=>new RegExp(a.pick).test(p.id)); if(p){const v=new B.THREE.Vector3(); p.box.getCenter(v); x=v.x; z=v.z;}} c.target.set(x,(B.world.fastHeight?B.world.fastHeight(x,z):0),z); c.dist=a.d; if(a.az!=null) c.azim=a.az; return [x,z,c.dist,c.azim];}"
VIEWS = {'close': {'pick': 'mill', 'd': 28}, 'mill': {'pick': 'mill', 'd': 70}, 'town': {'x': 18, 'z': 16, 'd': 120}, 'gate': {'x': 41, 'z': -2, 'd': 75}, 'fields': {'x': 211, 'z': 1.6, 'd': 90}, 'map': None}
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
async def run(tag, qs):
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        await pg.goto('http://127.0.0.1:%d/pf1_dev.html?q=high&w=clear&h=14&wa=0.1%s' % (PORT, qs))
        for i in range(3600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready && !!(window.__bw && __bw.lateReady)'): break
        await pg.evaluate('__bw.ctl._skipIntro && __bw.ctl._skipIntro()'); await asyncio.sleep(25)
        for name, a in VIEWS.items():
            if a: await pg.evaluate(CAM, a)
            await asyncio.sleep(5)
            await pg.screenshot(path='%s/%s_%s.png' % (OUT, name, tag))
            print(tag, name, flush=True)
        await b.close()
async def main():
    srv = None
    if not up(): srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        await run('on', ''); await run('off', '&an1lod=0')
    finally:
        if srv: srv.terminate()
asyncio.run(main())
