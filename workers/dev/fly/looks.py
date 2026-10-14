import json, sys, subprocess, os
# looks.py PREFIX unit 'json of heads opts' v1json v2json ...  -> renders q + f views per look
pre, unit, heads = sys.argv[1], sys.argv[2], sys.argv[3]; vs = sys.argv[4:]
for i, v in enumerate(vs):
    look = json.loads(v)
    if isinstance(look.get('tint'), str): look['tint'] = int(look['tint'], 16)
    fo = json.dumps({"heads": {unit: json.loads(heads)}, "look": {unit: look}}, separators=(',', ':'))
    r = subprocess.run(['python3', 'hc.py', f'/home/claude/dev/s35/fly/work/{pre}{i+1}', json.dumps({unit: 1, "dragon": 1}, separators=(',', ':')), fo,
        "q=L.adv(3.0); POSE('Fly',0.08); window.HY=5.5; HC(1,46,0.55,0.3,2); return 1", "f=HC(1,46,0.05,0.12,2); return 1"], capture_output=True, text=True, env=dict(os.environ, W='900', H='560'))
    print(i + 1, r.stdout.strip().splitlines()[-1][:80] if r.stdout.strip() else r.stderr[-200:])
