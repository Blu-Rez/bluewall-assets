import asyncio, sys, os, json, time
from playwright.async_api import async_playwright
OUT = '/home/claude/work/scan37'
SCAN = """() => { const s=__bw.battle.session, dp=s.sim.deploy, tx=-dp.nz, tz=dp.nx; const T=__bw.THREE; const out=[]; const box=new T.Box3(), v=new T.Vector3(), sz=new T.Vector3();
 const lb=(x,z)=>{const dx=x-dp.x,dz=z-dp.z;return [Math.round(dx*tx+dz*tz),Math.round(dx*dp.nx+dz*dp.nz)];};
 const chain=(o)=>{ let n=[]; let p=o; for(let i=0;i<4&&p;i++){ if(p.name) n.push(p.name); p=p.parent; } return n.join('<'); };
 __bw.scene.traverse(o=>{ let p=o, vis=true; while(p){ if(!p.visible){vis=false;break;} p=p.parent;} if(!vis) return;
   if(o.isInstancedMesh){ const a=o.instanceMatrix.array; let n=0, sample=[]; for(let i=0;i<o.count;i++){ const x=a[i*16+12], z=a[i*16+14]; if(x===0&&z===0) continue; const [l,b]=lb(x,z); if(Math.abs(l)<150&&b>-45&&b<200){ n++; if(sample.length<3) sample.push([l,b]); } } if(n) out.push({k:'inst', name:chain(o)||o.type, n, sample}); }
   else if(o.isMesh){ box.setFromObject(o); box.getCenter(v); box.getSize(sz); const [l,b]=lb(v.x,v.z); if(Math.abs(l)<150&&b>-45&&b<200 && sz.x<90 && sz.z<90 && sz.y>2.5) out.push({k:'mesh', name:chain(o)||o.type, l,b, sx:+sz.x.toFixed(0), sy:+sz.y.toFixed(0), sz:+sz.z.toFixed(0)}); } });
 return out; }"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=1)
        await pg.goto('http://127.0.0.1:8777/dev_s35.html?q=low&w=clear&h=14&wa=0.1&lv=30')
        for i in range(3000):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        for i in range(600):
            if await pg.evaluate('!!__bw.lateReady'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        if os.environ.get('ARMY') == 'small':
            await pg.evaluate("(a) => { const A = __bw.econ.st.army; A.army = a; A.guard = {}; }", {'spear': 30, 'sword': 20, 'archer': 20, 'cavalry': 8})
        await pg.evaluate("document.querySelector('.bwa-btn').click()")
        for i in range(2400):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!(__bw.battle && __bw.battle.session && !__bw.battle.session.loading)'): break
        for i in range(900):
            if await pg.evaluate('__bw.battle.session.cam.intro <= 0.01'): break
            await asyncio.sleep(1)
        await asyncio.sleep(3)
        print('DP', json.dumps(await pg.evaluate('(() => { const d = __bw.battle.session.sim.deploy; return { x: d.x, z: d.z, nx: d.nx, nz: d.nz, d: d.d, lat: d.lat }; })()')), flush=True)
        res = await pg.evaluate(SCAN)
        agg = {}
        for r in res:
            k = r['name']; a = agg.setdefault(k, {'k': r['k'], 'n': 0, 'items': []}); a['n'] += r.get('n', 1)
            if r['k'] == 'mesh' and len(a['items']) < 6: a['items'].append([r['l'], r['b'], r['sx'], r['sy'], r['sz']])
            if r['k'] == 'inst' and len(a['items']) < 2: a['items'].append(r['sample'])
        for k, a in sorted(agg.items(), key=lambda kv: -kv[1]['n']): print('OBJ', k[:90], a['k'], a['n'], json.dumps(a['items']), flush=True)
        await pg.evaluate("(()=>{const s=__bw.battle.session; s.hud.el.style.display='none'; const dp=s.sim.deploy, tx=-dp.nz, tz=dp.nx; s.cam.tx=dp.x+dp.nx*60; s.cam.tz=dp.z+dp.nz*60; s.cam.dist=330; s.cam.pitch=1.5;})()")
        await asyncio.sleep(10)
        await pg.screenshot(path=OUT + '_top.png', timeout=240000)
        await b.close()
asyncio.run(main())
