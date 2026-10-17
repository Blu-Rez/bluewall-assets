#!/usr/bin/env python3
# rp1c_r6_one.py — RP1C_R6: ONE 844x390 frame at any spot.   usage: rp1c_r6_one.py TAG OUT.png x z yaw [under]
import sys, json, subprocess, os, base64
TAG, OUT, x, z, yaw = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]); under = len(sys.argv) > 6
def q(*a, tmo=1200):
    env = dict(os.environ, TMO=str(tmo)); r = subprocess.run(['python3', '/home/claude/dev/rp1c2_q.py', '-t', TAG] + list(a), capture_output=True, text=True, env=env); return r.stdout.strip()
cfg = dict(x=x, z=z, yaw=yaw)
if under: cfg.update(under=True, sims=10)
q('eval', 'window.__R6=' + json.dumps(cfg) + '; 1')
o = q('evalf', '/home/claude/dev/rp1c_r6_shot.js'); d = json.loads(json.loads(o) if o.startswith('"') else o)
open(OUT, 'wb').write(base64.b64decode(d['png'].split(',', 1)[1])); print(json.dumps(d['n']))
