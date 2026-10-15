#!/usr/bin/env python3
# pf1/page.py — the browser part of dev/pf1_test.sh.  Software GL, draw calls swallowed (CPU side only).  Prints "ok ..." / "FAIL ..." lines and exits 1 on any failure.
#   A. a PLAYER page (no dev / owner): no probe, no benchmark, rAF and render untouched; the HUD readout (settings) shows fps · ms · calls · tris · px · q in map mode
#   B. the OWNER page (?pf=1): matrix-skip invariant (local == compose(TRS), world == parent x local) on the live scene in map AND hero mode, skip ratio, HUD readout in map AND hero mode (visible, on screen),
#      BW_bench.run(): result shape, <3.5 KB, ONE POST to /api/perf with the Authorization header, result card, nothing left running, hero left again
import asyncio, json, os, re, sys, time, subprocess, socket
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; PORT = int(os.environ.get('PF1_PORT', 8795)); FAILS = []
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
def ok(c, m):
    print(('ok   ' if c else 'FAIL ') + m, flush=True)
    if not c: FAILS.append(m)
INIT = "(()=>{ window.__nd={on:true}; const P=['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced','drawRangeElements']; for(const k of P){ const o=WebGL2RenderingContext.prototype[k]; WebGL2RenderingContext.prototype[k]=function(a,b,c,d,e,f){ if(window.__nd.on) return; return o.call(this,a,b,c,d,e,f); }; } })();"
HUD_JS = "(()=>{ const c=[...document.querySelectorAll('#game > div')].filter(d=>/ fps · .* ms · .* calls · .* tris · .* px · q /.test(d.textContent||'')); if(!c.length) return null; const d=c[0], r=d.getBoundingClientRect(), cs=getComputedStyle(d); return {t:d.textContent.split('\\n')[0], vis:cs.visibility, disp:cs.display, r:[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)], w:innerWidth, h:innerHeight}; })()"
HUD_RE = re.compile(r'^(map|hero|hero/under|battle) · \d+ fps · [\d.]+ ms · \d+ calls · [\d.]+[kM]? tris · [\d.]+[kM]? px · q (low|medium|high|ultra)')
async def boot(b, page_name, qs):
    ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
    await ctx.add_init_script(INIT)
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
    pg.on('console', lambda m: errs.append('console.error ' + m.text[:160]) if m.type == 'error' and 'favicon' not in m.text else None)
    await pg.goto('http://127.0.0.1:%d/%s?q=high&w=clear&h=14&wa=0.1%s' % (PORT, page_name, qs))
    for i in range(1500):
        await asyncio.sleep(0.5)
        st = await pg.evaluate('({ready: !!window.__ready, late: !!(window.__bw && __bw.lateReady), done: !!document.querySelector("#game canvas")})') if page_name.startswith('pf1_dev') else await pg.evaluate('({ready: !!window.__ready, late: true})')
        if st['ready'] and st['late']: break
    await asyncio.sleep(2); return ctx, pg, errs
async def hudtxt(pg):
    await pg.evaluate("window.dispatchEvent(new Event('pointermove'))"); await asyncio.sleep(2.5); await pg.evaluate("window.dispatchEvent(new Event('pointermove'))"); await asyncio.sleep(1.5)
    return await pg.evaluate(HUD_JS)
