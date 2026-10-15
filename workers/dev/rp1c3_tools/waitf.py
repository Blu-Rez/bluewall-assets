#!/usr/bin/env python3
# waitf.py [-t TAG] N : wait until the render counter window.__c2 grew by N frames
import sys,subprocess,time,json
tag='rp1c3'; a=sys.argv[1:]
if a and a[0]=='-t': tag=a[1]; a=a[2:]
n=int(a[0]) if a else 2
def q(js):
    r=subprocess.run(['python3','/home/claude/dev/rp1c2_q.py','-t',tag,'eval',js],capture_output=True,text=True,timeout=120); return r.stdout.strip()
c0=json.loads(json.loads(q('JSON.stringify(window.__c2||0)')) if q('JSON.stringify(window.__c2||0)').startswith('"') else q('JSON.stringify(window.__c2||0)'))
t0=time.time()
while time.time()-t0<150:
    s=q('JSON.stringify(window.__c2||0)'); c=int(json.loads(s)) if s.startswith('"') else int(s)
    if c>=c0+n: break
    time.sleep(2)
print('frames', c-c0, 'in', round(time.time()-t0,1),'s')
