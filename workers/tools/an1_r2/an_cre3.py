import json, math, sys, collections, statistics as st
def q(a,p): a=sorted(a); return a[min(len(a)-1,int(p*(len(a)-1)))]
def show(files,title,vmin=0.5):
    G=collections.defaultdict(lambda: collections.defaultdict(list))
    for fn in files:
        R=json.load(open(fn))['result']; dt=R['dt']
        for o in R['out']:
            rows=o['rows']
            for j in range(2,len(rows)-2):
                a,c,b=rows[j-1],rows[j+1],rows[j]
                v=math.hypot(c['x']-a['x'],c['z']-a['z'])/(2*dt)
                if v<vmin or b['sn']<2 or b['ss']<0: continue
                k=(o['kind'],b['clip']); G[k]['ss'].append(b['ss']); G[k]['v'].append(v); G[k]['ts'].append(b['ts'])
    print('==',title); print('%-8s %-8s %7s %7s %7s | planted-foot slide cm/s: mean  p50  p90'%('kind','clip','n','v m/s','tscale'))
    for k,g in sorted(G.items()):
        if len(g['ss'])<30: continue
        print('%-8s %-8s %7d %7.2f %7.2f | %6.0f %5.0f %5.0f'%(k[0],k[1],len(g['ss']),st.mean(g['v']),st.mean(g['ts']),st.mean(g['ss']),q(g['ss'],.5),q(g['ss'],.9)))
if __name__=='__main__': show(sys.argv[2:],sys.argv[1])
