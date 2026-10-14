#!/usr/bin/env python3
# TR2-S4c — drive the real game (dev_s35.html) on the home map: per camera view -> calls / tris (renderer.info) + a full-size PNG + a scene census (tris x instances per group).
#   URLQ="s4c=1&s=2" VIEWS=top,ctr SHOTS=1 python3 tr2_s4c_run.py TAG [LV]       (static server :8777 from /home/claude/dev; software GL: NOT a phone number)
#   CAMS="name=js;name2=js2" adds custom camera views (js sets c.target / c.dist / c.polar / c.azim, c = __bw.ctl)
import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
TAG = sys.argv[1]; LV = sys.argv[2] if len(sys.argv) > 2 else '30'
OUT = '/home/claude/work/s4c/' + TAG; os.makedirs(OUT, exist_ok=True)
W = int(os.environ.get('W', 1100)); H = int(os.environ.get('H', 620)); URLQ = os.environ.get('URLQ', 's4c=1'); Q = os.environ.get('Q', 'low')
VIEWS = {
  'top':    "c.target.set(0,0,0); c.dist=c.maxD*1.0; c.polar=0.25; c.azim=0.6;",
  'ctr':    "c.target.set(0,0,0); c.dist=c.maxD*0.7; c.polar=0.95; c.azim=0.5;",
  'town':   "c.target.set(60,0,150); c.dist=140; c.polar=0.9; c.azim=0.6;",
  'fields': "c.target.set(235,0,10); c.dist=150; c.polar=0.9; c.azim=1.2;",
  'lake':   "c.target.set(-128,0,230); c.dist=150; c.polar=0.95; c.azim=2.2;",
  'rnorth': "c.target.set(0,0,-105); c.dist=130; c.polar=0.95; c.azim=3.14;",
  'rgateNE':"c.target.set(128,0,-84); c.dist=85; c.polar=0.95; c.azim=2.3;",
  'streets':"c.target.set(20,0,15); c.dist=95; c.polar=0.95; c.azim=0.6;",
  'keep':   "c.target.set(0,0,-40); c.dist=95; c.polar=0.95; c.azim=3.5;",
  'rbridge':"c.target.set(-94,0,-58); c.dist=70; c.polar=0.9; c.azim=0.3;",
}
for kv in filter(None, os.environ.get('CAMS', '').split(';')):
    k, v = kv.split('=', 1); VIEWS[k] = v
want = os.environ.get('VIEWS', 'top,ctr,town,fields,lake').split(',')
CENSUS = """() => { const g = {}; const add = (k, tri, n) => { const e = g[k] || (g[k] = { meshes: 0, inst: 0, tris: 0 }); e.meshes++; e.inst += n; e.tris += tri * n; };
  __bw.scene.traverse((o) => { if (!(o.isMesh)) return; if (!o.visible) return; const geo = o.geometry; const tri = (geo.index ? geo.index.count : geo.attributes.position.count) / 3; const n = o.isInstancedMesh ? o.count : 1;
    let k = o.name || (o.material && o.material.name) || 'unnamed'; if (o.isInstancedMesh && !/^(sc_|tr2)/.test(k)) k = (o.material && o.material.name ? o.material.name : 'inst') + (o.name ? ':' + o.name : '') + '#' + Math.round(tri);
    add((o.isInstancedMesh ? 'I ' : 'M ') + k, tri, n); });
  return Object.entries(g).sort((a, b) => b[1].tris - a[1].tris).slice(0, 40); }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': W, 'height': H}, device_scale_factor=1)
        logs = []; pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400]))
        pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if m.type in ('error', 'warning') and '404' not in m.text and 'GPU stall' not in m.text else None)
        t0 = time.time(); T = lambda: round(time.time() - t0)
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=' + Q + '&w=clear&h=14&wa=0.1&lv=' + LV + '&' + URLQ)
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        print('home ready', T(), flush=True)
        await asyncio.sleep(3)
        await pg.evaluate('() => { const c=__bw.ctl; if (c.intro) { c.intro=null; } }')
        res = {}
        async def meas():
            return await pg.evaluate("""async () => { const bw = __bw, r = bw.renderer; r.info.autoReset = false; r.info.reset(); const f0 = bw.frames; await new Promise((res) => { const t0 = bw.frames; const iv = setInterval(() => { if (bw.frames - t0 >= 3) { clearInterval(iv); res(); } }, 100); }); const n = bw.frames - f0; const o = { calls: Math.round(r.info.render.calls / n), tris: Math.round(r.info.render.triangles / n), prog: r.info.programs ? r.info.programs.length : -1, n }; r.info.autoReset = true; return o; }""")
        for nm in want:
            await pg.evaluate('() => { const c=__bw.ctl; ' + VIEWS[nm] + ' }')
            await asyncio.sleep(float(os.environ.get('SETTLE', 8)))
            a = await meas(); res[nm] = a; print('perf', nm, a, flush=True)
            if os.environ.get('SHOTS', '1') == '1': await pg.screenshot(path=f'{OUT}/{nm}.png', timeout=240000)
        if os.environ.get('CENSUS'):
            c = await pg.evaluate(CENSUS); res['census'] = c
            for k, v in c[:30]: print('census', k.ljust(34), v['meshes'], v['inst'], v['tris'])
        if os.environ.get('CENSUS'):
            c2 = await pg.evaluate(CENSUS.replace('b[1].tris - a[1].tris', 'b[1].meshes - a[1].meshes').replace('.slice(0, 40)', '.slice(0, 45)')); res['censusM'] = c2
            for k, v in c2[:45]: print('censusM', k.ljust(34), v['meshes'], v['inst'], v['tris'])
        res['s4c'] = await pg.evaluate('() => window.__S4C ? window.__S4C.count : null'); print('s4c', res['s4c']); res['stats'] = await pg.evaluate("() => { const r = __bw.renderer; return { geometries: r.info.memory.geometries, textures: r.info.memory.textures, programs: r.info.programs ? r.info.programs.length : -1 }; }")
        print('stats', res['stats'])
        json.dump(res, open(f'{OUT}/results.json', 'w'))
        print('LOGS', json.dumps(logs[:14]))
        await b.close()
asyncio.run(main())
