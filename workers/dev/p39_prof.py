import asyncio, sys, os, json, time, collections
from playwright.async_api import async_playwright
# p39_prof.py : CPU profile (V8 sampling) of the whole load of the real game; where does the main thread's time go?  Q=low|medium|high, OLD=1 for the p38 loader
Q = os.environ.get('Q', 'low'); OLD = os.environ.get('OLD')
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
        cdp = await pg.context.new_cdp_session(pg)
        await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', {'interval': 2000}); await cdp.send('Profiler.start')
        t0 = time.time()
        await pg.goto(f'http://127.0.0.1:8777/dev_s35.html?q={Q}&w=clear&h=14&wa=0.1&lv=30' + ('&oldload=1' if OLD else ''))
        for i in range(4000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        print('ready', round(time.time() - t0), flush=True)
        prof = (await cdp.send('Profiler.stop'))['profile']
        nodes = {n['id']: n for n in prof['nodes']}; dt = prof['timeDeltas']; self_t = collections.Counter()
        for sid, d in zip(prof['samples'], dt): self_t[sid] += d
        tot = sum(self_t.values()) / 1000; byfn = collections.Counter()
        for nid, t in self_t.items():
            cf = nodes[nid]['callFrame']; byfn[(cf['functionName'] or '(anon)') + ' @' + cf['url'].split('/')[-1] + ':' + str(cf['lineNumber'])] += t / 1000
        print('total sampled ms', round(tot))
        for k, v in byfn.most_common(30): print('%8.0f ms  %s' % (v, k))
        # inclusive time by top-level 'build' functions
        kids = {n['id']: n.get('children', []) for n in prof['nodes']}
        incl = {}
        def f(nid):
            if nid in incl: return incl[nid]
            r = self_t.get(nid, 0) / 1000 + sum(f(c) for c in kids[nid]); incl[nid] = r; return r
        import sys as _s; _s.setrecursionlimit(100000); f(prof['nodes'][0]['id'])
        agg = collections.Counter()
        for nid, t in incl.items():
            cf = nodes[nid]['callFrame']; agg[(cf['functionName'] or '(anon)') + ':' + str(cf['lineNumber'])] = max(agg[(cf['functionName'] or '(anon)') + ':' + str(cf['lineNumber'])], t)
        print('--- biggest inclusive (max single node) ---')
        for k, v in agg.most_common(40): print('%8.0f ms  %s' % (v, k))
        await b.close()
asyncio.run(main())
