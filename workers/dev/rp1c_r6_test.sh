#!/bin/bash
# rp1c_r6_test.sh — RP1C_R6: (1) the hero-mode default third-person camera farther back / higher / pitched down, with a squeeze search (no top-down views, nothing inside a solid, no pops), (2) the jump (hop camera, landing).  Prints "RP1C_R6 OK" or the failures.
#   usage: bash dev/rp1c_r6_test.sh [page]
#   default (seconds, no browser): rpg.js parses; look B = CAM_B (5.6 x HC, pitch 0.28 rad); the kit camera (placeCameraOld, CAM_MIN / CAM_RISE) is still there for camKit; the RP1C_R6 lines are marked; no dev override left; the face-rule node sweep; only rpg.js (+ dev tests) differs from the kit
#   with «page» (~12 min incl. ~100 s browser boot; run it WITHOUT a pipe: the persistent browser it starts keeps stdout open; kill it afterwards with work/kill_drv.sh in its own call;  software GL, nothing else running; the persistent browser rp1c2_drv.py, TAG r6t, is started if it is not up):
#      camera scan (10 456 spots x 4 headings, hero set inside a solid skipped): inside a solid 0, closer than 2.15 m 0, view steeper than 50 deg < 0.6 %, mean distance >= 5.5 m (kit: 4.7)
#      dynamic walk / run / back into a wall / camera turns (7 680 frames at 60 fps): camera inside a solid 0, 1-frame jumps > 0.3 m <= 6 (kit: 46)
#      jump (standing + running at 60 / 30 / 20 fps): take-off in the first frame, apex 0.55..0.62 m, air 0.64..0.72 s, soles never 3 cm under the ground while standing, camera height range <= 0.30 m (kit: 0.53)
D=/home/claude/dev; R=/home/claude/bot/bluebot_v2; A=$R/bluewall/web/assets/rpg; FAIL=0
ok(){ echo "OK   $1"; }; bad(){ echo "FAIL $1"; FAIL=1; }
node --input-type=module --check < $A/rpg.js 2>/tmp/rp1c_r6_syn.log && ok "rpg.js parses" || { bad "rpg.js does not parse"; head -3 /tmp/rp1c_r6_syn.log; }
grep -q "^const CAM_B = { far: 5.6, pit: 0.28 };" $A/rpg.js && ok "CAM_B = 5.6 x HC (6.3 m), pitch 0.28 rad" || bad "CAM_B is not { far: 5.6, pit: 0.28 }"
grep -q "{ get D() { return CAM_B.far; }, ndc: 0.30, py: 0.95, get pit() { return CAM_B.pit; } }" $A/rpg.js && ok "look B (the default) reads CAM_B" || bad "look B does not read CAM_B"
grep -q "{ D: 3.6, sh: 0.55, py: 1.45, pit: 0.2 }" $A/rpg.js && grep -q "{ D: 4.8, ndc: 0.12, py: 1.62, pit: 0.4 }" $A/rpg.js && ok "looks A (3.6) and C (4.8) unchanged" || bad "look A / C changed"
grep -q "^const CAM_MIN = 3.0, CAM_RISE = 3.2;" $A/rpg.js && grep -q "function placeCameraOld" $A/rpg.js && grep -q "camKit" $A/rpg.js && ok "the kit camera (CAM_MIN / CAM_RISE, placeCameraOld, dev.camKit) is still there for the wall-walk / climb / underworld and for before / after numbers" || bad "kit camera missing"
N=$(grep -c "RP1C_R6" $A/rpg.js); [ "$N" -ge 15 ] && [ "$N" -le 60 ] && ok "rpg.js: $N lines marked RP1C_R6 (15..60)" || bad "rpg.js has $N RP1C_R6 lines (expected 15..60)"
grep -q "r6force" $A/rpg.js && bad "the r6force dev override is still in rpg.js" || ok "no temporary dev override (r6force) left"
if grep -nE "'[^']*\b(bot|ربات)\b[^']*'|\"[^\"]*\b(bot|ربات)\b[^\"]*\"" $A/rpg.js | grep -v "^[0-9]*:\s*//" | grep -q .; then bad "the word «bot» in a game string"; else ok "no «bot» word in the game strings"; fi
if grep -nE "(sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|BEGIN (RSA |OPENSSH )?PRIVATE KEY)" $A/rpg.js | grep -q .; then bad "a secret-looking string"; else ok "no secret-looking string"; fi
DF=$( cd $R && { git diff --name-only HEAD; git ls-files --others --exclude-standard; } | grep -v "^bluewall/web/app/" | sort -u )
BADF=$(echo "$DF" | grep -vE "^bluewall/web/assets/rpg/rpg\.js$|^workers/dev/" | grep .)
[ -z "$BADF" ] && ok "only rpg.js differs from the kit (web/app/* = the build, not in the patch)" || bad "files outside the allowed set differ: $BADF"
( node $D/rp1c2_face.mjs 2>&1 | tail -1 | grep -q "FACE_NODE OK" ) && ok "face rule node sweep (hard 70° / lean 30°, body <= 55°)" || bad "face rule node sweep"
if [ "$1" = page ]; then
  Q="python3 $D/rp1c2_q.py -t r6t"; mkdir -p /home/claude/work/r6t
  if [ ! -f /home/claude/work/r6t/ready ]; then ( cd $D && W=844 H=390 TAG=r6t URL='rp1_dev.html?q=low&w=clear&h=14&wa=0.1' nohup python3 rp1c2_drv.py > /home/claude/work/r6t/drv.log 2>&1 & ); for i in $(seq 1 120); do [ -f /home/claude/work/r6t/ready ] && break; sleep 5; done; fi
  TMO=300 $Q eval "(async()=>{ const h=await window.__rpLoad('?v='+Date.now()); window.__h=h; await h.start('aylin'); window.__scanStep=12; return h.active; })()" | grep -q true || bad "hero did not start"
  TMO=3000 $Q evalf $D/rp1c_r6_scan.js > /tmp/rp1c_r6_scan.out 2>&1
  python3 - <<'PY' && ok "camera scan: inside 0, < 2.15 m 0, steeper than 50° < 0.6 %, mean distance >= 5.5 m" || bad "camera scan"
