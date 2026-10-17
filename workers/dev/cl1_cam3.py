#!/usr/bin/env python3
# cl1_cam3.py <tag> <door-spec> [...]  — like cl1_cam.py, but ONE teleport per door and SEVERAL vantage points (for doors whose default camera sits inside a wall / roof):
#   variants (back, side, up) = (4,3,7) (9,2,12) (3,-4,5); the frames go to cl1/shots/<tag><k>_<id>.png (k = 1..3)
import sys, json, base64
sys.path.insert(0, '/home/claude/work'); import cl1q
tag = sys.argv[1]; specs = sys.argv[2:]
V = json.dumps([[4, 3, 7], [9, 2, 12], [3, -4, 5]])
for spec in specs:
    i, _, fxs = spec.partition('@')
    js = """(async()=>{const rp=__rp,S=rp.S,B=__bw; const its=rp.doors().items().filter(q=>q.fx!==undefined); const FX=%s; const it=its.find(q=>q.id===%s&&(FX===null||Math.abs(q.fx-FX)<0.6)); if(!it) return JSON.stringify({err:'nodoor'});
      const nx=(it.x-it.fx)/0.7,nz=(it.z-it.fz)/0.7,l=Math.hypot(nx,nz)||1,ux=nx/l,uz=nz/l; const hx=it.fx+ux*3.2, hz=it.fz+uz*3.2; rp.setPos(hx,hz,Math.atan2(-ux,-uz)); S.pitch=0.3; S.snap=true;
      const f0=B.renderer.info.render.frame; const t0=performance.now(); while(B.renderer.info.render.frame<f0+10 && performance.now()-t0<60000) await new Promise(r=>setTimeout(r,200));
      const gy=rp.ground(it.fx,it.fz); const R=B.renderer; const w0=R.domElement.width,h0=R.domElement.height,pr=R.getPixelRatio(); const urls=[];
      for(const [bk,sd,up] of %s){ const cam=new B.camera.constructor(46,16/9,0.3,3000);
        cam.position.set(it.fx+ux*(3.2+bk)+(-uz)*sd, gy+up, it.fz+uz*(3.2+bk)+(ux)*sd); cam.lookAt(it.fx+ux*1.5, gy+0.3, it.fz+uz*1.5); cam.updateMatrixWorld(true);
        R.setPixelRatio(1); R.setSize(1280,720,false); R.render(B.scene,cam); urls.push(R.domElement.toDataURL('image/png')); }
      R.setPixelRatio(pr); R.setSize(w0/pr,h0/pr,false);
      return JSON.stringify({id:it.id,fx:+it.fx.toFixed(1),fz:+it.fz.toFixed(1),urls});})()""" % (json.dumps(float(fxs) if fxs else None), json.dumps(i), V)
    r = cl1q.send({'op': 'eval', 'js': js}, 300); v = r.get('v')
    if not v: print(spec, 'ERR', r); continue
    d = json.loads(v)
    if d.get('err'): print(spec, d); continue
    for k, u in enumerate(d['urls'], 1):
        open('/home/claude/work/cl1/shots/%s%d_%s.png' % (tag, k, i.replace(':', '_')), 'wb').write(base64.b64decode(u.split(',', 1)[1]))
    print(spec, d['fx'], d['fz'], 'ok')
