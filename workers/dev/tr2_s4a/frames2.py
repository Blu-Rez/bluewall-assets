import json, re
s = open('/home/claude/work/s4a/frames.py').read()
s = s.replace("OUT = '/home/claude/work/s4a/fr_' + TAG", "OUT = '/home/claude/work/s4a/cl_' + TAG")
LOTS = json.load(open('/home/claude/work/s4a/lots.json'))
views = {}
for k, v in LOTS.items():
    d = 34 if k in ('market', 'townhall', 'chapel') else 20
    views[k] = "c.target.set(%f,0,%f); c.dist=%d; c.polar=1.1; c.azim=%f;" % (v['x'], v['z'], d, v['ry'] + 0.4)
a = s.index("        VIEWS['civic']")
b = s.index("        rows = {}")
s = s[:a] + "        VIEWS.clear(); VIEWS.update(" + json.dumps(views) + ")\n" + s[b:]
open('/home/claude/work/s4a/frames2_run.py', 'w').write(s)
