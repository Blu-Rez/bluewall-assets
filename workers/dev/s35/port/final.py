import io, json, base64
import mkport3
FR=json.load(open(mkport3.D+'/fr.json'))
out={}; tot=0
for t in FR:
    im=mkport3.make(t,192); b=io.BytesIO(); im.save(b,'WEBP',quality=80,method=6); out[t]=b.getvalue(); tot+=len(b.getvalue())
print('total bytes',tot)
P='/home/claude/bot/bluebot_v2/bluewall/client/src/portraits.js'
head=open(P).read().split('export const PORTRAIT')[0]
body='export const PORTRAIT = {\n'+',\n'.join(' "%s": "data:image/webp;base64,%s"'%(t,base64.b64encode(v).decode()) for t,v in out.items())+'\n};\n'
open(P,'w').write(head+body)
