#!/usr/bin/env python3
# rp4r3_film.py <tag> [camera: side|behind] — RP4_R3: full-size frames (844x390) of the roll on the REAL game, at fixed times after the press, + the hero's screen position for the crops.
import sys, json, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rp4r3_q import call
tag = sys.argv[1]; cam = sys.argv[2] if len(sys.argv) > 2 else 'side'; IDX = int(sys.argv[3]) if len(sys.argv) > 3 else 0
OUT = '/home/claude/work/rp4r3/shots/'; os.makedirs(OUT, exist_ok=True)
TIMES = [0.0, 0.08, 0.16, 0.24, 0.32, 0.42, 0.54, 0.68, 0.82, 0.95]
YAW = 1.5707963267948966 if cam == 'side' else 0.0
SETUP = """(async()=>{ const rp=__rp, S=rp.S; rp.pause(true); S.cool=99; S.dodgeCool=0;
  const flats=[]; for (let x=-300;x<=300;x+=20) for (let z=-300;z<=240;z+=20){ let lo=1e9,hi=-1e9; for (let a=-6;a<=6;a+=1.5) for (let b=-6;b<=6;b+=1.5){ const y=rp.baseGround(x+a,z+b); lo=Math.min(lo,y); hi=Math.max(hi,y);} if(hi-lo<0.05&&lo>0.5&&rp.surfAt(x,z)<-1e8&&[-4,0,4].every(a=>[-4,0,4].every(b=>rp.free(x+a,z+b)))) flats.push({x,z}); } const flat=flats[Math.min(%d, flats.length-1)]||{x:0,z:0};
  const yaw=%f; rp.setPos(flat.x, flat.z, yaw); rp.setLook(yaw, 0.2); S.vx=S.vz=0; rp.setInput(0,0); rp.sim(1.0, 1/60); window.__film={flat, t:0, x0:S.x, z0:S.z};
  return JSON.stringify({flat, n:flats.length}); })()""" % (IDX, YAW)
print(call({'op': 'eval', 'js': SETUP})['v'])
# stick: side camera -> the roll goes to the camera's right (stick right); behind -> forward (stick up)
INP = '(1,0)' if cam == 'side' else '(0,1)'
call({'op': 'eval', 'js': "(()=>{ __rp.setInput%s; __rp.dodge(); return 1; })()" % INP})
res = []; t_prev = 0.0
for i, t in enumerate(TIMES):
    step = "(async()=>{ const rp=__rp, S=rp.S; const dt=%f; if (dt>0) rp.sim(dt, 1/60); if (%s) rp.setInput(0,0); await new Promise(r=>requestAnimationFrame(r)); await new Promise(r=>requestAnimationFrame(r)); const p=rp.proj(S.x, S.y+1.0, S.z); return JSON.stringify({t:%f, x:S.x-window.__film.x0, z:S.z-window.__film.z0, st:S.st, sx:p[0], sy:p[1], body:S.body}); })()" % (t - t_prev if i else 0.0, 'true' if t > 0.9 else 'false', t)
    r = json.loads(call({'op': 'eval', 'js': step})['v']); t_prev = t
    name = '%s_%s_%02d' % (tag, cam, i)
    call({'op': 'shot', 'name': name}); r['file'] = OUT + name + '.png'; res.append(r)
    print(r['t'], 'x', round(r['x'], 2), 'z', round(r['z'], 2), r['st'], 'screen', round(r['sx']), round(r['sy']))
json.dump(res, open(OUT + tag + '_' + cam + '.json', 'w'))
call({'op': 'eval', 'js': "(()=>{ __rp.setInput(0,0); __rp.pause(false); return 1; })()"})
