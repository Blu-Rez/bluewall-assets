import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
# pf_battle_gate.py — PERF2 gate.  Starts a battle in dev_s35.html, waits for the battle to be playable, asserts no pageerror, prints "PF OK" + the numbers:
#   programs before / after the load, the sw lap (programs, units, worst compile slice, worst warm chunk), the [pf] marks, long tasks (relative: software GL), draw calls / triangles of the first frame,
#   and the black-box report of a session that went home -> battle -> home: one POST /api/perf per send, every body < 3 800 characters, with the new marks and `ph`.
#   env: Q=low (high = the real program counts; slow in software GL)  LV=30  HOUR=14  OLD=1 (?oldload=1 : the p39 loader, for the A/B)  EXTRA='&x=1'  PAGE=dev_s35.html  NOBLOOM=1  WAITBG=0
Q = os.environ.get('Q', 'low'); LV = os.environ.get('LV', '30'); HOUR = os.environ.get('HOUR', '14'); PAGE = os.environ.get('PAGE', 'dev_s35.html')
EXTRA = os.environ.get('EXTRA', '') + ('&oldload=1' if os.environ.get('OLD') else '')
SEEDJS = """(() => { const e = __bw.econ, o = e.scout, SEED = __SEED__, mul = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  e.scout = function (...a) { const r = Math.random; Math.random = mul(SEED); try { return o.apply(this, a); } finally { Math.random = r; } }; })()"""          # (the dev opponent is made with Math.random: pin it, so before / after fight the same base)
INIT = """
(() => {
  window.__lt = []; window.__loaf = []; window.__pf = []; window.__tasks = [];
  { const P = WebGL2RenderingContext.prototype, lp = P.linkProgram; let tk = null;      // programs linked per main-thread task (speed independent)
    P.linkProgram = function (p) { if (!tk) { tk = { n: 0 }; window.__tasks.push(tk); const me = tk; setTimeout(() => { if (tk === me) tk = null; }, 0); } tk.n++; return lp.call(this, p); }; }
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ entryTypes: ['longtask'] }); } catch (e) {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { const sc = (e.scripts || []).slice().sort((a, b) => b.duration - a.duration)[0]; window.__loaf.push([Math.round(e.startTime), Math.round(e.duration), sc ? String(sc.sourceFunctionName || sc.invoker || '').slice(0, 30) : '']); } }).observe({ type: 'long-animation-frame', buffered: true }); } catch (e) {}
})();
"""
async def main():
    fails = []; errs = []; posts = []; pf = {}
    async with async_playwright() as p:
        ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']; VP = {'width': int(os.environ.get('VW', 390)), 'height': int(os.environ.get('VH', 844))}
        if os.environ.get('PROFILE'):          # a persistent browser profile keeps Chrome's GPU shader cache between runs: the home load of the next run is much faster
            b = await p.chromium.launch_persistent_context(os.environ['PROFILE'], args=ARGS, viewport=VP, device_scale_factor=1); pg = b.pages[0] if b.pages else await b.new_page()
        else:
            b = await p.chromium.launch(args=ARGS); pg = await b.new_page(viewport=VP, device_scale_factor=1)
        await pg.add_init_script(INIT)
        if os.environ.get('NOBLOOM'): await pg.add_init_script("try { localStorage.setItem('bw_settings_v1', JSON.stringify({ bloom: false })); } catch (e) {}")
        async def route(r):
            posts.append(r.request.post_data or ''); await r.fulfill(status=200, content_type='application/json', body='{"ok":true}')
        await pg.route('**/api/perf', route)
        pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        def con(m):
            t = m.text
            if t.startswith('[pf] '):
                a = t[5:].rsplit(' ', 1)
                try: pf[a[0]] = int(a[1])
                except Exception: pass
            elif m.type == 'error' and '404' not in t: errs.append('console.error ' + t[:200])
        pg.on('console', con)
        t0 = time.time()
        await pg.goto(f'http://127.0.0.1:8777/{PAGE}?q={Q}&w=clear&h={HOUR}&wa=0.1&lv={LV}{EXTRA}')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(1800):
            if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
            await asyncio.sleep(1)
        print('home ready after', round(time.time() - t0), 's', flush=True)
        if os.environ.get('WAITBG', '0') == '1':
            for i in range(1500):
                if await pg.evaluate('(() => { const c = __bw.composer(); const p = __bw.pathReady; return !c || (p.screen && p.rt); })()'): break
                await asyncio.sleep(2)
        await asyncio.sleep(3)
        n0 = await pg.evaluate('__bw.renderer.info.programs.length')
        await pg.evaluate(SEEDJS.replace('__SEED__', os.environ.get('SEED', '777')))
        await pg.evaluate("window.__tclick = performance.now(); window.__tasks.length = 0; __bw.sw.lap()")
        w0 = time.time()
        await pg.evaluate("document.querySelector('.bwa-btn').click()")
        ok = False
        for i in range(3600):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): ok = True; break
        wall = time.time() - w0
        if not ok: fails.append('battle did not become playable')
        await asyncio.sleep(3)
        r = await pg.evaluate("""({ n1: __bw.renderer.info.programs.length, calls: __bw.renderer.info.render.calls, tris: __bw.renderer.info.render.triangles, lt: window.__lt.filter((x) => x[0] >= window.__tclick), loaf: window.__loaf.filter((x) => x[0] >= window.__tclick),
            sw: __bw.sw.stats, tasks: window.__tasks.map((t) => t.n), active: !!(__bw.battle && __bw.battle.active), mem: { ...__bw.renderer.info.memory } })""")
        print(f"battle playable after {wall:.0f}s (software GL: relative only)   programs {n0} -> {r['n1']}  (+{r['n1'] - n0})   first frame: {r['calls']} calls, {r['tris']} tris   memory {r['mem']}")
        print('[pf] marks (ms; n:* are counts):', json.dumps(pf))
        lt = [x[1] for x in r['lt']]; print('long tasks since the tap (>50 ms, relative):', len(lt), ' >250 ms:', sum(1 for x in lt if x > 250), ' worst:', max(lt) if lt else 0, ' list:', r['lt'][:12])
        import collections
        print('programs linked per main-thread task during the load: tasks', len(r['tasks']), ' most in one task:', max(r['tasks']) if r['tasks'] else 0, ' histogram', dict(sorted(collections.Counter(r['tasks']).items())))
        print('LoAF since the tap:', r['loaf'][:10]); print('sw.stats', json.dumps({k: v for k, v in r['sw'].items() if k != 'top'}), 'top', r['sw'].get('top', [])[:4])
        if not r['active']: fails.append('battle not active')
        if os.environ.get('OLD') is None:
            for k in ('b:total', 'b:compile', 'b:warm', 'n:progs', 'n:slice', 'n:chunk', 'b:views', 'b:sim'):
                if k not in pf: fails.append('mark missing: ' + k)
        # ---- black box: home -> battle -> home, the reports that would go to /api/perf
        # (a token makes the game talk to a real server, so it is given only now: the report 'battle-ready' - sent when the load phase turns into the play phase - is replayed by hand, then one 'gate-battle' report)
        await pg.evaluate("__bw.econ.token = 'dummy-gate-token'; __bw.bbox.mark('gate-ready', 1); __bw.bbox.phase('battle:load'); __bw.bbox.phase('battle'); __bw.bbox.send('gate-battle')"); await asyncio.sleep(0.5)
        await pg.evaluate("__bw.battle.exit()")
        for i in range(600):
            await asyncio.sleep(0.5)
            if not await pg.evaluate('!!(__bw.battle && __bw.battle.active)'): break
        await asyncio.sleep(4)
        r2 = await pg.evaluate("({ n2: __bw.renderer.info.programs.length, tasks: window.__tasks.map((t) => t.n) })")
        print(f"back home: programs {r['n1']} -> {r2['n2']} (+{r2['n2'] - r['n1']})   most programs linked in one task since the tap (load + return): {max(r2['tasks']) if r2['tasks'] else 0}")
        if r2['n2'] - r['n1'] > 40: fails.append('too many new programs when the home map came back: %d' % (r2['n2'] - r['n1']))
        await pg.evaluate("__bw.bbox.mark('gate-home', 1); __bw.bbox.send('gate-home'); __bw.econ.token = null"); await asyncio.sleep(1)
        bodies = []
        for t in posts:
            try: bodies.append(json.loads(t))
            except Exception: fails.append('bad json in a POST')
        print('POST /api/perf:', len(posts), 'bodies, lengths', [len(t) for t in posts])
        if not posts: fails.append('no perf POST seen (token hook?)')
        for t, j in zip(posts, bodies):
            if len(t) >= 3800: fails.append('perf body too long: %d' % len(t))
        phs = {}
        for j in bodies: phs.update(j.get('ph') or {})
        print('ph (frames, mean ms, p95 ms):', json.dumps(phs)); mk = [m[0] for j in bodies for m in (j.get('marks') or [])]; print('marks sent (the battle ones):', [m for m in mk if m[:2] in ('b:', 'n:', 'v:', 'u:b')][:40])
        if bodies and 'battle' not in phs: fails.append("no 'battle' entry in ph")
        if os.environ.get('OLD') is None:
            for k in ('b:total', 'n:progs', 'n:slice', 'b:compile'):
                if k not in mk: fails.append('mark not in any perf body: ' + k)
            print('why of the reports:', [j.get('why') for j in bodies], ' marks per body:', [len(j.get('marks') or []) for j in bodies])
        if bodies and not any(m.startswith('b:') for m in mk) and os.environ.get('OLD') is None: fails.append('no b:* marks in the perf bodies')
        if errs: fails.append('pageerror / console.error: ' + ' | '.join(errs[:4]))
        await b.close()
    if fails: print('PF FAIL', fails); sys.exit(1)
    print('PF OK')
asyncio.run(main())
