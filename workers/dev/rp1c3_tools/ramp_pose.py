#!/usr/bin/env python3
# ramp_pose.py [-t TAG] i mode name    mode: far | foot | mid | top | down | topwalk
import sys, subprocess, time, json
tag='rp1c3'; a=sys.argv[1:]
if a[0]=='-t': tag=a[1]; a=a[2:]
i, mode, name = int(a[0]), a[1], a[2]
js = """(async()=>{const api=window.__rp,S=api.S; api.pause(false); S.doorHook=()=>{}; S.cool=99; api.camLook(2); api.shadowLook(2);
 const R=api.ramps(), rt=R.route(%d), mode=%s; const n=rt.length; const yaw0=Math.atan2(rt[1][0]-rt[0][0], rt[1][1]-rt[0][1]);
 const hook=()=>{ if(!S.hero.blob.__hk){S.hero.blob.__hk=1; window.__c2=0; S.hero.blob.onBeforeRender=()=>{window.__c2++}} };
 const place=(x,z,yaw)=>{ api.setPos(x,z,yaw); S.camYaw=S.body=yaw; S.inp.x=0; S.inp.y=0; api.sim(0.6, 1/30); };
 const walkTo=(stopFn, tmax)=>{ let k=1,t=0; while(t<tmax){ const [tx,tz]=rt[Math.min(k,n-1)], dx=tx-S.x, dz=tz-S.z, d=Math.hypot(dx,dz); if(d<0.8&&k<n-1){k++;continue;} S.camYaw=Math.atan2(dx,dz); S.inp.x=0; S.inp.y=0.8; api.sim(1/30,1/30); t+=1/30; if(stopFn()) break; } S.inp.y=0; api.sim(0.5,1/30); return t; };
 const L=(()=>{let s=0; for(let k=1;k<n;k++) s+=Math.hypot(rt[k][0]-rt[k-1][0], rt[k][1]-rt[k-1][1]); return s;})();
 let info={};
 if(mode==='far'){ const b=R.st.ramps[%d].wall, k=Math.floor(n/2), mx=rt[k][0], mz=rt[k][1], dx0=mx-b.x, dz0=mz-b.z, vv=dx0*b.vx+dz0*b.vz, sg=vv>=0?1:-1; let ok=null; for (const d of [12,10,8,6]) { const px=mx+sg*b.vx*d, pz=mz+sg*b.vz*d; if (api.free(px,pz)) { ok=[px,pz,d]; break; } } if(!ok) ok=[mx+sg*b.vx*6, mz+sg*b.vz*6, 6]; place(ok[0], ok[1], Math.atan2(mx-ok[0], mz-ok[1])); info.far=ok; }
 else if(mode==='back'){ let ok=null; for (const d of [9,7,5]) { const px=rt[0][0]-Math.sin(yaw0)*d, pz=rt[0][1]-Math.cos(yaw0)*d; if (api.free(px,pz)) { ok=[px,pz]; break; } } if(!ok) ok=[rt[0][0]-Math.sin(yaw0)*4, rt[0][1]-Math.cos(yaw0)*4]; place(ok[0], ok[1], yaw0); info.back=ok; }
 else if(mode==='foot'){ place(rt[0][0], rt[0][1], yaw0); }
 else if(mode==='mid'){ place(rt[0][0], rt[0][1], yaw0); let tr=0,px=S.x,pz=S.z; walkTo(()=>{ tr+=Math.hypot(S.x-px,S.z-pz); px=S.x; pz=S.z; return tr>L*0.5; }, 120); }
 else if(mode==='top'){ place(rt[0][0], rt[0][1], yaw0); walkTo(()=>S.layer==='top'||S.layer==='climb', 150); for(let k=0;k<40&&S.layer==='climb';k++) api.sim(1/30,1/30); S.inp.y=0; api.sim(0.5,1/30); }
 else if(mode==='topwalk'){ place(rt[0][0], rt[0][1], yaw0); walkTo(()=>S.layer==='top'||S.layer==='climb', 150); for(let k=0;k<40&&S.layer==='climb';k++) api.sim(1/30,1/30); const b=S.top; S.inp.y=0.8; for(let k=0;k<90;k++){ api.sim(1/30,1/30);} S.inp.y=0; api.sim(0.5,1/30); }
 hook(); await new Promise(r=>setTimeout(r,1500)); info=api.pos(); info.layer=S.layer; info.L=+L.toFixed(1); return JSON.stringify(info);})()""" % (i, json.dumps(mode), i)
open('/tmp/rp_cmd_%s.js'%tag,'w').write(js)
r=subprocess.run(['python3','/home/claude/dev/rp1c2_q.py','-t',tag,'evalf','/tmp/rp_cmd_%s.js'%tag],capture_output=True,text=True,timeout=200); print(r.stdout.strip()[:200], r.stderr.strip()[:200])
def q(js):
    return subprocess.run(['python3','/home/claude/dev/rp1c2_q.py','-t',tag,'eval',js],capture_output=True,text=True,timeout=150).stdout.strip()
def cnt():
    s=q('JSON.stringify(window.__c2||0)').strip('"')
    try: return int(float(s))
    except: return -1
c0=cnt(); t0=time.time()
while time.time()-t0<200 and cnt()<c0+3: time.sleep(1.5)
r=subprocess.run(['python3','/home/claude/dev/rp1c2_q.py','-t',tag,'shot',name],capture_output=True,text=True,timeout=120); print(r.stdout.strip())
