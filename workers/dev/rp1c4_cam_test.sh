#!/bin/bash
# rp1c4_cam_test.sh — RP1C_R4 item 2: the third-person camera over the walkable map (fix OFF vs ON) + the bridge sideways push (QA1-051).  Needs the persistent browser (rp1c2_drv.py, TAG r4t; ~90 s boot).
#   usage: bash dev/rp1c4_cam_test.sh      prints "RP1C_R4_CAM OK" or the failures
D=/home/claude/dev; Q="python3 $D/rp1c2_q.py -t r4t"; FAIL=0; mkdir -p /home/claude/work/r4t
ok(){ echo "OK   $1"; }; bad(){ echo "FAIL $1"; FAIL=1; }
if [ ! -f /home/claude/work/r4t/ready ]; then ( cd $D && W=844 H=390 TAG=r4t URL='rp1_dev.html?q=low&w=clear&h=14&wa=0.1' nohup python3 rp1c2_drv.py > /home/claude/work/r4t/drv.log 2>&1 & ); for i in $(seq 1 120); do [ -f /home/claude/work/r4t/ready ] && break; sleep 5; done; fi
TMO=300 $Q eval "(async()=>{ const h=await window.__rpLoad('?v='+Date.now()); window.__h=h; await h.start('aylin'); return h.active; })()" | grep -q true || bad "hero did not start"
TMO=1500 $Q evalf $D/rp1c4_cam_scan.js > /tmp/rp1c4_cam.out 2>&1
python3 - <<'PY' && ok "camera scan: fix ON < 0.1 % of samples closer than 2.15 m (OFF: see report), nothing new inside a solid" || bad "camera scan"
import json,sys
o=json.loads(open('/tmp/rp1c4_cam.out').read().strip().splitlines()[-1]); print({k:o[k] for k in ('n','offLt','offMin','onLt','onMin','offInside','onInside')})
ok = o['onLt'] <= max(3, o['n']*0.001) and o['onInside'] <= o['offInside'] and o['offLt'] > o['onLt']
sys.exit(0 if ok else 1)
PY
TMO=900 $Q evalf $D/rp1c4_bridge_push.js > /tmp/rp1c4_br.out 2>&1
python3 - <<'PY' && ok "bridges: 3 places x 2 sides x every bridge, 3 s sideways push: never hovering (deck / river by the wade rule / bank)" || bad "bridge push (hover)"
import json,sys
o=json.loads(open('/tmp/rp1c4_br.out').read().strip().splitlines()[-1]); print({k:o[k] for k in ('bridges','runs','sum','bad')}); sys.exit(0 if not o['bad'] and o['runs']>=39 else 1)
PY
[ $FAIL = 0 ] && echo "RP1C_R4_CAM OK" || echo "RP1C_R4_CAM FAILED"; exit $FAIL
