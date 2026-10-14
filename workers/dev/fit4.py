# p35 pacing fit v4: global damped fit.  T[n] (h at multiplier 1) from the BEST (builder bound) gaps, CK[n] (cost factor) from the FREE / BEST ratio.
# usage: python3 fit4.py [rounds] [--reset]     state fit4_state.json
import sys, json, math, os, time
sys.path.insert(0, '/home/claude/bot/bluebot_v2')
from bluewall import progress as P, sim as SIM
STATE = '/home/claude/dev/fit4_state.json'
G = {1: 0.0, 2: 3, 3: 7, 4: 12, 5: 25, 6: 40, 7: 60, 8: 85, 9: 115, 10: 150}
G20, TAILG = float(os.environ.get('G20', 395)), float(os.environ.get('TAILG', 28))
for n in range(11, 21): G[n] = 150 + (G20 - 150) / 10.0 * (n - 10)
for n in range(21, 31): G[n] = G20 + TAILG * (n - 20)
RB = 0.62
B = {n: RB * d for n, d in G.items()}
OLD = {n: P.t_hours(n) for n in range(1, 31)}
if not hasattr(P, '_orig_cost'): P._orig_cost = P.cost
S = None
TMIN, TMAX, CMIN, CMAX = 0.05, 3000.0, 0.15, 6.0
def apply():
    T, CK = S['T'], S['CK']
    P.t_hours = lambda to: T[min(30, max(1, int(to)))]
    base = P._orig_cost
    def cost2(ent, to):
        f = CK[min(30, max(1, int(to)))]
        return {g: int(math.ceil(v * f)) for g, v in base(ent, to).items()}
    P.cost = cost2
    P._VC.clear()
def init():
    T = {}
    for n in range(1, 31):
        gap = max(1.0, B[n] - B[n - 1]) if n >= 2 else 1.0
        T[n] = (3.6 if n <= 6 else 5.4) * gap if n >= 2 else OLD[1]
    return {'T': T, 'CK': {n: 1.0 for n in range(1, 31)}, 'round': 0}
def load():
    if os.path.exists(STATE) and '--reset' not in sys.argv:
        d = json.load(open(STATE)); return {'T': {int(k): v for k, v in d['T'].items()}, 'CK': {int(k): v for k, v in d['CK'].items()}, 'round': d['round']}
    return init()
def save(): json.dump(S, open(STATE, 'w'))
def sim(name, hor):
    return SIM.simulate(SIM.PROFILES[name], hor)['keep_days']
def measure(hf=2600, hb=1700):
    apply(); return sim('free', hf), sim('best', hb)
def gaps(kd, hor):
    out = {}; prev = 0.0
    for n in range(2, 31):
        d = kd.get(n)
        if d is None: d = max(hor, prev + 200.0)
        out[n] = max(0.2, d - prev); prev = d
    return out
def smooth(d, lo, hi):
    keys = sorted(d); out = {}
    for i, n in enumerate(keys):
        a = d[keys[max(0, i - 1)]]; b = d[n]; c = d[keys[min(len(keys) - 1, i + 1)]]
        out[n] = math.exp(0.2 * math.log(a) + 0.6 * math.log(b) + 0.2 * math.log(c))
    return out
def step(kf, kb):
    gb, gf = gaps(kb, 1700), gaps(kf, 2600)
    kT = {}; kC = {}
    for n in range(2, 31):
        tb = B[n] - B[n - 1]; tf = G[n] - G[n - 1]
        kT[n] = max(0.5, min(2.0, (tb / gb[n]) ** 0.6))
        # free should follow its own target: whatever T did (kT), the rest is the cost factor
        rf = (tf / gf[n]) ** 0.6 / kT[n] ** 0.6
        kC[n] = max(0.5, min(2.0, rf))
    newT = dict(S['T']); newC = dict(S['CK'])
    for n in range(2, 31):
        # gap n depends mostly on T[n-1] (the 14 other structures), a bit on T[n] (the castle)
        a = max(2, n - 1)
        newT[a] *= kT[n] ** 0.65; newT[n] *= kT[n] ** 0.35 if n > 2 else 1.0
        newC[a] *= kC[n] ** 0.65; newC[n] *= kC[n] ** 0.35 if n > 2 else 1.0
    for n in range(2, 31):
        newT[n] = max(TMIN, min(TMAX, newT[n])); newC[n] = max(CMIN, min(CMAX, newC[n]))
    S['T'].update(newT); S['CK'].update(newC)
def report(kf, kb):
    print(' lvl  goodT  good  err | bestT  best  err |  T[n]h   CK')
    for n in range(2, 31):
        f, b = kf.get(n), kb.get(n)
        e1 = '%+.0f%%' % (100 * (f / G[n] - 1)) if f else '-'; e2 = '%+.0f%%' % (100 * (b / B[n] - 1)) if b else '-'
        print(' %2d %6.0f %6s %5s | %5.0f %6s %5s | %7.1f %5.2f' % (n, G[n], f, e1, B[n], b, e2, S['T'][n], S['CK'][n]))
def loss(kf, kb):
    e = [abs(math.log(kf[n] / G[n])) for n in range(2, 31) if kf.get(n)] + [abs(math.log(kb[n] / B[n])) for n in range(2, 31) if kb.get(n)]
    return sum(e) / max(1, len(e)), len(e)
if __name__ == '__main__':
    S = load(); rounds = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 5
    for it in range(rounds):
        t0 = time.time()
        kf, kb = measure()
        l, cnt = loss(kf, kb)
        print('round %d  mean|log err| %.3f over %d points  (%.1fs)' % (S['round'], l, cnt, time.time() - t0), flush=True)
        step(kf, kb); S['round'] += 1; save()
    kf, kb = measure(); report(kf, kb)
