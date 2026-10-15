#!/usr/bin/env python3
# an1_r3_page.py — AN1_R3 dev helper: boots the real game ONCE (dev/pf1_dev_r3.html = debug bundle + window.__R3 handles) and then serves "RPC" files, so measurement / lineup / screenshot scripts can be
# iterated without a 2-3 minute boot each time.  Put  <dir>/NNN.js  (the body of an async function; may `return` JSON-able data; first line `// shot: name.png` also takes a full-size screenshot after it ran)
# -> the result appears as  <dir>/NNN.out.json  ({ok, result|error, shot}).  Stop: create <dir>/STOP.   Env: AN1_PAGE, AN1_QS, AN1_RPC, AN1_PORT, AN1_VW, AN1_VH, AN1_SWALLOW=1 (draw calls off).
import asyncio, json, os, re, sys, time, subprocess, socket, traceback
from playwright.async_api import async_playwright
D = '/home/claude/dev/'
RPC = os.environ.get('AN1_RPC', '/home/claude/work/an1r3/rpc'); os.makedirs(RPC, exist_ok=True)
SHOTS = '/home/claude/work/an1r3/shots'; os.makedirs(SHOTS, exist_ok=True)
PORT = int(os.environ.get('AN1_PORT', 8799)); PAGE = os.environ.get('AN1_PAGE', 'pf1_dev_r3.html'); QS = os.environ.get('AN1_QS', '')
VW = int(os.environ.get('AN1_VW', 844)); VH = int(os.environ.get('AN1_VH', 390)); HOUR = os.environ.get('AN1_HOUR', '14'); HERO = os.environ.get('AN1_HERO') == '1'      # HERO: the hero mode of rp1_dev.html (__rpLoad / __rp.start)
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--js-flags=--expose-gc']
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)
async def main():
    srv = None
    if not up(): srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            ctx = await b.new_context(viewport={'width': VW, 'height': VH}, device_scale_factor=1, is_mobile=True, has_touch=True)
            if os.environ.get('AN1_SWALLOW') == '1':
                await ctx.add_init_script("(()=>{ const P=['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced','drawRangeElements']; for(const k of P){ const o=WebGL2RenderingContext.prototype[k]; WebGL2RenderingContext.prototype[k]=function(a,b,c,d,e,f){ return; }; } })();")
            pg = await ctx.new_page(); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
            pg.on('console', lambda m: errs.append('console.' + m.type + ': ' + m.text[:200]) if m.type in ('error',) else None)
            await pg.goto('http://127.0.0.1:%d/%s?q=high&w=clear&h=%s&wa=0.1%s' % (PORT, PAGE, HOUR, QS))
            for i in range(3600):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready && !!(window.__bw && __bw.lateReady)'): break
            await pg.evaluate('__bw.ctl._skipIntro && __bw.ctl._skipIntro()'); await asyncio.sleep(1)
            if HERO:
                await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,2500)); return 1; })()" % int(time.time())); await pg.evaluate("__rp.cam('third')"); await asyncio.sleep(1)
            log('READY'); open(RPC + '/READY', 'w').write(str(time.time()))
            done = set()
            while True:
                if os.path.exists(RPC + '/STOP'): break
                fs = sorted(f for f in os.listdir(RPC) if re.match(r'^\d+.*\.js$', f) and f not in done)
                for f in fs:
                    done.add(f); src = open(RPC + '/' + f).read(); out = {'ok': True}
                    m = re.match(r'^\s*//\s*shot:\s*(\S+)', src)
                    try:
                        res = await pg.evaluate('async () => {' + src + '\n}')
                        out['result'] = res
                        if m:
                            await asyncio.sleep(0.4); path = SHOTS + '/' + m.group(1); await pg.screenshot(path=path); out['shot'] = path
                    except Exception as e:
                        out = {'ok': False, 'error': str(e)[:1500]}
                    out['pageErrors'] = errs[-5:]
                    json.dump(out, open(RPC + '/' + f[:-3] + '.out.json', 'w'))
                    log('did', f, 'ok' if out['ok'] else 'ERR')
                await asyncio.sleep(0.25)
            await b.close()
    finally:
        if srv: srv.terminate()
asyncio.run(main())
