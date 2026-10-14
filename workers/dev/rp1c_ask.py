import sys, os, time, json
# rp1c_ask.py 'js body' [shot.png]   — send one command to dev/rp1c_repl.py and print its answer (waits up to 600 s)
IO = os.environ.get('RP1C_IO', '/tmp/rp1c/')
src = sys.argv[1]
if os.path.isfile(src): src = open(src).read()
if len(sys.argv) > 2: src = '#shot ' + sys.argv[2] + '\n' + src
n = '%d' % (time.time() * 1000)
open(IO + 'in/' + n + '.tmp', 'w').write(src); os.rename(IO + 'in/' + n + '.tmp', IO + 'in/' + n + '.js')
t0 = time.time(); lim = float(os.environ.get('ASK_TIMEOUT', 600))
while time.time() - t0 < lim:
    if os.path.exists(IO + 'out/' + n + '.json'):
        r = json.load(open(IO + 'out/' + n + '.json')); print(json.dumps(r.get('result'), indent=None)[:int(os.environ.get('ASK_MAX', 6000))])
        if r.get('error'): print('ERROR', r['error'])
        if r.get('errs'): print('PAGE ERRS', r['errs'])
        sys.exit(0)
    time.sleep(0.3)
print('TIMEOUT'); sys.exit(1)
