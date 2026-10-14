import json, os, time, io, sys
from PIL import Image
D = '/home/claude/dev/s35/port'; Q = D + '/q'
_n = [int(time.time()) % 100000]
def run(jobs, timeout=300):
    _n[0] += 1; f = '%s/%d.json' % (Q, _n[0]); tmp = f + '.tmp'
    json.dump(jobs, open(tmp, 'w')); os.rename(tmp, f)
    o = f[:-5] + '.out'; t0 = time.time()
    while not os.path.exists(o):
        time.sleep(0.4)
        if time.time() - t0 > timeout: raise RuntimeError('timeout')
    return open(o).read()
ISO = """window.__iso=(type)=>{ const S=__bw.battle.session; let k=0, one=0; for(const u of S.sim.units){ if(!u.__home) u.__home=[u.x,u.z]; if(u.type===type && !one){ one=1; u.x=u.__home[0]; u.z=u.__home[1]; } else { u.x=u.__home[0]+3000+(k++)*40; u.z=u.__home[1]+3000; } } for(const d of S.sim.defenders){ if(!d.__home) d.__home=[d.x,d.z]; d.x=d.__home[0]+4000; d.z=d.__home[1]+4000; } return 1; };"""
BG = (12, 31, 68)
def bbox(path):
    im = Image.open(path).convert('RGB'); w, h = im.size; px = im.load(); x0, y0, x1, y1 = w, h, 0, 0; n = 0
    for yy in range(0, h, 2):
        for xx in range(0, w, 2):
            r, g, b = px[xx, yy]
            if abs(r - BG[0]) + abs(g - BG[1]) + abs(b - BG[2]) > 40:
                n += 1; x0 = min(x0, xx); x1 = max(x1, xx); y0 = min(y0, yy); y1 = max(y1, yy)
    return (x0, y0, x1, y1) if n > 12 else None
def cam(t, d, ly, az, up=0.3, fov=30, sx=0.0):
    if not sx: return "return __pt('%s',%s,%s,%s,%s,%s);" % (t, d, ly, az, up, fov)
    # sx = sideways shift of the camera along its own right axis (world units): a negative value moves the subject to the right of the frame
    return "const r0=__pt('%s',%s,%s,%s,%s,%s); const T0=__bw.THREE,c0=__bw.camera,rt0=new T0.Vector3().setFromMatrixColumn(c0.matrixWorld,0); c0.position.addScaledVector(rt0,%s); c0.updateMatrixWorld(true); return r0;" % (t, d, ly, az, up, fov, round(sx, 4))

K = 2 * 0.26795
def find(t, d0, ly0, az, up=0.3, vp=256, tries=6):
    """full-body find: iterate camera until the unit's bbox is inside the frame; returns dict(d, ly, H, W, top, bot) in world units (ly relative to the unit's base height)"""
    d, ly = d0, ly0
    for it in range(tries):
        run([{"js": "__iso('%s'); " % t + cam(t, d, ly, az, up), "vp": vp, "shot": 'A_' + t}])
        bb = bbox(D + '/shots/A_%s.png' % t)
        if not bb:
            ly += 0.0; d *= 1.0; ly = ly0 + (it + 1) * (-1) ** it * d * 0.15; continue
        x0, y0, x1, y1 = bb; k = K * d / vp
        touch = x0 <= 3 or y0 <= 3 or x1 >= vp - 4 or y1 >= vp - 4
        cy = (y0 + y1) / 2; cx = (x0 + x1) / 2
        ly += (vp / 2 - cy) * k
        H = (y1 - y0) * k; W = (x1 - x0) * k
        if touch: d *= 1.5; continue
        if max(H, W) < 0.4 * d * K: d = max(H, W) * 1.5 / K; continue          # small in the frame: come closer and re-measure
        top = ly + (vp / 2 - y0) * k; bot = ly - (y1 - vp / 2) * k
        return dict(d=d, ly=ly, H=H, W=W, top=top, bot=bot)
    return None
