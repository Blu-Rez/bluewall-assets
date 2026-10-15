#!/usr/bin/env python3
# rp4r3_q.py — RP4_R3: talk to the persistent headless game driver (dev/rp1c2_drv.py, TAG=rp4r3) through its file queue.
#   usage:  python3 rp4r3_q.py eval <file.js> [out.json]     evaluate a JS file in the game page, print / save its (JSON string) result
#           python3 rp4r3_q.py js "<expr>"                    evaluate one expression
#           python3 rp4r3_q.py shot <name> [x y w h]          screenshot to work/rp4r3/shots/<name>.png
#           python3 rp4r3_q.py quit
import json, os, sys, time, glob
BASE = '/home/claude/work/rp4r3/'
Q, R = BASE + 'q/', BASE + 'r/'
def call(cmd, timeout=1800):
    n = len(glob.glob(R + '*.json')) + len(glob.glob(Q + '*.json')) + int(time.time() * 1000) % 100000
    name = '%06d.json' % n
    tmp = Q + name + '.tmp'
    json.dump(cmd, open(tmp, 'w')); os.rename(tmp, Q + name)
    t0 = time.time()
    while time.time() - t0 < timeout:
        if os.path.exists(R + name):
            time.sleep(0.05)
            out = json.load(open(R + name)); os.remove(R + name); return out
        time.sleep(0.2)
    raise TimeoutError(name)
if __name__ == '__main__':
    op = sys.argv[1]
    if op == 'eval':
        r = call({'op': 'eval', 'js': open(sys.argv[2]).read()})
    elif op == 'js':
        r = call({'op': 'eval', 'js': sys.argv[2]})
    elif op == 'shot':
        cmd = {'op': 'shot', 'name': sys.argv[2]}
        if len(sys.argv) > 6: cmd['clip'] = {'x': float(sys.argv[3]), 'y': float(sys.argv[4]), 'width': float(sys.argv[5]), 'height': float(sys.argv[6])}
        r = call(cmd)
    elif op == 'quit':
        r = call({'op': 'quit'})
    else:
        raise SystemExit('?')
    if not r.get('ok'): print('ERR', r.get('err')); sys.exit(1)
    v = r.get('v')
    if len(sys.argv) > 3 and op == 'eval': open(sys.argv[3], 'w').write(v if isinstance(v, str) else json.dumps(v)); print('saved', sys.argv[3], len(str(v)), 'chars')
    else: print(v if isinstance(v, str) else json.dumps(v))
