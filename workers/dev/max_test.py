import sys, json
src=open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0]
exec(src)
sys.path.insert(0,'/home/claude/bot/bluebot_v2')
from bluewall import military as M, progress as P
bad=0
def chk(n,c):
    global bad
    print(('OK   ' if c else 'FAIL ')+n); bad+= 0 if c else 1
s,a=req('/api/auth',{'init_data':init_data(777)}); T=a['token']
s,r=req('/api/dev',{'reset':True},tok=T); chk('reset to level 1 works (owner) level=%s'%r.get('level'), s==200)
s,r=req('/api/dev',{'max':True},tok=T); chk('max 200',s==200 and r.get('ok'))
s,st=req('/api/state',tok=T)
b=st['prog']['b']; chk('all 15 structures at 30 '+str(set(b.values())), set(b.values())=={30} and len(b)==15)
chk('keep level 30 / level', st['level']==30)
army=st['army']['army']; cap=M.army_cap(30)
used=sum(n*M.UNITS[u]['space'] for u,n in army.items()); chk('army within training cap %d/%d'%(used,cap), used<=cap and used>=0.97*cap)
fam={}
for u,n in army.items(): fam[M.UNITS[u]['fam']]=fam.get(M.UNITS[u]['fam'],0)+n*M.UNITS[u]['space']
for f,v in fam.items(): chk('%s %d <= fam_cap %d'%(f,v,M.fam_cap(f,30)), v<=M.fam_cap(f,30))
chk('every unit of the roster present: missing=%s'%[u for u in M.UNITS if u not in army and u not in ('axerider','dragonling')], all(u in army for u in M.UNITS if u not in ('axerider','dragonling')))
chk('heroes all 3: %s'%{h:army.get(h) for h in M.HEROES}, all(army.get(h)==3 for h in M.HEROES))
sp=st['army']['spell']; chk('spells full %s/%s'%(sp['used'],sp['cap']), sp['used']==sp['cap'] and len(sp['spells'])==5 and all(v['n']>0 for v in sp['spells'].values()))
chk('gems = vaults '+str(st['gems']), all(st['gems'][g]==st['vault'][g] if isinstance(st['vault'].get(g),int) else True for g in st['gems']))
chk('prem >= 10000 '+str(st['prem']), all(v>=10000 for v in st['prem'].values()))
chk('own tesla 4 + dragonling '+str(st['own']), st['own']['tesla']==4 and st['own']['dragonling'])
print('army:',army); print('vault',st.get('vault'))
# training anything now is refused cleanly (house full)? and a second max is idempotent
s,r2=req('/api/dev',{'max':True},tok=T); s,st2=req('/api/state',tok=T); chk('max twice = same army', st2['army']['army']==army)
print('FAILED' if bad else 'MAX OK'); 
