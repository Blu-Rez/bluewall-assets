# usage: PAGE=dev.html python3 hitch.py Q SECONDS [W H]   -> per-frame JS cost (outside render), render cost, new shader programs per frame
import asyncio, sys, json, os
from playwright.async_api import async_playwright
INIT = r'''
(() => {
  window.__fr = []; let cur = null;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((ts) => {
    const t0 = performance.now(); cur = { t0, r: 0, pn0: window.__bw ? __bw.renderer.info.programs.map(p=>p.name+':'+p.id) : [], p0: window.__bw ? __bw.renderer.info.programs.length : 0, f: window.__bw ? __bw.frames : -1, gap: 0 };
    if (window.__lastEnd) cur.gap = t0 - window.__lastEnd;
    try { cb(ts); } finally {
      const t1 = performance.now(); cur.total = t1 - t0; cur.js = cur.total - cur.r; cur.p1 = window.__bw ? __bw.renderer.info.programs.length : 0; if (window.__bw && cur.p1 !== cur.p0) { const ns = __bw.renderer.info.programs.map(p=>p.name+':'+p.id).filter(x=>!cur.pn0.includes(x)); cur.names = ns.map(x=>x+' '+(((__bw.renderer.info.programs.find(p=>p.name+':'+p.id===x)||{}).cacheKey||'').slice(0,260))); } delete cur.pn0; window.__lastEnd = t1;
      window.__fr.push(cur); cur = null;
    }
  });
  window.__heap = []; setInterval(() => { if (window.__hooked && performance.memory) window.__heap.push([Math.round(performance.now()), Math.round(performance.memory.usedJSHeapSize / 1048576 * 10) / 10]); }, 1000);
  window.__hook = () => { if (window.__hooked || !window.__bw) return; window.__hooked = true; const r = __bw.renderer, o = r.render;
    r.render = function (s, c) { const a = performance.now(); const res = o.call(r, s, c); if (cur) cur.r += performance.now() - a; return res; };
  };
})();
'''
async def main():
    q = sys.argv[1]; secs = float(sys.argv[2]); W = int(sys.argv[3]) if len(sys.argv) > 3 else 240; Hh = int(sys.argv[4]) if len(sys.argv) > 4 else 420
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--enable-precise-memory-info'])
        pg = await b.new_page(viewport={'width': W, 'height': Hh})
        logs = []; pg.on('console', lambda m: logs.append(m.type + ': ' + m.text[:300])); pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:300]))
        await pg.add_init_script(INIT)
        await pg.goto('http://127.0.0.1:8777/' + os.environ.get('PAGE', 'dev.html') + f'?q={q}&h={os.environ.get("H","12")}&w=clear' + os.environ.get('EXTRA', ''))
        for i in range(6000):
            await asyncio.sleep(0.25)
            if await pg.evaluate('!!window.__ready'): break
        await pg.evaluate('window.__hook && window.__hook()')
        await asyncio.sleep(secs)
        fr = await pg.evaluate('window.__fr')
        print('frames', len(fr))
        rows = [(f['f'], round(f['js'], 1), round(f['total'], 1), f['p1'] - f['p0'], f['p1']) for f in fr]
        print('frame  jsMs  totalMs  newProg  progTotal')
        for f in fr:
            if f.get('names') and f['f']>=4: print('NEWPROG frame', f['f'], f['names'][:8])
        for r in rows: 
            if r[0] >= 0 and (r[1] > 40 or r[3] > 0 or r[0] % 10 == 0): print(*r)
        hp = await pg.evaluate('window.__heap'); print('heap MB (1/s after ready):', [h[1] for h in hp][:90])
        print('programs final', rows[-1][4] if rows else None)
        print('late-model log:'); 
        for l in logs: print(' ', l)
        await b.close()
asyncio.run(main())
