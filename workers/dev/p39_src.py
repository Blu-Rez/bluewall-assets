import asyncio, sys, os, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=high&w=clear&h=14&wa=0.1&lv=30&nolate=1')
        for i in range(4000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        res = await pg.evaluate("""() => { const r = __bw.renderer, gl = r.getContext(); const out = []; for (const p of r.info.programs) { try { out.push({ name: p.name, key: (p.cacheKey || '').slice(0, 60), fs: gl.getShaderSource(p.fragmentShader), vs: gl.getShaderSource(p.vertexShader) }); } catch (e) {} } out.sort((a, b) => b.fs.length - a.fs.length); return [out[0], out[Math.floor(out.length / 2)], out[out.length - 1]]; }""")
        for i, o in enumerate(res):
            open(f'/home/claude/work/src_{i}.frag', 'w').write(o['fs']); open(f'/home/claude/work/src_{i}.vert', 'w').write(o['vs']); print(i, o['name'], len(o['fs']), len(o['vs']))
        await b.close()
asyncio.run(main())
