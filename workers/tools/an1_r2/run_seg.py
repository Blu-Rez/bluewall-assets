import json, sys, math, random, subprocess, collections
random.seed(11)
def segs(files, step=8, cap=9000, labels=('agent','cart.driver','animal:cow','animal:horse','animal:sheep','animal:pig')):
    S=[]
    for fn in files:
        R=json.load(open(fn))['result']
        for sp in R['out']:
            for it in sp['items']:
                if it['label'] not in labels: continue
                rows=it['rows']
                for j in range(0,len(rows)-step,step):
                    a,b=rows[j],rows[j+step]
                    if math.hypot(b[0]-a[0],b[2]-a[2])<0.12: continue                 # standing
                    S.append([a[0],a[2],a[1],b[0],b[2],it['label']])
    random.shuffle(S); return S[:cap]
def run(port, ss):
    src='const P='+json.dumps({'segs':ss})+';\n'+open('/home/claude/work/an1_r2/m4_seg.js').read(); open('/tmp/seg_job.js','w').write(src)
    out=subprocess.run(['/home/claude/work/an1_r2/ev.sh','/tmp/seg_job.js',str(port)],capture_output=True,text=True,env={'EVT':'900','PATH':'/usr/bin:/bin'}).stdout
    return json.loads(out)
port=int(sys.argv[1]); tag=sys.argv[2]; files=sys.argv[3:]
ss=segs(files); print(tag,'segments',len(ss))
r=run(port,ss); print(json.dumps(r['result'] if r.get('ok') else r)[:1800])
json.dump(r,open('out/seg_%s.json'%tag,'w'))
