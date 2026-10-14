exec(open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0])
import subprocess, os
s,a=req('/api/auth',{'init_data':init_data(4242)}); T=a['token']
s,st=req('/api/state',tok=T); assert 'prem' in st and st['prem']=={'sap':0,'onyx':0}, st.get('prem'); print('fresh prem ok', st['prem'])
# a prize from the bot: sapphire + onyx through the inbox, drained on the next state read, paid exactly once
os.chdir('/home/claude/bot/bluebot_v2')
import sys; sys.path.insert(0,'/home/claude/bot/bluebot_v2')
print('bridge cli:', subprocess.run([sys.executable,'-m','bluewall.bridge','--grant-prem','4242','10','2'],capture_output=True,text=True,env={**os.environ,'BLUEBOT_REDIS_URL':os.getenv('BLUEBOT_REDIS_URL','redis://127.0.0.1:6379')}).stdout.strip()[:160])
s,st=req('/api/state',tok=T); print('after prize', st['prem'], st.get('gift'))
s,st2=req('/api/state',tok=T); print('again (no double pay)', st2['prem'])
# the dev tool is owner-only (uid 777)
s,r=req('/api/dev',{'prem':{'sap':999}},tok=T); print('dev for a stranger', s)
s,a7=req('/api/auth',{'init_data':init_data(777)}); T7=a7['token']
s,r=req('/api/dev',{'prem':{'sap':120,'onyx':8}},tok=T7); print('dev owner', s, r.get('prem') if isinstance(r,dict) else r)
