# mkport_part.py unit... : re-make only these portraits (same framing / vignette as mkport.py), keep the others in portraits.js
import sys, re, json
src = open('/home/claude/dev/mkport.py').read()
head, loop = src.split("for u in order:", 1)
body, tail = loop.split("js = '//", 1)
exec(head.replace("order = json.load(open(SRC + 'unitdefs.json'))['order']", "order = sys.argv[1:]"))
exec("for u in order:" + body)
P = SRC + 'portraits.js'; js = open(P).read()
for u, v in out.items():
    js, n = re.subn(r'("%s": )"data:image/webp;base64,[^"]+"' % re.escape(u), lambda m: m.group(1) + json.dumps(v), js); print(u, 'replaced', n)
open(P, 'w').write(js)
