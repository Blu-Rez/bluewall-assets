import asyncio, os, time, subprocess, socket, json, sys
from playwright.async_api import async_playwright
D = '/home/claude/dev/'; PORT = 8778
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
JS = r"""
(async()=>{
  const B=__bw, T=B.THREE, sc=B.scene, rp=__rp, S=rp.S, W=B.world;
  const ray=new T.Raycaster(); ray.far=400; const down=new T.Vector3(0,-1,0);
  const meshes=[]; sc.updateMatrixWorld(true);
  sc.traverse(o=>{ if(!(o.isMesh)||o.isSkinnedMesh||!o.visible) return; let p=o,hid=false; while(p){ if(p.visible===false){hid=true;break;} p=p.parent; } if(hid) return; if(o.material&&(o.material.transparent||o.material.depthWrite===false)) return; meshes.push(o); });
  const g=S.hero.grp; const pts=[]; const R=+(window.__R||260), st=+(window.__ST||10);
  const homeG=(x,z)=>S.nav.groundY(x,z,W.fastHeight(x,z));
  const out={n:0,meshes:meshes.length,bad:[],hist:{}};
  const byName={};
  for(let x=-R;x<=R;x+=st) for(let z=-R;z<=R;z+=st){
    if(W.fastHeight(x,z)<(rp.WSURF||0)+0.3) continue;
    const gy=homeG(x,z); ray.set(new T.Vector3(x,gy+3,z),down);
    const hits=ray.intersectObjects(meshes,false); out.n++;
    // visible walkable surface = the HIGHEST hit that is at or below gy+3 (hero head height is above) ; hits above gy+0.03 mean the foot is under a surface
    let top=null; for(const h of hits){ if(h.point.y>gy+3.01) continue; if(!top||h.point.y>top.point.y) top=h; }
    if(!top) continue; const d=top.point.y-gy; const k=d<-0.15?'below':d>0.6?'>0.6':d>0.25?'0.25-0.6':d>0.08?'0.08-0.25':'ok';
    out.hist[k]=(out.hist[k]||0)+1;
    if(d>0.08){ const nm=(top.object.name||top.object.geometry?.name||top.object.parent?.name||'?')+'|'+(top.object.parent?.name||''); byName[nm]=byName[nm]||{n:0,max:0,x:x,z:z}; byName[nm].n++; byName[nm].max=Math.max(byName[nm].max,d); if(out.bad.length<400) out.bad.push([x,z,+gy.toFixed(2),+d.toFixed(2),nm]); }
  }
  out.byName=Object.entries(byName).sort((a,b)=>b[1].n-a[1].n).slice(0,25);
  out.bad=out.bad.slice(0,0);
  return JSON.stringify(out);
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
            if len(sys.argv) > 1: await pg.evaluate("window.__R=%s;window.__ST=%s" % (sys.argv[1], sys.argv[2]))
            res = await pg.evaluate(JS)
            print(res); print('errors', errs[:3])
            await b.close()
    finally:
        if srv: srv.terminate()
asyncio.run(main())
