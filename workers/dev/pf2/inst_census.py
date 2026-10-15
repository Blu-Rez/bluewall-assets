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


INST = """(()=>{ const by=new Map(); __bw.scene.traverse(o=>{ if(!o.isInstancedMesh) return; const ms=Array.isArray(o.material)?o.material:[o.material]; for(const m of ms){ if(!m) continue; let e=by.get(m.uuid); if(!e){ e={name:m.name||m.type, type:m.type, ic:0, noic:0, n:0, parents:{}}; by.set(m.uuid,e); } if(o.instanceColor) e.ic++; else e.noic++; e.n+=o.count; let a=o; while(a.parent && a.parent.type!=='Scene') a=a.parent; const top=(a.name||a.type)+(a.parent&&a.parent.name==='late-stage'?'':''); e.parents[top]=(e.parents[top]||0)+1; } });
 return [...by.values()]; })()"""
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
                await asyncio.sleep(0.4)
                st = await pg.evaluate('({ready: !!window.__ready, late: !!(window.__bw && __bw.lateReady)})')
                if st['ready'] and st['late']: break
            await pg.evaluate("__bw.ctl._skipIntro && __bw.ctl._skipIntro()")
            for _ in range(20):
                await pg.evaluate("window.dispatchEvent(new Event('pointermove'))"); await asyncio.sleep(0.5)
            K = await pg.evaluate(PROGS); M = await pg.evaluate(INST)
            json.dump({'progs': K, 'inst': M}, open(OUT + '/inst_census.json', 'w'))
            keys = {k for n, k, u in K}; ib = {v: k for k, v in BITS[0].items()}
            bic, bi = ib.get('instancingColor'), ib.get('instancing')
            print('programs', len(K), 'bits', bic, bi)
            ic = twin_ic = noic = 0; names = {}
            for n, k, u in K:
                t = k.split(',')
                try: i = next(j for j, x in enumerate(t) if x in ('highp', 'mediump', 'lowp') and j >= 1)
                except StopIteration: continue
                ti = i + len(FIELDS)
                v = int(t[ti]); has_ic = bool(v >> bic & 1); has_i = bool(v >> bi & 1)
                alt = list(t); alt[ti] = str(v ^ (1 << bic)); altk = ','.join(alt)
                if has_ic:
                    ic += 1
                    if altk in keys: twin_ic += 1; names[n or '(empty)'] = names.get(n or '(empty)', 0) + 1
                elif has_i:
                    noic += 1
            print('instanced programs WITH instanceColor:', ic, ' of them with a twin WITHOUT it (same everything else):', twin_ic, ' instanced WITHOUT instanceColor:', noic)
            print('twin names', sorted(names.items(), key=lambda r: -r[1])[:12])
            both = [e for e in M if e['ic'] and e['noic']]; only_ic = [e for e in M if e['ic'] and not e['noic']]; only_no = [e for e in M if not e['ic'] and e['noic']]
            print('materials on instanced meshes:', len(M), ' both (with and without instanceColor):', len(both), ' only with:', len(only_ic), ' only without:', len(only_no))
            for e in sorted(both, key=lambda e: -e['n'])[:15]: print('  both', json.dumps(e)[:300])
            await b.close()
    finally:
        if srv: srv.terminate()
asyncio.run(main())
