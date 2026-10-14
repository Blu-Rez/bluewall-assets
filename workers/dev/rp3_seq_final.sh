#!/bin/bash
# rp3_seq_final.sh — full-game proof for RP3 (needs rp1_drv.py running: W=390 H=844 python3 rp1_drv.py). Walks the hub with the real physics, takes the frames, runs the exit / re-enter leak check.
cd /home/claude/dev; C="python3 rp3_c.py"
$C eval "(() => { const c=__bw.ctl; c.intro=null; __bw.world.setLevel(30); c.target.set(0,0,0); c.dist=190; c.polar=1.08; c.azim=0.95; return 1; })()" | cut -c1-60
$C sleep 4; $C click ".rp-open" | cut -c1-60; $C wait "!!document.querySelector('.rp-pick')" 90 | cut -c1-60; $C sleep 2
$C click ".rp-card[data-k=aylar]" | cut -c1-60; $C wait "!!(window.__rp && __rp.S && __rp.S.hero)" 240 | cut -c1-60
$C eval "(() => { const r = __bw.renderer; window.__base = {prog: r.info.programs.length, geo: r.info.memory.geometries, tex: r.info.memory.textures}; window.__walk = (tx, tz, maxSec = 90, stop = 2.2) => { let t = 0, st = 0, lx = __rp.S.x, lz = __rp.S.z, chk = 2; __rp.S.inp.x = 0; while (t < maxSec) { const S = __rp.S; if (S.where !== 'under') break; const dx = tx - S.x, dz = tz - S.z, d = Math.hypot(dx, dz); if (d < stop) break; S.camYaw = Math.atan2(dx, dz); __rp.setInput(0, 1); __rp.sim(1/30, 1/30); t += 1/30; if (t >= chk) { chk += 2; if (Math.hypot(S.x - lx, S.z - lz) < 0.6) { st++; if (st > 2) { __rp.setInput(0, 0); return {ok: false, why: 'stuck', x: +S.x.toFixed(1), z: +S.z.toFixed(1), t: +t.toFixed(1)}; } } else st = 0; lx = S.x; lz = S.z; } } __rp.setInput(0, 0); const S = __rp.S; return {ok: Math.hypot(tx - S.x, tz - S.z) < stop + 1, where: S.where, x: +S.x.toFixed(1), z: +S.z.toFixed(1), t: +t.toFixed(1)}; }; window.__cnt = () => { const r = __bw.renderer; return JSON.stringify({prog: r.info.programs.length, geo: r.info.memory.geometries, tex: r.info.memory.textures, where: __rp.pos().where}); }; return JSON.stringify(window.__base); })()"
enter() { $C eval "(async () => { __rp.pause(false); __rp.S.cool = 0; await __rp.goUnder(); __rp.pause(true); __rp.S.cool = 99; return __rp.pos().where; })()" | cut -c1-80; $C sleep 8; }
shotlook() { $C eval "(() => { __rp.setLook($1, $2); __rp.sim(0.5); return 1; })()" | cut -c1-40; $C sleep 2; $C shot $3 | cut -c1-70; }
mouth() { n=$1; b=$2; R=${3:-62}
  $C eval "(() => { const rad = $b * Math.PI / 180; return JSON.stringify(__walk(Math.sin(rad) * $R, Math.cos(rad) * $R, 160, 2.0)); })()" | cut -c1-160
  shotlook "$b * Math.PI / 180" 0.1 g_mouth_$n; }
echo "== BASE"; $C eval "__cnt()" | cut -c1-200
echo "== ENTER 1"; enter
$C eval "(() => { __rp.sim(0.4); const r = __bw.renderer; return JSON.stringify({prog: r.info.programs.length, calls: r.info.render.calls, tris: r.info.render.triangles, geo: r.info.memory.geometries, tex: r.info.memory.textures, st: __rp.stats()}); })()" | cut -c1-500
$C sleep 1; $C shot g_under_spawn | cut -c1-70
echo "== CAMP"; $C eval "JSON.stringify(__walk(0, -3, 120, 4.5))" | cut -c1-160; shotlook "Math.atan2(-__rp.S.x, -__rp.S.z)" 0.22 g_under_camp
echo "== BOARD"; $C eval "JSON.stringify(__walk(3.0, -6.8, 60, 1.5))" | cut -c1-160; shotlook "Math.atan2(3.95 - __rp.S.x, -9.55 - __rp.S.z)" 0.1 g_board
for p in "N 0" "NE 45" "E 90" "SE 135" "S 180" "W 270" "NW 315"; do set -- $p; echo "== MOUTH $1"; mouth $1 $2; done
echo "== PORTAL"; $C eval "(() => { const rad = 225 * Math.PI / 180; return JSON.stringify(__walk(Math.sin(rad) * 70, Math.cos(rad) * 70, 160, 2.0)); })()" | cut -c1-160
shotlook "225 * Math.PI / 180" 0.12 g_portal_far
$C eval "(() => { const rad = 225 * Math.PI / 180; return JSON.stringify(__walk(Math.sin(rad) * 86, Math.cos(rad) * 86, 60, 2.0)); })()" | cut -c1-160
shotlook "225 * Math.PI / 180" 0.15 g_portal_stair
echo "== EXIT via the portal"; $C eval "(() => { const P = __rp.S.under.portal; return JSON.stringify({portal: [P.x, P.z, P.y, P.r], walk: __walk(P.x, P.z, 40, 0.6), where: __rp.pos().where}); })()" | cut -c1-300
$C sleep 3; $C eval "(async () => { await new Promise(r => setTimeout(r, 1500)); return __cnt(); })()" | cut -c1-200
$C shot g_home_after_exit | cut -c1-70
echo "== ENTER 2"; enter; $C eval "__cnt()" | cut -c1-200
echo "== EXIT 2 (goHome)"; $C eval "(async () => { await __rp.goHome(); await new Promise(r => setTimeout(r, 1200)); return __cnt(); })()" | cut -c1-200
echo "== ENTER 3"; enter; $C eval "__cnt()" | cut -c1-200
$C eval "(async () => { await __rp.goHome(); await new Promise(r => setTimeout(r, 1200)); return __cnt(); })()" | cut -c1-200
for k in 4 5; do echo "== ENTER $k"; enter; $C eval "__cnt()" | cut -c1-200; echo "== EXIT $k (goHome)"; $C eval "(async () => { await __rp.goHome(); await new Promise(r => setTimeout(r, 1200)); return __cnt(); })()" | cut -c1-200; done
$C logs | cut -c1-900
echo SEQ_DONE
