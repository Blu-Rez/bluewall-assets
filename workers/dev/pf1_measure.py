#!/usr/bin/env python3
# pf1_measure.py — PF1 Job 1: the measuring run.  Boots the real game (dev/pf1_dev.html, ?pf=1) in a phone-sized landscape browser (844x390 @ dpr 2, software GL), records
# the views (strategic map, castle gate, fields, outer mill, night/bloom, level 30 / 50, hero standing + walking) at CPU throttle 1x / 4x / 6x, a heap-sampling run for the allocation hunt,
# a texture / geometry memory report and the start-up timeline.  Writes <PF1_OUT>/measure.json (+ screenshots).   Software GL measures the CPU side and the call counts, NOT the phone GPU.
import asyncio, json, os, sys, time, subprocess, socket
from playwright.async_api import async_playwright
D = '/home/claude/dev/'
OUT = os.environ.get('PF1_OUT', '/home/claude/work/pf1'); os.makedirs(OUT, exist_ok=True)
TAG = os.environ.get('PF1_TAG', 'measure'); QS = os.environ.get('PF1_QS', ''); VIEWS = [v for v in os.environ.get('PF1_VIEWS', '').split(',') if v]
def want(n): return (not VIEWS) or any(n == v or n.startswith(v) for v in VIEWS)
PORT = int(os.environ.get('PF1_PORT', 8791)); Q = os.environ.get('PF1_Q', 'high'); SECS = float(os.environ.get('PF1_SECS', 10)); REL = os.environ.get('PF1_REL', ''); SHR = int(os.environ.get('PF1_SHRINK', 1)); NODRAW = os.environ.get('PF1_NODRAW', '1') == '1'        # the game canvas is drawn 1/SHR linear size: calls / triangles / JS are the same, the software rasteriser is not the bottleneck
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--js-flags=--expose-gc']
R = {'q': Q, 'viewport': '844x390 (canvas 1/%d linear, see PF1_SHRINK)' % SHR, 'views': {}, 'errors': []}
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
def save(): json.dump(R, open(OUT + '/%s.json' % TAG, 'w'), indent=1)
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)

async def poker(pg, secs):                                      # a playing hand: keeps the game at its full frame rate (it drops to 30 fps after 3.5 s without a touch)
    t0 = time.time()
    while time.time() - t0 < secs:
        try: await pg.evaluate("window.dispatchEvent(new Event('pointermove'))")
        except Exception: pass
        await asyncio.sleep(0.6)

async def record(pg, cdp, secs, th):
    await cdp.send('Emulation.setCPUThrottlingRate', {'rate': th})
    await asyncio.sleep(2.0 if th == 1 else 1.0)
    pk = asyncio.create_task(poker(pg, secs + 1))
    m0 = {m['name']: m['value'] for m in (await cdp.send('Performance.getMetrics'))['metrics']}
    await pg.evaluate('__pf.start()'); await asyncio.sleep(secs); s = await pg.evaluate('__pf.stop()')
    m1 = {m['name']: m['value'] for m in (await cdp.send('Performance.getMetrics'))['metrics']}
    s['cdp'] = {k: round((m1[k] - m0[k]) / secs, 3) for k in ('TaskDuration', 'ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration', 'LayoutCount', 'RecalcStyleCount') if k in m1}
    await pk; await cdp.send('Emulation.setCPUThrottlingRate', {'rate': 1}); return s

async def view(pg, cdp, name, setup, ths=(1,), secs=None, settle=4.0, extra=None, shot=False):
    if not want(name): return
    secs = secs or SECS; v = R['views'].setdefault(name, {})
    try:
        if setup: await pg.evaluate(setup)
        await asyncio.sleep(settle)
        for th in ths: v['x%d' % th] = await record(pg, cdp, secs, th); log(name, 'x%d' % th, {k: v['x%d' % th].get(k) for k in ('n', 'fps', 'avg', 'p95', 'js', 'calls', 'tris', 'shCalls')})
        v['census'] = await pg.evaluate('__pf.census()'); v['scan'] = await pg.evaluate('__pf.scan()'); v['info'] = await pg.evaluate('__pf.info()')
        if extra: v['extra'] = await extra()
        if shot: await pg.screenshot(path='%s/%s.png' % (OUT, name))
    except Exception as e:
        R['errors'].append('%s: %s' % (name, str(e)[:200])); log('ERR', name, str(e)[:200])
    save()

CAM = "(a)=>{const B=__bw,c=B.ctl; if(c._skipIntro) c._skipIntro(); let x=a.x,z=a.z; if(a.pick){const p=B.world.picks.find(p=>a.pick.test(p.id)); if(p){const v=new B.THREE.Vector3(); p.box.getCenter(v); x=v.x; z=v.z;}} c.target.set(x,(B.world.fastHeight?B.world.fastHeight(x,z):0),z); c.dist=a.d; if(a.az!=null) c.azim=a.az; return [x,z,c.dist,c.azim];}"
def cam(**k):
    pick = k.pop('pick', None); arg = json.dumps(k)
    if pick: arg = arg[:-1] + (', ' if k else '') + 'pick: /%s/}' % pick
    return '(%s)(%s)' % (CAM, arg)

