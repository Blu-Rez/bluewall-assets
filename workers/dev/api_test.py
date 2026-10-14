import hmac, hashlib, json, time, urllib.parse, urllib.request
TOK="123456:TESTTOKENabcdefghijk"
def init_data(uid, sp=None):
    d={"auth_date":str(int(time.time())),"query_id":"AAE","user":json.dumps({"id":uid,"first_name":"Blꪊe"},separators=(',',':'))}
    if sp: d["start_param"]=sp
    dcs="\n".join(f"{k}={v}" for k,v in sorted(d.items()))
    sk=hmac.new(b"WebAppData", TOK.encode(), hashlib.sha256).digest()
    d["hash"]=hmac.new(sk, dcs.encode(), hashlib.sha256).hexdigest()
    return urllib.parse.urlencode(d)
def req(path, body=None, tok=None):
    h={'Content-Type':'application/json'}
    if tok: h['Authorization']='Bearer '+tok
    r=urllib.request.Request('http://127.0.0.1:8591'+path, data=json.dumps(body).encode() if body is not None else None, headers=h, method='POST' if body is not None else 'GET')
    try:
        with urllib.request.urlopen(r) as f: return f.status, json.loads(f.read())
    except urllib.error.HTTPError as e: return e.code, json.loads(e.read())
s,a=req('/api/auth',{'init_data':init_data(777)}); print('auth',s,a.get('name'))
t=a['token']
s,st=req('/api/state',tok=t); print('state',s,st['level'],st['gems'],{k:(v['ready'],v['rate'],v['cap']) for k,v in st['mines'].items()})
s,c=req('/api/collect',{'mine':'ruby'},tok=t); print('collect',s,c['got'],c['gems'])
s,c=req('/api/collect',{'mine':'ruby'},tok=t); print('collect again',s,c['got'],c['gems'])
s,c=req('/api/collect',{'mine':'gold'},tok=t); print('bad mine',s,c)
s,c=req('/api/state'); print('no token',s,c)
s,a2=req('/api/auth',{'init_data':init_data(999)}); print('stranger',s,a2)
