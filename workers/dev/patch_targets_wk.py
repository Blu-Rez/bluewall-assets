# p35: gives the real-map targets the same `wk` (weapon kind) the new castle.js rule gives them:
#   unroofed (ballista-type) towers: k even -> every 2nd of those is a DRAGONBANE (j = k>>1 odd), the others ballista;  k odd -> cannon / quad as before
#   roofed towers: every 3rd is a wizard (as before); of the others the q-th: q%3==1 -> frost spire, q%3==2 -> flame tower
import json, sys
p = '/home/claude/bot/bluebot_v2/bluewall/client/src/basetargets.json'
BT = json.load(open(p))
rings = {}
for t in BT['targets']:
    if t['type'] in ('tower', 'ballista') and t.get('def'): rings.setdefault(t.get('ringId'), []).append(t)
for rid, L in rings.items():
    L.sort(key=lambda t: t['seg'])
    k = 0; r = 0; q = 0
    for t in L:
        if t['type'] == 'ballista':
            t['wk'] = ('dragonbane' if (k >> 1) % 2 == 1 else 'ballista') if k % 2 == 0 else ('cannon' if ((k - 1) >> 1) % 2 == 0 else 'quad'); k += 1
        else:
            if r % 3 == 2: t['wk'] = 'wizard'
            else:
                if q % 3 == 1: t['wk'] = 'frost'
                elif q % 3 == 2: t['wk'] = 'flame'
                else: t.pop('wk', None)
                q += 1
            r += 1
json.dump(BT, open(p, 'w'), separators=(',', ':'))
import collections
print(collections.Counter((t['type'], t.get('wk')) for t in BT['targets'] if t['type'] in ('tower', 'ballista')))
