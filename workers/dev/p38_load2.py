import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# p38_load2.py TAG [CPU] : like p38_load.py but also times every WebGL call (blocking GL = what stalls a phone's UI thread) and stamps the progress log.
TAG = sys.argv[1]; CPU = float(sys.argv[2]) if len(sys.argv) > 2 else 1
PAGE = os.environ.get('PAGE', 'dev_s35.html'); Q = os.environ.get('Q', 'low'); LV = os.environ.get('LV', '30'); IDLE = int(os.environ.get('IDLE', 30))
INIT = """
window.__lt = [];
try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ entryTypes: ['longtask'] }); } catch (e) {}
(function () { let _l = []; const stamp = (a) => { a.push = function (x) { return Array.prototype.push.call(this, Math.round(performance.now()) + ' ' + x); }; return a; };
  Object.defineProperty(window, '__log', { get() { return _l; }, set(v) { _l = stamp(v); }, configurable: true }); })();
window.__gl = { tot: {}, cnt: {}, big: [] };
for (const C of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) { if (!C) continue; const proto = C.prototype;
  for (const k of Object.getOwnPropertyNames(proto)) { let f; try { f = proto[k]; } catch (e) { continue; } if (typeof f !== 'function' || k === 'constructor') continue;
    proto[k] = function (...a) { const t = performance.now(); const r = f.apply(this, a); const d = performance.now() - t; const G = window.__gl; G.tot[k] = (G.tot[k] || 0) + d; G.cnt[k] = (G.cnt[k] || 0) + 1;
      if (d > 60) G.big.push([Math.round(t), Math.round(d), k, (new Error().stack || '').split('\\n').slice(2, 4).map((s) => s.replace(/.*\\//, '')).join(' | ')]); return r; }; } }
"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        await pg.add_init_script(INIT)
        cdp = await pg.context.new_cdp_session(pg)
        if CPU > 1: await cdp.send('Emulation.setCPUThrottlingRate', {'rate': CPU})
        t0 = time.time()
        await pg.goto(f'http://127.0.0.1:8777/{PAGE}?q={Q}&w=clear&h=14&wa=0.1&lv={LV}')
        for i in range(4000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        t_ready = round(time.time() - t0)
        for i in range(900):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        t_late = round(time.time() - t0)
        mark = await pg.evaluate('performance.now()')
        await pg.evaluate('() => { const c=__bw.ctl; c.intro=null; }')
        await asyncio.sleep(IDLE)
        lt = await pg.evaluate('window.__lt'); log = await pg.evaluate('window.__log'); G = await pg.evaluate('window.__gl')
        print('ready', t_ready, 's late', t_late, 's; idle window starts at perf', round(mark))
        lt2 = sorted([x for x in lt if isinstance(x[0], int)], key=lambda x: -x[1])
        print('long tasks', len(lt2), 'total', sum(x[1] for x in lt2), 'ms; top10', lt2[:10])
        tot = sorted(G['tot'].items(), key=lambda kv: -kv[1])[:12]
        print('GL time by call (ms):', [(k, round(v), G['cnt'][k]) for k, v in tot], ' sum', round(sum(G['tot'].values())))
        big = sorted(G['big'], key=lambda x: -x[1])[:25]
        print('biggest single GL calls:'); [print('  ', x) for x in big]
        idle = [x for x in lt2 if x[0] > mark]
        print('IDLE/play window long tasks:', len(idle), 'max', max([x[1] for x in idle], default=0), sorted(idle, key=lambda x: -x[1])[:8])
        print('progress log:'); [print('  ', l) for l in log[:60]]
        json.dump({'lt': lt, 'log': log, 'gl': G}, open(f'/home/claude/work/p38_load2_{TAG}.json', 'w'))
        await b.close()
asyncio.run(main())
