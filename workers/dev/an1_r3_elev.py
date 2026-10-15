#!/usr/bin/env python3
# an1_r3_elev.py — runs an1_r3/elev.js through the RPC page for a list of game models; writes PNGs to work/an1r3/elev/ and prints the sizes.  usage: an1_r3_elev.py <set>
import json, sys, base64, os, subprocess
S = {
 'houses': [dict(id='cottage_0', url='assets/tr2/house_cottage_0.glb', key='house_cottage_0', w=6.6), dict(id='cottage_1', url='assets/tr2/house_cottage_1.glb', key='house_cottage_1', w=6.6), dict(id='craftsman_0', url='assets/tr2/house_craftsman_0.glb', key='house_craftsman_0', w=7.8),
            dict(id='merchant_0', url='assets/tr2/house_merchant_0.glb', key='house_merchant_0', w=7.4), dict(id='noble_0', url='assets/tr2/house_noble_0.glb', key='house_noble_0', w=10.5), dict(id='generic_a', url='assets/tr2/house_generic_a.glb', key='house_generic_a', w=7.5),
            dict(id='generic_b', url='assets/tr2/house_generic_b.glb', key='house_generic_b', w=7.5), dict(id='generic_d', url='assets/tr2/house_generic_d.glb', key='house_generic_d', w=7.5)],

 'castle': [dict(id='gate_stone_26', url='assets/tr2/castle_gate_stone.glb', key='castle_gate_stone', len=26.0), dict(id='gate_stone_24', url='assets/tr2/castle_gate_stone.glb', key='castle_gate_stone', len=24.0),
            dict(id='tower_stone_9.8', url='assets/tr2/castle_tower_medium_stone.glb', key='castle_tower_medium_stone', w=9.8), dict(id='keep_27', url='assets/tr2/castle_keep_stone_2.glb', key='castle_keep_stone_2', w=27.0),
            dict(id='tavern_11h', url='assets/tr2/tavern_0.glb', key='tavern_0', h=11.0), dict(id='civic_hall_16', url='assets/tr2/civic_hall_0.glb', key='civic_hall_0', w=24.0), dict(id='shrine_16h', url='assets/tr2/shrine_0.glb', key='shrine_0', h=16.0),
            dict(id='well_4.4h', url='assets/tr2/well_stone.glb', key='well_stone', h=4.4)],
}
which = sys.argv[1] if len(sys.argv) > 1 else 'houses'
items = S[which] if '/' not in which else S[which.split('/')[0]][int(which.split('/')[1]):int(which.split('/')[1])+1]
js = open('/home/claude/dev/an1_r3/elev.js').read().replace('ARGS.items', json.dumps(items)).replace('ARGS.px || [480, 340]', '[480, 340]')
open('/tmp/elev_%s.js' % which.replace('/', '_'), 'w').write(js)
r = subprocess.run(['/home/claude/dev/an1_r3_rpc.sh', 'elev_' + which.replace('/', '_')], stdin=open('/tmp/elev_%s.js' % which.replace('/', '_')), capture_output=True, text=True).stdout
d = json.loads(r)
if not d.get('ok'): print(d); sys.exit(1)
os.makedirs('/home/claude/work/an1r3/elev', exist_ok=True)
for k, v in d['result'].items():
    if 'png' in v:
        open('/home/claude/work/an1r3/elev/%s.png' % k, 'wb').write(base64.b64decode(v['png'].split(',')[1])); print(k, v['size'], v['s'], v['ppm'])
    else: print(k, v)
