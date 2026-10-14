import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# p38_prof.py TAG : CPU-profile the real game's load (main thread) and print the heaviest functions per time window.
TAG = sys.argv[1]; PAGE = os.environ.get('PAGE', 'dev_s35.html'); Q = os.environ.get('Q', 'low'); LV = os.environ.get('LV', '30')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        cdp = await pg.context.new_cdp_session(pg)
        await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {'interval': 2000})
        await cdp.send('Profiler.start')
        t0 = time.time()
        await pg.goto(f'http://127.0.0.1:8777/{PAGE}?q={Q}&w=clear&h=14&wa=0.1&lv={LV}')
        for i in range(4000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(900):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        prof = (await cdp.send('Profiler.stop'))['profile']
        json.dump(prof, open(f'/home/claude/work/p38_prof_{TAG}.json', 'w'))
        print('saved', len(prof['nodes']), 'nodes', len(prof['samples']), 'samples')
        await b.close()
asyncio.run(main())
