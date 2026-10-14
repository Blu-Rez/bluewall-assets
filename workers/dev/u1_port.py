import sys, io, json, base64, os
sys.path.insert(0, '/home/claude/dev'); sys.path.insert(0, '/home/claude/dev/s35/port')
import numpy as np
from PIL import Image
import u1_q
# u1_port.py TYPE d ly az up : a portrait of one unit (the pipeline of dev/s35/port: the same frame on black and on white -> alpha -> 192 px WebP) through the u1_gd.py daemon (the real game, one unit of the type isolated).
OUT = '/home/claude/work/shots/game'
GHOST = set()
STARTJS = """const S=__bw.battle.session, W=__bw, T3=W.THREE; __bw.pause(false); S.cam.intro=0; S.confirming=true; S.hud.el.style.display='none'; S.cam.free=true;
const keep=S.views.group; W.scene.children.forEach(o=>{ if(!o.isLight && o!==keep) o.visible=false; });
W.scene.background=new T3.Color(0x0c1f44); { const f=new T3.FogExp2(0x0c1f44,0); f.color.copy=()=>f.color; f.color.lerp=()=>f.color; Object.defineProperty(f,'density',{get:()=>0,set:()=>{}}); W.scene.fog=f; }
if(!window.__rim){ const rim=new T3.DirectionalLight(0x9fd0ff,2.2); W.scene.add(rim); window.__rim=rim; }
window.__pt=(type,d,ly,az,up,fov)=>{ const u=S.sim.units.find(q=>q.type===type&&!q.dead); const gy=W.world.fastHeight(u.x,u.z); const x=u.x, y=gy, z=u.z, a=(u.face||0)+az; const c=W.camera; c.fov=fov; c.aspect=1; c.updateProjectionMatrix(); c.position.set(x+Math.sin(a)*d, y+ly+up*d*0.12, z+Math.cos(a)*d); c.lookAt(x, y+ly, z); c.updateMatrixWorld(true); window.__rim.position.set(x-Math.sin(a+1.9)*40, y+30, z-Math.cos(a+1.9)*40); window.__rim.target.position.set(x,y,z); window.__rim.target.updateMatrixWorld(); return [x|0,y|0,z|0]; };
return 1;"""
from drive import ISO
def bg(c): return "__bw.scene.background.set(%s);" % c
def shoot(t, d, ly, az=0.6, up=0.3, fov=30, vp=384):
    pre = "const S=__bw.battle.session, B=__bw.battle; __iso('%s'); __bw.pause(true); B.advance(0.2); B.advance(0.2); " % t
    cam = "__pt('%s',%s,%s,%s,%s,%s); S.confirming=true; " % (t, d, ly, az, up, fov)
    k = pre + bg('0x000000') + cam + "B.advance(0.05); " + cam + "__bw.renderer.render(__bw.scene,__bw.camera); return 1;"
    w = bg('0xffffff') + "__bw.renderer.render(__bw.scene,__bw.camera); return 1;"
    print(u1_q.run([{'js': k, 'vp': [vp, vp], 'shot': 'p_%s_k' % t, 'frames': 3}, {'js': w, 'shot': 'p_%s_w' % t, 'frames': 3}], timeout=600))
def alpha(t, size=192):
    k = np.asarray(Image.open(f'{OUT}/p_{t}_k.png').convert('RGB'), dtype=np.float32); w = np.asarray(Image.open(f'{OUT}/p_{t}_w.png').convert('RGB'), dtype=np.float32)
    a = 1.0 - np.clip((w - k).mean(axis=2) / 255.0, 0, 1); a = np.clip((a - 0.02) / 0.96, 0, 1)
    if t in GHOST: a = np.clip((a - 0.72) / 0.2, 0, 1)
    F = np.where(a[..., None] > 0.01, k / np.maximum(a[..., None], 0.01), 0.0)
    im = Image.fromarray(np.dstack([np.clip(F, 0, 255), a * 255.0]).astype(np.uint8), 'RGBA').resize((size, size), Image.LANCZOS)
    im.save(f'{OUT}/p_{t}_a.png'); return im
if __name__ == '__main__':
    t = sys.argv[1]; d, ly = float(sys.argv[2]), float(sys.argv[3]); az = float(sys.argv[4]) if len(sys.argv) > 4 else 0.6; up = float(sys.argv[5]) if len(sys.argv) > 5 else 0.3
    shoot(t, d, ly, az, up); im = alpha(t)
    bgim = Image.new('RGBA', im.size, (12, 31, 68, 255)); bgim.alpha_composite(im); bgim.resize((384, 384), Image.LANCZOS).save(f'{OUT}/p_{t}_preview.png'); print('ok', t)
