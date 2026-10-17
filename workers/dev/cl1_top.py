import sys, json, base64
sys.path.insert(0,'/home/claude/work'); import cl1q
name=sys.argv[1]; cx,cz,h,dx,dz=[float(v) for v in sys.argv[2:7]]
js="""(async()=>{const rp=__rp,S=rp.S,B=__bw; rp.setPos(%f,%f,0); const f0=B.renderer.info.render.frame; const t0=performance.now(); while(B.renderer.info.render.frame<f0+10 && performance.now()-t0<60000) await new Promise(r=>setTimeout(r,200));
 const gy=rp.ground(%f,%f); const cam=new B.camera.constructor(50,16/9,0.3,3000); cam.position.set(%f+%f,gy+%f,%f+%f); cam.lookAt(%f,gy+1,%f); cam.updateMatrixWorld(true);
 const R=B.renderer; const w0=R.domElement.width,h0=R.domElement.height,pr=R.getPixelRatio(); R.setPixelRatio(1); R.setSize(1280,720,false); R.render(B.scene,cam); const url=R.domElement.toDataURL('image/png'); R.setPixelRatio(pr); R.setSize(w0/pr,h0/pr,false); return JSON.stringify({url});})()""" % (cx+25,cz+25,cx,cz,cx,dx,h,cz,dz,cx,cz)
r=cl1q.send({'op':'eval','js':js},300); d=json.loads(r['v']); open('/home/claude/work/cl1/shots/%s.png'%name,'wb').write(base64.b64decode(d['url'].split(',',1)[1])); print('ok')
