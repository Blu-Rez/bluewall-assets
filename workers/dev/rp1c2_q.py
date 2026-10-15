#!/usr/bin/env python3
# rp1c2_q.py — send ONE command to the persistent browser and print the answer.   usage: rp1c2_q.py [-t TAG] eval 'js' | evalf file.js | dsf N | shot name [x y w h] | sleep s | logs | quit
import sys, os, json, time, glob
args = sys.argv[1:]; TAG = 'rp1c2'
if args and args[0] == '-t': TAG = args[1]; args = args[2:]
B = '/home/claude/work/' + TAG + '/'
op = args[0]; cmd = {'op': op}
if op == 'eval': cmd['js'] = args[1]
elif op == 'evalf': cmd = {'op': 'eval', 'js': open(args[1]).read()}
elif op == 'shot':
    cmd['name'] = args[1]
    if len(args) >= 6: cmd['clip'] = {'x': float(args[2]), 'y': float(args[3]), 'width': float(args[4]), 'height': float(args[5])}
elif op == 'sleep': cmd['s'] = float(args[1])
elif op == 'dsf': cmd['v'] = float(args[1])
elif op == 'touch': cmd['x'] = float(args[1]); cmd['y'] = float(args[2])
n = len(glob.glob(B + 'r/*.json')) + len(glob.glob(B + 'q/*.json')) + int(time.time() * 10) % 100000
name = '%08d.json' % n; json.dump(cmd, open(B + 'q/' + name + '.tmp', 'w')); os.rename(B + 'q/' + name + '.tmp', B + 'q/' + name)
tmo = float(os.environ.get('TMO', 600)); t0 = time.time()
while time.time() - t0 < tmo:
    f = B + 'r/' + name
    if os.path.exists(f):
        time.sleep(0.05); o = json.load(open(f)); os.remove(f)
        print(json.dumps(o.get('v')) if o.get('ok') else 'ERR ' + o.get('err', '')); sys.exit(0 if o.get('ok') else 1)
    time.sleep(0.15)
print('TIMEOUT'); sys.exit(2)
