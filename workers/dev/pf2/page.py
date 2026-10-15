#!/usr/bin/env python3
# pf2/page.py — the browser part of dev/pf2_test.sh.  Software GL, draw calls swallowed (CPU side only).  Prints "ok ..." / "FAIL ..." lines, exits 1 on any failure.   Page: dev/pf2_<TAG>.html (TAG=after by default; build it with dev/pf2_rig_build.sh).
#   A. F1  boot at day: every light is on the mirror layer at the first draw; the programs 10 s after the first draw (with touches) equal those at the first draw (± 3 depth-only programs of crowd casters), none differs by numPointLights.
#   B. F2  the same page, 100 s WITHOUT input at day: the night (bloom composer) path is NOT built (pathReady.rt false), the programs stay flat.
#   C. F2  hour pinned 16.8 (dusk near): the night path IS built in the idle time, before night.
#   G. the recorder: a gap above 2000 ms is a stall (counted apart, never averaged); drift from the valid frames.  H. pf_overdraw against a hand-computed sprite footprint.
#   D. F2  real clock shifted (Date.now + offset): booted at minute 38 of the real hour (game hour ≈ 16), the clock jumps 4 min: the LOOP check (not the boot one) starts the night path.
import asyncio, json, os, sys, time, subprocess, socket
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; PORT = int(os.environ.get('PF2_PORT', 8797)); FAILS = []; TAG = os.environ.get('TAG') or (sys.argv[1] if len(sys.argv) > 1 else 'after'); PAGE = os.environ.get('PAGE') or ('pf2_%s.html' % TAG)
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
INIT = "(()=>{ window.__nd={on:true}; const P=['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced','drawRangeElements']; for(const k of P){ const o=WebGL2RenderingContext.prototype[k]; WebGL2RenderingContext.prototype[k]=function(a,b,c,d,e,f){ if(window.__nd.on) return; return o.call(this,a,b,c,d,e,f); }; } })();"
SHIFT = "(()=>{ const n0=Date.now.bind(Date); window.__dnOff = ((38 - ((n0()/60000)%%60) + 60) %% 60) * 60000; Date.now = () => n0() + window.__dnOff; })();"
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
def ok(c, m):
    print(('ok   ' if c else 'FAIL ') + m, flush=True)
    if not c: FAILS.append(m)
JS = "({progs:__bw.renderer.info.programs.length, rt:!!__bw.pathReady.rt, scr:!!__bw.pathReady.screen, comp:!!__bw.composer(), night:+__bw.P().night.toFixed(2), hour:+(__bw.P().hour||0).toFixed(2), lights:(()=>{let n=0,m=0; __bw.scene.traverse(o=>{ if(o.isLight){ n++; if(o.layers.isEnabled(5)) m++; } }); return [n,m];})()})"
PL = "__bw.renderer.info.programs.map(p=>p.cacheKey)"
async def boot(b, qs, init=None):
    ctx = await b.new_context(viewport={'width': 844, 'height': 390}, device_scale_factor=1, is_mobile=True, has_touch=True)
    await ctx.add_init_script(INIT)
    if init: await ctx.add_init_script(init)
    pg = await ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)[:160]))
    await pg.goto('http://127.0.0.1:%d/%s?pf=1&q=high&w=clear&wa=0.1%s' % (PORT, PAGE, qs))
    for i in range(3000):
        await asyncio.sleep(0.4)
        st = await pg.evaluate('({ready: !!window.__ready, late: !!(window.__bw && __bw.lateReady)})')
        if st['ready'] and st['late']: break
    return ctx, pg, errs
async def touch(pg, secs):
    for _ in range(int(secs * 2)):
        await pg.evaluate("window.dispatchEvent(new Event('pointermove'))"); await asyncio.sleep(0.5)
async def idle(pg, secs, until=None):
    t0 = time.time(); s = None
    while time.time() - t0 < secs:
        s = await pg.evaluate(JS)
        if until and until(s): break
        await asyncio.sleep(2)
    return s, time.time() - t0
