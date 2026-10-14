#!/usr/bin/env python3
# b3_credits_gen.py -> web/assets/credits_b3.json : credits of every source model that dev/b3_recipe.json packs into kit_civic.glb (shape of credits_new.json: id, name, author, license, source ...)
import json, os, re
R = json.load(open('/home/claude/dev/b3_recipe.json'))
srcs = []
for it in R['items']:
    for p in (it.get('parts') or [it]): srcs.append(p['src'])
def used(pack): return sorted({os.path.basename(s)[:-5] for s in srcs if s.startswith('$' + pack)})
PACKS = [
  dict(var='KK', id='kaykit_medieval_hexagon_1_0', name='KayKit Medieval Hexagon Pack 1.0 (buildings: tavern, church, well, market, tower A, home A / B; blue + yellow)', author='Kay Lousberg (KayKit)', license='CC0 1.0', source='https://www.kaylousberg.com'),
  dict(var='FP', id='quaternius_fantasy_props_megakit', name='Fantasy Props MegaKit (Standard, free) — stall, cart, barrels, crates, bench, table, mugs, books, coins, banner, torch, vases, chest', author='Quaternius', license='CC0 1.0', source='https://quaternius.com'),
  dict(var='MK', id='quaternius_medieval_village_megakit', name='Medieval Village MegaKit (Standard, free) — exterior stairs, plinth, stone pillar, wooden post', author='Quaternius', license='CC0 1.0', source='https://quaternius.com'),
]
out = []
for P in PACKS:
    u = used(P['var'])
    if u: out.append(dict(id=P['id'], name=P['name'], author=P['author'], license=P['license'], source=P['source'], cat='civic', kit='kit_civic.glb', models=u, note='CC0: credit not required, given anyway. Models were decimated, baked to vertex colours and packed by dev/b3_mkkit.mjs; no model was redrawn.'))
json.dump(out, open('/home/claude/bot/bluebot_v2/bluewall/web/assets/credits_b3.json', 'w'), indent=1, ensure_ascii=False)
print(len(out), 'credits;', sum(len(o['models']) for o in out), 'source models')
