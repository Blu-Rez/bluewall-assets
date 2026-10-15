#!/usr/bin/env python3
# an1_r3_ingame.py <name> '<json args>' — an in-game verification frame through the RPC page (an1_r3/ingame_rt.js) -> work/an1r3/shots/<name>.png (844x390)
import json, sys, base64, subprocess, os
name, args = sys.argv[1], json.loads(sys.argv[2])
js = open('/home/claude/dev/an1_r3/ingame_rt.js').read().replace('ARGS', json.dumps(args))
out = subprocess.run(['/home/claude/dev/an1_r3_rpc.sh', 'ig_' + name], input=js, capture_output=True, text=True, env=dict(os.environ, AN1_WAIT='900')).stdout
d = json.loads(out)
if not d.get('ok'): print(json.dumps(d)[:1000]); sys.exit(1)
p = '/home/claude/work/an1r3/shots/%s.png' % name; open(p, 'wb').write(base64.b64decode(d['result']['png'].split(',')[1])); print(p, d['result']['cam'])
