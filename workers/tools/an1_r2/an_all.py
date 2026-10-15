import sys, json, collections
from an_sim import analyse, report, mean, q
def run(variant):
    G=collections.defaultdict(lambda: collections.defaultdict(list)); EV=collections.defaultdict(list)
    for s in 'ABCDEF':
        g,ev=analyse('out/sim_%s_%s.json'%(variant,s),'out/tr_%s.json'%variant)
        for k,m in g.items():
            for a,b in m.items(): G[k][a]+=b
        for k,v in ev.items(): EV[k]+=v
    return G,EV
if __name__=='__main__':
    v=sys.argv[1]; G,EV=run(v); print('=====',v); report(G,EV)
    tot=collections.defaultdict(list)
    for (lab,kind,what),x in EV.items(): tot[(lab,what)]+=x
    for (lab,what),x in sorted(tot.items()):
        if what in('teleport','yawjump'): print('%-14s %-9s n=%d  max=%.2f  mean=%.2f'%(lab,what,len(x),max(x),mean(x)))
        elif what=='maxacc': print('%-14s maxacc    n=%d  p50=%.1f p90=%.1f max=%.1f m/s²'%(lab,len(x),q(x,.5),q(x,.9),max(x)))
        elif what.startswith('switch') and 'Walk' in what: print('%-14s %-22s n=%d  speed at switch: mean %.2f max %.2f m/s'%(lab,what,len(x),mean(x),max(x)))
