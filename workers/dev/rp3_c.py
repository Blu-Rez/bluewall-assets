import json, sys, time, os, glob
# rp3c.py <op> [arg...]  — talks to rp1_drv.py through work/rp1/q and r.   ops: eval JS | shot NAME | click SEL | sleep S | wait JS [timeoutSec] | logs
Q = '/home/claude/work/rp1/q/'; R = '/home/claude/work/rp1/r/'
def send(cmd, timeout=900):
    n = '%06d' % (int(time.time() * 1000) % 1000000); json.dump(cmd, open(Q + n + '.tmp', 'w')); os.rename(Q + n + '.tmp', Q + n + '.json')
    t0 = time.time()
    while time.time() - t0 < timeout:
        if os.path.exists(R + n + '.json'):
            time.sleep(0.05); return json.load(open(R + n + '.json'))
        time.sleep(0.2)
    return {'ok': False, 'err': 'timeout'}
a = sys.argv[1:]; op = a[0]
if op == 'eval': r = send({'op': 'eval', 'js': a[1]})
elif op == 'shot': r = send({'op': 'shot', 'name': a[1]})
elif op == 'click': r = send({'op': 'click', 'sel': a[1]})
elif op == 'sleep': r = send({'op': 'sleep', 's': float(a[1])})
elif op == 'logs': r = send({'op': 'logs'})
elif op == 'wait':
    t0 = time.time(); lim = float(a[2]) if len(a) > 2 else 60; r = {'ok': False, 'err': 'wait timeout'}
    while time.time() - t0 < lim:
        x = send({'op': 'eval', 'js': a[1]})
        if x.get('ok') and x.get('v'): r = x; break
        time.sleep(1)
else: r = {'ok': False, 'err': 'bad op'}
print(json.dumps(r)[:4000])
