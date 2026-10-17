#!/usr/bin/env python3
# ui2_page.py — UI2 browser part (ONE fresh page, day, q=low, 844x390; the real game in software GL).   usage: python3 ui2_page.py        Prints «PAGE OK» or the failures.   (~5 min: the game boots, nothing else may run)
#   1. the hero starts with the blue / silver chip (data-l = 1) and the crown marker (look 1)
#   2. +0 shader programs: the program count does not move while the marker looks 1..3 x the chip looks 1..3 are all drawn
#   3. the marker: 3 draw calls in every look; the sign never overlaps the chip on screen (4 places, 33 m and 300 m)
#   4. the chip: all three looks sit in the top row (inside the screen, top >= 4 px, bottom <= 76 px), are <= 150 px wide with «33 m» and «300 m», and touch no other button of the HUD
#   5. exit() leaves no chip, no pill, no style, no group; the next session shows the chip again with the same look
import asyncio, json, sys, os, subprocess, socket, time
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; PORT = int(os.environ.get('UI2_PAGE_PORT', 8785))
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
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
WAIT = "const wait = (ms) => new Promise((r) => setTimeout(r, ms)); const frames = async (n) => { const S = __rp.S; let c = 0; S.hero.blob.onBeforeRender = () => { c++; }; const t = performance.now(); while (c < n && performance.now() - t < 120000) await wait(200); return c; };"
async def ev(pg, js, to=900): return await asyncio.wait_for(pg.evaluate(js), to)
PLACE = "const place = (x, z, yaw) => { const a = __rp, S = a.S; a.pause(false); S.cool = 99; a.setPos(x, z, yaw); S.camYaw = yaw; a.sim(0.8); };"
RECT = "const rc = (e) => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; }; const hit = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];"
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
            r = json.loads(await ev(pg, "(async()=>{" + WAIT + "await window.__rpLoad('?v='+Date.now()); await __rp.start('elina'); await wait(2500); const a=__rp; a.pause(false); a.S.cool=99; await frames(3); const ch=document.querySelector('.rp-gu-chip'); return JSON.stringify({key:a.S.key, l:ch&&ch.dataset.l, look:a.marker().info().look, style:!!document.querySelector('style') })})()", 1500))
            ok(r['key'] == 'elina' and r['l'] == '1' and r['look'] == 1, 'hero starts with the blue / silver chip (look 1) and the crown marker (look 1)', r)
            # 2 + 3 + 4 at the 33 m grass spot and the 300 m spot
            for tag, (x, z, yaw) in (('33 m', (-119.6, -80.8, 0.3)), ('300 m', (-29.8, -400.8, 0.0))):
                r = json.loads(await ev(pg, "(async()=>{" + WAIT + PLACE + RECT + "const a=__rp,R=__bw.renderer,S=a.S,out={progs:[],calls:[],chip:[],ov:[],sign:[]}; place(%s,%s,%s); await frames(4); const ch=document.querySelector('.rp-gu-chip'); out.txt=ch.textContent; const hud=ch.parentElement;" % (x, z, yaw) +
                    "const cam=__bw.camera, V=S.hero.grp.position.constructor; const v=new V(), v2=new V(); const W=innerWidth,Hh=innerHeight;" +
                    "for (let ml=1;ml<=3;ml++) for (let cl=1;cl<=3;cl++){ a.marker().setLook(ml); ch.dataset.l=String(cl); await frames(3); out.progs.push(R.info.programs.length); const mi=a.marker().info(); out.calls.push(mi.calls);" +
                    "  const e=a.marker().ents[0]; e.sign.getWorldPosition(v); v.project(cam); const sx=(v.x+1)/2*W, sy=(1-v.y)/2*Hh; e.sign.getWorldPosition(v2); const k=cam.matrixWorld.elements; v2.x+=k[0]*e.sign.scale.x/2; v2.y+=k[1]*e.sign.scale.x/2; v2.z+=k[2]*e.sign.scale.x/2; v2.project(cam); const hw=Math.abs((v2.x+1)/2*W-sx); const sr=[sx-hw,sy-hw,sx+hw,sy+hw];" +
                    "  const cr=rc(ch); out.chip.push([ml,cl,cr]); out.sign.push([ml,cl,sr.map(Math.round)]); out.ov.push(hit(sr,cr));" +
                    "  if (ml===1){ const others=[...hud.querySelectorAll('*')].filter(o=>o!==ch&&!ch.contains(o)&&getComputedStyle(o).pointerEvents==='auto'&&o.getBoundingClientRect().width>20&&o.getBoundingClientRect().width<200&&o.getBoundingClientRect().height<200&&o.getBoundingClientRect().top<110); out['hit'+cl]=others.filter(o=>hit(rc(o),cr)).map(o=>o.className); } }" +
                    "return JSON.stringify(out)})()" , 1500))
                ok(len(set(r['progs'])) == 1, 'programs: +0 while the marker looks 1..3 x the chip looks 1..3 are drawn (%s)' % tag, sorted(set(r['progs'])))
                ok(all(c == 3 for c in r['calls']), 'marker: 3 draw calls in every look (%s)' % tag, set(r['calls']))
                ok(not any(r['ov']), 'the sign never overlaps the chip on screen (%s)' % tag, r['sign'][:3])
                ok(all(c[2][1] >= 4 and c[2][3] <= 76 and c[2][0] >= 0 and c[2][2] <= 844 for c in r['chip']), 'chip: all looks inside the top row (%s)' % tag, [c[2] for c in r['chip'][:3]])
                ok(all((c[2][2] - c[2][0]) <= 150 for c in r['chip']), 'chip: <= 150 px wide with «%s» (%s)' % (r['txt'], tag), max(c[2][2] - c[2][0] for c in r['chip']))
                ok(not (r.get('hit1') or r.get('hit2') or r.get('hit3')), 'chip: touches no other HUD button (%s)' % tag, [r.get('hit1'), r.get('hit2'), r.get('hit3')])
            r = json.loads(await ev(pg, "(async()=>{" + WAIT + "const a=__rp,S=a.S; a.exit(); const R={}; R.afterExit={dom:document.querySelectorAll('.rp-gu').length,grp:!!__bw.scene.getObjectByName('rp-goup')}; await a.start('aylin'); await wait(1500); await frames(3); const ch=document.querySelector('.rp-gu-chip'); R.again=ch&&ch.dataset.l; return JSON.stringify(R)})()", 1500))
            ok(r['afterExit']['dom'] == 0 and not r['afterExit']['grp'], 'exit() leaves no chip / pill / group', r['afterExit'])
            ok(r['again'] == '1', 'the next session shows the chip again with look 1', r['again'])
            ok(not errs, 'no page error', errs[:2])
            await b.close()
    finally:
        if srv: srv.terminate()
    print('PAGE OK' if not fails else 'PAGE FAILED: %d' % len(fails), flush=True); sys.exit(1 if fails else 0)
asyncio.run(main())