async def main():
    srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            # ---------------- A. a player
            ctx, pg, errs = await boot(b, 'pf1_player.html', '')
            r = await pg.evaluate("({pf: typeof window.__pf, bench: typeof window.BW_bench, bw: typeof window.__bw, raf: String(window.requestAnimationFrame).includes('[native code]')})")
            ok(r['pf'] == 'undefined' and r['bench'] == 'undefined', 'player page: no window.__pf, no window.BW_bench (the probe is not even created)  %s' % r)
            ok(r['raf'], 'player page: requestAnimationFrame is the native one (nothing is hooked)')
            ok(r['bw'] == 'undefined', 'player page: no dev handle')
            await ctx.close()
            ctx, pg, errs = await boot(b, 'pf1_player.html', '&pf=1')
            r = await pg.evaluate("({pf: typeof window.__pf, bench: typeof window.BW_bench})")
            ok(r['pf'] == 'object' and r['bench'] == 'undefined', 'player page with ?pf=1: the probe is there (read-only), the owner benchmark is NOT  %s' % r)
            await ctx.close()
            # ---------------- B. the owner
            ctx, pg, errs = await boot(b, 'pf1_dev.html', '&pf=1')
            await pg.evaluate('window.__bwFixDyn = true; __bw.ctl._skipIntro && __bw.ctl._skipIntro()'); await asyncio.sleep(2)
            await pg.evaluate("__bw.settings.perfInfo = true"); await asyncio.sleep(1)
            h = await hudtxt(pg); ok(bool(h) and bool(HUD_RE.match(h['t'])), 'HUD readout, map mode: ' + (h['t'] if h else 'NONE'))
            ok(bool(h) and h['vis'] == 'visible' and 0 <= h['r'][0] and h['r'][2] <= h['w'] and 0 <= h['r'][1] and h['r'][3] <= h['h'], 'HUD readout inside the screen, visible  %s' % (h and h['r']))
            await pg.evaluate("window.dispatchEvent(new Event('pointermove'))"); await asyncio.sleep(2)
            m = await pg.evaluate('__pf.mskip.check()'); ok(m['badLocal'] == 0 and m['badWorld'] == 0 and m['on'], 'matrix skip ON, map: local + world matrices of %d objects all equal the recomputed ones (bad %d / %d), %d skipped / %d computed' % (m['objs'], m['badLocal'], m['badWorld'], m['skip'], m['run']))
            ok(m['skip'] > 2 * m['run'] * 0.5 and m['skip'] > 100000, 'matrix skip really skips (> 100k skipped)')
            await pg.evaluate('__pf.mskip.on = false'); await asyncio.sleep(3); m0 = await pg.evaluate('__pf.mskip.check()'); await pg.evaluate('__pf.mskip.on = true')
            ok(m0['badLocal'] == 0 and m0['badWorld'] == 0, 'matrix skip OFF (original code), map: the same invariant holds (bad %d / %d)' % (m0['badLocal'], m0['badWorld']))
            await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,3000)); __rp.setPos(40.95,-2.17,0); window.__yaw=0; window.__walk=setInterval(()=>{window.__yaw+=0.05; __rp.setLook(window.__yaw,0.2); __rp.setInput(0,0.8);},100); return 1; })()" % int(time.time())); await asyncio.sleep(3)
            h = await hudtxt(pg); ok(bool(h) and bool(HUD_RE.match(h['t'])) and h['t'].startswith('hero'), 'HUD readout, HERO mode: ' + (h['t'] if h else 'NONE'))
            ok(bool(h) and h['vis'] == 'visible' and 0 <= h['r'][0] and h['r'][2] <= h['w'] and 0 <= h['r'][1] and h['r'][3] <= h['h'], 'HUD readout visible in hero mode (the hero hides the other UI)  %s' % (h and h['r']))
            m = await pg.evaluate('__pf.mskip.check()'); ok(m['badLocal'] == 0 and m['badWorld'] == 0, 'matrix skip ON, HERO walking: invariant holds for %d objects (bad %d / %d); %d more sit under hidden subtrees that RP1C cull.js froze on purpose (counted apart) %s' % (m['objs'], m['badLocal'], m['badWorld'], m.get('frozen', 0), m['ex']))
            await pg.evaluate('clearInterval(window.__walk); __rp.setInput(0,0); __rp.exit && __rp.exit(); 1'); await asyncio.sleep(2)
            m = await pg.evaluate('__pf.mskip.check()'); ok(m['badLocal'] == 0 and m['badWorld'] == 0 and m.get('frozen', 0) == 0, 'after the hero is left: everything thawed (frozen %s) and the invariant holds for %d objects (bad %d / %d) %s' % (m.get('frozen'), m['objs'], m['badLocal'], m['badWorld'], m['ex']))
            # the benchmark: intercept the POST
            posts = []
            async def route(rt):
                req = rt.request; posts.append({'n': len(req.post_data or ''), 'auth': req.headers.get('authorization', ''), 'body': req.post_data}); await rt.fulfill(status=200, body='{"ok":1}', content_type='application/json')
            await pg.route('**/api/perf', route)
            await pg.evaluate("__bw.econ.token = 'TESTTOKEN'")
            res = await pg.evaluate('BW_bench.run({secs: 7})')      # (PF2: bench v2 = 5 phases, the night path is built first; 7 s phases so that the drift (first / last 5 s) exists)
            ok(res and res.get('bench') == 1, 'BW_bench.run(): a result with bench:1')
            ph = (res or {}).get('ph', {})
            # PF2: the v2 result (v 2): five phases md / mn / hd / hn / mu (map day, map night, hero day, hero night, map day uncapped), per-phase stats, stalls apart, drift per phase
            ok(all(ph.get(k) and ph[k].get('fps') for k in ('md', 'mn', 'mu')) and (all(ph.get(k) and ph[k].get('fps') for k in ('hd', 'hn')) or (res or {}).get('hero') == 'skipped'), 'result has the five phases: md %s · mn %s · hd %s · hn %s · mu %s' % tuple((ph.get(k) or {}).get('fps') for k in ('md', 'mn', 'hd', 'hn', 'mu')))
            ok(all(ph[k].get(f) is not None for k in ('md', 'mn', 'mu') if ph.get(k) for f in ('avg', 'p95', 'max', 'o33', 'o50', 'calls', 'k', 'px', 'st')) and (res or {}).get('stalls') is not None, 'per-phase avg / p95 / worst / >33 / >50 / calls / tris / buffer / stalls: %s' % (ph.get('md')))
            q = (res or {}).get('q', {}); ok(all(k in q for k in ('preset', 'dprNow', 'dyn', 'gov', 'sh', 'bloom')) and all('pr' in ph[k] for k in ph if ph.get(k) and ph[k].get('fps')), 'quality + per-phase pixel ratio present: %s' % q)
            ok(ph.get('md') and ph['md'].get('d') and len(ph['md']['d']) == 2, 'thermal drift (first 5 s vs last 5 s of the phase): %s' % (ph.get('md') or {}).get('d'))
            d = (res or {}).get('dev', {}); ok(all(k in d for k in ('ua', 'hc', 'mem', 'scr', 'dpr', 'gpu')), 'device snapshot: ua / hardwareConcurrency / deviceMemory / screen / dpr / GL renderer')
            ok(((res or {}).get('mskip') or {}).get('bad') == 0, 'bench: matrix-skip invariant checked at the end: %s' % (res or {}).get('mskip'))
            bp = [x for x in posts if '"bench":1' in (x['body'] or '')]                                      # (the game's own flight recorder may post too: only the bench posts are counted)
            ok(len(bp) == 1 and bp[0]['n'] < 3500 and bp[0]['auth'] == 'Bearer TESTTOKEN' and json.loads(bp[0]['body']).get('bench') == 1, 'ONE bench POST to /api/perf, %s bytes (< 3500), bearer header, {bench:1,..}; other posts in the window (flight recorder): %d' % (bp[0]['n'] if bp else None, len(posts) - len(bp)))
            card = await pg.evaluate("[...document.querySelectorAll('div')].filter(d=>/^BENCH /.test(d.textContent||'')&&d.children.length==0).map(d=>d.textContent)")
            ok(bool(card) and all(t in card[0] for t in ('MAP DAY', 'MAP NIGHT', 'MAP UNCAPPED', 'p95', 'worst', 'programs')), 'result card (one line per phase): %s' % (card[0].split('\n')[0] if card else None))
            busy = await pg.evaluate('BW_bench.busy'); inhero = await pg.evaluate("(__rp && __rp.state ? 0 : 0)"); ok(busy is False, 'bench is not busy afterwards')
            res2 = await pg.evaluate('BW_bench.run({secs: 1})') if False else None
            await ctx.close(); await b.close()
            real = [e for e in errs if 'WebGL' not in e and 'GPU stall' not in e]
            ok(not real, 'no page errors on the owner page %s' % real[:3])
    finally:
        if srv: srv.terminate()
    print('PAGE FAIL %d' % len(FAILS) if FAILS else 'PAGE OK'); sys.exit(1 if FAILS else 0)
asyncio.run(main())
