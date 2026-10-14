import asyncio, hmac, hashlib, json, time, urllib.parse, sys
from playwright.async_api import async_playwright
TOK="123456:TESTTOKENabcdefghijk"
def init_data(uid):
    d={"auth_date":str(int(time.time())),"query_id":"AAE","user":json.dumps({"id":uid,"first_name":"Blꪊe"},separators=(',',':'))}
    dcs="\n".join(f"{k}={v}" for k,v in sorted(d.items()))
    sk=hmac.new(b"WebAppData", TOK.encode(), hashlib.sha256).digest()
    d["hash"]=hmac.new(sk, dcs.encode(), hashlib.sha256).hexdigest()
    return urllib.parse.urlencode(d)
async def main():
    uid=int(sys.argv[1]); out=sys.argv[2]
    frag = urllib.parse.urlencode({"tgWebAppData": init_data(uid), "tgWebAppVersion": "8.0", "tgWebAppPlatform": "android"})
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':412,'height':870})
        logs=[]; pg.on('console', lambda m: logs.append(m.type+': '+m.text)); pg.on('pageerror', lambda e: logs.append('PAGEERR '+str(e)))
        await pg.goto('http://127.0.0.1:8591/#' + frag)
        for i in range(200):
            await asyncio.sleep(1)
            cls = await pg.evaluate("document.getElementById('splash').className")
            msg = await pg.evaluate("document.getElementById('msg').textContent")
            if cls == 'gone' or 'اتصال' in msg or '🔒' in msg or '⚠️' in msg: break
        await asyncio.sleep(2)
        await pg.screenshot(path=out, timeout=240000)
        print('splash:', cls, '| msg:', msg)
        for l in [l for l in logs if 'warning' not in l][-6:]: print(l[:200])
        await b.close()
asyncio.run(main())
