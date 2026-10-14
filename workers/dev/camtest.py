import asyncio, sys, os, json
from playwright.async_api import async_playwright
JS = r'''
(() => { const B = __bw, c = B.ctl; c.intro && (c.intro.hold = false, c.intro.t = c.intro.dur); c.update(0.1);
  const rep = (n) => { c.update(0.016); const p = B.camera.position; const el = Math.atan2(p.y - c.target.y, Math.hypot(p.x - c.target.x, p.z - c.target.z)) * 57.3;
    return [n, 'dist', Math.round(c.dist), 'target', Math.round(c.target.x), Math.round(c.target.z), 'cam', Math.round(p.x), Math.round(p.y), Math.round(p.z), 'camR', Math.round(Math.hypot(p.x, p.z)), 'elev', Math.round(el)]; };
  const out = [rep('start')];
  for (const [d, tx, tz] of [[150, 0, 0], [150, 150, 60], [150, -120, 120], [250, 0, 0], [250, 150, 60], [250, -150, -80], [380, 0, 0], [380, 120, 100], [60, 160, 40]]) {
    c.dist = d; c.target.set(tx, 0, tz); for (let i = 0; i < 3; i++) c.update(0.016); out.push(rep('d' + d + '@' + tx + ',' + tz)); }
  return JSON.stringify(out); })()
'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}); pg.on('pageerror', lambda e: print('PAGEERR', str(e)[:300])); pg.on('console', lambda m: print('CON', m.text[:200]) if m.type in ('error','warning') and '404' not in m.text else None)
        await pg.goto('http://127.0.0.1:8777/dev.html?q=low&h=22&nolate=1&wa=999')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for r in json.loads(await pg.evaluate(JS)): print(*r)
        # rotate the phone
        d0 = await pg.evaluate('Math.round(__bw.ctl.dist)+" maxD "+__bw.ctl.maxD')
        await pg.set_viewport_size({'width': 844, 'height': 390}); await asyncio.sleep(15)
        d1 = await pg.evaluate('innerWidth+"x"+innerHeight+" "+Math.round(__bw.ctl.dist)+" maxD "+__bw.ctl.maxD+" aspect "+__bw.camera.aspect.toFixed(2)')
        await pg.set_viewport_size({'width': 390, 'height': 844}); await asyncio.sleep(15)
        d2 = await pg.evaluate('Math.round(__bw.ctl.dist)+" maxD "+__bw.ctl.maxD')
        print(await pg.evaluate('typeof __bw.ctl.setView'))
        print('portrait', d0, '-> landscape', d1, '-> portrait', d2)
        await b.close()
asyncio.run(main())
