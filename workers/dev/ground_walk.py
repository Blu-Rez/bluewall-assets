import asyncio, os, time, subprocess, socket, json, sys
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; PORT = 8778
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
JS = r"""
(async()=>{
  const B=__bw, T=B.THREE, sc=B.scene, rp=__rp, S=rp.S, W=B.world;
  const ray=new T.Raycaster(); ray.far=400; const down=new T.Vector3(0,-1,0);
  const meshes=[]; sc.updateMatrixWorld(true);
  sc.traverse(o=>{ if(!(o.isMesh)||o.isSkinnedMesh) return; let p=o,hid=false; while(p){ if(p.visible===false){hid=true;break;} p=p.parent; } if(hid) return; if(o.material&&(o.material.transparent||o.material.depthWrite===false)) return; meshes.push(o); });
  const vis=(x,z,y0)=>{ ray.set(new T.Vector3(x,y0+1.2,z),down); const hs=ray.intersectObjects(meshes,false); let t=-1e9; for(const h of hs){ if(h.point.y<=y0+1.21&&h.point.y>t) t=h.point.y; } return t; };
  const starts=[]; for(let a=0;a<14;a++){ const ang=a*0.9, r=40+a*13; starts.push([Math.cos(ang)*r, Math.sin(ang)*r, ang+1.0]); }
  const res=[]; let all=[];
  for(const spr of [false,true]) for(const [x,z,yaw] of starts){
    if(W.fastHeight(x,z)<(rp.WSURF||0)+0.5) continue;
    rp.setPos(x,z,yaw); rp.setInput(0,1); rp.sprint(spr); rp.sim(0.6);
    const d=[]; let trav=0, px=S.x, pz=S.z, slopeMax=0, py=S.y;
    for(let i=0;i<60;i++){ rp.sim(0.1); const v=vis(S.x,S.z,S.y); const gy=S.nav.groundY(S.x,S.z,W.fastHeight(S.x,S.z)); d.push([+(gy-S.y).toFixed(3), +(v-S.y).toFixed(3)]); trav+=Math.hypot(S.x-px,S.z-pz); px=S.x; pz=S.z; slopeMax=Math.max(slopeMax,Math.abs(S.y-py)/0.1/Math.max(0.1,Math.hypot(S.vx,S.vz))); py=S.y; }
    if(trav<3) continue;
    const dg=d.map(a=>a[0]), dv=d.map(a=>a[1]);
    res.push({spr,x:Math.round(x),z:Math.round(z),trav:+trav.toFixed(0),maxLagBelowGround:Math.max(...dg),maxBelowVisible:Math.max(...dv.filter(v=>v>-5)),slope:+slopeMax.toFixed(2)});
    all.push(...dg);
  }
  all.sort((a,b)=>a-b); const q=p=>all[Math.floor(p*(all.length-1))];
  return JSON.stringify({runs:res.length,p50:q(0.5),p90:q(0.9),p99:q(0.99),max:all[all.length-1],worst:res.sort((a,b)=>b.maxBelowVisible-a.maxBelowVisible).slice(0,10)});
})()
"""
def up():
    s = socket.socket(); s.settimeout(0.5)
    try: s.connect(('127.0.0.1', PORT)); return True
    except Exception: return False
    finally: s.close()
async def main():
    srv = None
    if not up():
        srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=D, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1.5)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(args=ARGS)
            pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
            errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
            await pg.goto('http://127.0.0.1:%d/rp1_dev.html?q=low&w=clear&h=14&wa=0.1' % PORT)
            for i in range(1200):
                await asyncio.sleep(0.5)
                if await pg.evaluate('!!window.__ready'): break
            for i in range(600):
                if await pg.evaluate('!!(window.__bw && __bw.lateReady)'): break
                await asyncio.sleep(1)
            await pg.evaluate("(async()=>{ await __rpLoad('?v=%d'); await __rp.start('elina'); await new Promise(r=>setTimeout(r,2500)); return 1; })()" % int(time.time()))
            res = await pg.evaluate(JS)
            print(res); print('errors', errs[:3])
            await b.close()
    finally:
        if srv: srv.terminate()
asyncio.run(main())
