import sys; sys.path.insert(0,'/home/claude/dev')
src=open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0]
exec(src)
def login(uid):
    s,a=req('/api/auth',{'init_data':init_data(uid)}); return a['token']
t=login(123); o=login(777)
s,st=req('/api/state',tok=t); a=st['army']
print('new player army',a['army'],'cap',a['cap'],'ready',a['ready'],'power',a['power'],'attack',a['attack'])
s,j=req('/api/dev',{'fill':True,'gems':10**6},tok=o); print('owner fill', s, j['army']['ready'], j['army']['power'], j['army']['army'])
for g in ('ruby','emerald','turq'): req('/api/collect',{'mine':g},tok=t)
s,j=req('/api/army/train',{'u':'sword','n':5},tok=t); print('train sword at barracks 1 ->',j.get('why'),j.get('info'))
s,j=req('/api/army/train',{'u':'spear','n':4},tok=t); print('train spear ->',j.get('ok'),j.get('why'),j['army']['fam']['barracks']['q'])
s,j=req('/api/army/train',{'u':'spear','n':1},tok=t); print('train again (busy) ->',j.get('why'))
s,j=req('/api/army/cancel',{'fam':'barracks'},tok=t); print('cancel',j.get('ok'),j['gems'])
s,j=req('/api/army/train',{'u':'archer','n':4},tok=t); print('archer ->',j.get('ok'),j.get('why'))
s,j=req('/api/army/train',{'u':'spear','n':500},tok=t); print('spear 500 ->',j.get('why'),j.get('info'))
s,j=req('/api/scout',{},tok=t); print('scout non-owner',s,j.get('why'))
s,j=req('/api/scout',{},tok=o); print('scout owner',s,j.get('ok'),j.get('why'), j.get('target'))
tg=j.get('target')
if tg:
    s,j2=req('/api/scout',{},tok=o); print('scout again too fast ->',j2.get('why'))
    army=j['army']['army']
    sent={u:max(1,n//2) for u,n in army.items()}
    lost={u:max(0,n//5) for u,n in sent.items()}
    rep={'sent':sent,'lost':lost,'destruction':83,'stars':1,'loot':{'ruby':99999,'emerald':99999,'turq':99999}}
    s,e=req('/api/battle/end',{'id':tg['id'],'rep':rep},tok=o); print('battle end',s,e.get('ok'),e.get('why'),e.get('info') and e['info']['loot'])
    s,e=req('/api/battle/end',{'id':tg['id'],'rep':rep},tok=o); print('replay ->',e.get('why'))
s,cat=req('/api/catalog',tok=t); print('catalog units',list(cat['army']['units'])[:4],cat['army']['army_cap'][:3])
