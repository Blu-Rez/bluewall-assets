# add_credits.py — every Sketchfab model baked into kit_ws / kit_def (the recipes) gets its credits line (CC-BY 4.0); idempotent.
import json, re, sys
CP = '/home/claude/bot/bluebot_v2/bluewall/web/assets/credits.json'
cc = json.load(open(CP)); have = {(i['name'], i['by']) for i in cc['items']}
new = {x['id']: x for x in json.load(open('/home/claude/blu-rez/bluewall-assets/v4/sketchfab/credits_new.json'))}
added = 0
for rf in sys.argv[1:]:
    for r in json.load(open(rf)):
        m = re.search(r'v4/sketchfab/[^/]+/([^/]+)/', r['src'])
        if not m: continue
        x = new.get(m.group(1))
        if not x: print('no credit info for', m.group(1)); continue
        assert x['license'].startswith('CC-BY'), x
        key = (x['name'], x['author'])
        if key in have: continue
        cc['items'].append({'group': 'Models (CC-BY 4.0)', 'name': x['name'], 'by': x['author'], 'license': 'CC-BY 4.0 — sketchfab.com'}); have.add(key); added += 1
json.dump(cc, open(CP, 'w'), ensure_ascii=False, indent=1)
print('added', added, 'total', len(cc['items']))
