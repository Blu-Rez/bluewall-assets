import asyncio, sys, os
from playwright.async_api import async_playwright
async def main():
    out = sys.argv[1]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width':390,'height':844}, device_scale_factor=1.5)
        await pg.goto("http://127.0.0.1:8777/dev.html?q=high&nolate&h=15&w=clear")
        for i in range(900):
            await asyncio.sleep(0.5)
            if await pg.evaluate('!!window.__ready'): break
        await pg.evaluate("(()=>{const c=__bw.ctl; if(c.intro){c.intro.hold=false; c.intro.t=c.intro.dur;} })()")
        await pg.add_script_tag(path='/home/claude/dev/cam.js')
        info = await pg.evaluate("""(()=>{const T=__bw.THREE; let best=null;
          __bw.scene.traverse(m=>{ if(m.isInstancedMesh && m.geometry.parameters && m.geometry.parameters.widthSegments===10){ const M=new T.Matrix4(); for(let i=0;i<m.count;i++){ m.getMatrixAt(i,M); const p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3(); M.decompose(p,q,s); if(!best||s.x>best.s) best={i,s:s.x,p:p.toArray(),q:q.toArray(), n:m.count}; } } });
          return best;})()""")
        print(info)
        px,py,pz = info['p']; q = info['q']
        # facing: local +z rotated by quaternion (rotation around y): ry = 2*atan2(qy,qw)
        import math
        ry = 2*math.atan2(q[1], q[3]); s = info['s']
        zx, zz = math.sin(ry), math.cos(ry); xx, xz = math.cos(ry), -math.sin(ry)
        cx = px + xx*1.6*s + zx*9*s; cz = pz + xz*1.6*s + zz*9*s; cy = py - 0.8*s
        tx = px + xx*1.6*s; tz = pz + xz*1.6*s; ty = py - 1.0*s
        for tag,sgn in (('f',1),('b',-1)):
            cx = px + xx*1.6*s + sgn*zx*9*s; cz = pz + xz*1.6*s + sgn*zz*9*s
            await pg.evaluate('(a)=>__cam(...a)', [cx,cy,cz,tx,ty,tz])
            for i in range(240):
                await asyncio.sleep(0.5)
                if await pg.evaluate('__bw.frames >= window.__f0 + 3'): break
            await pg.screenshot(path=f'{out}_{tag}.png', timeout=240000); print('shot', tag, flush=True)
        await b.close()
asyncio.run(main())
