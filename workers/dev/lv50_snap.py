# lv50_snap.py OUT.json : a snapshot of every level-dependent server number for levels 1..30 (before / after the 50-level patch must be identical)
import sys, json, random
sys.path.insert(0, '/home/claude/bot/bluebot_v2'); sys.path.insert(0, '/home/claude/dev/stubcfg')
from bluewall import progress as PR, military as MI
N = 30
o = {}
o['t_hours'] = [PR.t_hours(n) for n in range(1, N + 1)]
o['cost'] = {e: [PR.cost(e, n) for n in range(1, N + 1)] for e in PR.ORDER}
o['dur'] = {e: [PR.dur(e, n) for n in range(1, N + 1)] for e in PR.ORDER}
o['rate'] = {g: [PR.mine_rate(g, n) for n in range(1, N + 1)] for g in PR.GEMS}
o['vault'] = {g: [PR.vault_cap(g, n) for n in range(1, N + 1)] for g in PR.GEMS}
o['max_allowed'] = {e: [PR.max_allowed(e, k) for k in range(1, N + 1)] for e in PR.ORDER}
o['builders'] = [PR.builders(k) for k in range(1, N + 1)]
o['S'] = [MI.S(k) for k in range(1, 21)]
o['guardians'] = [MI.guardian_slots(k) for k in range(1, N + 1)]
o['spell_cap'] = [MI.spell_cap(k) for k in range(1, N + 1)]
o['army_cap'] = [MI.army_cap(k) for k in range(1, N + 1)]
o['fam_cap'] = {f: [MI.fam_cap(f, k) for k in range(1, N + 1)] for f in MI.FAMILIES}
o['speed'] = [MI.speed(k) for k in range(1, N + 1)]
o['lvl_mult'] = [MI.lvl_mult(k) for k in range(1, N + 1)]
o['tier_of'] = [MI.tier_of(k) for k in range(1, N + 1)]
o['P_REF'] = MI.P_REF[:N]
o['level_for_power'] = [MI.level_for_power(p) for p in (30, 100, 400, 1500, 6000, 20000, 60000)]
o['hero_slots'] = {u: [MI.hero_slots(u, k) for k in range(1, N + 1)] for u in MI.HEROES}
o['GARRISON_AT'] = MI.GARRISON_AT
o['DEF'] = {k: {a: (list(b) if isinstance(b, tuple) else b) for a, b in d.items() if a in ('unlock', 'n', 'w', 'rng', 'cd')} for k, d in MI.DEFENCES.items()}
o['unit_lv'] = {u: d['lv'] for u, d in MI.UNITS.items()}
c = MI.catalog()
o['cat_keys'] = sorted(c)
for k in ('guardians', 'garrison', 'defences'):
    if k in c: o['cat_' + k] = c[k]
# the catalog arrays cut to 30 entries
def cut(v):
    if isinstance(v, list) and len(v) > N and all(isinstance(x, (int, float)) for x in v): return v[:N]
    if isinstance(v, dict): return {a: cut(b) for a, b in v.items()}
    return v
o['catalog'] = cut(c)
pc = PR.catalog()
o['pcatalog'] = cut(pc)
json.dump(o, open(sys.argv[1], 'w'), sort_keys=True, default=str)
print('snapshot', sys.argv[1], len(json.dumps(o, default=str)), 'bytes')
