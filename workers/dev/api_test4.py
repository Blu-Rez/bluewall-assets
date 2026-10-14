import sys; sys.path.insert(0,'/home/claude/dev')
src=open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0]
exec(src)
import time
s,a=req('/api/auth',{'init_data':init_data(777)}); o=a['token']
s,j=req('/api/dev',{'gems':100,'army':'fill'},tok=o); print('fill', s, j.get('gems'))
time.sleep(21)
s,j=req('/api/scout',{},tok=o); print('scout',j.get('ok'),j.get('why'))
tg=j['target']; print(tg['loot'], tg['ratio'])
army=req('/api/state',tok=o)[1]['army']['army']
sent={u:max(1,n//2) for u,n in army.items()}
lost={u:max(0,n//5) for u,n in sent.items()}
for des,stars in ((40,0),(100,3)):
    time.sleep(21)
    s,j=req('/api/scout',{},tok=o); tg=j['target']
    rep={'sent':sent,'lost':lost,'destruction':des,'stars':stars,'loot':{'ruby':99999,'emerald':99999,'turq':99999}}
    s,e=req('/api/battle/end',{'id':tg['id'],'rep':rep},tok=o); print(des,'->',e.get('ok'),e.get('why'),e.get('info') and e['info'].get('loot'),'target loot',tg['loot'], 'gems',e.get('gems'))
# cheating: sent more than owned
time.sleep(21)
s,j=req('/api/scout',{},tok=o); tg=j['target']
bad={'sent':{'dragon':99},'lost':{},'destruction':50,'stars':1,'loot':{'ruby':1}}
s,e=req('/api/battle/end',{'id':tg['id'],'rep':bad},tok=o); print('cheat sent>owned ->',e.get('ok'),e.get('why'))
