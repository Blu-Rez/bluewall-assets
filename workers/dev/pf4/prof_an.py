import json,sys,collections
p=json.load(open(sys.argv[1])); thr=float(sys.argv[2]) if len(sys.argv)>2 else 90
nodes={n['id']:n for n in p['nodes']}; parent={}
for n in p['nodes']:
    for c in n.get('children',[]): parent[c]=n['id']
def name(i):
    cf=nodes[i]['callFrame']; u=cf['url'].split('/')[-1] if cf['url'] else ''
    return f"{cf['functionName'] or '(anon)'}@{u}:{cf['lineNumber']+1}"
S=p['samples']; D=p['timeDeltas']; t=p['startTime']; ts=[]
for d in D: t+=d; ts.append(t)
# tasks: runs of non-idle samples with gaps < 2ms
IDLE={'(idle)','(program)'}
def isidle(i): return nodes[i]['callFrame']['functionName'] in ('(idle)',)
tasks=[]; cur=None
for k,(s,tt) in enumerate(zip(S,ts)):
    if isidle(s):
        if cur: tasks.append(cur); cur=None
        continue
    if cur is None: cur={'a':tt,'idx':[]}
    cur['idx'].append(k); cur['b']=tt
if cur: tasks.append(cur)
big=[x for x in tasks if (x['b']-x['a'])/1000>=thr]
print('tasks',len(tasks),'>=%dms:'%thr,len(big))
for x in sorted(big,key=lambda x:-(x['b']-x['a']))[:8]:
    dur=(x['b']-x['a'])/1000
    selfc=collections.Counter(); incl=collections.Counter()
    for k in x['idx']:
        dt=D[k]/1000 if k<len(D) else 0
        # D[k] is delta *before* sample k; use next delta approx
        dt=(D[k+1] if k+1<len(D) else D[k])/1000
        i=S[k]; selfc[name(i)]+=dt
        seen=set()
        while i in nodes:
            n=name(i)
            if n not in seen: incl[n]+=dt; seen.add(n)
            i=parent.get(i)
            if i is None: break
    print(f"\n== task {dur:.0f} ms at +{(x['a']-p['startTime'])/1e6:.1f}s")
    print(' self:',[(n,round(v)) for n,v in selfc.most_common(7)])
    print(' incl:',[(n,round(v)) for n,v in incl.most_common(14)])
