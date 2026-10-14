import sys, json, math
sys.argv=['x']
sys.path.insert(0,'/home/claude/dev')
import fit5
S0=json.load(open(fit5.STATE))
# base: levels >= 11  T x0.85, CK x1.10
for i,n in enumerate(fit5.TK):
    if n>=11: S0['lt'][i]+=math.log(0.85)
for i,n in enumerate(fit5.CKN):
    if n>=11: S0['lc'][i]+=math.log(1.10)
json.dump(S0,open('/home/claude/dev/fit5_state_A.json','w'))
def run(b, d, n0=6, n1=10):
    S=json.loads(json.dumps(S0))
    for i,n in enumerate(fit5.TK):
        if n0<=n<=n1: S['lt'][i]+=math.log(b)
    for i,n in enumerate(fit5.CKN):
        if n0<=n<=n1: S['lc'][i]+=math.log(d)
    fit5.S=S
    kf,kb=fit5.measure()
    return fit5.loss(kf,kb), kf, kb, S
best=None
for b in (1.0,1.15,1.3):
    for d in (1.0,0.85,0.7):
        l,kf,kb,S=run(b,d)
        print('b %.2f d %.2f loss %.2f | good 5/7/10/12/15/20: %s | best: %s' % (b,d,l,[kf.get(n) for n in (5,7,10,12,15,20)],[kb.get(n) for n in (5,7,10,12,15,20)]), flush=True)
