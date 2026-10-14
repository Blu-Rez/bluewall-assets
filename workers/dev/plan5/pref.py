"""Reference army power P_ref(K) per castle level (proposed unlocks), used as the full-defence budget D(K) of a level-K base.  Read-only."""
import json, math
D = json.load(open('/home/claude/bot/bluebot_v2/bluewall/client/src/unitdefs.json'))
U = D['units']
UNLOCK = {'barracks': 1, 'training': 1, 'stable': 3, 'forge': 5, 'workshop': 7, 'lair': 9}
PLAN = dict(spear=.07, sword=.07, guard=.05, archer=.08, cavalry=.08, pegasus=.06, baby=.05, dragon=.05, catapult=.05, giant=.05, imp=.04, mage=.05, ram=.04, cannon=.05, werewolf=.05, trebuchet=.05, hill=.05, shieldmaiden=.03, lord=.03)
def famcap(f, L):
    return 0 if L <= 0 else {"barracks": 14 + 7 * (L-1), "training": 10 + 5 * (L-1), "stable": 8 + 4 * (L-1), "lair": 12 + 6 * (L-1), "workshop": 10 + 5 * (L-1)}[f]
rows = []
for K in range(1, 21):
    lv = {f: (K if K >= u else 0) for f, u in UNLOCK.items()}
    cap = 30 + 14 * (K - 1)
    open_ = [u for u in PLAN if lv[U[u]['fam']] >= U[u]['lv']]
    tot = sum(PLAN[u] for u in open_)
    army, used, fu = {}, 0, {}
    for u in open_:
        f = U[u]['fam']; n = int(cap * PLAN[u] / tot) // U[u]['space']
        n = max(0, min(n, (famcap(f, lv[f]) - fu.get(f, 0)) // U[u]['space'], (cap - used) // U[u]['space']))
        if n: army[u] = n; used += n * U[u]['space']; fu[f] = fu.get(f, 0) + n * U[u]['space']
    # top up with spearmen / archers to the full housing
    for u in ('spear', 'archer', 'sword'):
        if u in open_:
            f = U[u]['fam']; n = min((cap - used), famcap(f, lv[f]) - fu.get(f, 0)) // U[u]['space']
            if n > 0: army[u] = army.get(u, 0) + n; used += n; fu[f] = fu.get(f, 0) + n
    fm = 1 + 0.06 * max(0, lv['forge'] - 1)
    P = sum(n * math.sqrt(U[u]['hp'] * U[u]['dps']) / 3 * fm for u, n in army.items())
    cost = {}
    for u, n in army.items():
        for g, c in U[u]['cost'].items(): cost[g] = cost.get(g, 0) + c * n
    rows.append((K, cap, used, round(P), round(fm, 2), cost, len(open_)))
    print(f"K{K:2d} housing {cap:3d} used {used:3d} units {len(open_):2d} forge x{fm:.2f}  P_ref {round(P):5d}  army cost {cost}")
json.dump({r[0]: r[3] for r in rows}, open('pref.json', 'w'))
