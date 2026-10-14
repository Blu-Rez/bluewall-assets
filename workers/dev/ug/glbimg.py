import json, struct, sys, io
from PIL import Image
d = open(sys.argv[1],'rb').read()
cl, ct = struct.unpack('<II', d[12:20]); j = json.loads(d[20:20+cl]); off = 20+cl+8
bin_ = d[off:]
for i,im in enumerate(j.get('images',[])):
    bv = j['bufferViews'][im['bufferView']]; b = bin_[bv.get('byteOffset',0): bv.get('byteOffset',0)+bv['byteLength']]
    img = Image.open(io.BytesIO(b)); print(i, im.get('mimeType'), img.size)
    img.convert('RGB').save(f'{sys.argv[2]}_{i}.png')
