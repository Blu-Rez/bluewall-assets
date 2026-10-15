import json, math, sys, collections
def mean(a): return sum(a)/len(a) if a else float('nan')
def q(a,p):
    a=sorted(a); return a[min(len(a)-1,int(p*(len(a)-1)))] if a else float('nan')
REF={'dog':2.2,'wolf':2.8,'knight':7.5}
def analyse(files, vmin=0.5):
    res=collections.defaultdict(lambda: collections.defaultdict(list)); ev=collections.defaultdict(list)
    for fn in files:
        R=json.load(open(fn))['result']; dt=R['dt']
        for o in R['out']:
            rows=o['rows']; n=len(rows); kind=o['kind']; ref=REF[kind]; nf=o['nfeet']
            if nf==0: continue
            # per-foot ground level (20th percentile of its y)
            lev=[]
            for f in range(nf):
                ys=sorted(r['feet'][f][1] for r in rows); lev.append(ys[int(0.2*(n-1))])
            for j in range(2,n-2):
                a,b,c=rows[j-1],rows[j],rows[j+1]
                vx=(c['x']-a['x'])/(2*dt); vz=(c['z']-a['z'])/(2*dt); v=math.hypot(vx,vz)
                step=math.hypot(c['x']-b['x'],c['z']-b['z'])
                if step>0.35: ev[(kind,'teleport')].append(step)
                dy=abs(math.atan2(math.sin(c['yaw']-b['yaw']),math.cos(c['yaw']-b['yaw'])))
                if dy>0.5: ev[(kind,'yawjump')].append(dy)
                key=(kind,b['clip'])
                if v<vmin: continue
                yaw=b['yaw']; vf=vx*math.sin(yaw)+vz*math.cos(yaw); vr=vx*math.cos(yaw)-vz*math.sin(yaw)
                res[key]['v'].append(v); res[key]['ang'].append(abs(math.atan2(vr,vf))); res[key]['ts'].append(b['ts'])
                sl=[]
                for f in range(nf):
                    if b['feet'][f][1]>lev[f]+0.02*ref: continue
                    fa,fc=a['feet'][f],c['feet'][f]
                    sl.append(math.hypot((fc[0]-fa[0])/(2*dt),(fc[2]-fa[2])/(2*dt)))
                if sl: res[key]['slide'].append(mean(sl)*100)
            # accel & switch speeds
            vs=[math.hypot(rows[j+1]['x']-rows[j-1]['x'],rows[j+1]['z']-rows[j-1]['z'])/(2*dt) for j in range(1,n-1)]
            acc=[abs(vs[j+1]-vs[j-1])/(2*dt) for j in range(1,len(vs)-1)]
            if acc: ev[(kind,'maxacc')].append(max(acc))
            for j in range(2,n-2):
                if rows[j]['clip']!=rows[j-1]['clip'] : ev[(kind,'switch %s->%s'%(rows[j-1]['clip'],rows[j]['clip']))].append(vs[j-1])
    return res,ev
def show(res,ev):
    print('%-8s %-9s %6s %7s %7s %7s %9s %9s'%('kind','clip','n','v m/s','ang°','tscale','slide avg','slide p90'))
    for (kind,clip),g in sorted(res.items()):
        if len(g['v'])<15: continue
        sl=g.get('slide',[])
        print('%-8s %-9s %6d %7.2f %7.1f %7.2f %9.1f %9.1f'%(kind,clip,len(g['v']),mean(g['v']),mean(g['ang'])*57.3,mean(g['ts']),mean(sl) if sl else float('nan'),q(sl,.9) if sl else float('nan')))
    tot=collections.defaultdict(list)
    for (k,w),v in ev.items(): tot[(k,w)]+=v
    for (k,w),v in sorted(tot.items()):
        if w in('teleport','yawjump'): print('%-8s %-9s n=%d max=%.2f'%(k,w,len(v),max(v)))
        elif w=='maxacc': print('%-8s maxacc    p50=%.1f max=%.1f m/s2'%(k,q(v,.5),max(v)))
        elif 'Walk' in w or 'Gallop' in w: print('%-8s %-22s n=%d speed at switch mean %.2f max %.2f'%(k,w,len(v),mean(v),max(v)))
if __name__=='__main__':
    res,ev=analyse(sys.argv[1:]); show(res,ev)
