import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# a2_calls.py : who owns the draw calls?  toggles every top-level child of the scene (and of late-stage) off one by one and prints the drop in render.calls (home camera)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1100, 'height': 620}, device_scale_factor=1)
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await pg.evaluate('() => { const c=__bw.ctl; c.intro=null; c.target.set(49.5,0,51.5); c.dist=257.6; c.azim=1.191; }')
        await asyncio.sleep(8)
        meas = """async () => { const bw = __bw, r = bw.renderer; r.info.autoReset = false; r.info.reset(); const f0 = bw.frames; await new Promise((res) => { const iv = setInterval(() => { if (bw.frames - f0 >= 2) { clearInterval(iv); res(); } }, 100); setTimeout(() => { clearInterval(iv); res(); }, 60000); }); const n = Math.max(1, bw.frames - f0); const o = Math.round(r.info.render.calls / n); r.info.autoReset = true; return o; }"""
        names = await pg.evaluate("""() => { const o = []; for (const c of __bw.scene.children) { if (c.name === 'late-stage') for (const d of c.children) o.push('late:' + d.name); else o.push(c.name || c.type); } return o; }""")
        total = await pg.evaluate(meas); print('TOTAL', total, 'children', len(names), flush=True)
        for nm in names:
            setv = """(a) => { const [nm, v] = a; for (const c of __bw.scene.children) { if (c.name === 'late-stage') { for (const d of c.children) if ('late:' + d.name === nm) d.visible = v; } else if ((c.name || c.type) === nm) c.visible = v; } }"""
            await pg.evaluate(setv, [nm, False]); t = await pg.evaluate(meas); await pg.evaluate(setv, [nm, True])
            if total - t >= 2: print(nm, total - t, flush=True)
        await b.close()
asyncio.run(main())
