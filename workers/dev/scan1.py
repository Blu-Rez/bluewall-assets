import sys, json, math
sys.argv=['x']
sys.path.insert(0,'/home/claude/dev')
import fit5
S0=json.load(open(fit5.STATE))
def run(a, c, n0=11):
    S=json.loads(json.dumps(S0))
    for i,n in enumerate(fit5.TK):
        if n>=n0: S['lt'][i]+=math.log(a)
    for i,n in enumerate(fit5.CKN):
        if n>=n0: S['lc'][i]+=math.log(c)
    fit5.S=S
    kf,kb=fit5.measure()
    return fit5.loss(kf,kb), kf, kb
for a in (0.85,0.82):
    for c in (1.04,1.07,1.10):
        l,kf,kb=run(a,c)
        print('a %.2f c %.2f loss %.2f | good 10/15/20/25/30: %s | best: %s' % (a,c,l,[kf.get(n) for n in (10,15,20,25,30)],[kb.get(n) for n in (10,15,20,25,30)]), flush=True)
