import json, sys, subprocess, os
# looks2.py PREFIX unit 'heads json' view-js look1 look2 ... : one image per look (view js given once)
pre, unit, heads, view = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]; vs = sys.argv[5:]
for i, v in enumerate(vs):
    look = json.loads(v)
    if isinstance(look.get('tint'), str): look['tint'] = int(look['tint'], 16)
    fo = json.dumps({"heads": {unit: json.loads(heads)}, "look": {unit: look}}, separators=(',', ':'))
    r = subprocess.run(['python3', 'hc.py', f'/home/claude/dev/s35/fly/work/{pre}{i+1}', json.dumps({unit: 1}, separators=(',', ':')), fo, "q=L.adv(3.0); POSE('Fly',0.08); window.HY=5.5; " + view + " return 1"], capture_output=True, text=True, env=dict(os.environ, W='900', H='560'))
    print(i + 1, r.stdout.strip().splitlines()[-1][:60] if r.stdout.strip() else r.stderr[-200:])
