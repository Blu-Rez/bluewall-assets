#!/usr/bin/env python3
# ramp_cam.py i dist height name : free camera looking at the middle of ramp i from the inner side (hero paused)
import sys, subprocess, time, json
tag='rp1c3'; i, dist, hgt, name = int(sys.argv[1]), float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
js = """(async()=>{const api=window.__rp,S=api.S,cam=window.__bw.camera; const R=api.ramps(), rt=R.route(%d), b=R.st.ramps[%d].wall; const n=rt.length, k=Math.floor(n*0.45), mx=rt[k][0], mz=rt[k][1];
 const vv=(mx-b.x)*b.vx+(mz-b.z)*b.vz, sg=vv>=0?1:-1; const gy=api.ground(mx,mz);
 api.pause(true); S.hero.grp.visible=false; const mk=api.marker(); 
 const px=mx+sg*b.vx*%f - b.ux*6, pz=mz+sg*b.vz*%f - b.uz*6; cam.position.set(px, gy+%f, pz); cam.lookAt(mx, gy+0.2, mz); cam.updateMatrixWorld(true);
 window.__fr0=window.__bw.renderer.info.render.frame; return JSON.stringify({px,pz,mx,mz,gy,vv});})()""" % (i, i, dist, dist, hgt)
open('/tmp/rc_cmd.js','w').write(js)
r=subprocess.run(['python3','/home/claude/dev/rp1c2_q.py','-t',tag,'evalf','/tmp/rc_cmd.js'],capture_output=True,text=True,timeout=120); print(r.stdout.strip()[:200])
def q(js): return subprocess.run(['python3','/home/claude/dev/rp1c2_q.py','-t',tag,'eval',js],capture_output=True,text=True,timeout=150).stdout.strip()
t0=time.time()
while time.time()-t0<200:
    s=q('JSON.stringify(window.__bw.renderer.info.render.frame-window.__fr0)').strip('"')
    try:
        if int(float(s))>=4: break
    except: pass
    time.sleep(2)
print(subprocess.run(['python3','/home/claude/dev/rp1c2_q.py','-t',tag,'shot',name],capture_output=True,text=True,timeout=120).stdout.strip())
