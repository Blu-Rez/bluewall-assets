# budget_table.py  → markdown table of draw calls / tris, KIT vs S4d (median of 5), from the two res.json of dev/tr2_s4d/game.py (NOSHOT passes)
import json, sys
n = json.load(open('/home/claude/work/s4d_bud_new/res.json')); b = json.load(open('/home/claude/work/s4d_bud_base/res.json'))
names = {'h_past': 'hero 1: paddock + stable yard (pasture)', 'h_stock': 'hero 2: stable + livestock pens', 'h_yard': 'hero 3: town square (villagers)',
         's_top': 'strategic: top', 's_ctr': 'strategic: centre', 's_town': 'strategic: town side', 's_fields': 'strategic: fields side', 's_past': 'strategic: pasture side', 's_lake': 'strategic: lake'}
print('| view | calls KIT | calls S4d | Δ | tris KIT | tris S4d | Δ |'); print('|---|---|---|---|---|---|---|')
for k, t in names.items():
    if k not in n or k not in b: continue
    a, c = b[k], n[k]; print('| %s | %d | %d | %+d | %s | %s | %+.0f %% |' % (t, a['calls'], c['calls'], c['calls'] - a['calls'], format(a['tris'], ','), format(c['tris'], ','), 100.0 * (c['tris'] - a['tris']) / a['tris']))
pn, pb = n['_peek'], b['_peek']
print(); print('programs KIT %d → S4d %d · textures (info.memory) KIT %d → S4d %d · geometries KIT %d → S4d %d · instanced meshes %d → %d · skinned meshes %d → %d · scene meshes %d → %d' % (pb['programs'], pn['programs'], pb['tex'], pn['tex'], pb['geo'], pn['geo'], pb['inst'], pn['inst'], pb['skinned'], pn['skinned'], pb['meshes'], pn['meshes']))
