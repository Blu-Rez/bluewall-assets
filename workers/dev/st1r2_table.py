#!/usr/bin/env python3
# ST1_R2 — before / after table (markdown) from the results.json files of st1r2_shots.py
#   python3 st1r2_table.py > table.md     (reads /home/claude/work/st1r2/{before,after}_{day,dusk,night}_lv{30,50}/results.json)
import json, os
R = '/home/claude/work/st1r2/'; VIEWS = ['map', 'quarter', 'quarter_near', 'vault_ruby', 'vault_emerald', 'vault_turq', 'mine_ruby', 'mine_emerald', 'mine_turq']
def load(tag):
    p = R + tag + '/results.json'
    return json.load(open(p))['views'] if os.path.exists(p) else None
print('| hour · lv | view | halo sprites before → after | quad px before → after | alpha-weighted px before → after | calls b→a | tris b→a | programs b→a |')
print('|---|---|---|---|---|---|---|---|')
tot = {}
for hr in ['day', 'dusk', 'night']:
    for lv in [30, 50]:
        b, a = load(f'before_{hr}_lv{lv}'), load(f'after_{hr}_lv{lv}')
        if not b or not a: continue
        sb = sa = qb = qa = ab = aa = 0
        for v in VIEWS:
            if v not in b or v not in a: continue
            ob, oa = b[v]['over'], a[v]['over']
            print(f"| {hr} · lv{lv} | {v} | {ob['sprites']} → {oa['sprites']} | {ob['quadPx']} → {oa['quadPx']} | {ob['alphaPx']} → {oa['alphaPx']} | {b[v]['calls']} → {a[v]['calls']} | {b[v]['tris']} → {a[v]['tris']} | {b[v]['prog']} → {a[v]['prog']} |")
            sb += ob['sprites']; sa += oa['sprites']; qb += ob['quadPx']; qa += oa['quadPx']; ab += ob['alphaPx']; aa += oa['alphaPx']
        tot[(hr, lv)] = (sb, sa, qb, qa, ab, aa)
print('\n**Totals over the 9 views of each run** (sprites, quad px, alpha-weighted px):\n')
print('| run | sprites | quad px (fragments shaded) | alpha-weighted px |'); print('|---|---|---|---|')
for (hr, lv), (sb, sa, qb, qa, ab, aa) in tot.items():
    print(f"| {hr} · lv{lv} | {sb} → {sa} | {qb} → {qa} ({(100*(qa-qb)/max(1,qb)):+.0f} %) | {ab} → {aa} ({(100*(aa-ab)/max(1,ab)):+.0f} %) |")
