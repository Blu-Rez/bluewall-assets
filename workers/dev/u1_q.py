import json, os, time
Q = '/home/claude/dev/u1_q'; _n = [int(time.time()) % 1000000]
def run(jobs, timeout=600):
    _n[0] += 1; f = '%s/%d.json' % (Q, _n[0]); tmp = f + '.tmp'
    json.dump(jobs, open(tmp, 'w')); os.rename(tmp, f)
    o = f[:-5] + '.out'; t0 = time.time()
    while not os.path.exists(o):
        time.sleep(0.4)
        if time.time() - t0 > timeout: raise RuntimeError('timeout')
    return open(o).read()
if __name__ == '__main__':
    import sys
    print(run([{'js': sys.argv[1]}]))
