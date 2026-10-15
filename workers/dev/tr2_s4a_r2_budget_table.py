import json, sys
# budget_table.py OLD.json R1.json NEW.json  — markdown table: the pre-S4a town (kit town, window.__tr2TownOff) vs S4a round 1 vs now (tr2_budget_s4a.py output files)
old, r1, new = [json.load(open(p))['views'] for p in sys.argv[1:4]]
print('| view | old town calls / tris | S4a R1 | **R2 now** | R2 vs old town | R2 vs R1 |'); print('|---|---|---|---|---|---|')
for v in new:
    o, a, n = old[v], r1[v], new[v]
    print(f"| {v} | {o['calls']} / {o['tris']:,} | {a['calls']} / {a['tris']:,} | **{n['calls']} / {n['tris']:,}** | {n['calls'] - o['calls']:+d} calls, {100 * (n['tris'] / o['tris'] - 1):+.1f} % | {n['calls'] - a['calls']:+d} calls, {100 * (n['tris'] / a['tris'] - 1):+.1f} % |")
g = lambda r, k: ' + '.join(f"{kk.split(':')[0]} {vv['calls']}c/{vv['tris']:,}" for kk, vv in r['groups'].items() if kk.startswith(k))
print(); print('town groups (calls/tris):')
for v in new: print(f"- {v}: old [{g(old[v], 'homes')} {g(old[v], 'civic')}] -> now [{g(new[v], 'homes')}; {g(new[v], 'civic')}]")
