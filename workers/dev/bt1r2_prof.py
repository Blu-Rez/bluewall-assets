#!/usr/bin/env python3
# bt1r2_prof.py <tag> — BT1_R2 job 1b: WHERE the battle's CPU time goes (CDP sampling profiler, by module / function) and WHAT the unit crowds cost per kind (instances, calls, triangles).
# Same boot as bt1r2_perf.py (dev/bt1r2_<tag>.html, ?pf=1, 844x390, draws swallowed).  Writes <OUT>/prof_<tag>.json and prints the top lists.
#   env: Q=low  LV=30  SECS=8  OUT=/home/claude/work/bt1r2  PHASES=deploy,fight
import asyncio, json, os, re, sys, time, bisect
from playwright.async_api import async_playwright
TAG = sys.argv[1] if len(sys.argv) > 1 else 'before'
Q = os.environ.get('Q', 'low'); LV = int(os.environ.get('LV', 30)); SECS = float(os.environ.get('SECS', 8)); PH = os.environ.get('PHASES', 'deploy,fight').split(',')
OUT = os.environ.get('OUT', '/home/claude/work/bt1r2'); os.makedirs(OUT, exist_ok=True)
BUNDLE = '/home/claude/dev/app_bt1r2_%s/wall.js' % TAG
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--js-flags=--expose-gc']
R = {'tag': TAG, 'prof': {}, 'kinds': {}, 'errors': []}
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)
mods = []
for i, l in enumerate(open(BUNDLE, encoding='utf-8', errors='replace')):
    m = re.match(r'^\s*// (\S+\.js)\s*$', l)
    if m: mods.append((i + 1, m.group(1).replace('node_modules/', 'npm:').replace('client/src/', '').replace('src/', '')))
starts = [a for a, _ in mods]
def module(url, line):
    if 'wall.js' in url:
        i = bisect.bisect_right(starts, line) - 1; return mods[i][1] if i >= 0 else '?bundle'
    return url.split('/')[-1].split('?')[0] or '(native)'
async def poker(pg, secs):
    t0 = time.time()
    while time.time() - t0 < secs:
        try: await pg.evaluate("window.dispatchEvent(new Event('pointermove'))")
        except Exception: pass
        await asyncio.sleep(0.6)
async def prof(pg, cdp, name, secs):
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {'interval': 250})
    await pg.evaluate('__pf.start()'); await cdp.send('Profiler.start'); pk = asyncio.create_task(poker(pg, secs + 1)); await asyncio.sleep(secs)
    r = await cdp.send('Profiler.stop'); s = await pg.evaluate('__pf.stop()'); await pk
    p = r['profile']; nodes = {n['id']: n for n in p['nodes']}; self_us = {}
    for sid, dt in zip(p['samples'], p['timeDeltas']): self_us[sid] = self_us.get(sid, 0) + dt
    fn, md, tot = {}, {}, sum(self_us.values()) or 1
    for nid, us in self_us.items():
        cf = nodes[nid]['callFrame']; m = module(cf['url'], cf['lineNumber'] + 1); k = '%s %s:%d' % (cf['functionName'] or '(anon)', m, cf['lineNumber'] + 1)
        if cf['functionName'] in ('(idle)', '(program)', '(garbage collector)'): k = cf['functionName']; m = k
        fn[k] = fn.get(k, 0) + us; md[m] = md.get(m, 0) + us
    n = max(1, s.get('n', 1))
    R['prof'][name] = {'frames': s.get('n'), 'fps': s.get('fps'), 'js': s.get('js'), 'calls': s.get('calls'), 'tris': s.get('tris'), 'busy_ms_per_frame': round(tot / 1000 / n, 2),
        'by_module': [[k, round(v / 1000 / n, 2)] for k, v in sorted(md.items(), key=lambda kv: -kv[1])[:16]], 'by_function': [[k, round(v / 1000 / n, 2)] for k, v in sorted(fn.items(), key=lambda kv: -kv[1])[:28]]}
    log(name, R['prof'][name]['frames'], 'frames; busy', R['prof'][name]['busy_ms_per_frame'], 'ms/frame')
    for k, v in R['prof'][name]['by_module'][:8]: log('   module', k, v)
    for k, v in R['prof'][name]['by_function'][:14]: log('   fn', k, v)
KINDS = """(() => { const s = __bw.battle.session, K = s.views.kinds, out = {}; for (const [n, k] of Object.entries(K)) { let calls = 0, tris = 0, inst = 0; k.group.traverse((o) => { if (!o.geometry || o.visible === false) return; const g = o.geometry, c = o.isInstancedMesh ? o.count : 1; if (!c) return; calls++; inst += c; tris += (g.index ? g.index.count : g.attributes.position.count) / 3 * c; }); out[n] = { calls, tris: Math.round(tris), inst, drawn: k.drawn ? k.drawn.slice() : null }; } return out; })()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
        await ctx.add_init_script("(()=>{ window.__nd={on:true}; const P=[[WebGL2RenderingContext,'drawElements'],[WebGL2RenderingContext,'drawArrays'],[WebGL2RenderingContext,'drawElementsInstanced'],[WebGL2RenderingContext,'drawArraysInstanced'],[WebGL2RenderingContext,'drawRangeElements']]; for(const [C,k] of P){ const o=C.prototype[k]; C.prototype[k]=function(a,b,c,d,e,f){ if(window.__nd.on) return; return o.call(this,a,b,c,d,e,f); }; } })();")
        pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg)
        pg.on('pageerror', lambda e: R['errors'].append('page: ' + str(e)[:300]))
        await pg.goto('http://127.0.0.1:8777/bt1r2_%s.html?pf=1&q=%s&w=clear&h=14&wa=0.1&lv=%d' % (TAG, Q, LV))
        for i in range(3600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        tgt = json.dumps({'id': 'bt1', 'name': 'Rival', 'emblem': 'flame', 'ratio': 1, 'levels': {'keep': LV, 'wall': LV, 'towers': LV}, 'seed': 12345, 'power': 1000, 'loot': {'ruby': 1, 'emerald': 1, 'turq': 1}})
        await pg.evaluate('__bw.battle.start(%s)' % tgt)
        for i in range(2400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        await asyncio.sleep(3); await pg.evaluate('__bw.battle.session.cam.intro = 0'); await asyncio.sleep(2)
        if 'deploy' in PH:
            R['kinds']['deploy'] = await pg.evaluate(KINDS); await prof(pg, cdp, 'deploy', SECS)
        if 'fight' in PH:
            await pg.evaluate("(() => { const s = __bw.battle.session, k = __bw.world.baseMeta.keep; for (const t of s.types) s.sim.send(t, k.x, k.z); s.started = true; })()")
            await asyncio.sleep(12); R['kinds']['fight'] = await pg.evaluate(KINDS); await prof(pg, cdp, 'fight', SECS)
        for ph, ks in R['kinds'].items():
            log('kinds', ph); tot = sum(v['tris'] for v in ks.values())
            for n, v in sorted(ks.items(), key=lambda kv: -kv[1]['tris'])[:14]: log('   %-14s calls %3d inst %4d tris %8d (%4.1f%%) drawn %s' % (n, v['calls'], v['inst'], v['tris'], 100.0 * v['tris'] / max(1, tot), v['drawn']))
        json.dump(R, open('%s/prof_%s.json' % (OUT, TAG), 'w'), indent=1); await b.close()
asyncio.run(main())
