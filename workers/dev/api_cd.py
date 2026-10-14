import sys, time; sys.path.insert(0,'/home/claude/dev')
src=open('/home/claude/dev/api_test.py').read().split("s,a=req('/api/auth'")[0]
exec(src)
def login(uid):
    s,a=req('/api/auth',{'init_data':init_data(uid)}); return a['token']
o=login(777)
req('/api/dev',{'army':'fill','gems':10**6},tok=o)
time.sleep(21)
s,j=req('/api/scout',{},tok=o); print('1st',j.get('ok'),j.get('why'))
s,j=req('/api/scout',{},tok=o); print('immediate 2nd',j.get('ok'),j.get('why'))
time.sleep(2.3)
s,j=req('/api/scout',{},tok=o); print('after 2.3s',j.get('ok'),j.get('why'))
