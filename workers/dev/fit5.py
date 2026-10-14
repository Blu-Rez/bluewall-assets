# p35 pacing fit v5: smooth parametric (log-linear knots) + coordinate descent.  python3 fit5.py [sweeps] [--reset]   state fit5_state.json
import sys, json, math, os, time
sys.path.insert(0, '/home/claude/bot/bluebot_v2')
from bluewall import progress as P, sim as SIM
STATE = os.environ.get('STATE', '/home/claude/dev/fit5_state.json')
G = {1: 0.0, 2: 3, 3: 7, 4: 12, 5: 25, 6: 40, 7: 60, 8: 85, 9: 115, 10: 150}
G20, TAILG = float(os.environ.get('G20', 395)), float(os.environ.get('TAILG', 28))
for n in range(11, 21): G[n] = 150 + (G20 - 150) / 10.0 * (n - 10)
for n in range(21, 31): G[n] = G20 + TAILG * (n - 20)
RB = 0.62
B = {n: RB * d for n, d in G.items()}
if not hasattr(P, '_orig_cost'):
    P.COST_K[:] = [1.0] * len(P.COST_K); P._VC.clear(); P._orig_cost = P.cost       # the fit multiplies its own CK: the baked COST_K must not count twice
TK = [int(x) for x in os.environ.get('TK', '2,3,4,5,6,8,10,13,16,20,25,30').split(',')]          # knots of T
CKN = [int(x) for x in os.environ.get('CKN', '2,4,6,8,10,14,20,30').split(',')]                       # knots of CK
S = None
def interp(knots, vals, n):
    if n <= knots[0]: return vals[0]
    if n >= knots[-1]: return vals[-1]
    for i in range(len(knots) - 1):
        if knots[i] <= n <= knots[i + 1]:
            f = (n - knots[i]) / (knots[i + 1] - knots[i]); return vals[i] * (1 - f) + vals[i + 1] * f
def tables():
    T = {n: math.exp(interp(TK, S['lt'], n)) for n in range(1, 31)}; T[1] = 10 / 60.0
    if os.environ.get('MONO'):                                   # an upgrade never takes less time than the one of the level below (from level 3 on)
        for n in range(4, 31): T[n] = max(T[n], T[n - 1])
    CK = {n: math.exp(interp(CKN, S['lc'], n)) for n in range(1, 31)}
    if os.environ.get('MONO'):                                   # ... and costs never fall with the level either: C[n] = T[n] * CK[n] * 1.13^(n-1) is non-decreasing from level 3 on
        for n in range(3, 31):
            c0 = T[n - 1] * CK[n - 1] * 1.13 ** (n - 2); c1 = T[n] * CK[n] * 1.13 ** (n - 1)
            if c1 < c0: CK[n] = c0 / (T[n] * 1.13 ** (n - 1))
    return T, CK
def apply():
    T, CK = tables()
    P.t_hours = lambda to: T[min(30, max(1, int(to)))]
    base = P._orig_cost
    def cost2(ent, to):
        f = CK[min(30, max(1, int(to)))]
        return {g: int(math.ceil(v * f)) for g, v in base(ent, to).items()}
    P.cost = cost2
    P._VC.clear()
def init():
    lt = []
    for n in TK:
        gap = max(1.0, B[n] - B[n - 1]); lt.append(math.log((3.6 if n <= 6 else 5.4) * gap))
    return {'lt': lt, 'lc': [0.0] * len(CKN), 'sweep': 0, 'best': 9e9}
def from_baked():
    b = json.load(open('/home/claude/dev/baked_tables.json'))
    return {'lt': [math.log(b['T'][n - 1]) for n in TK], 'lc': [math.log(b['CK'][n - 1]) for n in CKN], 'sweep': 0, 'best': 9e9}
def load():
    if os.environ.get('START') == 'baked' and not os.path.exists(STATE): return from_baked()
    if os.path.exists(STATE) and '--reset' not in sys.argv: return json.load(open(STATE))
    return init()
def save(): json.dump(S, open(STATE, 'w'))
HF, HB = int(os.environ.get('HF', 1400)), int(os.environ.get('HB', 900))
def measure():
    apply()
    return SIM.simulate(SIM.PROFILES['free'], HF)['keep_days'], SIM.simulate(SIM.PROFILES['best'], HB)['keep_days']
def loss(kf, kb):
    e = 0.0
    for n in range(2, 31):
        wgt = ((float(os.environ.get('WLOW', 1.0)) if n <= 10 else 1.0) if n <= 12 else 0.5) * (3.0 if n in (15, 20, 25, 30) else 1.0)
        f = kf.get(n); b = kb.get(n)
        e += wgt * (math.log(f / G[n]) ** 2 if f else (math.log(HF / G[n]) + 2) ** 2)
        e += 2.0 * wgt * (math.log(b / B[n]) ** 2 if b else (math.log(HB / B[n]) + 2) ** 2)
    # gap terms: every level should take about as long as the target says (not only the sums), which also keeps the table smooth
    pf = pb = 0.0
    for n in range(2, 31):
        f = kf.get(n); b = kb.get(n)
        if f and pf is not None:
            gt = max(0.5, G[n] - G[n - 1]); ga = max(0.5, f - pf); e += 0.25 * math.log(ga / gt) ** 2
        if b and pb is not None:
            gt = max(0.5, B[n] - B[n - 1]); ga = max(0.5, b - pb); e += 0.1 * math.log(ga / gt) ** 2
        pf = f; pb = b
    # smoothness (tiny): second difference of the knots
    lt = S['lt']; e += 0.02 * sum((lt[i - 1] - 2 * lt[i] + lt[i + 1]) ** 2 for i in range(1, len(lt) - 1))
    return e
def f_eval():
    kf, kb = measure(); return loss(kf, kb)
def report():
    kf, kb = measure(); T, CK = tables()
    ki = SIM.simulate(SIM.PROFILES['idle'], 3000)['keep_days']; ko = SIM.simulate(SIM.PROFILES['boost'], 2200)['keep_days']
    print(' lvl  good(target)   best(target) | boost  idle |  T[n]h   CK')
    for n in range(2, 31):
        print(' %2d  %6s(%5.0f)  %6s(%5.0f) | %6s %6s | %7.1f %5.2f' % (n, kf.get(n), G[n], kb.get(n), B[n], ko.get(n), ki.get(n), T[n], CK[n]))
if __name__ == '__main__':
    S = load(); S['step'] = 0.1; sweeps = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 3
    cur = f_eval(); print('start loss %.3f' % cur, flush=True)
    step = float(S.get('step', 0.5))
    for sw in range(sweeps):
        t0 = time.time(); improved = False
        params = [('lt', i) for i in range(len(TK))] + [('lc', i) for i in range(len(CKN))]
        for (k, i) in params:
            for d in (+step, -step):
                old = S[k][i]; S[k][i] = old + d
                v = f_eval()
                if v < cur - 1e-9:
                    cur = v; improved = True; break
                S[k][i] = old
        if not improved: step *= 0.6
        S['sweep'] += 1; S['step'] = step; S['best'] = cur; save()
        print('sweep %d loss %.3f step %.3f (%.0fs)' % (S['sweep'], cur, step, time.time() - t0), flush=True)
    report()
