#!/usr/bin/env python3
# rp1c_r6_frames.py — RP1C_R6: the six camera spots at 844x390 (home square, gate, beside the bridge, inside the town, near a wall, under the bridge) -> OUT/<label>_<spot>.png + OUT/<label>_numbers.json
#   usage: python3 rp1c_r6_frames.py TAG LABEL OUT [spot,spot,...]       (the persistent browser TAG must be up with the hero started: rp1c2_drv.py W=844 H=390 TAG=TAG)
import sys, json, subprocess, os, base64
TAG, LABEL, OUT = sys.argv[1], sys.argv[2], sys.argv[3]; ONLY = sys.argv[4].split(',') if len(sys.argv) > 4 else None
D = '/home/claude/dev/'; os.makedirs(OUT, exist_ok=True)
SPOTS = {   # name: (x, z, yaw, extra)
  'home_square':  (40.95, 21.98, -2.17, {}),
  'gate':         (46.3, 24.7, 1.107, {}),
  'bridge_side':  (145.1, 75.36, 1.107, {}),
  'town':         (35.4, 82.9, 2.71, {}),
  'near_wall':    (-154.91, 2.82, -1.4658 + 3.14159, {}),
  'under_bridge': (146.78, 70.15, 2.678, {'under': True, 'sims': 10}),
}
def q(*a, tmo=900):
    env = dict(os.environ, TMO=str(tmo)); r = subprocess.run(['python3', D + 'rp1c2_q.py', '-t', TAG] + list(a), capture_output=True, text=True, env=env); return r.stdout.strip()
nums = {}
for name, (x, z, yaw, ex) in SPOTS.items():
    if ONLY and name not in ONLY: continue
    cfg = dict(x=x, z=z, yaw=yaw); cfg.update(ex)
    q('eval', 'window.__R6=' + json.dumps(cfg) + '; 1')
    o = q('evalf', D + 'rp1c_r6_shot.js', tmo=1200)
    try:
        d = json.loads(json.loads(o)) if o.startswith('"') else json.loads(o)
    except Exception as e:
        print(name, 'ERR', o[:200]); continue
    open(OUT + '/%s_%s.png' % (LABEL, name), 'wb').write(base64.b64decode(d['png'].split(',', 1)[1])); nums[name] = d['n']; print(name, d['n'], flush=True)
json.dump(nums, open(OUT + '/%s_numbers.json' % LABEL, 'w'), indent=1)
