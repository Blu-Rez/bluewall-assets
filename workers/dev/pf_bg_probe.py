import asyncio, sys, os, json, time, collections
from playwright.async_api import async_playwright
# pf_bg_probe.py — PERF2 / P2: the idle shader compile (bgCompile) of the OTHER render path, watched for WINDOW seconds after the home is ready.
#   Speed independent numbers: programs linked per main-thread task (a task of 3 programs = ~300 ms on the phone), long tasks (relative: software GL), frames the loop managed.
#   env: PAGE=dev_s35.html (dev_s35_base.html = the p39 bundle)  Q=high  HOUR=14  LV=30  WINDOW=300  VW=260 VH=560  PROFILE=/tmp/pwprof  TOUCH=1 (tap the canvas every 2 s: the compile must stay away while the player plays)  INTRO=1 (do not skip the intro)
Q = os.environ.get('Q', 'high'); LV = os.environ.get('LV', '30'); HOUR = os.environ.get('HOUR', '14'); PAGE = os.environ.get('PAGE', 'dev_s35.html'); WINDOW = int(os.environ.get('WINDOW', '300'))
INIT = """
(() => {
  window.__lt = []; window.__tasks = []; window.__t0 = 0;
  { const P = WebGL2RenderingContext.prototype, lp = P.linkProgram; let tk = null;
    P.linkProgram = function (p) { if (!tk) { tk = { n: 0, t: performance.now() }; window.__tasks.push(tk); const me = tk; setTimeout(() => { if (tk === me) tk = null; }, 0); } tk.n++; return lp.call(this, p); }; }
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ entryTypes: ['longtask'] }); } catch (e) {}
})();
"""
async def main():
    errs = []
    async with async_playwright() as p:
        ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']; VP = {'width': int(os.environ.get('VW', 260)), 'height': int(os.environ.get('VH', 560))}
        if os.environ.get('PROFILE'):
            b = await p.chromium.launch_persistent_context(os.environ['PROFILE'], args=ARGS, viewport=VP, device_scale_factor=1); pg = b.pages[0] if b.pages else await b.new_page()
        else:
            b = await p.chromium.launch(args=ARGS); pg = await b.new_page(viewport=VP, device_scale_factor=1)
        await pg.add_init_script(INIT)
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        t0 = time.time()
        await pg.goto(f'http://127.0.0.1:8777/{PAGE}?q={Q}&w=clear&h={HOUR}&wa=0.1&lv={LV}')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(1800):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        print('home ready after', round(time.time() - t0), 's', flush=True)
        if not os.environ.get('INTRO'):          # a player who has seen the intro (the dev page holds it for ~75 slow software-GL frames): the idle compile is allowed to start (the new bgOk waits for the intro to end)
            await pg.evaluate("(() => { const c = __bw.ctl; if (c.intro) { c.intro.hold = false; c.intro.t = c.intro.dur; } })()")
            for i in range(240):
                if await pg.evaluate('!__bw.ctl.intro'): break
                await asyncio.sleep(1)
        await pg.evaluate("window.__t0 = performance.now(); window.__tasks.length = 0; window.__f0 = __bw.frames; window.__n0 = __bw.renderer.info.programs.length; window.__lap = __bw.sw.lap ? __bw.sw.lap() : null")
        ready = None
        for i in range(WINDOW):
            await asyncio.sleep(1)
            if os.environ.get('TOUCH') and i % 2 == 0:
                try: await pg.mouse.move(100 + (i % 7) * 10, 300); await pg.mouse.down(); await pg.mouse.up()
                except Exception: pass
            if i % 15 == 0:
                s = await pg.evaluate("({ p: __bw.renderer.info.programs.length, path: { ...__bw.pathReady }, fr: __bw.frames - window.__f0, intro: !!__bw.ctl.intro })"); print(f'  t+{i}s programs +{s["p"] - 0}', s['path'], 'frames', s['fr'], 'intro', s['intro'], flush=True)
                if s['path']['screen'] and s['path']['rt'] and ready is None: ready = i
            if ready is not None and i > ready + 5: break
        r = await pg.evaluate("({ n1: __bw.renderer.info.programs.length, n0: window.__n0, fr: __bw.frames - window.__f0, lt: window.__lt.filter((x) => x[0] >= window.__t0), tasks: window.__tasks.map((t) => t.n), path: { ...__bw.pathReady }, lap: __bw.sw.lap ? __bw.sw.lap() : null, el: performance.now() - window.__t0 })")
        lt = [x[1] for x in r['lt']]; tk = r['tasks']
        print(f"window {r['el'] / 1000:.0f}s   programs {r['n0']} -> {r['n1']} (+{r['n1'] - r['n0']})   frames {r['fr']}   paths {r['path']}")
        print('programs linked per main-thread task: tasks that link', len(tk), ' most in ONE task:', max(tk) if tk else 0, ' histogram', dict(sorted(collections.Counter(tk).items())), ' sum', sum(tk))
        print('long tasks (relative, software GL): n', len(lt), ' >250 ms:', sum(1 for x in lt if x > 250), ' >1000 ms:', sum(1 for x in lt if x > 1000), ' worst:', max(lt) if lt else 0, ' sorted top 8:', sorted(lt, reverse=True)[:8])
        print('sw lap (worst slice ms, programs, units, slices):', r['lap']); print('pageerrors', errs[:4])
        await b.close()
asyncio.run(main())
