#!/usr/bin/env python3
# pf4/rig_bench.py <tag> — PF4: the owner's BW_bench in the rig (software GL, draw calls swallowed: CPU side only), with a per-render log (programs / textures / geometries / diet level / cap level) so the WORST frames of every phase
# can be attributed.  env: PF4_PAGE (page file, default pf2_<tag>.html) · PF4_SECS (seconds per phase, default 8) · PF4_IDLE=1 (wait until the idle compile has settled before the bench, default 0 = the owner's «bench right after the update»)
#      PF4_CAPLVL=n (force CAP.lvl for the capped phases) · PF4_OUT (json) · PF4_QS (extra query string)
import asyncio, json, os, sys, time, subprocess, socket
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; TAG = sys.argv[1] if len(sys.argv) > 1 else 'before'; PORT = int(os.environ.get('PF4_PORT', 8798)); SECS = float(os.environ.get('PF4_SECS', 8))
PAGE = os.environ.get('PF4_PAGE') or ('pf2_%s.html' % TAG); QS = os.environ.get('PF4_QS', ''); OUT = os.environ.get('PF4_OUT') or ('/home/claude/work/pf4/rig_%s.json' % TAG)
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-precise-memory-info']
INIT = open(D + 'pf2/page.py').read().split('INIT = "')[1].split('"\n')[0].replace('\\"', '"')
HOOK = """(()=>{ const b = window.__bw, r = b.renderer, r0 = r.render.bind(r); window.__rl = []; window.__rlOn = false;
  r.render = function (s, c) { if (window.__rlOn) { const i = r.info, d = (window.__rp && window.__rp.diet && window.__rp.diet()) ? window.__rp.diet().st.lvl : -1; window.__rl.push([performance.now(), i.programs.length, i.memory.textures, i.memory.geometries, d, window.__pf && window.__pf.cap ? window.__pf.cap.lvl : -1, +r.getPixelRatio().toFixed(3)]); } return r0(s, c); };
  window.__t4 = []; const arr = r.info.programs, push = arr.push.bind(arr); arr.push = function (p) { const n = push(p); try { window.__t4.push([Math.round(performance.now()), n, p.name, (new Error().stack || '').split('\\n').slice(2, 9).map((l) => { const m = /at (?:async )?([^ (]+)/.exec(l); return m ? m[1] : l.trim().slice(0, 24); }).join('<')]); } catch (e) {} return n; };
})()"""
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
def log(*a): print(time.strftime('%H:%M:%S'), *a, flush=True)
async def main():
    R = {'tag': TAG, 'errors': []}; srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
            await ctx.add_init_script(INIT); pg = await ctx.new_page(); pg.on('pageerror', lambda e: R['errors'].append(str(e)[:200]))
            t0 = time.time()
            await pg.goto('http://127.0.0.1:%d/%s?pf=1&q=high&w=clear&h=%s&wa=0.1%s' % (PORT, PAGE, os.environ.get('PF4_H', '14'), QS))
            for i in range(3000):
                await asyncio.sleep(0.4)
                if await pg.evaluate('!!window.__bw'): break
            await pg.evaluate(HOOK)
            for i in range(3000):
                await asyncio.sleep(0.4)
                st = await pg.evaluate('({ready: !!window.__ready, late: !!(window.__bw && __bw.lateReady)})')
                if st['ready'] and st['late']: break
            R['boot_s'] = round(time.time() - t0, 1); R['boot_progs'] = await pg.evaluate('__bw.renderer.info.programs.length')
            await pg.evaluate('__bw.ctl._skipIntro && __bw.ctl._skipIntro()'); await asyncio.sleep(2)
            if os.environ.get('PF4_IDLE'):
                last = -1; stable = 0; t1 = time.time()
                while stable < 25 and time.time() - t1 < 420:
                    await asyncio.sleep(1); n = await pg.evaluate('__bw.renderer.info.programs.length'); stable = stable + 1 if n == last else 0; last = n
                log('idle compile settled at', last, 'after %.0f s' % (time.time() - t1))
            R['progs_at_bench_start'] = await pg.evaluate('__bw.renderer.info.programs.length'); log('bench start, programs', R['progs_at_bench_start'])
            if os.environ.get('PF4_CAPLVL') is not None and os.environ.get('PF4_CAPLVL') != '':
                await pg.evaluate('(()=>{ const c = __pf.cap; c.lvl = %s; c.off = true; })()' % os.environ['PF4_CAPLVL'])
            await pg.evaluate('window.__t4.length = 0; window.__rlOn = true')
            R['bench'] = await pg.evaluate('BW_bench.run({secs:%s})' % SECS)
            await pg.evaluate('window.__rlOn = false')
            R['card'] = await pg.evaluate("[...document.querySelectorAll('div')].filter(d=>/^BENCH/.test(d.textContent||'')&&d.children.length==0).map(d=>d.textContent)")
            R['F'] = await pg.evaluate('(()=>{ const F = __pf.rec.F, n = F.n; const o = {}; for (const k of ["t","js","rn","sh","calls","pr"]) o[k] = Array.from(F[k].subarray(0, n)).map((v) => +v.toFixed(2)); o.n = n; return o; })()')
            R['rl'] = await pg.evaluate('window.__rl'); R['t4'] = await pg.evaluate('window.__t4')
            R['progs_end'] = await pg.evaluate('__bw.renderer.info.programs.length')
            R['diet'] = await pg.evaluate('(() => { try { const d = __rp.diet(); return d ? d.info() : null; } catch (e) { return String(e); } })()')
            log('end: programs', R['progs_end']); json.dump(R, open(OUT, 'w')); await b.close()
    finally:
        if srv: srv.terminate()
asyncio.run(main())
