#!/usr/bin/env python3
# an1r3_measure.py — AN1_R3 F6: what the movers (villagers, animals, worksite packs, knights, creatures) cost per frame, before / after the update-rate LOD.
# Boots the real game (dev/pf1_dev.html, ?pf=1, software GL with the draw calls swallowed = CPU side only, 844x390), and for a few views records
#   * the PF1 per-system split (life / moat = worksites + wslife + moat / units+patrols / render submit) and JS ms per frame at CPU throttle x1 and x4,
#   * a CDP sampling profile at x1: ms per frame by module and by function (so the cost of OUR files is visible),
#   * the F6 counters (window.__an1lod: how many movers were stepped at which level, how many steps were skipped).
# Env: AN1_TAG (output name), AN1_QS (extra query string, e.g. &an1lod=0), AN1_VIEWS (comma list), AN1_SECS, AN1_OUT, AN1_BUNDLE (app_dbg.js)
import asyncio, json, os, re, sys, time, subprocess, socket, bisect
from playwright.async_api import async_playwright
D = '/home/claude/dev/'
OUT = os.environ.get('AN1_OUT', '/home/claude/work/an1r3'); os.makedirs(OUT, exist_ok=True)
TAG = os.environ.get('AN1_TAG', 'run'); QS = os.environ.get('AN1_QS', ''); SECS = float(os.environ.get('AN1_SECS', 10)); PORT = int(os.environ.get('AN1_PORT', 8793))
AB = os.environ.get('AN1_AB') == '1'                    # interleaved A/B in ONE page: on, off, on, off (the machine's speed drifts between runs)
VIEWS = [v for v in os.environ.get('AN1_VIEWS', 'map,gate,fields,mill,town').split(',') if v]
BUNDLE = D + os.environ.get('AN1_BUNDLE', 'app_dbg.js')
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--js-flags=--expose-gc']
R = {'viewport': '844x390', 'views': {}, 'errors': []}
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)
def save(): json.dump(R, open(OUT + '/%s.json' % TAG, 'w'), indent=1)

mods = []
for i, l in enumerate(open(BUNDLE, encoding='utf-8', errors='replace')):
    m = re.match(r'^\s*// (\S+\.js)\s*$', l)
    if m: mods.append((i + 1, m.group(1).replace('node_modules/', 'npm:').replace('client/src/', '').replace('src/', '')))
starts = [a for a, _ in mods]
def module(url, line):
    if 'app_dbg' in url or url.endswith(os.path.basename(BUNDLE)):
        i = bisect.bisect_right(starts, line) - 1; return mods[i][1] if i >= 0 else '?bundle'
    return url.split('/')[-1].split('?')[0] or '(native)'

async def poker(pg, secs):
    t0 = time.time()
    while time.time() - t0 < secs:
        try: await pg.evaluate("window.dispatchEvent(new Event('pointermove'))")
        except Exception: pass
        await asyncio.sleep(0.6)

async def record(pg, cdp, secs, th, profile=False):
    await cdp.send('Emulation.setCPUThrottlingRate', {'rate': th}); await asyncio.sleep(2.0 if th == 1 else 1.0)
    pk = asyncio.create_task(poker(pg, secs + 1))
    if profile: await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {'interval': 250}); await cdp.send('Profiler.start')
    await pg.evaluate('window.__an1lod && __an1lod.reset && __an1lod.reset()')
    await pg.evaluate('__pf.start()'); await asyncio.sleep(secs); s = await pg.evaluate('__pf.stop()')
    prof = None
    if profile:
        r = await cdp.send('Profiler.stop'); p = r['profile']; nodes = {n['id']: n for n in p['nodes']}; self_us = {}
        for sid, dt in zip(p['samples'], p['timeDeltas']): self_us[sid] = self_us.get(sid, 0) + dt
        fn, md = {}, {}
        for nid, us in self_us.items():
            cf = nodes[nid]['callFrame']; m = module(cf['url'], cf['lineNumber'] + 1); k = '%s %s:%d' % (cf['functionName'] or '(anon)', m, cf['lineNumber'] + 1)
            if cf['functionName'] in ('(idle)', '(program)', '(garbage collector)'): k = cf['functionName']; m = k
            fn[k] = fn.get(k, 0) + us; md[m] = md.get(m, 0) + us
        n = max(1, s.get('n', 1))
        prof = {'by_module': {k: round(v / 1000 / n, 3) for k, v in md.items()}, 'top_fn': [[k, round(v / 1000 / n, 3)] for k, v in sorted(fn.items(), key=lambda kv: -kv[1])[:40]]}
    await pk; await cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1})
    st = await pg.evaluate('window.__an1lod && __an1lod.snapshot ? __an1lod.snapshot() : null')
    keep = {k: s.get(k) for k in ('n', 'fps', 'avg', 'p95', 'js', 'calls', 'tris')}; keep['prof'] = {k: v for k, v in (s.get('prof') or {}).items() if k in ('life', 'moat', 'units+patrols', 'army', 'extras', 'render(submit)', 'dragon')}
    keep['f6'] = st
    if prof: keep['cpu'] = prof
    return keep

