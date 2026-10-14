import json, struct, sys
d = open(sys.argv[1],'rb').read()
cl, ct = struct.unpack('<II', d[12:20]); j = json.loads(d[20:20+cl])
pat = sys.argv[2] if len(sys.argv)>2 else ''
for i,n in enumerate(j['nodes']):
    if pat in (n.get('name') or ''):
        print(i, n.get('name'), 'mesh' if 'mesh' in n else '', 'skin' if 'skin' in n else '', 'ch', n.get('children'), 't', n.get('translation'), 'r', n.get('rotation'), 's', n.get('scale'))
