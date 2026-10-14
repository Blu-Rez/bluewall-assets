# usage: python3 views.py OUTPREFIX preset[,preset...]   (presets below)  env: H=hour DPR Q=quality W=weather
import asyncio, sys, os, json
from playwright.async_api import async_playwright
PRESETS = {
  'moat1': dict(tx=112, tz=14, dist=60, azim=1.33),
  'moat2': dict(tx=112, tz=14, dist=40, azim=0.35),
  'cliff': dict(cam=[250,120,20,380,150,20]),
  'cliff2': dict(cam=[120,60,-40,330,120,-40]),
  'cliffwide': dict(cam=[60,70,0,380,170,0]),
  'moatcam': dict(cam=[40,14,110,40,-1,70]),
  'moatlow': dict(cam=[90,8,86,40,-0.5,70]),
  'gate':  dict(tx=0, tz=100, dist=105, azim=1.33),     # the moat + gate from the south-east, like the owner's screenshot
  'water': dict(tx=40, tz=96, dist=45, azim=0.7),       # moat close-up
  'mount': dict(tx=-60, tz=-120, dist=220, azim=3.3),   # backdrop mountains
  'town':  dict(tx=-70, tz=40, dist=95, azim=2.2),
  'ma': dict(tx=68, tz=-10, dist=42, azim=0.9),
  'mb': dict(tx=66, tz=-4, dist=34, azim=1.75),
  'mc': dict(tx=60, tz=30, dist=60, azim=2.4),
  'top_e': dict(cam=[160,230,70.5,160,0,70]),
  'top_c': dict(cam=[-40,240,-160.5,-40,0,-160]),
  'mo1': dict(tx=128, tz=42, dist=58, azim=1.2),
  'mo2': dict(tx=125, tz=-85, dist=62, azim=2.36),
  'mo3': dict(tx=100, tz=60, dist=40, azim=0.2),
  'mo4': dict(tx=-110, tz=-70, dist=70, azim=4.4),
  'mo5': dict(cam=[10,7,176,0,2,141]),
  'mo6': dict(cam=[150,9,100,118,2,62]),
  'mn_r': dict(tx=107.0, tz=-201.3, dist=70, azim=-0.49),
  'mn_e': dict(tx=-223.8, tz=68.4, dist=70, azim=1.87),
  'mn_t': dict(tx=-141.6, tz=-181.2, dist=70, azim=0.66),
  'mil_b': dict(tx=240, tz=58, dist=90, azim=4.4),
  'mil_t': dict(tx=225, tz=40, dist=190, azim=4.5),
  'mil_s': dict(tx=-10, tz=214, dist=85, azim=1.4),
  'mil_w': dict(tx=-60, tz=-258, dist=85, azim=0.6),
  'mil_l': dict(tx=272, tz=4, dist=85, azim=4.6),
  'wide':  dict(tx=5, tz=12, dist=300, azim=1.33),
}
async def main():
    out = sys.argv[1]; names = sys.argv[2].split(','); tag = ''
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=float(os.environ.get('DPR','1.5')))
        logs=[]; pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)[:300]))
        pg.on('console', lambda m: logs.append(m.text[:200]) if m.type in ('error','warning') and '404' not in m.text else None)
        await pg.goto(f"http://127.0.0.1:8777/dev.html?q={os.environ.get('Q','high')}&nolate&h={os.environ.get('H','15')}&w={os.environ.get('W','clear')}")
        for i in range(900):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        await pg.evaluate("(()=>{const c=__bw.ctl; if(c.intro){c.intro.hold=false; c.intro.t=c.intro.dur;} c.minD=10; c.maxD=900; })()")
        for nm in names:
            if nm.startswith('lv='):
                await pg.evaluate("(s)=>{const o={}; s.split(',').forEach(p=>{const [k,v]=p.split(':'); if(k=='all') __bw.world.levels.setLevel(+v); else o[k]=+v;}); __bw.world.levels.setMany(o);}", nm[3:]); await asyncio.sleep(1.5); tag = nm[3:].replace(':','').replace(',','_') + '_'; print('level', nm, flush=True); continue
            if nm.startswith('vault'):
                k = int(nm[5:] or 0); PRESETS[nm] = await pg.evaluate('(k)=>{const v=__bw.world.vaults.list[k]; return {tx:v.x+Math.sin(v.ry)*8, tz:v.z+Math.cos(v.ry)*8, dist:62, azim:v.ry+0.5};}', k)
            P = PRESETS[nm]
            if 'cam' in P:
                await pg.add_script_tag(path='/home/claude/dev/cam.js'); await pg.evaluate('(a)=>__cam(...a)', P['cam'])
                for i in range(240):
                    await asyncio.sleep(0.5)
                    if await pg.evaluate('__bw.frames >= window.__f0 + 3'): break
                await pg.screenshot(path=f'{out}_{tag}{nm}.png', timeout=240000); print('shot', tag+nm, flush=True); continue
            await pg.evaluate("(P)=>{const c=__bw.ctl; c.target.x=P.tx; c.target.z=P.tz; c.dist=P.dist; c.azim=P.azim; c.vel.set(0,0); window.__f0=__bw.frames;}", P)
            for i in range(240):
                await asyncio.sleep(0.5)
                if await pg.evaluate('__bw.frames >= window.__f0 + 3'): break
            await pg.screenshot(path=f'{out}_{tag}{nm}.png', timeout=240000); print('shot', tag+nm, flush=True)
        print(logs[-6:]); await b.close()
asyncio.run(main())
