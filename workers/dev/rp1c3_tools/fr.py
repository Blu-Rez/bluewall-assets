#!/usr/bin/env python3
# fr.py [-t TAG] x z yaw camLook shLook mode name      mode: still | walk | run
import sys, subprocess
tag='rp1c3'; a=sys.argv[1:]
if a[0]=='-t': tag=a[1]; a=a[2:]
x,z,yaw,cl,sl,mode,name=a[:7]
iy={'still':0,'walk':0.5,'run':1}[mode]
js="""(async()=>{const api=window.__rp,S=api.S; api.pause(false); S.doorHook=()=>{}; api.camLook(%s); api.shadowLook(%s); api.setPos(%s,%s,%s); api.setLook(%s, api.camLook().pit); S.camYaw=%s; S.inp.x=0; S.inp.y=%s; S.cool=99; api.sim(0.6); if(!S.hero.blob.__hk){S.hero.blob.__hk=1; window.__c2=0; S.hero.blob.onBeforeRender=()=>{window.__c2++}} await new Promise(r=>setTimeout(r,%d)); const o=api.pos(); S.inp.y=0; return JSON.stringify(o);})()""" % (cl,sl,x,z,yaw,yaw,yaw,iy, 700 if mode!='still' else 1500)
open('/tmp/fr_cmd_%s.js'%tag,'w').write(js)
r=subprocess.run(['python3','/home/claude/dev/rp1c2_q.py','-t',tag,'evalf','/tmp/fr_cmd_%s.js'%tag],capture_output=True,text=True); print(r.stdout.strip()[:120], r.stderr.strip()[:120])
import time,json
def q(js):
    return subprocess.run(['python3','/home/claude/dev/rp1c2_q.py','-t',tag,'eval',js],capture_output=True,text=True,timeout=150).stdout.strip()
def cnt():
    s=q('JSON.stringify(window.__c2||0)').strip('"'); 
    try: return int(float(s))
    except: return -1
c0=cnt(); t0=time.time()
while time.time()-t0<200 and cnt()<c0+3: time.sleep(1.5)
r=subprocess.run(['python3','/home/claude/dev/rp1c2_q.py','-t',tag,'shot',name],capture_output=True,text=True); print(r.stdout.strip())
