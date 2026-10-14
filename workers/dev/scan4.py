import sys, json, math, os
os.environ['MONO']='1'
sys.argv=['x']
sys.path.insert(0,'/home/claude/dev')
import fit6, fit5
from multiprocessing import Pool
fit6.POOL=Pool(2)
S0=json.load(open('/home/claude/dev/fit5_state_F.json'))
def run(b, d, label=''):
    S=json.loads(json.dumps(S0))
    for i,n in enumerate(fit5.TK):
        if 7<=n<=10: S['lt'][i]+=math.log(b)
    for i,n in enumerate(fit5.CKN):
        if n>=11: S['lc'][i]+=math.log(d)
    fit5.S=S
    r=fit6.measure_all(S)
    kf,kb=r['free'],r['best']
    g=lambda k,ns:[('%.0f'%k[n]) if k.get(n) else '-' for n in ns]
    print('b %.2f d %.2f | good 5/7/8/9/10/11/15/20/25/30: %s | best 7/10/15/20/30: %s' % (b,d,g(kf,(5,7,8,9,10,11,15,20,25,30)),g(kb,(7,10,15,20,30))), flush=True)
    return S
for b in (1.0,1.1,1.2):
    for d in (1.0,0.88,0.76):
        run(b,d)
