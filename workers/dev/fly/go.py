import sys, json, os, time
# fly/go.py NAME step:file.js[:frames][:noshot] ...  -> writes cmd/NAME.json for live.py, waits for NAME.out and prints it
name = sys.argv[1]; D = '/home/claude/dev/fly/cmd'; steps = []
for a in sys.argv[2:]:
    p = a.split('@'); st = {'name': p[0], 'js': open('/home/claude/dev/fly/js/' + p[1]).read() if os.path.exists('/home/claude/dev/fly/js/' + p[1]) else p[1]}
    for x in p[2:]:
        if x == 'noshot': st['shot'] = False
        elif x.startswith('vp'): st['vp'] = [int(v) for v in x[2:].split('x')]
        elif x.startswith('w') and x[1:].isdigit(): st['wait'] = int(x[1:])
        elif x.isdigit(): st['frames'] = int(x)
    steps.append(st)
json.dump(steps, open(D + '/' + name + '.json.tmp', 'w')); os.rename(D + '/' + name + '.json.tmp', D + '/' + name + '.json')
t0 = time.time()
while not os.path.exists(D + '/' + name + '.out'):
    time.sleep(1)
    if time.time() - t0 > float(os.environ.get('GOWAIT', 900)): print('TIMEOUT'); break
else: time.sleep(0.5); print(open(D + '/' + name + '.out').read())
