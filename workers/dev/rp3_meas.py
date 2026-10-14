import asyncio, json, time
from playwright.async_api import async_playwright
# rp3_meas.py : gate OFF (rp1_off.html = rpg:false) vs gate ON but not started (rp1_dev.html) — shader programs after boot, bytes, and which /rpg/ files are fetched at boot. RP3's files must be absent from both lists.
CFG = [('off', 'rp1_off.html'), ('on_not_started', 'rp1_dev.html')]
async def main():
    res = {}
    async with async_playwright() as p:
        for tag, page in CFG:
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
            pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
            reqs = []; pg.on('response', lambda r: reqs.append((r.url, r.headers.get('content-length'))))
            t0 = time.time(); await pg.goto('http://127.0.0.1:8777/' + page + '?q=low&w=clear&h=14&wa=0.1')
            for i in range(3000):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            for i in range(900):
                if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
                await asyncio.sleep(1)
            await asyncio.sleep(8)
            rr = {'ready_s': round(time.time() - t0), 'programs': await pg.evaluate('__bw.renderer.info.programs.length'), 'requests': len(reqs), 'bytes_hdr': sum(int(c) for u, c in reqs if c and c.isdigit()),
                  'rpg_files': sorted(set(u.split('/rpg/')[1] for u, c in reqs if '/rpg/' in u)), 'under_files': [u for u, c in reqs if 'rpg_under' in u or '/under/' in u]}
            res[tag] = rr; print(tag, json.dumps(rr), flush=True); await b.close()
    json.dump(res, open('/home/claude/work/rp3_meas.json', 'w'), indent=1)
asyncio.run(main())
