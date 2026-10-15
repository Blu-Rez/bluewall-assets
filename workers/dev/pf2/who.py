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


HOOK = """(()=>{ const r=__bw.renderer; window.__who=[]; const o=r.renderBufferDirect.bind(r);
 r.renderBufferDirect=function(cam,scene,geo,mat,obj,grp){ const n0=(r.info.programs||[]).length; const res=o(cam,scene,geo,mat,obj,grp); const n1=(r.info.programs||[]).length;
   if(n1>n0){ const chain=[]; for(let a=obj;a&&chain.length<5;a=a.parent) chain.push((a.name||a.type)); window.__who.push({t:Math.round(performance.now()),added:n1-n0,mat:mat.type+':'+(mat.name||''),obj:obj.type+':'+(obj.name||''),inst:!!obj.isInstancedMesh,skin:!!obj.isSkinnedMesh,cast:!!obj.castShadow,tr:!!mat.transparent,map:!!mat.map,alphaTest:mat.alphaTest,chain:chain.join('<')}); }
   return res; }; })()"""
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
                st = await pg.evaluate('({b: !!window.__bw})')
                if st['b']: break
            await pg.evaluate(HOOK)     # (installed as soon as the dev handle exists: everything that adds a program from here on is named)
            for i in range(3000):
                await asyncio.sleep(0.4)
                st = await pg.evaluate('({ready: !!window.__ready, late: !!(window.__bw && __bw.lateReady)})')
                if st['ready'] and st['late']: break
            n_ready = await pg.evaluate("__bw.renderer.info.programs.length"); who_ready = await pg.evaluate("window.__who.length")
            for _ in range(int(float(os.environ.get('WAIT', 12)) * 2)):
                await pg.evaluate("window.dispatchEvent(new Event('pointermove'))"); await asyncio.sleep(0.5)
            W = await pg.evaluate("window.__who"); n_end = await pg.evaluate("__bw.renderer.info.programs.length")
            print('programs at ready', n_ready, 'end', n_end, 'events before ready', who_ready)
            for w in W[who_ready:]: print(json.dumps(w))
            json.dump(W, open(OUT + '/who.json', 'w'))
            await b.close()
    finally:
        if srv: srv.terminate()
asyncio.run(main())
