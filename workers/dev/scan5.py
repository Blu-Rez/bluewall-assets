import sys, json, math, os
os.environ['MONO']='1'
sys.argv=['x']
sys.path.insert(0,'/home/claude/dev')
import fit6, fit5
from multiprocessing import Pool
fit6.POOL=Pool(2)
S0=json.load(open('/home/claude/dev/fit5_state_F.json'))
def run(d1, d2, n0=6):
    S=json.loads(json.dumps(S0))
    for i,n in enumerate(fit5.CKN):
        if n0<=n<=10: S['lc'][i]+=math.log(d1)
        if n>=11: S['lc'][i]+=math.log(d2)
    fit5.S=S
    r=fit6.measure_all(S)
    kf,kb=r['free'],r['best']
    g=lambda k,ns:[('%.0f'%k[n]) if k.get(n) else '-' for n in ns]
    print('d1 %.2f d2 %.2f | good 5/7/8/9/10/11/15/20/25/30: %s' % (d1,d2,g(kf,(5,7,8,9,10,11,15,20,25,30))), flush=True)
    return S
if __name__=='__main__':
    for d1 in (1.2,1.5,1.9):
        for d2 in (1.0,1.25,1.5):
            run(d1,d2)
