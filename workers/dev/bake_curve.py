# bake the fitted time / cost tables into bluewall/progress.py   python3 bake_curve.py [state.json]  (MONO=1 as in the fit)
import sys, json, math, os, re
sys.argv = [sys.argv[0]] + sys.argv[1:]
state = sys.argv[1] if len(sys.argv) > 1 else '/home/claude/dev/fit5_state.json'
sys.path.insert(0, '/home/claude/dev')
sys.argv = ['x']
import fit5
fit5.S = json.load(open(state))
T, CK = fit5.tables()
def r3(x):
    return float('%.3g' % x) if x >= 1 else round(x, 3)
Tl = [r3(T[n]) for n in range(1, 31)]; Cl = [round(CK[n], 3) for n in range(1, 31)]
print('T_HOURS =', Tl); print('COST_K  =', Cl)
json.dump({'T': Tl, 'CK': Cl}, open('/home/claude/dev/baked_tables.json', 'w'))