CAM = "(a)=>{const B=__bw,c=B.ctl; if(c._skipIntro) c._skipIntro(); let x=a.x,z=a.z; if(a.pick){const p=B.world.picks.find(p=>a.pick.test(p.id)); if(p){const v=new B.THREE.Vector3(); p.box.getCenter(v); x=v.x; z=v.z;}} c.target.set(x,(B.world.fastHeight?B.world.fastHeight(x,z):0),z); c.dist=a.d; if(a.az!=null) c.azim=a.az; return [x,z,c.dist,c.azim];}"
def cam(**k):
    pick = k.pop('pick', None); arg = json.dumps(k)
    if pick: arg = arg[:-1] + (', ' if k else '') + 'pick: /%s/}' % pick
    return '(%s)(%s)' % (CAM, arg)
VIEWDEF = {
    'map':    (None, (1, 4), True),
    'gate':   (cam(x=41, z=-2, d=75), (1, 4), True),
    'fields': (cam(x=211, z=1.6, d=90), (1, 4), True),
    'mill':   (cam(pick='mill', d=70), (1,), False),
    'town':   (cam(x=18, z=16, d=120), (1,), True),
    'close':  (cam(pick='mill', d=28), (1,), False),      # near the workers: nothing may change here
}
async def main():
    srv = None
    if not up(): srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
            await ctx.add_init_script("(()=>{ window.__nd={on:true}; const P=['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced','drawRangeElements']; for(const k of P){ const o=WebGL2RenderingContext.prototype[k]; WebGL2RenderingContext.prototype[k]=function(a,b,c,d,e,f){ if(window.__nd.on) return; return o.call(this,a,b,c,d,e,f); }; } })();")
            pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg); await cdp.send('Performance.enable')
            pg.on('pageerror', lambda e: R['errors'].append('page: ' + str(e)[:200]))
            await pg.goto('http://127.0.0.1:%d/%s?pf=1&q=high&w=clear&h=14&wa=0.1%s' % (PORT, os.environ.get('AN1_PAGE', 'pf1_dev.html'), QS))
            for i in range(3600):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready && !!(window.__bw && __bw.lateReady)'): break
            log('booted'); await pg.evaluate('__bw.ctl._skipIntro && __bw.ctl._skipIntro()'); await asyncio.sleep(3)
            for i in range(40):                                  # the worksite grids are built a few ms per frame: let them finish
                await asyncio.sleep(1)
            R['lod_cfg'] = await pg.evaluate('window.__an1lod ? JSON.stringify(__an1lod.cfg) : null')
            for name in VIEWS:
                setup, ths, prof = VIEWDEF[name]; v = R['views'].setdefault(name, {})
                try:
                    if setup: await pg.evaluate(setup)
                    await asyncio.sleep(4)
                    for th in (tuple(int(x) for x in os.environ['AN1_THS'].split(',')) if os.environ.get('AN1_THS') else ths):
                        if AB:
                            ab = {'on': [], 'off': []}
                            for cond in ('on', 'off', 'on', 'off'):
                                await pg.evaluate('(c)=>{ if(window.__an1lod) __an1lod.cfg.on = c; }', cond == 'on')
                                ab[cond].append(await record(pg, cdp, SECS, th, profile=False))
                            await pg.evaluate('__an1lod.cfg.on = true')
                            v['x%d' % th] = ab
                            m = lambda c, f: sum(f(r) for r in ab[c]) / len(ab[c])
                            vals = {k: (m('on', lambda r, k=k: r['prof'].get(k, 0)), m('off', lambda r, k=k: r['prof'].get(k, 0))) for k in ('life', 'moat', 'units+patrols')}; vals['js'] = (m('on', lambda r: r['js']), m('off', lambda r: r['js'])); vals['fps'] = (m('on', lambda r: r['fps']), m('off', lambda r: r['fps']))
                            log(name, 'x%d' % th, 'ON/OFF', {k: '%.2f/%.2f' % x for k, x in vals.items()})
                        else:
                            v['x%d' % th] = await record(pg, cdp, SECS, th, profile=(prof and th == 1)); log(name, 'x%d' % th, {k: v['x%d' % th].get(k) for k in ('n', 'fps', 'js', 'prof')})
                except Exception as e:
                    R['errors'].append('%s: %s' % (name, str(e)[:200])); log('ERR', name, str(e)[:200])
                save()
            await b.close()
    finally:
        if srv: srv.terminate()
    log('DONE', len(R['errors']), 'errors'); save()
asyncio.run(main())
