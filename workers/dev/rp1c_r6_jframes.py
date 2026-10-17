#!/usr/bin/env python3
# rp1c_r6_jframes.py — RP1C_R6: the jump as FRAMES: for each time t (s after the key press) the real game camera (844x390) and a fixed SIDE camera (crop 330x390, no HUD: the renderer's canvas only) at the same instant.
#   usage: rp1c_r6_jframes.py TAG NAME run(0|1) "t1,t2,..." [x,z,yaw]     -> /home/claude/work/TAG/jf/NAME_<ms>_cam.png and NAME_<ms>_side.png
import sys, subprocess, json, os, base64, time
tag, name, run, ts = sys.argv[1], sys.argv[2], int(sys.argv[3]), [float(x) for x in sys.argv[4].split(',')]
SPOT = (sys.argv[5] if len(sys.argv) > 5 else '40.95,21.98,-2.17').split(',')
OUT = '/home/claude/work/%s/jf' % tag; os.makedirs(OUT, exist_ok=True)
def q(*a, tmo=900):
    env = dict(os.environ, TMO=str(tmo)); r = subprocess.run(['python3', '/home/claude/dev/rp1c2_q.py', '-t', tag] + list(a), capture_output=True, text=True, env=env); return r.stdout.strip()
JS = r'''
(() => {
  const B = __bw, rp = __rp, S = rp.S, cam = B.camera, T = B.THREE;
  const png = (crop) => { const rnd = B.renderer, cv = rnd.domElement; B.scene.updateMatrixWorld(true); rnd.render(B.scene, cam); const o = document.createElement('canvas'); const w = crop ? 330 : 844; o.width = w; o.height = 390; o.getContext('2d').drawImage(cv, crop ? (844 - 330) / 2 : 0, 0, w, 390, 0, 0, w, 390); return o.toDataURL('image/png'); };
  window.__r6j = { t: 0, yaw: 0, g0: 0,
    init(x, z, yaw, run) { rp.pause(true); S.cool = 99; S.sheetOn = false; rp.contact({ rigid: true, rib: true }); rp.footOn(true); rp.setPos(x, z, yaw); rp.sprint(false); rp.setInput(0, run ? 1 : 0); rp.sim(1.5, 1 / 60); this.t = 0; this.yaw = yaw; this.g0 = rp.ground(S.x, S.z);
      const rnd = B.renderer; rnd.setPixelRatio(1); rnd.setSize(844, 390, false); cam.aspect = 844 / 390; cam.updateProjectionMatrix(); rp.jump(); return 'ok'; },
    to(t) { while (this.t < t - 1e-6) { const st = Math.min(1 / 60, t - this.t); rp.sim(st, st); this.t += st; } return JSON.stringify({ t: +this.t.toFixed(3), st: S.st, h: +(S.y - rp.ground(S.x, S.z)).toFixed(3), w: S.hero.acts && S.hero.acts.jump ? +S.hero.acts.jump.w.toFixed(2) : null }); },
    cam() { return png(false); },
    side() { const p = cam.position.clone(), q = cam.quaternion.clone(), fx = Math.sin(this.yaw), fz = Math.cos(this.yaw); cam.position.set(S.x + fz * 3.6, this.g0 + 1.2, S.z - fx * 3.6); cam.lookAt(S.x, this.g0 + 1.2, S.z); cam.updateMatrixWorld(); const r = png(true); cam.position.copy(p); cam.quaternion.copy(q); cam.updateMatrixWorld(); return r; },
    end() { rp.setInput(0, 0); rp.pause(false); return 'done'; } };
  return 1;
})()
'''
def save(du, path):
    d = json.loads(du) if du.startswith('"') else du; open(path, 'wb').write(base64.b64decode(d.split(',', 1)[1]))
q('eval', JS); print('init', q('eval', 'window.__r6j.init(%s,%s,%s,%d)' % (SPOT[0], SPOT[1], SPOT[2], run)))
for t in ts:
    print(t, q('eval', 'window.__r6j.to(%f)' % t)); ms = round(t * 1000)
    save(q('eval', 'window.__r6j.cam()'), '%s/%s_%04d_cam.png' % (OUT, name, ms)); save(q('eval', 'window.__r6j.side()'), '%s/%s_%04d_side.png' % (OUT, name, ms))
print(q('eval', 'window.__r6j.end()'))
