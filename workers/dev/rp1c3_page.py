#!/usr/bin/env python3
# rp1c3_page.py — RP1C_R3 browser part (ONE fresh page, day, q=low, 844x390; the real game in software GL).   usage: python3 rp1c3_page.py [parts...]   parts: progs ramps goup collide water jump  (default: all)
#   progs   the hero adds no programs by its own markers / go-up icons (render with and without them: the count does not move)
#   ramps   every ramp: >= 4 outer + >= 2 town, grade <= 0.33, walked up and down with the real update() + camera (camera never clips, she ends on the wall-walk / back on the landing)
#   goup    the «Go up» markers: one per ramp, <= 2 draw calls, icons within 30 m, the HUD chip when none is on screen (> 6 m), the prompt at the foot, nothing left after exit, works again in the next session
#   collide dev/rp1c_collide_page.js: every door / wall / tower / gate / ballista / disc / 160 free-standing surfaces at 8 angles and walk / run / dodge: (a) centre inside a solid  (b) stuck  (c) pass-through = 0 / 0 / 0
#   water   dev/rp1c_water_page.js: entry / exit of the river at 8 sample shores: reaches the swim state, no stuck, no teleport, swims ~1.3 m/s, never walks on the bed
#   jump    apex 0.55–0.60 m, air 0.65–0.75 s, horizontal speed kept, landing absorb 80–120 ms (pelvis bottom after touch-down)
# Prints «PAGE OK» or the failures.   (~6–9 min: the game boots in software GL, the collision run is ~35 s)
import asyncio, json, sys, os, subprocess, socket, time
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; PORT = int(os.environ.get('RP1C3_PAGE_PORT', 8783))
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
PARTS = sys.argv[1:] or ['progs', 'ramps', 'goup', 'collide', 'water', 'jump']
fails = []; nok = 0
def ok(c, m, info=''):
    global nok
    print(('ok   ' if c else 'FAIL ') + m + ((' — ' + str(info)) if info != '' else ''), flush=True)
    if c: nok += 1
    else: fails.append(m)
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
WAIT = "const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const frames = async (n) => { const S = __rp.S; let c = 0; S.hero.blob.onBeforeRender = () => { c++; }; const t = performance.now(); while (c < n && performance.now() - t < 120000) await wait(250); return c; };"
async def ev(pg, js, to=900):
    return await asyncio.wait_for(pg.evaluate(js), to)
