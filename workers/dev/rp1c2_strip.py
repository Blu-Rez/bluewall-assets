#!/usr/bin/env python3
# rp1c2_strip.py — RP1C-R2 Jobs 4 + 5: drive rp1c2_strip.js in the persistent browser and take N side-view frames.
#   usage: rp1c2_strip.py TAG NAME kind(street|slope|flat) mode(old|new) speed(walk|run|sprint) N dt  [dist h look]
#   frames land in /home/claude/work/TAG/shots/NAME_k.png (390x844 CSS px, clipped around her); the install of window.__strip happens once per session (idempotent)
import sys, subprocess, json, os, time
tag, name, kind, mode, speed, n, dt = sys.argv[1:8]; n = int(n); dt = float(dt)
dist = float(sys.argv[8]) if len(sys.argv) > 8 else 2.2; h = float(sys.argv[9]) if len(sys.argv) > 9 else 0.55; look = float(sys.argv[10]) if len(sys.argv) > 10 else 0.45
Q = ['python3', '/home/claude/dev/rp1c2_q.py', '-t', tag]
def q(*a, tmo=900):
    env = dict(os.environ, TMO=str(tmo)); r = subprocess.run(Q + list(a), capture_output=True, text=True, env=env); return r.stdout.strip()
if q('eval', '!!window.__strip') != 'true': print('install', q('evalf', '/home/claude/dev/rp1c2_strip.js')[:200])
o = json.dumps(dict(kind=kind, mode=mode, speed=speed, dist=dist, h=h, look=look, warm=1.4))
r = q('eval', 'window.__strip.init(%s)' % o); print('init', r[:300])
CLIP = os.environ.get('CLIP', '45,300,300,440').split(',')
log = []
for k in range(n):
    if k: log.append(q('eval', 'window.__strip.step(%s)' % dt))
    else: log.append(q('eval', 'window.__strip.step(0.0166)'))
    time.sleep(0.4)
    print(k, q('shot', '%s_%d' % (name, k), *CLIP)[-60:], log[-1][:200], flush=True)
print('done', q('eval', 'window.__strip.done()'))
json.dump(log, open('/home/claude/work/%s/shots/%s_log.json' % (tag, name), 'w'))
