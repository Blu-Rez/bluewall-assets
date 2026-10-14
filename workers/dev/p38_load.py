import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# p38_load.py TAG [CPU] : load the real game page and list the main-thread long tasks (>=150 ms) with the progress phase they fall in.
# CPU = Emulation.setCPUThrottlingRate (4 ~ a mid phone). env PAGE (default dev_s35.html), Q (low|medium|high), LV.
TAG = sys.argv[1]; CPU = float(sys.argv[2]) if len(sys.argv) > 2 else 1
PAGE = os.environ.get('PAGE', 'dev_s35.html'); Q = os.environ.get('Q', 'low'); LV = os.environ.get('LV', '30')
INIT = """
window.__lt = []; window.__ph = [];
try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ entryTypes: ['longtask'] }); } catch (e) { window.__lt.push(['noobs', String(e)]); }
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
        lt = await pg.evaluate('window.__lt'); log = await pg.evaluate('window.__log')
        pt = await pg.evaluate('performance.now()')
        print('ready', t_ready, 's  late', t_late, 's  perf.now', round(pt))
        lt2 = [x for x in lt if isinstance(x[0], int)]
        lt2.sort(key=lambda x: -x[1])
        print('long tasks:', len(lt2), ' total ms', sum(x[1] for x in lt2), ' max', lt2[0][1] if lt2 else 0)
        print('top20 (start ms, dur ms):', lt2[:20])
        print('over 1000 ms:', [x for x in lt2 if x[1] >= 1000], ' over 3000 ms:', [x for x in lt2 if x[1] >= 3000])
        json.dump({'lt': lt, 'log': log}, open(f'/home/claude/work/p38_load_{TAG}.json', 'w'))
        await b.close()
asyncio.run(main())
