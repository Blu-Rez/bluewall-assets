import json, sys, re, bisect
prof = json.load(open(sys.argv[1])); wins = [tuple(map(float, w.split('-'))) for w in sys.argv[2:]] or [(0, 200)]
# bundle line -> src module (esbuild non-minified writes "// src/x.js" / "// node_modules/..." comment lines)
mods = []
for i, l in enumerate(open('/home/claude/dev/app_dbg.js', errors='ignore')):
    if l.startswith('// src/') or l.startswith('// node_modules/'): mods.append((i + 1, l[3:].strip()))
mline = [m[0] for m in mods]
def src(line):
    k = bisect.bisect_right(mline, line) - 1
    return mods[k][1] if k >= 0 else '?'
nodes = {n['id']: n for n in prof['nodes']}
t = prof['startTime']; ts = []
for d in prof['timeDeltas']: t += d; ts.append(t)
t0 = prof['startTime']
for (a, b) in wins:
    agg = {}; tot = 0
    for sid, tt in zip(prof['samples'], ts):
        s = (tt - t0) / 1e6
        if not (a <= s < b): continue
        n = nodes[sid]; cf = n['callFrame']; fn = cf['functionName'] or '(anon)'
        if fn in ('(idle)', '(program)', '(garbage collector)') and False: continue
        key = (fn, src(cf['lineNumber'] + 1) if cf['url'] else cf['url'] or '(native)', cf['lineNumber'] + 1)
        agg[key] = agg.get(key, 0) + 1; tot += 1
    print(f'--- window {a}-{b}s: {tot} samples (~{tot*2/1000:.1f}s busy)')
    for k, v in sorted(agg.items(), key=lambda kv: -kv[1])[:12]: print(f'   {v*2/1000:6.2f}s  {k[0]}  {k[1]}:{k[2]}')