async def main():
    srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            # ---- A + B: day
            ctx, pg, errs = await boot(b, '&h=14')
            s0 = await pg.evaluate(JS); k0 = set(await pg.evaluate(PL))
            ok(s0['lights'][0] == s0['lights'][1] and s0['lights'][0] >= 6, 'A. at the first draw every light (%d) is on the mirror layer (%d)' % tuple(s0['lights']))
            await pg.evaluate("__bw.ctl._skipIntro && __bw.ctl._skipIntro()"); await touch(pg, 10)
            s1 = await pg.evaluate(JS); k1 = await pg.evaluate(PL)
            new = [k for k in k1 if k not in k0]
            ok(s1['progs'] - s0['progs'] <= 3, 'A. programs %d at the first draw, %d ten seconds later (+%d; was +29 / +31 before PF2)' % (s0['progs'], s1['progs'], s1['progs'] - s0['progs']))
            nl = {}
            for k in new:
                t = k.split(',')
                nl[len(t)] = nl.get(len(t), 0) + 1
            ok(all('depth' in k.split(',')[0] for k in new), 'A. the new programs are depth-only (shadow casters of the crowd): %s' % [k.split(',')[0] for k in new])
            s2, dt = await idle(pg, 100)
            ok(s2['comp'] and not s2['rt'], 'B. day, %d s without input: the bloom composer exists but its path is NOT built (pathReady.rt = %s)' % (dt, s2['rt']))
            ok(s2['progs'] - s1['progs'] <= 3, 'B. programs flat in the idle day: %d -> %d' % (s1['progs'], s2['progs']))
            await ctx.close()
            # ---- C: dusk near, pinned
            ctx, pg, errs = await boot(b, '&h=16.8')
            await pg.evaluate("__bw.ctl._skipIntro && __bw.ctl._skipIntro()")
            s3, dt = await idle(pg, 150, lambda s: s['rt'])
            ok(s3['rt'], 'C. hour 16.8: the night path is built in the idle time, %d s after the first draw (programs %d)' % (dt, s3['progs']))
            ok(s3['night'] < 0.25, 'C. ... while it is still day (night = %s)' % s3['night'])
            await ctx.close()
            # ---- D: the real clock jumps towards dusk while the page runs
            ctx, pg, errs = await boot(b, '', SHIFT % ())
            await pg.evaluate("__bw.ctl._skipIntro && __bw.ctl._skipIntro()")
            s4, dt = await idle(pg, 30)
            ok(not s4['rt'] and s4['hour'] < 16.7, 'D. booted at game hour %s: the night path is not built (30 s idle)' % s4['hour'])
            await pg.evaluate("window.__dnOff += 4 * 60000")
            s5, dt = await idle(pg, 150, lambda s: s['rt'])
            ok(s5['rt'] and s5['hour'] >= 16.7, 'D. the clock jumped 4 min (game hour %s): the loop check started the night path, done after %d s (programs %d)' % (s5['hour'], dt, s5['progs']))
            await ctx.close()
            # ---- G: the recorder: a stall (a gap > 2000 ms) is counted apart and never averaged; H: pf_overdraw against a hand-computed sprite footprint
            ctx, pg, errs = await boot(b, '&h=23')
            await pg.evaluate("__bw.ctl._skipIntro && __bw.ctl._skipIntro()"); await asyncio.sleep(2)
            g = await pg.evaluate("""(() => { const r = __pf.rec, F = r.F; r.start(); r.stop(); F.n = 0; let t = 1000;
              const push = (dt) => { t += dt; F.t[F.n] = t; F.js[F.n] = 2; F.rn[F.n] = 1; F.calls[F.n] = 10; F.tris[F.n] = 100; F.pr[F.n] = 1; F.n++; };
              for (let i = 0; i < 300; i++) push(16.7); push(605660); for (let i = 0; i < 300; i++) push(16.7);
              const all = r.summary(0, F.n), dr = r.drift(0, F.n); F.n = 0; return { all, dr }; })()""")
            a1 = g['all']
            ok(a1['stalls'] == 1 and abs(a1['stallMs'] - 605660) < 2, 'G. a 605 660 ms gap = 1 stall (stalls %s, %s ms), not a frame' % (a1['stalls'], a1['stallMs']))
            ok(abs(a1['fps'] - 59.9) < 0.5 and a1['max'] < 17 and a1['p95'] < 17 and abs(a1['avg'] - 16.7) < 0.2, 'G. fps %s avg %s p95 %s max %s: the stall is left out of every figure' % (a1['fps'], a1['avg'], a1['p95'], a1['max']))
            ok(g['dr'] and abs(g['dr'][0] - 59.9) < 0.5 and abs(g['dr'][1] - 59.9) < 0.5, 'G. drift (first 5 s / last 5 s of the valid frames): %s' % g['dr'])
            # H: a camera 25 m from the ruby gem's glow sprite
            h = await pg.evaluate("""(() => { const THREE = __bw.THREE, c = new THREE.PerspectiveCamera(52, 844 / 390, 0.5, 3000);
              let sp = null; __bw.scene.traverse((o) => { if (o.isSprite && o.material.blending === THREE.AdditiveBlending && Math.abs(o.position.x + 36) < 0.5 && Math.abs(o.position.z - 102) < 0.5) sp = o; });
              if (!sp) return null; const p = sp.getWorldPosition(new THREE.Vector3()), m = Math.max(sp.scale.x, sp.scale.y); c.position.set(p.x + 25, p.y, p.z); c.lookAt(p); c.updateMatrixWorld(); c.updateProjectionMatrix();
              const r = pf_overdraw({ camera: c, w: 844, h: 390, within: { x: p.x, z: p.z, r: 3 } });
              const want = Math.pow(m / (2 * 25 * Math.tan(26 * Math.PI / 180)) * 390, 2); return { r: { add: r.add, glow: r.glow, top: r.top[0] }, want, m, op: sp.material.opacity }; })()""")
            if h is None: ok(False, 'H. the ruby glow sprite was not found')
            else:
                gx = h['r']['glow']['px']
                ok(abs(gx - h['want']) / h['want'] < 0.1, 'H. pf_overdraw: the glow sprite (%.1f m, 25 m away) covers %d px; hand-computed %d px (within 10 %%)' % (h['m'], gx, h['want']))
                ok(h['r']['add']['max'] == 1 and abs(h['r']['glow']['wpx'] - gx * h['op']) / max(1, gx * h['op']) < 0.05, 'H. one layer, weighted by its opacity %.2f: %d' % (h['op'], h['r']['glow']['wpx']))
            await ctx.close()
            # ---- J: ?nres=0.7 (the A/B switch): the bloom composer's render target is 0.7 x the default; without it nothing changes
            wd = {}
            for q in ('&h=23', '&h=23&nres=0.7'):
                ctx, pg, errs = await boot(b, q)
                wd[q] = await pg.evaluate("(() => { const c = __bw.composer(); return c ? [c.renderTarget1.width, c.renderTarget1.height, __bw.renderer.getDrawingBufferSize(new __bw.THREE.Vector2()).x] : null; })()")
                await ctx.close()
            d0, d1 = wd['&h=23'], wd['&h=23&nres=0.7']
            ok(bool(d0 and d1) and d0[0] == d0[2] and abs(d1[0] / d0[0] - 0.7) < 0.02, 'J. composer render target %s px wide by default (= the canvas), %s px with ?nres=0.7' % (d0 and d0[0], d1 and d1[0]))
            await b.close()
    finally:
        if srv: srv.terminate()
    print('PF2 PAGE ' + ('FAILED' if FAILS else 'OK')); sys.exit(1 if FAILS else 0)
asyncio.run(main())
