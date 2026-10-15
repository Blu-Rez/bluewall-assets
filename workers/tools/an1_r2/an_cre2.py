import json, math, sys, collections, statistics as st
REF={'dog':2.2,'wolf':2.8,'knight':7.5}
def run(files, vmin=0.5):
    W=collections.defaultdict(list); TS=collections.defaultdict(list); VF=collections.defaultdict(list); SL=collections.defaultdict(list); N=collections.Counter()
    for fn in files:
        R=json.load(open(fn))['result']; dt=R['dt']
        for o in R['out']:
            rows=o['rows']; n=len(rows); kind=o['kind']; nf=o['nfeet']
            if nf==0: continue
            # per clip and foot: lowest / highest height (5 % / 95 %) of the foot while that clip plays at speed
            rng={}
            for clip in set(r['clip'] for r in rows):
                idx=[j for j in range(n) if rows[j]['clip']==clip]
                if len(idx)<40: continue
                for f in range(nf):
                    ys=sorted(rows[j]['feet'][f][1] for j in idx); rng[(clip,f)]=(ys[int(0.05*(len(ys)-1))],ys[int(0.95*(len(ys)-1))])
            for j in range(3,n-3):
                a,b,c=rows[j-1],rows[j],rows[j+1]
                vx=(c['x']-a['x'])/(2*dt); vz=(c['z']-a['z'])/(2*dt); v=math.hypot(vx,vz)
                if v<vmin: continue
                yaw=b['yaw']; fx,fz=math.sin(yaw),math.cos(yaw); vf=vx*fx+vz*fz; ts=b['ts'] or 1
                key=(kind,b['clip']); N[key]+=1; TS[key].append(ts); VF[key].append(vf)
                for f in range(nf):
                    if (b['clip'],f) not in rng: continue
                    lo,hi=rng[(b['clip'],f)]; th=lo+max(0.02,0.2*(hi-lo))
                    if not (rows[j-1]['feet'][f][1]<=th and b['feet'][f][1]<=th and rows[j+1]['feet'][f][1]<=th): continue      # interior of a stance only
                    fa,fc=a['feet'][f],c['feet'][f]; gx=(fc[0]-fa[0])/(2*dt); gz=(fc[2]-fa[2])/(2*dt)
                    gf=gx*fx+gz*fz; W[key].append((vf-gf)/ts); SL[key].append(math.hypot(gx,gz)*100)
    return W,TS,VF,SL,N
def show(files,title):
    W,TS,VF,SL,N=run(files); print('==',title)
    print('%-8s %-8s %6s %7s %7s %9s | %12s %14s %9s'%('kind','clip','n','v m/s','tscale','slide avg','v_nat(clip)','match v/(ts*vnat)','floor cm/s'))
    for key in sorted(W):
        if N[key]<30 or len(W[key])<30: continue
        w=W[key]; vn=st.median(w); ts=st.mean(TS[key]); floor=st.mean(abs(x-vn) for x in w)*ts*100
        match=st.median(v/(t*vn) for v,t in zip(VF[key],TS[key])) if vn>0 else float('nan')
        print('%-8s %-8s %6d %7.2f %7.2f %9.1f | %12.2f %14.2f %9.1f'%(key[0],key[1],N[key],st.mean(VF[key]),ts,st.mean(SL[key]),vn,match,floor))
if __name__=='__main__':
    show(sys.argv[2:],sys.argv[1])
