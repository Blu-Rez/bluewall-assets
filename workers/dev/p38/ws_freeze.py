# ws_freeze.py — turn /tmp/cmp/wsplan.json (wsplan.mjs) into the frozen WS_SITES table of layout.js
import json, math, re
S=json.load(open('/tmp/cmp/wsplan.json'))
R={'lumber':24,'quarry':24,'farm':26,'livestock':26,'fishery':22,'iron':22,'slaughter':18,'greenhouse':20,'gold':22,'oil':26}
cnt={}; rows=[]
for w in S:
    k=w['kind']; cnt[k]=cnt.get(k,0)+1
    idn=k+(str(cnt[k]) if k=='lumber' else '')
    if k=='fishery': idn='fishery_'+w['variant']
    tx,tz=(w['water'] if 'water' in w else w['link'])
    ry=math.atan2(tx-w['x'], tz-w['z'])
    rows.append("  { id: '%s', kind: '%s', x: %.1f, z: %.1f, ry: %.3f, r: %d, link: [%.1f, %.1f]%s },"%(idn,k,w['x'],w['z'],ry,R[k],w['link'][0],w['link'][1], (", water: [%.1f, %.1f]"%tuple(w['water'])) if 'water' in w else ''))
p='/home/claude/bot/bluebot_v2/bluewall/client/src/layout.js'
s=open(p).read()
a=s.index("export const WS_SITES = [\n")+len("export const WS_SITES = [\n"); b=s.index("];",a)
s=s[:a]+'\n'.join(rows)+'\n'+s[b:]
open(p,'w').write(s); print('\n'.join(rows))
