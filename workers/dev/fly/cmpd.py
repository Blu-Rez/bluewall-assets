import json, sys, subprocess, os
# cmpd.py PREFIX unit 'heads json' look1 look2 ... : [unit | normal dragon/baby] side by side, one image per look
pre, unit, heads = sys.argv[1], sys.argv[2], sys.argv[3]; vs = sys.argv[4:]
norm = 'baby' if unit == 'baby3' else 'dragon'; D = 70 if unit == 'baby3' else 100; Y = 14 if unit == 'baby3' else 20
for i, v in enumerate(vs):
    look = json.loads(v)
    if isinstance(look.get('tint'), str): look['tint'] = int(look['tint'], 16)
    fo = json.dumps({"heads": {unit: json.loads(heads)}, "look": {unit: look}}, separators=(',', ':'))
    js = f"q=L.adv(3.0); POSE('Fly',0.08); const sy=1; L.cam(34,{Y}+22,-{D}+10,0,{Y}+1,0,30); return 1"
    r = subprocess.run(['python3', 'hc.py', f'/home/claude/dev/s35/fly/work/{pre}{i+1}', json.dumps({unit: 1, norm: 1}, separators=(',', ':')), fo, js], capture_output=True, text=True, env=dict(os.environ, W='1000', H='560'))
    print(i + 1, (r.stdout.strip().splitlines() or ['?'])[-1][:50])
