#!/bin/bash
# m43_units_test.sh — p43 static checks of the U1-U4 unit assets (no browser): files exist, valid glb, size budget (<= 600 KB per file), credits.json names every CC-BY / CC0 model, story files are clean,
# the ogre is in LATE, no .rej / .orig left in the tree, U5 assets are either absent or credited.   Prints "M43 OK" or the failures.
python3 - <<'PY'
import json, re, os, sys
R = '/home/claude/bot/bluebot_v2/bluewall'; A = R + '/web/assets/'; fails = []
def bad(m): fails.append(m)
for f, cap in (('u1_legionary', 600), ('u1_captain', 600), ('u2_ogre', 600), ('u3_skel_rogue', 600), ('u3_staff', 600), ('u3_dragon_dark', 600), ('u3_dk_knight', 600), ('u4_gryphon', 600)):
    p = A + f + '.glb'
    if not os.path.exists(p): bad('missing ' + f + '.glb'); continue
    b = open(p, 'rb').read(12)
    if b[:4] != b'glTF': bad(f + ': not a glb')
    if os.path.getsize(p) > cap * 1024: bad('%s: %d KB > %d KB' % (f, os.path.getsize(p) // 1024, cap))
cr = json.load(open(A + 'credits.json')); items = cr['items'] if isinstance(cr, dict) else cr; names = ' | '.join(i['name'] for i in items).lower()
for k in ('viking (lowpoly)', 'low poly dragon', 'low poly dark knight', 'gryphon-simple', 'kaykit adventurers', 'kaykit character pack: skeletons', 'battle ogre behemoth'):
    if k not in names: bad('credits.json lacks: ' + k)
for i in items:
    if not (i.get('group') and i.get('name') and i.get('by') and i.get('license')): bad('credits item incomplete: ' + str(i)[:80])
for s in ('u1_story', 'u3_story', 'u4_story'):
    d = json.load(open(A + s + '.json'))
    for k, v in d.items():
        if not (v.get('fa') and v.get('en')): bad(s + ':' + k + ' lacks fa/en')
        if re.search(r'ربات|\bbot\b', json.dumps(v, ensure_ascii=False), re.I): bad(s + ':' + k + ' has a bot word')
for c in ('u1', 'u2', 'u3', 'u4'):
    try: json.load(open(A + 'credits_%s.json' % c))
    except Exception as e: bad('credits_%s.json: %s' % (c, e))
late = [l for l in open(R + '/client/src/assets.js') if l.startswith('export const LATE')][0]
if "'u2_ogre'" not in late: bad('u2_ogre not in LATE')
if os.path.exists(A + 'u5_dragon3.glb') and 'ghidorah' not in names: bad('u5_dragon3.glb shipped without its credit')
for d, _, fs in os.walk(R + '/client/src'):
    for f in fs:
        if f.endswith(('.rej', '.orig')): bad('leftover ' + os.path.join(d, f))
print('M43 OK' if not fails else 'M43 FAIL: ' + '; '.join(fails))
PY
