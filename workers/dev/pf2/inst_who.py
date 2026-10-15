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

Q5 = """(()=>{ const out=[]; __bw.scene.traverse(o=>{ if(!o.isInstancedMesh) return; const ms=Array.isArray(o.material)?o.material:[o.material]; for(const m of ms){ if(!m) continue; if(m.type==='MeshStandardMaterial' && !m.name){ const k=m.uuid; (window.__mm=window.__mm||{})[k]=(window.__mm[k]||0)+1; } } });
 const by={}; __bw.scene.traverse(o=>{ if(!o.isInstancedMesh) return; const ms=Array.isArray(o.material)?o.material:[o.material]; for(const m of ms){ if(!m) continue; (by[m.uuid]=by[m.uuid]||{ic:[],no:[]})[o.instanceColor?'ic':'no'].push({name:o.name,count:o.count,parent:(o.parent&&o.parent.name)||o.parent.type,grand:(o.parent&&o.parent.parent&&o.parent.parent.name)||'',cast:o.castShadow,recv:o.receiveShadow,geo:o.geometry.attributes.position.count,ud:Object.keys(o.userData||{}).join(',')}); } });
 for(const k in by){ if(by[k].ic.length && by[k].no.length) out.push(by[k]); } return out; })()"""
async def main():
    srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
            await ctx.add_init_script(INIT); pg = await ctx.new_page()
            await pg.goto('http://127.0.0.1:%d/%s?pf=1&q=%s&w=clear&h=14&wa=0.1' % (PORT, PAGE, QUAL))
            for i in range(3000):
                await asyncio.sleep(0.4)
                st = await pg.evaluate('({ready: !!window.__ready, late: !!(window.__bw && __bw.lateReady)})')
                if st['ready'] and st['late']: break
            r = await pg.evaluate(Q5)
            print(json.dumps(r, indent=1)[:3000])
            await b.close()
    finally:
        if srv: srv.terminate()
asyncio.run(main())
