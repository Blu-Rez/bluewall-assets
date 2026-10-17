#!/usr/bin/env python3
# cl1q.py — send ONE command to the persistent browser driver (rp1c2_drv.py, TAG=cl1) and print the answer.
#   python3 cl1q.py eval  <js-file|-e 'js'> [timeout_s]      evaluates a JS file (or inline) in the game page, prints the returned value
#   python3 cl1q.py shot  <name> [x y w h]                    screenshot into work/cl1/shots/<name>.png
#   python3 cl1q.py logs
import sys, json, time, os, glob
BASE = '/home/claude/work/cl1/'; Q = BASE + 'q/'; R = BASE + 'r/'
def send(cmd, to=900):
    n = '%06d' % int(time.time() * 1000 % 1000000); f = Q + n + '.json'
    json.dump(cmd, open(f + '.tmp', 'w')); os.rename(f + '.tmp', f)
    t0 = time.time()
    while time.time() - t0 < to:
        if os.path.exists(R + n + '.json'):
            time.sleep(0.05); return json.load(open(R + n + '.json'))
        time.sleep(0.3)
    return {'ok': False, 'err': 'timeout %ds' % to}
if __name__ == '__main__':
    op = sys.argv[1]
    if op == 'eval':
        js = sys.argv[3] if sys.argv[2] == '-e' else open(sys.argv[2]).read()
        to = int(sys.argv[4]) if len(sys.argv) > 4 else 900
        r = send({'op': 'eval', 'js': js}, to)
        print(r['v'] if r.get('ok') and isinstance(r.get('v'), str) else json.dumps(r)[:4000])
    elif op == 'shot':
        c = {'op': 'shot', 'name': sys.argv[2]}
        if len(sys.argv) > 6: c['clip'] = {'x': float(sys.argv[3]), 'y': float(sys.argv[4]), 'width': float(sys.argv[5]), 'height': float(sys.argv[6])}
        print(json.dumps(send(c, 600)))
    elif op == 'logs': print(json.dumps(send({'op': 'logs'}, 60))[:3000])
