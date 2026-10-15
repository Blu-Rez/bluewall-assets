#!/usr/bin/env python3
# pf2/progs.py (PF2: copy of pf1/progs.py + page / tag parameters + a boot time series of programs and point lights)
# pf1/progs.py — WHY does the phone show ~346 shader programs at night in hero mode when a day sandbox shows ~162?  Walk the renderer through states (day / night, screen path / bloom-composer path, map / hero), after each one list renderer.info.programs
# and the lights in the scene, and for every NEW program name the cache-key fields that differ from its nearest older sibling (outputColorSpace, toneMapping, numPointLights, ...).  -> /home/claude/work/pf1/progs.json
import asyncio, json, os, re, sys, time, subprocess, socket
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; TAG = (os.environ.get('TAG') or (sys.argv[1] if len(sys.argv) > 1 else 'after')); OUT = '/home/claude/work/pf2/' + TAG; PORT = int(os.environ.get('PF2_PORT', 8798)); PAGE = os.environ.get('PAGE') or ('pf2_%s.html' % TAG); QUAL = os.environ.get('Q', 'high')
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
    srv = None; os.makedirs(OUT, exist_ok=True)
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
            await ctx.add_init_script(INIT); pg = await ctx.new_page()
            await pg.goto('http://127.0.0.1:%d/%s?pf=1&q=%s&w=clear&h=%s&wa=0.1' % (PORT, PAGE, QUAL, os.environ.get('H', '14')))
            for i in range(3000):
                await asyncio.sleep(0.2)
                st = await pg.evaluate('({ready: !!window.__ready, late: !!(window.__bw && __bw.lateReady)})')
                if st['ready'] and st['late']: break
            K0 = await pg.evaluate(PROGS)
            LC = "(()=>{const o=[]; __bw.scene.traverse(l=>{ if(l.isLight){ let path=[]; for(let a=l;a;a=a.parent) path.push(a.name||a.type); o.push({type:l.type,int:l.intensity,vis:l.visible,mask:l.layers.mask,path:path.slice(0,4).join('<')}); } }); return o;})()"
            lc0 = await pg.evaluate(LC)
            for _ in range(int(float(os.environ.get('WAIT', 10)) * 2)):
                await pg.evaluate("window.dispatchEvent(new Event('pointermove'))"); await asyncio.sleep(0.5)
            K1 = await pg.evaluate(PROGS); lc1 = await pg.evaluate(LC)
            c0 = {k: n for n, k, u in K0}; new = [(n, k) for n, k, u in K1 if k not in c0]
            from collections import Counter
            print('numPointLights of programs at ready:', dict(Counter((decode(k) or {}).get('numPointLights') for k in c0)), ' of the new ones:', dict(Counter((decode(k) or {}).get('numPointLights') for n, k in new)))
            print('light masks at ready', [(l['type'][:5], l['mask'], l['vis']) for l in lc0], '\nlight masks after   ', [(l['type'][:5], l['mask'], l['vis']) for l in lc1])
            print('programs at ready', len(K0), 'after wait', len(K1), 'new', len(new)); print('lights at ready', json.dumps(lc0)); print('lights after   ', json.dumps(lc1))
            rows = {}
            for nm, k in new:
                d = decode(k); best, bd = None, 99
                for k0 in c0:
                    d0 = decode(k0)
                    if not d0 or not d or d0['id'] != d['id']: continue
                    diff = [f for f in FIELDS if d0.get(f) != d.get(f)]
                    for gi in (0, 1):
                        try:
                            x = int(d0['tail'][gi]) ^ int(d['tail'][gi]); diff += ['L%d:%s' % (gi + 1, BITS[gi].get(bb, 'bit%d' % bb)) for bb in range(32) if x >> bb & 1]
                        except Exception: pass
                    if d0['tail'][2:] != d['tail'][2:]: diff.append('tail2')
                    if len(diff) < bd: best, bd = diff, len(diff)
                key = (nm, ','.join(best) if best is not None else 'NEW SHADER'); rows[key] = rows.get(key, 0) + 1
            for (a, c), n in sorted(rows.items(), key=lambda r: -r[1]): print('%3d  %-40s %s' % (n, a[:40], c))
            json.dump({'at_ready': len(K0), 'after': len(K1), 'new': [[n, k] for n, k in new], 'lights0': lc0, 'lights1': lc1}, open(OUT + '/boot_diff.json', 'w'))
            await b.close()
    finally:
        if srv: srv.terminate()
asyncio.run(main())
