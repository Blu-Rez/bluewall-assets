# p35 pacing fit v2 (owner 22:16 / 22:21): castle level -> day for the GOOD player (free); BEST = RB x good.   python3 fit2.py [rounds] [--reset]
import sys, json, math, os, time
sys.path.insert(0, '/home/claude/bot/bluebot_v2')
from bluewall import progress as P, sim as SIM
STATE = '/home/claude/dev/fit2_state.json'
G = {1: 0.0, 2: 3, 3: 7, 4: 12, 5: 25, 6: 40, 7: 60, 8: 85, 9: 115, 10: 150}
G20, TAILG = 395.0, 28.0
for n in range(11, 21): G[n] = 150 + (G20 - 150) / 10.0 * (n - 10)
for n in range(21, 31): G[n] = G20 + TAILG * (n - 20)
RB = 0.62
B = {n: RB * d for n, d in G.items()}
OLD = {n: P.t_hours(n) for n in range(1, 31)}
def load():
    if os.path.exists(STATE) and '--reset' not in sys.argv: return json.load(open(STATE))
    return {'T': {str(n): OLD[n] * (20.0 if n <= 8 else 2.0) for n in range(1, 31)}, 'CK': {str(n): 1.0 for n in range(1, 31)}, 'round': 0}
if not hasattr(P, '_orig_cost'): P._orig_cost = P.cost
def apply(S):
    T, CK = S['T'], S['CK']
    P.t_hours = lambda to: T[str(min(30, max(1, int(to))))]
    base = P._orig_cost
    def cost2(ent, to):
        f = CK[str(min(30, max(1, int(to))))]
        return {g: int(math.ceil(v * f)) for g, v in base(ent, to).items()}
    P.cost = cost2
    P._VC.clear()
def run(name, horizon):
    return SIM.simulate(SIM.PROFILES[name], horizon)['keep_days']
def gaps(kd):
    out = {}; prev = 0.0
    for n in range(2, 31):
        d = kd.get(n)
        if d is None: break
        out[n] = d - prev; prev = d
    return out
def measure(S, hf=2200, hb=1400):
    apply(S); return run('free', hf), run('best', hb)
def report(S, kf, kb):
    print(' lvl  targetG   free  err%% | targetB   best  err%%')
    for n in range(2, 31):
        f, b = kf.get(n), kb.get(n)
        print(' %2d  %7.0f %6s %5s | %6.0f %6s %5s' % (n, G[n], f, '%+.0f' % (100 * (f / G[n] - 1)) if f else '-', B[n], b, '%+.0f' % (100 * (b / B[n] - 1)) if b else '-'))
if __name__ == '__main__':
    S = load(); rounds = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 5
    for it in range(rounds):
        kf, kb = measure(S)
        gb, gf = gaps(kb), gaps(kf)
        for n in range(2, 31):
            lo, hi = 0.4, 2.5
            if n in gb and gb[n] > 0:
                k = ((B[n] - B[n - 1]) / gb[n]) ** 0.7; k = max(lo, min(hi, k))
                S['T'][str(max(2, n - 1) if n > 2 else 2)] *= k
            else:
                S['T'][str(max(2, n - 1))] *= 0.8 if n == 2 + len(gb) else 1.0
            if n in gf and gf[n] > 0:
                k = ((G[n] - G[n - 1]) / gf[n]) ** 0.5; k = max(lo, min(hi, k))
                S['CK'][str(max(2, n - 1))] *= k
        S['round'] += 1; json.dump(S, open(STATE, 'w'))
        if it == rounds - 1 or it % 10 == 9:
            errs = [abs(kf[n] / G[n] - 1) for n in range(2, 31) if kf.get(n)]
            print('round', S['round'], 'mean|err| free %.2f' % (sum(errs) / max(1, len(errs))), 'reached', len(errs))
    kf, kb = measure(S); report(S, kf, kb)
