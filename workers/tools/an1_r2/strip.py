import json, sys, subprocess, urllib.request, os
from PIL import Image
def ev(port, src, P):
    open('/tmp/strip_job.js','w').write('const P='+json.dumps(P)+';\n'+open('/home/claude/work/an1_r2/'+src).read())
    out=subprocess.run(['/home/claude/work/an1_r2/ev.sh','/tmp/strip_job.js',str(port)],capture_output=True,text=True,env={'EVT':'900','PATH':'/usr/bin:/bin'}).stdout
    return json.loads(out)
def shot(port, path):
    urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:%d/shot?path=%s'%(port,path),method='POST',data=b''),timeout=120).read()
def strip(port, tag, sub, spot, D, fov, n=6, dt=0.25, **kw):
    P=dict(sub=sub,spot=spot,D=D,fov=fov,**kw); r=ev(port,'strip_prep.js',P); print(tag,sub,r.get('result') if r.get('ok') else r)
    if not r.get('ok') or 'err' in r['result']: return None
    paths=[]
    for i in range(n):
        s=ev(port,'strip_step.js',{'dt':dt if i else 0.04}); p='/home/claude/work/an1_r2/shots/%s_%s_%d.png'%(tag,sub,i); shot(port,p); paths.append(p); print('  ',i,s.get('result'))
    ev(port,'strip_end.js',{}); return paths
if __name__=='__main__':
    port=int(sys.argv[1]); tag=sys.argv[2]; sub=sys.argv[3]; spot=[float(sys.argv[4]),float(sys.argv[5])]; D=float(sys.argv[6]); fov=float(sys.argv[7])
    extra={}; 
    if len(sys.argv)>8: extra=json.loads(sys.argv[8])
    strip(port,tag,sub,spot,D,fov,**extra)
