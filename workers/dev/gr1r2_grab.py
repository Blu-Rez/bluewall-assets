#!/usr/bin/env python3
# gr1r2_grab.py <qdir> <shots.json> — frames through the daemon by rendering once more and reading the canvas (no slow page.screenshot).
# shots.json: [{"name":"a","hour":14.4,"pos":[x,z,yaw],"look":[yaw,pitch],"pre":"js body (async)","wait":2,"post":"js expr -> string"}...]   PNG -> <qdir>/png/<name>.png
import json, os, sys, time, uuid, base64
from PIL import Image
sys.path.insert(0, '/home/claude/dev')
DAY_MAP = [(0, 4.6), (0.06, 6.5), (0.38, 12), (0.70, 17), (0.80, 19.1), (0.86, 20.3), (1, 28.6)]
def hour_to_ms(h):
    h = h % 24
    if h < 4.6: h += 24
    for (f0, g0), (f1, g1) in zip(DAY_MAP, DAY_MAP[1:]):
        if g0 <= h <= g1:
            f = f0 + (h - g0) / (g1 - g0) * (f1 - f0)
            return int(1_700_000_000_000 // 3_600_000 * 3_600_000 + f * 3_600_000)
JS = """(async()=>{ const raf=()=>new Promise(r=>requestAnimationFrame(r)); const H=%s;
 if(H.ms!=null) window.__dn=H.ms; if(H.pos) __rp.setPos(H.pos[0],H.pos[1],H.pos[2]); if(H.look) __rp.setLook(H.look[0],H.look[1]);
 if(H.pre) await (new Function('return (async()=>{'+H.pre+'})()'))();
 for(let i=0;i<(H.wait||2);i++) await raf();
 if(H.cam){ const c=__bw.camera; c.position.set(H.cam.p[0],H.cam.p[1],H.cam.p[2]); c.lookAt(H.cam.t[0],H.cam.t[1],H.cam.t[2]); if(H.cam.fov){c.fov=H.cam.fov; c.updateProjectionMatrix();} c.updateMatrixWorld(true); }
 const r=__bw.renderer; r.render(__bw.scene,__bw.camera); const gl=r.getContext(), w=gl.drawingBufferWidth, h=gl.drawingBufferHeight, px=new Uint8Array(w*h*4);
 gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px); let bin=''; for(let i=0;i<px.length;i+=32768) bin+=String.fromCharCode.apply(null,px.subarray(i,i+32768)); const png={w,h,b64:btoa(bin)};
 if(H.cam&&H.cam.fov){ const c=__bw.camera; c.fov=H.cam.fov0||52; c.updateProjectionMatrix(); }
 let info=''; if(H.post) info=String(await (new Function('return (async()=>{ return '+H.post+' })()'))());
 return JSON.stringify({png, info}); })()"""
def send(qdir, cmd, tmo=1800):
    cmd.setdefault('id', 'c' + uuid.uuid4().hex[:6])
    p = os.path.join(qdir, 'in', '%013d_%s.json' % (int(time.time() * 1000), cmd['id']))
    json.dump(cmd, open(p + '.tmp', 'w')); os.rename(p + '.tmp', p)
    o = os.path.join(qdir, 'out', cmd['id'] + '.json'); t0 = time.time()
    while not os.path.exists(o):
        if time.time() - t0 > tmo: raise SystemExit('TIMEOUT ' + cmd['id'])
        time.sleep(0.3)
    time.sleep(0.1); return json.load(open(o))
def main():
    qdir = sys.argv[1]; shots = json.load(open(sys.argv[2])); os.makedirs(os.path.join(qdir, 'png'), exist_ok=True)
    for s in shots:
        t0 = time.time(); h = dict(s); h['ms'] = hour_to_ms(s['hour']) if s.get('hour') is not None else None
        r = send(qdir, {'eval': JS % json.dumps(h)})
        if 'error' in r: print(s['name'], 'ERROR', r['error']); continue
        v = json.loads(r['value']); path = os.path.join(qdir, 'png', s['name'] + '.png')
        Image.frombytes('RGBA', (v['png']['w'], v['png']['h']), base64.b64decode(v['png']['b64'])).transpose(Image.FLIP_TOP_BOTTOM).convert('RGB').save(path)
        print('%-34s %5.1fs %s' % (s['name'], time.time() - t0, v['info']), flush=True)
main()
