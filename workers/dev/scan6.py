import sys, json, math, os
os.environ['MONO']='1'
sys.argv=['x']
sys.path.insert(0,'/home/claude/dev')
import fit6, fit5
from multiprocessing import Pool
fit6.POOL=Pool(2)
S0=json.load(open('/home/claude/dev/fit8_state_final.json'))
def run(p, q):
    S=json.loads(json.dumps(S0))
    for i,n in enumerate(fit5.TK):
        if 10<=n<=25: S['lt'][i]+=math.log(p)
    for i,n in enumerate(fit5.CKN):
        if n>=10: S['lc'][i]+=math.log(q)
    fit5.S=S
    r=fit6.measure_all(S)
    kf,kb=r['free'],r['best']
    g=lambda k,ns:[('%.0f'%k[n]) if k.get(n) else '-' for n in ns]
    print('p %.2f q %.2f | good 10/12/15/20/25/30: %s | best 10/15/20/25/30: %s' % (p,q,g(kf,(10,12,15,20,25,30)),g(kb,(10,15,20,25,30))), flush=True)
if __name__=='__main__':
    for p in (1.0,0.92,0.85):
        for q in (1.0,1.1,1.2):
            run(p,q)