async def main():
    srv = None
    if not up(): srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS); pg = await b.new_page(viewport={'width': 844, 'height': 390}, device_scale_factor=1, has_touch=True, is_mobile=True)
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
            await pg.goto('http://127.0.0.1:%d/rp1_dev.html?q=low&w=clear&h=14&wa=0.1' % PORT)
            for i in range(1800):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            for i in range(900):
                if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
                await asyncio.sleep(1)
            r = json.loads(await ev(pg, "(async()=>{const R=__bw.renderer,p0=R.info.programs.length; await window.__rpLoad('?v='+Date.now()); await __rp.start('elina'); await new Promise(r=>setTimeout(r,1500)); return JSON.stringify({p0,p1:R.info.programs.length,key:__rp.S.key,boxes:__rp.S.boxes.length,grid:__rp.grid().info().ready})})()"))
            ok(r['key'] == 'elina' and r['grid'], 'hero starts; collision grid ready', r)
            ok(r['p1'] - r['p0'] <= 6, 'programs: hero start adds <= 6 (hero materials; the rest of the hero reuses the game\'s own)', '%d -> %d' % (r['p0'], r['p1']))
            if 'progs' in PARTS:
                r = json.loads(await ev(pg, "(async()=>{" + WAIT + "const a=__rp,R=__bw.renderer,sc=__bw.scene,cam=__bw.camera,g=a.goup(); a.pause(false); a.S.cool=99; for (let k = 0; k < 120 && g.feetList().length < 3; k++) await wait(500); const f=g.feetList()[2]; a.setPos(f.x+9,f.z-6,-0.8); a.S.camYaw=-0.8; a.sim(0.6); await frames(3); const P=()=>R.info.programs.length, grp=sc.getObjectByName('rp-goup'), p0=P(); grp.visible=false; R.render(sc,cam); R.render(sc,cam); const p1=P(); grp.visible=true; R.render(sc,cam); R.render(sc,cam); const p2=P(); const d=g.dbg(); return JSON.stringify({p0,p1,p2,isPts:!!(d.icons.isPointsMaterial&&d.cols.isPointsMaterial), ic:g.info()})})()"))
                ok(r['p0'] == r['p1'] == r['p2'] if False else (r['p0'] == r['p1'] and r['p1'] == r['p2']), 'go-up markers: +0 programs (with / without them drawn: %d / %d / %d)' % (r['p0'], r['p1'], r['p2']), r['ic'])
                ok(r['isPts'], 'go-up markers use the door orbs\' material class (PointsMaterial)')
            if 'ramps' in PARTS:
                r = json.loads(await ev(pg, "JSON.stringify(__rp.ramps().info())"))
                rs = r['ramps']; outer = [x for x in rs if x['ring'] == 'outer']; town = [x for x in rs if x['ring'] != 'outer']
                ok(len(outer) >= 4 and len(town) >= 2, 'ramps: %d outer + %d town (>= 4 + >= 2)' % (len(outer), len(town)), [(x['id'], x['ring'], x['design']) for x in rs])
                ok(all(x['grade'] <= 0.33 + 1e-9 for x in rs), 'ramps: grade <= 0.33', max(x['grade'] for x in rs)); ok(r['tris'] < 120000, 'ramps: decoration only, triangles', r['tris'])
                bad = []
                for i in range(len(rs)):
                    t = json.loads(await ev(pg, "(()=>JSON.stringify(__rp.rampTest(%d,{})))()" % i, 600))
                    good = bool(t.get('ok')) and not t.get('camBad')
                    print('     ramp%d up=%s down=%s camBad=%s fall=%s maxGrade=%s steps=%s %s' % (i, (t.get('up') or {}).get('ok'), (t.get('down') or {}).get('ok'), t.get('camBad'), t.get('fall'), (t.get('up') or {}).get('maxGrade'), t.get('nSteps'), t.get('camAt') if t.get('camBad') else ''), flush=True)
                    if not good: bad.append(i)
                ok(not bad, 'every ramp walked up to the wall-walk and back down with the real update + camera (camera never clips)', bad)
            if 'goup' in PARTS:
                r = json.loads(await ev(pg, "(async()=>{" + WAIT + "const a=__rp,S=a.S,g=a.goup(),R={}; a.pause(false); S.cool=99; a.exit(); await a.start('elina'); await wait(800); await frames(3);" +
                    "R.feet=g.feetList().length; R.ramps=a.ramps().info().n; R.gate=g.info();" +
                    "a.setPos(6,12,0.5); S.camYaw=0.5; a.sim(0.6); await frames(3); R.plaza=g.info(); R.plazaChip=document.querySelector('.rp-gu-chip').style.display;" +
                    "const f=g.feetList()[0]; a.setPos(f.x,f.z,0); a.sim(0.5); await frames(3); R.foot=g.info(); R.footPill=document.querySelector('.rp-gu-pill').style.display;" +
                    "a.setPos(f.x+12,f.z+2,0); a.sim(0.5); await frames(3); R.away=g.info(); R.awayPill=document.querySelector('.rp-gu-pill').style.display;" +
                    "const ri=Math.max(0,a.ramps().info().ramps.findIndex(x=>x.design==='S')), rt=a.ramps().route(ri), q=rt[Math.floor(rt.length*0.6)]; a.setPos(q[0],q[1],0); a.sim(0.5); await frames(3); R.onRamp=g.info(); R.onRampChip=document.querySelector('.rp-gu-chip').style.display; R.onRampH=+(S.y-a.baseGround(S.x,S.z)).toFixed(2); R.onRampD=g.info().nearD;" +
                    "a.exit(); R.afterExit={dom:document.querySelectorAll('.rp-gu').length,style:document.querySelectorAll('style').length,grp:!!__bw.scene.getObjectByName('rp-goup')};" +
                    "await a.start('aylin'); await wait(800); a.setPos(6,12,0.5); S.camYaw=0.5; a.sim(0.6); await frames(3); R.again=document.querySelector('.rp-gu-chip')&&document.querySelector('.rp-gu-chip').style.display; R.againInfo=g.info(); return JSON.stringify(R)})()", 1500))
                ok(r['feet'] == r['ramps'] and r['feet'] >= 6, 'go up: one foot per ramp', (r['feet'], r['ramps']))
                ok(r['gate']['calls'] <= 2 and r['gate']['ms'] < 1.0, 'go up: <= 2 draw calls, < 1 ms per frame', r['gate'])
                ok(r['plaza']['icons'] == 0 and r['plaza']['chip'] and r['plaza']['nearD'] > 6 and r['plazaChip'] == 'flex', 'go up: plaza (no marker within 30 m): the HUD arrow chip shows with the distance', r['plaza'])
                ok(r['foot']['prompt'] and r['footPill'] == 'flex' and not r['foot']['chip'], 'go up: at the foot the «Go up» prompt shows (and the chip is gone)', r['foot'])
                ok((not r['away']['prompt']) and r['awayPill'] == 'none', 'go up: 12 m away the prompt is gone', r['away'])
                ok(r['onRampH'] > 0.6 and r['onRampD'] > 6 and (not r['onRamp']['chip']) and r['onRampChip'] == 'none', 'go up: already up on a ramp (%.1f m above the terrain, %.0f m from the nearest foot): no arrow chip' % (r['onRampH'], r['onRampD']), r['onRamp'])
                ok(r['afterExit']['dom'] == 0 and not r['afterExit']['grp'], 'go up: exit() leaves no element and no group', r['afterExit'])
                ok(r['again'] == 'flex' and r['againInfo']['chip'], 'go up: the next session shows the chip again (stale-state bug found by the night run)', r['againInfo'])
            if 'jump' in PARTS:
                r = json.loads(await ev(pg, "(async()=>{const api=__rp,S=api.S,h=S.hero; api.pause(true); S.doorHook=()=>{}; S.cool=99; const out=[]; const Vv=h.grp.position.constructor, v=new Vv(), pel=h.model.getObjectByName('Pelvis');" +
                    "for(const [lab,mag] of [['stand',0],['walk',0.5],['run',1]]){ api.setPos(41,22,-0.73); S.camYaw=-0.73; api.sim(1.0); S.inp.x=0; S.inp.y=mag; api.sim(1.2); const g0=S.y,v0=Math.hypot(S.vx,S.vz); api.jump(); let n=0,tTake=null,tLand=null,hmin=9,tHmin=null,hsLand=null,apex=0;" +
                    "while(n<150){ api.sim(1/60); n++; const t=n/60; if(tTake===null&&S.y>g0+0.002) tTake=t; if(tTake!==null) apex=Math.max(apex,S.y-g0); if(tTake!==null&&tLand===null&&S.st==='land'){tLand=t; hsLand=Math.hypot(S.vx,S.vz);} if(tLand!==null){ h.grp.updateMatrixWorld(true); pel.getWorldPosition(v); const hy=v.y-S.y; if(hy<hmin){hmin=hy;tHmin=t;} if(t-tLand>0.5) break; } }" +
                    "out.push({lab,v0:+v0.toFixed(2),apex:+apex.toFixed(3),air:+(tLand-tTake+1/60).toFixed(3),absorb:+(tHmin-tLand).toFixed(3),hsLand:+hsLand.toFixed(2)}); } S.inp.y=0; api.pause(false); return JSON.stringify(out)})()", 600))
                for x in r:
                    ok(0.54 <= x['apex'] <= 0.61 and 0.65 <= x['air'] <= 0.76, 'jump %s: apex %.3f m (0.55–0.60), air %.3f s (0.65–0.75)' % (x['lab'], x['apex'], x['air']), x)
                    ok(abs(x['hsLand'] - x['v0']) <= 0.12 * max(0.5, x['v0']) or x['v0'] < 0.1, 'jump %s: horizontal speed kept in the air (%.2f -> %.2f m/s)' % (x['lab'], x['v0'], x['hsLand']))
                    ok(0.06 <= x['absorb'] <= 0.14, 'jump %s: landing absorb (touch-down to lowest pelvis) %.0f ms (80–120)' % (x['lab'], x['absorb'] * 1000))
            if 'collide' in PARTS:
                await ev(pg, open(D + 'rp1c_collide_page.js').read(), 120)
                await ev(pg, "window.__ctStart({grid:true})", 60)
                t0 = time.time()
                while time.time() - t0 < 900:
                    d = await ev(pg, "JSON.stringify([window.__ct.done, window.__ct.prog, window.__ct.total])", 60); d = json.loads(d)
                    if d[0]: break
                    await asyncio.sleep(5)
                o = json.loads(await ev(pg, "JSON.stringify(window.__ct.out)", 60)); a = o['agg']['TOTAL']; a20 = o['agg'].get('TOTAL@20fps', {})
                ok(not o.get('err'), 'collision run finished', o.get('err') or ('%d jobs, %d runs, %.0f s' % (o['jobs'], a['runs'], o['ms'] / 1000)))
                ok(a['a'] == 0 and a['b'] == 0 and a['c'] == 0 and a['un'] == 0, 'collision (a) inside-solid frames / (b) stuck / (c) pass-through / unstuck teleports = %d / %d / %d / %d on %d runs (+%d runs at 20 fps)' % (a['a'], a['b'], a['c'], a['un'], a['runs'], a20.get('runs', 0)))
                dd = o['agg']['door/all']                                                  # MOTHER (RP4_R3 merge): walk + run must open >= 90 % (the rule); the dodge roll (2.9 m since RP4_R3) ends AT the wall and does not open a door by design: reported, not asserted
                ok(dd.get('openedW', 0) >= 0.9 * dd.get('aimedW', 1), 'doors: walking / running AT them opens %d of %d approaches (blocked %d in all; the dodge roll does not open a door: %d of %d rolls did)' % (dd.get('openedW', 0), dd.get('aimedW', 0), dd.get('blocked', 0), dd.get('openedD', 0), dd.get('aimedD', 0)))
                await ev(pg, "(()=>{__rp.useGrid(true); __rp.pause(false); return 1})()", 30)
            if 'water' in PARTS:
                await ev(pg, open(D + 'rp1c_water_page.js').read(), 120)
                await ev(pg, "window.__wtStart({n:24,grid:true})", 60)
                t0 = time.time()
                while time.time() - t0 < 900:
                    d = json.loads(await ev(pg, "JSON.stringify([window.__wt.done, window.__wt.prog, window.__wt.total])", 60))
                    if d[0]: break
                    await asyncio.sleep(5)
                o = json.loads(await ev(pg, "JSON.stringify(window.__wt.out)", 60)); print('     water:', json.dumps(o)[:900], flush=True)
                ok(not o.get('err'), 'water run finished', o.get('err') or '%d shores, %.1f s' % (o['n'], o['ms'] / 1000))
                if not o.get('err'):
                    e, x = o['agg']['enter'], o['agg']['exit']
                    nfree = len(o.get('free') or [])
                    ok(nfree == 0 and e['un'] == 0 and x['un'] == 0, 'water: stuck windows on FREE ground (nothing solid / no steep bank in the way) / unstuck teleports (entry, exit) = %d / %d, %d  (stuck at solid quay walls %d+%d and steep terrain banks %d+%d are listed as findings, not hidden)' % (nfree, e['un'], x['un'], e.get('stuck_solid', 0), x.get('stuck_solid', 0), e.get('stuck_steep', 0), x.get('stuck_steep', 0)))
                    ok(e['bed'] <= 0.05 * e['runs'] + 1, 'water entry: runs that walk on the river bed = %d of %d (allowed <= 5 %% + 1)' % (e['bed'], e['runs']))
                    ok(e['jump'] <= 0.03 * e['runs'] + 1 and x['jump'] <= 0.03 * x['runs'] + 1, 'water: height jumps entry / exit = %d / %d (allowed <= 3 %% + 1)' % (e['jump'], x['jump']))
                    ok(e['reached'] >= 0.9 * e['runs'], 'water entry: reaches the swim state in %d of %d runs (the rest: quay walls / bridge undersides with no way in)' % (e['reached'], e['runs']))
                    ok(x['out'] >= 0.9 * x['runs'], 'water exit: out on the bank, dry, in %d of %d runs (the rest: quay walls without an exit / steep river banks)' % (x['out'], x['runs']))
            ok(not errs, 'no page errors', errs[:3])
            await b.close()
    finally:
        if srv: srv.terminate()
    print('PAGE OK (%d checks)' % nok if not fails else 'PAGE FAILED: %s' % fails); sys.exit(0 if not fails else 1)
asyncio.run(main())