async def heap(pg, cdp, secs, th=1):
    await cdp.send('HeapProfiler.enable')
    await cdp.send('HeapProfiler.startSampling', {'samplingInterval': 8192, 'includeObjectsCollectedByMajorGC': True, 'includeObjectsCollectedByMinorGC': True})
    s = await record(pg, cdp, secs, th)
    r = await cdp.send('HeapProfiler.stopSampling'); agg = {}
    chains = {}
    def nm(cf): return (cf['functionName'] or '(anon)') + '@' + cf['url'].split('/')[-1].split('?')[0] + ':' + str(cf['lineNumber'] + 1)
    def walk(n, st):
        cf = n['callFrame']; k = nm(cf); agg[k] = agg.get(k, 0) + n['selfSize']; st = st + [k]
        if n['selfSize']: ck = ' < '.join(reversed(st[-7:])); chains[ck] = chains.get(ck, 0) + n['selfSize']
        for c in n['children']: walk(c, st)
    walk(r['profile']['head'], []); tot = sum(agg.values()) or 1
    return {'secs': secs, 'totalMB': round(tot / 1048576, 1), 'frames': s.get('n'), 'perFrameKB': round(tot / 1024 / max(1, s.get('n', 1)), 1), 'top': [[k, round(v / 1024), round(100 * v / tot, 1)] for k, v in sorted(agg.items(), key=lambda kv: -kv[1])[:30]], 'chains': [[k, round(v / 1024), round(100 * v / tot, 1)] for k, v in sorted(chains.items(), key=lambda kv: -kv[1])[:25]]}

