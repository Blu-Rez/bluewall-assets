import asyncio, sys, json
from playwright.async_api import async_playwright
JS = r'''
() => {
  const B = __bw, P = B.world.patrols, A = P.archers; B.pause(true);
  const cam = B.camera; cam.updateMatrixWorld(); cam.matrixWorldInverse.copy(cam.matrixWorld).invert();
  const st = A.map(() => ({ walk: 0, wait: 0, turn: 0, smin: 1e9, smax: -1e9, flips: 0, lastDir: 0 }));
  let minD = 1e9, tt = 0, minPair = null;
  for (let step = 0; step < 6000; step++) {            // 10 simulated minutes at 10 Hz
    tt += 0.1; P.update(tt, 0.1, cam);
    A.forEach((a, i) => { const s = st[i]; s[a.state]++; s.smin = Math.min(s.smin, a.s); s.smax = Math.max(s.smax, a.s); if (a.dir !== s.lastDir) { s.flips++; s.lastDir = a.dir; } });
    if (step % 5 === 0) for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) { const d = Math.hypot(A[i].p.x - A[j].p.x, A[i].p.z - A[j].p.z); if (d < minD) { minD = d; minPair = [i, j]; } }
  }
  return { n: A.length, minD: +minD.toFixed(2), minPair, bounds: A.map((a, i) => [+a.s0.toFixed(1), +a.s1.toFixed(1), +st[i].smin.toFixed(1), +st[i].smax.toFixed(1)]).filter(b => b[2] < b[0] - 1e-6 || b[3] > b[1] + 1e-6).length,
    state: st.reduce((o, s) => { o.walk += s.walk; o.wait += s.wait; o.turn += s.turn; o.flips += s.flips; return o; }, { walk: 0, wait: 0, turn: 0, flips: 0 }),
    perArcher: st.slice(0, 6).map(s => ({ walk: s.walk, wait: s.wait, turn: s.turn, flips: s.flips })) };
}
'''
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':360,'height':640}); logs=[]
        pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:300]))
        await pg.goto('http://127.0.0.1:8777/dev.html?q=low&h=12&w=clear')
        for i in range(300):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        await asyncio.sleep(3)
        print(json.dumps(await pg.evaluate(JS), indent=0)); print(logs)
        await b.close()
asyncio.run(main())
