import sys; sys.path.insert(0,'/home/claude/dev')
src=open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0]
exec(src)
def login(uid, sp=''):
    s,a=req('/api/auth',{'init_data':init_data(uid, sp) if sp else init_data(uid)}); return a['token']
o=login(777)
s,j=req('/api/dev',{'fill':True,'gems':10**6},tok=o)
s,j=req('/api/scout',{},tok=o); tg=j['target']
army=j['army']['army']; sent={u:max(1,n//2) for u,n in army.items()}
rep={'sent':sent,'lost':{},'destruction':83,'stars':2,'loot':{'ruby':1,'emerald':1,'turq':1}}
s,e=req('/api/battle/end',{'id':tg['id'],'rep':rep},tok=o); print('battle',s,e.get('ok'),e.get('info',{}).get('tro'),'tro in view',e.get('tro'),e.get('lg'))
s,r=req('/api/rank',tok=o); print('rank',s,r['ok'],r['me'],len(r['top']),r['invite']['link'],r['invite']['done'],r['invite']['max'])
s,r=req('/api/rank'); print('rank no token',s)
# invite flow over HTTP: newcomer 4001 opens from 777's link, reaches castle 3 (owner dev tool on a second account is not possible, so only check the "came from" path is accepted and harmless)
t=login(4001,'ref_777'); s,st=req('/api/state',tok=t); print('invitee state',s,st['ok'],st['level'],st.get('gift'))
t=login(4002,'ref_notanumber'); s,st=req('/api/state',tok=t); print('bad ref ignored',s,st['ok'])
