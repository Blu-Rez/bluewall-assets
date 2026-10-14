import sys; sys.path.insert(0,'/home/claude/dev')
import importlib.util, json
spec=importlib.util.spec_from_file_location('a','/home/claude/dev/api_test.py')
src=open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0]
exec(src)
def login(uid):
    s,a=req('/api/auth',{'init_data':init_data(uid)}); return a['token']
t=login(123)
s,st=req('/api/state',tok=t); p=st['prog']
print('keep',p['b']['keep'],'builders',p['builders'],'gems',st['gems'],'vault',st['vault'])
for g in ('ruby','emerald','turq'):
    s,c=req('/api/collect',{'mine':g},tok=t)
print('after collect',c['gems'])
def up(op,e):
    s,j=req('/api/upgrade/'+op,{'ent':e},tok=t); return s,j.get('ok'),j.get('why'),j.get('info'),j['gems'] if 'gems' in j else None, (j['prog']['builders_busy'],j['prog']['reserved']) if 'prog' in j else None
print('start wall',up('start','wall'))
print('start barracks',up('start','barracks'))
print('start training',up('start','training'))
print('start mine_ruby (queue full)',up('start','mine_ruby'))
print('start lair (locked)',up('start','lair'))
print('cancel barracks',up('cancel','barracks'))
print('speedup wall',up('speedup','wall'))
s,st=req('/api/state',tok=t); print('levels',st['prog']['b']['wall'], st['prog']['reserved'], st['prog']['builders_busy'], {k:(v.get('up') or {}).get('to') for k,v in st['prog']['structs'].items() if v.get('up')})
print('dev as non-owner',req('/api/dev',{'all':5},tok=t)[0])
t2=login(777)
s,st=req('/api/state',tok=t2); print('owner keep',st['prog']['b']['keep'])
s,j=req('/api/dev',{'reset':True,'fill':True},tok=t2); print('owner reset',s,j['prog']['b']['keep'],j['gems'])
s,j=req('/api/dev',{'set':{'keep':8}},tok=t2); print('owner set keep 8 builders',j['prog']['builders'])
s,cat=req('/api/catalog',tok=t); print('catalog',s,list(cat['structs'])[:3],cat['structs']['wall']['cost'][1],cat['structs']['wall']['dur'][:3])
