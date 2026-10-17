import json,sys,collections
p=json.load(open(sys.argv[1]))
nodes={n['id']:n for n in p['nodes']}; parent={}
for n in p['nodes']:
    for c in n.get('children',[]): parent[c]=n['id']
def name(i):
    cf=nodes[i]['callFrame']; u=cf['url'].split('/')[-1].split('?')[0] if cf['url'] else ''
    return f"{cf['functionName'] or '(anon)'}@{u}:{cf['lineNumber']+1}"
S=p['samples']; D=p['timeDeltas']; t=p['startTime']; ts=[]
for d in D: t+=d; ts.append(t)
isidle=lambda i: nodes[i]['callFrame']['functionName']=='(idle)'
tasks=[];cur=None
for k,(s,tt) in enumerate(zip(S,ts)):
    if isidle(s):
        if cur: tasks.append(cur);cur=None
        continue
    if cur is None: cur={'a':tt,'idx':[]}
    cur['idx'].append(k);cur['b']=tt
if cur: tasks.append(cur)
pat=sys.argv[2:]
print('all tasks >=60ms:')
for x in tasks:
    d=(x['b']-x['a'])/1000
    if d<60: continue
    incl=collections.Counter()
    for k in x['idx']:
        dt=(D[k+1] if k+1<len(D) else D[k])/1000
        i=S[k];seen=set()
        while i is not None:
            n=name(i)
            if n not in seen: incl[n]+=dt;seen.add(n)
            i=parent.get(i)
    hits=[(n,round(v)) for n,v in incl.items() if any(q in n for q in pat)]
    top=[(n.split('@')[0],round(v)) for n,v in incl.most_common(40) if not n.startswith(('(root','loop','(anon)@wall','R3.','r.','WebGLRenderer.render@'))][:5]
    print(f"+{(x['a']-p['startTime'])/1e6:5.1f}s {d:5.0f}ms hits={hits} top={top}")