async def main():
    srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
            await ctx.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='#game{right:auto!important;bottom:auto!important;width:'+(844/%d)+'px!important;height:'+(390/%d)+'px!important}';document.head.appendChild(s);});" % (SHR, SHR))

            if NODRAW:      # software GL cannot rasterise ~4 M triangles per frame in real time (0.7 fps): the draw commands are swallowed (three.js still does all its work and counts calls / triangles) so the run measures the CPU side
                await ctx.add_init_script("(()=>{ window.__nd={on:true}; const P=[[WebGL2RenderingContext,'drawElements',4],[WebGL2RenderingContext,'drawArrays',3],[WebGL2RenderingContext,'drawElementsInstanced',5],[WebGL2RenderingContext,'drawArraysInstanced',4],[WebGL2RenderingContext,'drawRangeElements',6]]; for(const [C,k] of P){ const o=C.prototype[k]; C.prototype[k]=function(a,b,c,d,e,f){ if(window.__nd.on) return; return o.call(this,a,b,c,d,e,f); }; } })();")
            pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg)
            pg.on('pageerror', lambda e: R['errors'].append('page: ' + str(e)[:200]))
            await cdp.send('Network.enable'); await cdp.send('Performance.enable'); got = {'bytes': 0}
            cdp.on('Network.loadingFinished', lambda e: got.__setitem__('bytes', got['bytes'] + int(e.get('encodedDataLength', 0))))
            t0 = time.time(); tl = {}
            await pg.goto('http://127.0.0.1:%d/pf1_dev.html?pf=1&q=%s&w=clear&h=14&wa=0.1%s%s' % (PORT, Q, '&rel=1' if REL else '', QS))
            for i in range(3600):
                await asyncio.sleep(0.5); t = round(time.time() - t0, 1)
                st = await pg.evaluate('({bw: !!window.__bw, t: window.__bw ? __bw.t : 0, ready: !!window.__ready, late: !!(window.__bw && __bw.lateReady)})')
                for k, key in (('bw', 'world_built'), ('ready', 'ready_screen'), ('late', 'late_ready')):
                    if st[k] and key not in tl: tl[key] = [t, got['bytes']]
                if st['t'] and 'first_frame' not in tl: tl['first_frame'] = [t, got['bytes']]
                if st['ready'] and st['late']: break
            R['startup'] = {'timeline_s_bytes': tl, 'bytes_total': got['bytes'], 'at_1_6mbit_s': {k: round(v[1] / 200000, 1) for k, v in tl.items()}}
            res = await pg.evaluate("performance.getEntriesByType('resource').map(r=>({u:r.name.split('/').slice(-3).join('/'),b:r.encodedBodySize,s:Math.round(r.startTime),e:Math.round(r.responseEnd)}))")
            R['startup']['resources'] = len(res); R['startup']['all'] = [[r['u'], r['b'], r['s'], r['e']] for r in res]; R['startup']['top'] = sorted(res, key=lambda r: -r['b'])[:20]
            by = {}
            for r in res:
                k = r['u'].rsplit('.', 1)[-1].lower() if '.' in r['u'] else '?'; by[k] = by.get(k, 0) + r['b']
            R['startup']['bytes_by_ext'] = by; R['device'] = await pg.evaluate('__pf.device()')
            log('booted', tl, 'bytes', got['bytes']); save()
            # let the OTHER render path (the night bloom one) compile in the background (it only runs while nobody touches the screen)
            for i in range(20):
                if await pg.evaluate('!!(__bw.pathReady && __bw.pathReady.rt && __bw.pathReady.screen)'): break
                await asyncio.sleep(1)
            R['pathReady'] = await pg.evaluate('JSON.stringify(__bw.pathReady)'); log('paths', R['pathReady'])
            R['programs'] = await pg.evaluate('(__bw.renderer.info.programs||[]).length')
            await pg.evaluate('__bw.ctl._skipIntro && __bw.ctl._skipIntro()'); await asyncio.sleep(2)
            # --- strategic views, level of the dev save
            await view(pg, cdp, 'map', None, ths=(1, 4, 6))
            if want('map'): R['mskip_map'] = await pg.evaluate('__pf.mskip.check()'); log('mskip map', R['mskip_map'])
            await view(pg, cdp, 'gate', cam(x=41, z=-2, d=75), ths=(1, 4, 6))
            await view(pg, cdp, 'fields', cam(x=211, z=1.6, d=90))
            await view(pg, cdp, 'mill', cam(pick='mill', d=70))
            await view(pg, cdp, 'map_night', "__bw.ov = {night: 1}; window.__bwPath = 'c'; (%s)({x:18,z:16,d:240,az:null})" % CAM, ths=(1, 4))
            await pg.evaluate('__bw.ov = {}; window.__bwPath = null')
            # --- allocation hunt (map view, then repeated in the hero walk below)
            try:
                if want('heap'): await pg.evaluate(cam(x=18, z=16, d=240)); await asyncio.sleep(3); R['heap_map'] = await heap(pg, cdp, SECS); log('heap_map', R['heap_map']['perFrameKB'], 'KB/frame')
            except Exception as e: R['errors'].append('heap_map ' + str(e)[:150])
            # --- levels 30 and 50 (the castle tiers)
            for lv in (30, 50):
                await view(pg, cdp, 'L%d_map' % lv, "__bw.world.setLevel(%d); (%s)({x:18,z:16,d:240,az:null})" % (lv, CAM), settle=8.0, ths=(1, 4))
                await view(pg, cdp, 'L%d_gate' % lv, cam(x=41, z=-2, d=75), ths=(1,))
                try:
                    if want('L%d' % lv): R['mem_L%d' % lv] = await pg.evaluate('__pf.mem()')
                except Exception as e: R['errors'].append('mem ' + str(e)[:150])
                save()
            await pg.evaluate('__bw.world.setLevel(30)'); await asyncio.sleep(3)
            # --- hero mode
            try:
                if not (want('hero') or want('hero_walk')): raise RuntimeError('skip hero')
                await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,3000)); return 1; })()" % int(time.time()))
                await view(pg, cdp, 'hero_gate', "__rp.setPos(40.95,-2.17,0); __rp.setLook(0.3,0.25); 1", ths=(1, 4, 6), secs=8)
                await view(pg, cdp, 'hero_fields', "__rp.setPos(211,1.57,0); __rp.setLook(0.3,0.25); 1", secs=8)
                await view(pg, cdp, 'hero_mill', "__rp.goNear('ws:mill_wind2', 4); 1", secs=8)
                await pg.evaluate("__rp.setPos(40.95,-2.17,0); window.__yaw=0; window.__walk=setInterval(()=>{window.__yaw+=0.05; __rp.setLook(window.__yaw,0.2); __rp.setInput(0,0.8);},100); 1")
                await view(pg, cdp, 'hero_walk', None, ths=(1,), secs=20, settle=2)
                await view(pg, cdp, 'hero_walk4', None, ths=(4, 6), secs=10, settle=1, shot=False)
                R['mskip_hero'] = await pg.evaluate('__pf.mskip.check()'); log('mskip hero', R['mskip_hero'])
                try:
                  if want('heap'): R['heap_hero'] = await heap(pg, cdp, SECS); log('heap_hero', R['heap_hero']['perFrameKB'], 'KB/frame')
                except Exception as e: R['errors'].append('heap_hero ' + str(e)[:150])
                R['mem_hero'] = await pg.evaluate('__pf.mem()')
                await pg.evaluate('clearInterval(window.__walk); __rp.setInput(0,0); 1')
            except Exception as e:
                if 'skip hero' not in str(e): R['errors'].append('hero ' + str(e)[:200]); log('ERR hero', str(e)[:200])
            R['programs_end'] = await pg.evaluate('(__bw.renderer.info.programs||[]).length')
            # --- the owner's benchmark itself (dev build: hero walk + idle), headless numbers for the report
            try:
                if not want('bench'): raise RuntimeError('skip bench')
                await pg.evaluate('__rp.exit && __rp.exit(); 1'); await asyncio.sleep(2)
                R['bench'] = await pg.evaluate('BW_bench.run({secs: %s})' % os.environ.get('PF1_BENCH_SECS', 10)); log('bench', R['bench'].get('text') if R['bench'] else None)
            except Exception as e:
                if 'skip bench' not in str(e): R['errors'].append('bench ' + str(e)[:200])
            save(); await b.close()
    finally:
        if srv: srv.terminate()
    log('DONE', len(R['errors']), 'errors'); save()
asyncio.run(main())
