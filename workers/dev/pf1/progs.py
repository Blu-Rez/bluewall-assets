#!/usr/bin/env python3
# pf1/progs.py — WHY does the phone show ~346 shader programs at night in hero mode when a day sandbox shows ~162?  Walk the renderer through states (day / night, screen path / bloom-composer path, map / hero), after each one list renderer.info.programs
# and the lights in the scene, and for every NEW program name the cache-key fields that differ from its nearest older sibling (outputColorSpace, toneMapping, numPointLights, ...).  -> /home/claude/work/pf1/progs.json
import asyncio, json, os, re, time, subprocess, socket
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; OUT = '/home/claude/work/pf1'; PORT = int(os.environ.get('PF1_PORT', 8799))
SRC = open('/home/claude/bot/bluebot_v2/bluewall/client/node_modules/three/src/renderers/webgl/WebGLPrograms.js').read()
blk = SRC[SRC.index('function getProgramCacheKeyParameters'):SRC.index('function getProgramCacheKeyBooleans')]
FIELDS = re.findall(r'array\.push\( parameters\.(\w+) \)', blk)
bb = SRC[SRC.index('function getProgramCacheKeyBooleans'):]
bb = bb[:bb.index('function getUniforms')] if 'function getUniforms' in bb else bb[:6000]
grp = bb.split('_programLayers.disableAll();')[1:]
BITS = [{int(n): nm for nm, n in re.findall(r'if \( parameters\.(\w+) \)\s*_programLayers\.enable\( (\d+) \)', g)} for g in grp[:2]]
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
INIT = "(()=>{ window.__nd={on:true}; const P=['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced','drawRangeElements']; for(const k of P){ const o=WebGL2RenderingContext.prototype[k]; WebGL2RenderingContext.prototype[k]=function(a,b,c,d,e,f){ if(window.__nd.on) return; return o.call(this,a,b,c,d,e,f); }; } })();"
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)
def decode(key):
    t = key.split(',')
    try: i = next(j for j, x in enumerate(t) if x in ('highp', 'mediump', 'lowp') and j >= 1)
    except StopIteration: return None
    return {'id': ','.join(t[:i]), **{f: t[i + k] for k, f in enumerate(FIELDS) if i + k < len(t)}, 'tail': t[i + len(FIELDS):]}
PROGS = "(__bw.renderer.info.programs||[]).map(p=>[p.name,p.cacheKey,p.usedTimes])"
LIGHTS = "(()=>{const o={}; const sc=[__bw.scene]; sc.forEach(s=>s.traverse(l=>{ if(l.isLight){ const k=l.type+(l.castShadow?'+shadow':'')+(l.visible?'':' (hidden)'); o[k]=(o[k]||0)+1; } })); return o;})()"
async def main():
    R = {'fields': FIELDS, 'states': []}; srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
            await ctx.add_init_script(INIT); pg = await ctx.new_page()
            await pg.goto('http://127.0.0.1:%d/pf1_dev.html?pf=1&q=high&w=clear&h=14&wa=0.1' % PORT)
            t0 = time.time()
            for i in range(1500):
                await asyncio.sleep(0.5)
                st = await pg.evaluate('({ready: !!window.__ready, late: !!(window.__bw && __bw.lateReady)})')
                if st['ready'] and st['late']: break
            await pg.evaluate('window.__bwFixDyn = true; __bw.ctl._skipIntro && __bw.ctl._skipIntro()')
            prev = {}
            async def state(name, js, wait=6):
                nonlocal prev
                if js: await pg.evaluate(js)
                for _ in range(int(wait * 2)):
                    await pg.evaluate("window.dispatchEvent(new Event('pointermove'))"); await asyncio.sleep(0.5)
                pr = await pg.evaluate(PROGS); lights = await pg.evaluate(LIGHTS)
                cur = {k: n for n, k, u in pr}; new = [k for k in cur if k not in prev]
                rows = {}
                for k in new:
                    d = decode(k); nm = cur[k]
                    best, bd = None, 99
                    for k0 in prev:
                        d0 = decode(k0)
                        if not d0 or not d or d0['id'] != d['id']: continue
                        diff = [f for f in FIELDS if d0.get(f) != d.get(f)]
                        for gi in (0, 1):
                            try:
                                x = int(d0['tail'][gi]) ^ int(d['tail'][gi]); diff += ['L%d:%s' % (gi + 1, BITS[gi].get(b, 'bit%d' % b)) for b in range(32) if x >> b & 1]
                            except Exception: pass
                        if d0['tail'][2:] != d['tail'][2:]: diff.append('tail2')
                        if len(diff) < bd: best, bd = diff, len(diff)
                    key = (nm, ','.join(best) if best is not None else 'NEW SHADER')
                    rows[key] = rows.get(key, 0) + 1
                s = {'state': name, 'programs': len(pr), 'new': len(new), 'lights': lights, 'new_by_cause': sorted([[a, b, c] for (a, b), c in rows.items()], key=lambda r: -r[2])[:14]}
                R['states'].append(s); log(name, len(pr), '+%d' % len(new), json.dumps(lights), json.dumps(s['new_by_cause'][:6])); prev = cur
                json.dump(R, open(OUT + '/progs.json', 'w'), indent=1)
            await state('boot: day, screen path', None, 3)
            await state('day, screen path, 6 s later', None, 4)
            await state('night, screen path (no composer)', "__bw.ov = {night: 1}; window.__bwPath = 'd'", 7)
            await state('night, bloom composer path', "window.__bwPath = 'c'", 8)
            await state('day, bloom composer path', "__bw.ov = {night: 0}; window.__bwPath = 'c'", 7)
            await state('day, screen path again', "window.__bwPath = 'd'", 4)
            await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,3000)); __rp.setPos(40.95,-2.17,0); return 1; })()" % int(time.time()))
            await state('hero, day, screen path', "window.__bwPath = 'd'", 6)
            await state('hero, night, screen path', "__bw.ov = {night: 1}", 7)
            await state('hero, night, bloom composer path', "window.__bwPath = 'c'", 8)
            await b.close()
    finally:
        if srv: srv.terminate()
    log('DONE', time.time() - t0)
asyncio.run(main())
