#!/usr/bin/env bash
# rs2_test.sh — RS2: the node parts always (+ the RS1 ones); the browser parts when the persistent browser is up
#   (start:  cd /home/claude/dev && TAG=rs2 W=844 H=390 python3 rp1c2_drv.py &   — ~100 s until work/rs2/ready).   last line:  RS2 OK   (browser parts skipped = «RS2 OK (node only)»)
cd /home/claude/dev || exit 1; fail=0
node rs2_node.mjs | tail -1 | grep -q 'RS2_NODE OK' && echo "ok   rs2_node (face crop / fan slots / entrance curve / texts)" || { echo "FAIL rs2_node"; fail=1; }
node rs1_node.mjs | tail -1 | grep -q 'RS1_NODE OK' && echo "ok   rs1_node (Stage B rules, prefs)" || { echo "FAIL rs1_node"; fail=1; }
if [ -f /home/claude/work/rs2/ready ]; then
  for f in rs2_page.js rs1_a_page.js rs1_b_page.js; do
    r=$(TMO=3000 python3 rp1c2_q.py -t rs2 evalf $f) || { echo "FAIL $f (no answer)"; fail=1; continue; }
    echo "$r" | python3 -c "import sys,json; d=json.loads(json.loads(sys.stdin.read())); print('ok  ' if d['ok'] else 'FAIL', '$f', '' if d['ok'] else d['fails'])" | tee /tmp/_rs2_line; grep -q '^ok' /tmp/_rs2_line || fail=1
  done; tail=""
else tail=" (node only)"; fi
[ $fail = 0 ] && echo "RS2 OK$tail" || echo "RS2 FAIL"
