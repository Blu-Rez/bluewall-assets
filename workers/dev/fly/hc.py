import json, subprocess, os, sys
# hc.py OUTPREFIX 'army-json' 'fo-json' step1 step2 ...   (each step 'name=js'; HC/POSE helpers preloaded in the first)  env W H
out, army, fo = sys.argv[1], sys.argv[2], sys.argv[3]; steps = sys.argv[4:]
js = open('/home/claude/dev/fly/js/headcam.js').read().replace('\n', ' ')
steps[0] = steps[0].replace('=', '=' + js + ' ', 1) if '=' in steps[0] else steps[0]
env = dict(os.environ, W=os.environ.get('W', '1000'), H=os.environ.get('H', '640'))
r = subprocess.run(['python3', 'shot.py', 'army=' + army + '&t=2&fo=' + fo, out] + steps, env=env, capture_output=True, text=True, cwd='/home/claude/dev/fly')
print(r.stdout[-900:], r.stderr[-600:])
