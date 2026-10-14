# ref_armies.py: the reference army of castle K (military.ref_power's army) for K = 1..30 -> dev/s35/ref_armies_p34.json  {K: {army, forge, lv, power, cap}}
import sys, json
sys.path.insert(0, '/home/claude/bw/bluewall_handoff/code')
from bluewall import military as M, progress as PR
out = {}
for k in range(1, PR.MAX_LEVEL + 1):
    lv = {f: (k if PR.STRUCTS[f][3] <= k else 0) for f in M.FAMILIES}
    forge = 1.0 + 0.06 * max(0, (k if PR.STRUCTS["forge"][3] <= k else 1) - 1)
    cap = M.army_cap(k)
    open_ = [u for u in M._PLAN if lv[M.UNITS[u]["fam"]] >= M.UNITS[u]["lv"]]
    tot = sum(M._PLAN[u] for u in open_) or 1.0
    army, used, fu = {}, 0, {}
    for u in open_:
        f, sp = M.UNITS[u]["fam"], M.UNITS[u]["space"]
        n = int(cap * M._PLAN[u] / tot) // sp
        n = max(0, min(n, (M.fam_cap(f, lv[f]) - fu.get(f, 0)) // sp, (cap - used) // sp))
        if n:
            army[u] = n; used += n * sp; fu[f] = fu.get(f, 0) + n * sp
    for u in ("spear", "archer", "sword"):
        if u in open_:
            f = M.UNITS[u]["fam"]
            n = min(cap - used, M.fam_cap(f, lv[f]) - fu.get(f, 0)) // M.UNITS[u]["space"]
            if n > 0:
                army[u] = army.get(u, 0) + n; used += n; fu[f] = fu.get(f, 0) + n
    out[k] = {"army": army, "forge": round(forge, 3), "lv": {f: v for f, v in lv.items() if v}, "power": round(sum(n * M.unit_power(u, forge, max(1, lv[M.UNITS[u]["fam"]])) for u, n in army.items())), "cap": cap, "used": used}
json.dump(out, open('/home/claude/dev/s35/ref_armies_p34.json', 'w'))
for k in (5, 10, 15, 20, 25, 30): print(k, out[k]['cap'], out[k]['used'], out[k]['power'], out[k]['forge'], out[k]['army'])
