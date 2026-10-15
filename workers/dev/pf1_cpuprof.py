#!/usr/bin/env python3
# pf1_cpuprof.py — PF1: where the CPU time of a frame goes, by module and function (CDP sampling profiler, draws swallowed like pf1_measure.py) for the strategic map and the hero walk; also why the hero frame is 30 ms when its JS is 13 ms.
import asyncio, json, os, re, sys, time, subprocess, socket
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; OUT = os.environ.get('PF1_OUT', '/home/claude/work/pf1'); PORT = int(os.environ.get('PF1_PORT', 8792)); SECS = float(os.environ.get('PF1_SECS', 8))
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info']
BUNDLE = D + os.environ.get('PF1_BUNDLE', 'app_dbg.js'); R = {}
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
mods = []   # (first line, module) from the esbuild comments of the debug bundle
for i, l in enumerate(open(BUNDLE, encoding='utf-8', errors='replace')):
    m = re.match(r'^\s*// (\S+\.js)\s*$', l)
    if m: mods.append((i + 1, m.group(1).replace('node_modules/', 'npm:').replace('client/src/', '').replace('src/', '')))
import bisect
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
    R[name] = {'frames': s.get('n'), 'fps': s.get('fps'), 'js': s.get('js'), 'busy_ms_per_frame': round(tot / 1000 / n, 2), 'by_module_ms_per_frame': [[k, round(v / 1000 / n, 2)] for k, v in sorted(md.items(), key=lambda kv: -kv[1])[:22]], 'by_function_ms_per_frame': [[k, round(v / 1000 / n, 2)] for k, v in sorted(fn.items(), key=lambda kv: -kv[1])[:30]]}
    print(name, R[name]['frames'], 'frames; busy', R[name]['busy_ms_per_frame'], 'ms/frame', flush=True)
async def main():
    srv = None
    if not up(): srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS); ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
            await ctx.add_init_script("(()=>{ window.__nd={on:true}; const P=[['drawElements',4],['drawArrays',3],['drawElementsInstanced',5],['drawArraysInstanced',4],['drawRangeElements',6]]; for(const [k] of P){ const o=WebGL2RenderingContext.prototype[k]; WebGL2RenderingContext.prototype[k]=function(a,b,c,d,e,f){ if(window.__nd.on) return; return o.call(this,a,b,c,d,e,f); }; } })();")
            pg = await ctx.new_page(); cdp = await ctx.new_cdp_session(pg); await cdp.send('Performance.enable')
            await pg.goto('http://127.0.0.1:%d/pf1_dev.html?pf=1&q=high&w=clear&h=14&wa=0.1' % PORT)
            for i in range(1800):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready && !!(window.__bw && __bw.lateReady)'): break
            await pg.evaluate('__bw.ctl._skipIntro && __bw.ctl._skipIntro()'); await asyncio.sleep(3)
            await prof(pg, cdp, 'map', SECS)
            await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,3000)); return 1; })()" % int(time.time()))
            await pg.evaluate("__rp.setPos(40.95,-2.17,0); window.__yaw=0; window.__walk=setInterval(()=>{window.__yaw+=0.05; __rp.setLook(window.__yaw,0.2); __rp.setInput(0,0.8);},100); 1"); await asyncio.sleep(3)
            # why is a hero frame 30 ms when its JS is 13 ms?  the game's own flags + the on-screen readout
            R['hero_flags'] = await pg.evaluate("({fps: __bw.settings.fps, coolMode: __bw.settings.coolMode, idleEco: __bw.settings.idleEco, resScale: __bw.settings.resScale, dyn: __bw.Q && 0, panels: !!document.querySelector('.bwa.on,.bws.on,.bwu.on,.bwk.on,.bwh.on,.bw-set.on'), hidden: document.hidden, hz: 0})")
            R['raf_hz'] = await pg.evaluate("new Promise(r=>{let n=0,t0=0;const f=(t)=>{if(!t0)t0=t;n++;if(t-t0>1000)r(Math.round(n*1000/(t-t0)));else requestAnimationFrame(f);};requestAnimationFrame(f);})")
            await pg.evaluate("__bw.settings.perfInfo = true"); await asyncio.sleep(2.5)
            R['hud_hero'] = await pg.evaluate("(()=>{const e=[...document.querySelectorAll('div')].find(d=>/ fps · /.test(d.textContent||'') && d.children.length===0); return e? e.textContent : null;})()")
            await prof(pg, cdp, 'hero_walk', SECS)
            await pg.evaluate("__bw.settings.perfInfo = false"); await pg.evaluate('clearInterval(window.__walk); __rp.setInput(0,0); 1')
            await b.close()
    finally:
        if srv: srv.terminate()
    json.dump(R, open(OUT + '/cpuprof.json', 'w'), indent=1); print('DONE')
asyncio.run(main())
