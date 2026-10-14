# p35 early-game pacing fit (owner 22:16): castle-level -> day targets for the GOOD player (free profile); BEST (boost + gems + rush) ~38 % faster.
# unknowns: T[n] hours at multiplier 1 (builder time floor), CK[n] cost factor of level n.   python3 fit_curve.py [rounds]
import sys, json, math, os, time
sys.path.insert(0, '/home/claude/bot/bluebot_v2')
from bluewall import progress as P, sim as SIM
STATE = '/home/claude/dev/fit_state.json'
G = {1: 0.0, 2: 3, 3: 7, 4: 12, 5: 25, 6: 40, 7: 60, 8: 85, 9: 115, 10: 150}
for n in range(11, 21): G[n] = 150 + 32 * (n - 10)
for n in range(21, 31): G[n] = G[20] + 25 * (n - 20)
RB = 0.62                                                     # best / good
B = {n: RB * d for n, d in G.items()}
def load():
    if os.path.exists(STATE): return json.load(open(STATE))
    old = {n: P.t_hours(n) for n in range(1, 31)}
    T = {str(n): old[n] * (4.0 if n <= 10 else 1.5) for n in range(1, 31)}
    return {'T': T, 'CK': {str(n): 1.0 for n in range(1, 31)}, 'round': 0}
def apply(S):
    T, CK = S['T'], S['CK']
    P.t_hours = lambda to: T[str(min(30, max(1, int(to))))]
    base = P._orig_cost
    def cost2(ent, to):
        f = CK[str(min(30, max(1, int(to))))]
        return {g: int(math.ceil(v * f)) for g, v in base(ent, to).items()}
    P.cost = cost2
    P._VC.clear()
if not hasattr(P, '_orig_cost'): P._orig_cost = P.cost
def run(name, horizon=1500):
    r = SIM.simulate(SIM.PROFILES[name], horizon); return r['keep_days']
def gaps(kd, top=30):
    out = {}; prev = 0.0
    for n in range(2, top + 1):
        d = kd.get(n)
        if d is None: break
        out[n] = d - prev; prev = d
    return out
if __name__ == '__main__':
    S = load(); rounds = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    for it in range(rounds):
        apply(S); t0 = time.time()
        kb = run('best', 900); kf = run('free', 1500)
        print('--- round', S['round'], 'sim %.0fs' % (time.time() - t0))
        print(' lvl  targetG  free   | targetB  best')
        err = 0
        for n in range(2, 31):
            print(' %2d  %6.0f  %6s | %6.0f  %6s' % (n, G[n], kf.get(n), B[n], kb.get(n)))
        gb, gf = gaps(kb), gaps(kf)
        # best -> T: castle level n arrives after the round of n-1 ... use the gap to level n against the target gap
        for n in range(2, 31):
            tg = B[n] - B[n - 1]
            if n in gb and gb[n] > 0:
                k = (tg / gb[n]) ** 0.8; k = max(0.6, min(1.6, k))
                S['T'][str(n)] *= k
            if n in gf and gf[n] > 0:
                tgf = G[n] - G[n - 1]
                k = (tgf / gf[n]) ** 0.8; k = max(0.6, min(1.6, k))
                S['CK'][str(n)] *= k
        S['round'] += 1; json.dump(S, open(STATE, 'w'))
