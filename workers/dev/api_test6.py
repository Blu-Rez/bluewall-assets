import sys; sys.path.insert(0,'/home/claude/dev')
src=open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0]
exec(src)
def login(uid, sp=''):
    s,a=req('/api/auth',{'init_data':init_data(uid, sp) if sp else init_data(uid)}); return a['token']
def get(path, tok=None):
    return req(path, tok=tok)
o=login(777)
s,j=req('/api/dev',{'fill':True,'gems':10**6},tok=o)
# no token -> 403 on every new route
for p in ('/api/log','/api/friends','/api/clan'):
    s,r=get(p); assert s==403, (p,s)
# history after an attack
s,j=req('/api/scout',{},tok=o); tg=j['target']; army=j['army']['army']; sent={u:max(1,n//2) for u,n in army.items()}
rep={'sent':sent,'lost':{},'destruction':83,'stars':2,'loot':{'ruby':1,'emerald':1,'turq':1}}
s,e=req('/api/battle/end',{'id':tg['id'],'rep':rep},tok=o); assert e['ok']
s,h=get('/api/log',tok=o); assert s==200 and h['ok'] and len(h['log'])==1 and h['log'][0]['k']=='a' and h['log'][0]['stars']==2 and h['log'][0]['pct']==83, h
print('log ok', h['log'][0])
# friends: a newcomer from 777's link shows up
t=login(5001,'ref_777'); s,st=req('/api/state',tok=t)
s,f=get('/api/friends',tok=o); assert f['ok'] and [x['id'] for x in f['friends']]==[5001] and f['link'] and f['pay']==1000, f
print('friends ok', f['friends'][0]['n'], f['friends'][0]['k'])
# clans over HTTP (the owner's kingdom is castle 20; the newcomer is castle 1)
s,c=get('/api/clan',tok=o); assert c['ok'] and c['mine'] is None and c['top']==[], c
s,c=req('/api/clan',{'op':'create','name':'Blue Fleet','tag':'bf'},tok=o); assert c['ok'] and c['mine']['name']=='Blue Fleet' and c['mine']['tag']=='BF' and c['mine']['n']==1, c
s,c=req('/api/clan',{'op':'create','name':'Other','tag':'OT'},tok=o); assert not c['ok'] and c['why']=='in_clan', c
s,c=req('/api/clan',{'op':'join','id':c.get('id') or 1},tok=t); assert not c['ok'] and c['why'] in ('low',), c
s,c=req('/api/clan',{'op':'nope'},tok=o); assert s==400
s,c=req('/api/clan',{'op':'join','id':'x'},tok=o); assert s==400, s
s,c=get('/api/clan',tok=o); assert c['mine']['me_owner'] and len(c['top'])==1, c
s,c=req('/api/clan',{'op':'leave'},tok=o); assert c['ok'] and c['mine'] is None, c
print('clan http ok')
