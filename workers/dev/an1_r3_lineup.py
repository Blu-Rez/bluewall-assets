#!/usr/bin/env python3
# an1_r3_lineup.py — runs an1_r3/lineup.js through the RPC page (an1_r3_page.py, game paused): python3 an1_r3_lineup.py <people|animals|cart> <now|after>  -> work/an1r3/shots/lineup_<state>_<sheet>.png (844x390)
# (the call can take minutes in software GL: run it with nohup and poll the png)
import json, sys, base64, subprocess
sheet, state = sys.argv[1], sys.argv[2]
js = open('/home/claude/dev/an1_r3/lineup.js').read().replace('ARGS', json.dumps({'sheet': sheet, 'state': state, 'hero': 2}))
import os; env = dict(os.environ, AN1_WAIT='1800')
out = subprocess.run(['/home/claude/dev/an1_r3_rpc.sh', 'lineup_%s_%s' % (state, sheet)], input=js, capture_output=True, text=True, env=env).stdout
d = json.loads(out)
if not d.get('ok'): print(json.dumps(d)[:1500]); sys.exit(1)
res = d['result']; p = '/home/claude/work/an1r3/shots/lineup_%s_%s.png' % (state, sheet)
open(p, 'wb').write(base64.b64decode(res['png'].split(',')[1])); print(p); print(json.dumps(res['items']))
