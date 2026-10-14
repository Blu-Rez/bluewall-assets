import sys, json, math, os
os.environ['MONO']='1'
sys.argv=['x']
sys.path.insert(0,'/home/claude/dev')
import fit5
S0=json.load(open(fit5.STATE))
json.dump(S0,open('/home/claude/dev/fit5_state_M.json','w'))
def run(c, n0, n1):
    S=json.loads(json.dumps(S0))
    for i,n in enumerate(fit5.CKN):
        if n0<=n<=n1: S['lc'][i]+=math.log(c)
    fit5.S=S
    kf,kb=fit5.measure()
    return fit5.loss(kf,kb), kf, kb
for (c,n0,n1) in ((1.04,8,30),(1.05,8,30),(1.06,8,30),(1.07,8,30),(1.09,8,30),(1.06,6,30),(1.06,8,22)):
    l,kf,kb=run(c,n0,n1)
    print('c %.2f [%d..%d] loss %.2f | good 8/9/10/12/15/20/25/30: %s | best 20/30: %s' % (c,n0,n1,l,[kf.get(n) for n in (8,9,10,12,15,20,25,30)],[kb.get(n) for n in (20,30)]), flush=True)