import json,sys
o=json.loads(open('/tmp/rp1c_r6_scan.out').read().strip().splitlines()[-1]); o=json.loads(o) if isinstance(o,str) else o
print({k:o[k] for k in ('n','heroIn','inside','closer','el','d3','headOut')})
sys.exit(0 if o['inside']==0 and o['closer']['lt2_15']==0 and o['el']['gt50']<0.006*o['n'] and o['d3']['mean']>=5.5 and o['headOut']==0 else 1)
PY
  TMO=1800 $Q evalf $D/rp1c_r6_dyn.js > /tmp/rp1c_r6_dyn.out 2>&1
  python3 - <<'PY' && ok "dynamic: 7 680 frames, camera inside a solid 0, 1-frame jumps > 0.3 m <= 6" || bad "dynamic camera test"
import json,sys
o=json.loads(open('/tmp/rp1c_r6_dyn.out').read().strip().splitlines()[-1]); o=json.loads(o) if isinstance(o,str) else o
t=o['total']; print(t); sys.exit(0 if t['inside']==0 and t['pop03']<=6 else 1)
PY
  RES=1
  for run in 0 1; do for fps in 60 30 20; do
    $Q eval "window.__R6J={x:40.95,z:21.98,yaw:-2.17,run:$run,fps:$fps,secs:1.8}; 1" > /dev/null; TMO=600 $Q evalf $D/rp1c_r6_jump.js > /tmp/rp1c_r6_j_${run}_${fps}.out 2>&1
  done; done
  python3 - <<'PY' && ok "jump: 2 x 3 runs (standing / running x 60 / 30 / 20 fps): take-off at once, apex 0.55..0.62 m, air 0.64..0.72 s, camera height range <= 0.30 m" || bad "jump"
import json,sys
bad=0
for run in (0,1):
  for fps in (60,30,20):
    o=json.loads(open('/tmp/rp1c_r6_j_%d_%d.out'%(run,fps)).read().strip().splitlines()[-1]); o=json.loads(o) if isinstance(o,str) else o; s=o['sum']
    ok = s['takeoffT'] <= 1.5/fps and 0.55 <= s['apexH'] <= 0.62 and 0.64 <= s['airT'] <= 0.72 and s['camAbsRange'] <= 0.30 and (run==1 or s['solePenGrounded'] <= 0.03)
    print(run,fps,{k:s[k] for k in ('takeoffT','apexH','airT','camAbsRange','solePenGrounded')}, 'ok' if ok else 'BAD'); bad += (not ok)
sys.exit(1 if bad else 0)
PY
fi
[ $FAIL = 0 ] && echo "RP1C_R6 OK" || echo "RP1C_R6 FAILED"; exit $FAIL
