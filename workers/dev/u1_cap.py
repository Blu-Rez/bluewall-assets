import sys, json
sys.path.insert(0, '/home/claude/dev')
import u1_q
# u1_cap.py helpers for the battle daemon (u1_gd.py): the loop is paused, the sim is stepped with battle.advance (no rendering), then ONE frame is drawn and shot.
PRE = """const B=__bw.battle, S=B.session, sim=S.sim; __bw.pause(true);
const V=(u)=>S.views.views.get(u.id); const alive=(ty)=>sim.units.filter(u=>u.type===ty&&!u.dead);
const stOf=(u)=>{ const v=V(u); return v? (v.dead?'dead':v.state):'?'; };
const focus=(u,d,az)=>{ S.cam.tx=u.x; S.cam.tz=u.z; if(d) S.cam.dist=d; if(az!=null) S.cam.az=az; };
const draw=(k=3)=>{ S.confirming=true; for(let i=0;i<k;i++) B.frame(performance.now(), 0.4); __bw.renderer.render(__bw.scene, __bw.camera); };
const summary=()=>{ const o={}; for(const ty of ['legionary','captain']){ const c={}; for(const u of sim.units){ if(u.type!==ty) continue; const s=stOf(u); c[s]=(c[s]||0)+1; } o[ty]=c; } return o; };
const cam=(x,y,z,d,az,el,ly=1.6,fov=null)=>{ S.cam.free=true; const c=__bw.camera; if(fov){ c.fov=fov; c.updateProjectionMatrix(); } c.position.set(x+Math.sin(az)*Math.cos(el)*d, y+Math.sin(el)*d+ly, z+Math.cos(az)*Math.cos(el)*d); c.lookAt(x,y+ly,z); c.updateMatrixWorld(true); };
const gy=(x,z)=>__bw.world.fastHeight(x,z);
const shotcam=(x,z,d,az,el,ly,fov)=>{ cam(x,gy(x,z),z,d,az,el,ly,fov); S.confirming=true; S.views.update(S.t, 0.001, __bw.camera); S.views.update(S.t, 0.001, __bw.camera); __bw.renderer.render(__bw.scene,__bw.camera); };
const gamecam=(x,z,d,az)=>{ S.cam.free=false; Object.assign(S.cam,{tx:x,tz:z,dist:d,az:az}); draw(8); };
"""
def js(body): return PRE + body
SIDE = """const side=(u,d,el,ly,fov,off=1.45)=>{ let foe=null,bd=1e9; if(u.target&&u.target.x!=null&&!u.target.dead){ foe=u.target; bd=Math.hypot(foe.x-u.x,foe.z-u.z); } else for(const q of sim.defenders){ if(q.dead) continue; const dd=Math.hypot(q.x-u.x,q.z-u.z); if(dd<bd){bd=dd;foe=q;} } const ok=foe&&bd<14; const br=ok?Math.atan2(foe.x-u.x,foe.z-u.z):u.face; const mx=ok?(u.x+foe.x)/2:u.x, mz=ok?(u.z+foe.z)/2:u.z; shotcam(mx,mz,d,br+off,el,ly,fov); return {bd:+bd.toFixed(1), foe:foe&&foe.kind, st:stOf(u), pos:[u.x|0,u.z|0]}; };
"""
def jss(body): return PRE + SIDE + body

def advance(sec, step=0.1): return js("let t=0; while(t<%s && !sim.over){ B.advance(%s); t+=%s; } return {time:+sim.time.toFixed(1), sum:summary()};" % (sec, step, step))
def until(ty, state, maxsec, extra='', step=0.05, minN=1):
    # advance until >=minN units of `ty` are in `state`; returns the unit; camera is focused on it
    return js("""let t=0, hit=null; while(t<%s && !sim.over){ B.advance(%s); t+=%s; const L=sim.units.filter(u=>u.type==='%s' && stOf(u)==='%s'); if(L.length>=%d){ hit=L[0]; break; } }
if(hit){ %s } return {time:+sim.time.toFixed(1), found:!!hit, sum:summary(), pos:hit?[hit.x|0,hit.z|0]:null};""" % (maxsec, step, step, ty, state, minN, extra))
def shot(name, jsbody, vp=None, frames=3):
    j = {'js': jsbody, 'shot': name, 'frames': frames}
    if vp: j['vp'] = vp
    return j
def run(jobs, timeout=900): return u1_q.run(jobs, timeout)
