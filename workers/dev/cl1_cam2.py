#!/usr/bin/env python3
# cl1_cam.py <tag> <door-spec> [...]  — a clean frame of the 3 m in front of a door: the hero stands 3.2 m in front of the door (physics + LOD + cull proxies settle), then ONE extra camera (6.5 m behind her, 3.4 m up,
# looking at the door at 1.1 m) renders the scene at 1280 x 720 -> cl1/shots/<tag>_<id>.png (the game's own camera / UI are not in it).  door-spec = id  or  id@fx  (when several doors share an id).
import sys, json, base64, time
sys.path.insert(0, '/home/claude/work'); import cl1q
import os; BACK=float(os.environ.get('BACK','9')); SIDE=float(os.environ.get('SIDE','4')); UP=float(os.environ.get('UP','8'))
tag = sys.argv[1]; specs = sys.argv[2:]
for spec in specs:
    i, _, fxs = spec.partition('@')
    js = """(async()=>{const rp=__rp,S=rp.S,B=__bw; const its=rp.doors().items().filter(q=>q.fx!==undefined); const FX=%s; const it=its.find(q=>q.id===%s&&(FX===null||Math.abs(q.fx-FX)<0.6)); if(!it) return JSON.stringify({err:'nodoor'});
      const nx=(it.x-it.fx)/0.7,nz=(it.z-it.fz)/0.7,l=Math.hypot(nx,nz)||1,ux=nx/l,uz=nz/l; const hx=it.fx+ux*3.2, hz=it.fz+uz*3.2; rp.setPos(hx,hz,Math.atan2(-ux,-uz)); S.pitch=0.3; S.snap=true;
      const f0=B.renderer.info.render.frame; const t0=performance.now(); while(B.renderer.info.render.frame<f0+10 && performance.now()-t0<60000) await new Promise(r=>setTimeout(r,200));
      const T=B.scene.position.constructor; const cam=new B.camera.constructor(46,16/9,0.3,3000); const gy=rp.ground(it.fx,it.fz);
      cam.position.set(it.fx+ux*(3.2+%s)+(-uz)*%s, gy+%s, it.fz+uz*(3.2+%s)+(ux)*%s); cam.lookAt(it.fx+ux*1.5, gy+0.2, it.fz+uz*1.5); cam.updateMatrixWorld(true);
      const R=B.renderer; const w0=R.domElement.width,h0=R.domElement.height,pr=R.getPixelRatio();
      R.setPixelRatio(1); R.setSize(1280,720,false); R.render(B.scene,cam); const url=R.domElement.toDataURL('image/png'); R.setPixelRatio(pr); R.setSize(w0/pr,h0/pr,false);
      return JSON.stringify({id:it.id,fx:+it.fx.toFixed(1),fz:+it.fz.toFixed(1),frames:B.renderer.info.render.frame-f0,url});})()""" % (json.dumps(float(fxs) if fxs else None), json.dumps(i), BACK, SIDE, UP, BACK, SIDE)
    r = cl1q.send({'op': 'eval', 'js': js}, 300)
    v = r.get('v')
    if not v: print(spec, 'ERR', r); continue
    d = json.loads(v)
    if d.get('err'): print(spec, d); continue
    open('/home/claude/work/cl1/shots/%s_%s.png' % (tag, i.replace(':', '_')), 'wb').write(base64.b64decode(d['url'].split(',', 1)[1]))
    print(spec, d['fx'], d['fz'], 'frames', d['frames'])
