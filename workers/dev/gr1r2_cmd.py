#!/usr/bin/env python3
# gr1r2_cmd.py <qdir> '<json command or file>' [timeout_s] — drop one command for gr1r2_daemon.py and wait for its answer
import json, os, sys, time, uuid
qdir, raw = sys.argv[1], sys.argv[2]; tmo = float(sys.argv[3]) if len(sys.argv) > 3 else 900
cmd = json.load(open(raw)) if os.path.isfile(raw) else json.loads(raw)
cmd.setdefault('id', 'c' + uuid.uuid4().hex[:6])
p = os.path.join(qdir, 'in', '%013d_%s.json' % (int(time.time() * 1000), cmd['id']))
json.dump(cmd, open(p + '.tmp', 'w')); os.rename(p + '.tmp', p)
o = os.path.join(qdir, 'out', cmd['id'] + '.json'); t0 = time.time()
while not os.path.exists(o):
    if time.time() - t0 > tmo: print('TIMEOUT waiting for', cmd['id']); sys.exit(2)
    time.sleep(0.5)
res = json.load(open(o))
sv = cmd.get('save')
v = res.get('value')
if sv and isinstance(v, str) and v.startswith('data:image/'):
    import base64
    open(sv, 'wb').write(base64.b64decode(v.split(',', 1)[1])); res['value'] = 'saved ' + sv
print(json.dumps(res)[:4000])
