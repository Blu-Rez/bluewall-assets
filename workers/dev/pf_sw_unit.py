import asyncio, subprocess, os, json, sys
from playwright.async_api import async_playwright
# pf_sw_unit.py — PERF2 / P2: the p39 shaderwarm.js (idle-compile settings of p39: target 70, gap 30) against the PERF2 one (target 60, gap 30, duty 0.25, maxNew 1, k0 1) on the same synthetic scene.
#   Deterministic in COUNTS (programs per main-thread task, slices, share of the time the main thread is busy compiling, rAF gaps); software GL, so milliseconds are only relative.
D = '/home/claude/dev'; C = '/home/claude/bot/bluebot_v2/bluewall/client'; NEW = C + '/src/shaderwarm.js'
env = dict(os.environ, NODE_PATH=C + '/node_modules')
for v, src in (('old', D + '/pf_sw_p39.js'), ('new', NEW)):
    subprocess.run(['npx', 'esbuild', D + '/pf_sw_unit_entry.js', '--bundle', '--format=iife', '--target=es2020', f'--alias:sw-under-test={src}', f'--outfile={D}/pf_sw_unit_{v}.js', '--log-level=error'], check=True, cwd=C, env=env)
open(D + '/pf_sw_unit.html', 'w').write('<!doctype html><meta charset="utf-8"><body><script>var v = new URLSearchParams(location.search).get("v") || "new"; var s = document.createElement("script"); s.src = "pf_sw_unit_" + v + ".js"; document.body.appendChild(s);</script>')
async def main():
    out = {}
    async with async_playwright() as p:
        for v in ('old', 'new'):
            b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']); pg = await b.new_page(viewport={'width': 200, 'height': 200})
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:200]))
            await pg.goto(f'http://127.0.0.1:8777/pf_sw_unit.html?v={v}')
            for i in range(1200):
                if await pg.evaluate('!!window.__done'): break
                await asyncio.sleep(0.5)
            out[v] = await pg.evaluate('window.__res'); out[v]['errors'] = errs[:2]; await b.close()
    for v in ('old', 'new'): print(v, json.dumps(out[v]))
    o, n = out['old'], out['new']
    ok = n and o and n['mostInOneTask'] < o['mostInOneTask'] and n['busyShare'] < o['busyShare'] and not n['errors']
    print('PF_SW_UNIT', 'OK' if ok else 'FAIL', f"  programs per task: most {o['mostInOneTask']} -> {n['mostInOneTask']}   busy share of the wall time {o['busyShare']} -> {n['busyShare']}   late rAF frames {o['lateFrames']} -> {n['lateFrames']}")
    if not ok: sys.exit(1)
asyncio.run(main())
