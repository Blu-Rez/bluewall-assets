#!/usr/bin/env python3
# rp1c2_png.py in.json out.png  — decode the {png: dataURL} that rp1c2_L_canvas.js returned (a JSON string inside a JSON string)
import sys, json, base64
d = json.load(open(sys.argv[1]))
if isinstance(d, str): d = json.loads(d)
open(sys.argv[2], 'wb').write(base64.b64decode(d['png'].split(',', 1)[1]))
print({k: v for k, v in d.items() if k != 'png'})
