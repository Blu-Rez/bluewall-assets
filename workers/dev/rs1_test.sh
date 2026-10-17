#!/usr/bin/env bash
# rs1_test.sh — RS1: the node parts always; the two browser parts when the persistent browser is up (start:  cd /home/claude/dev && TAG=rs1 W=844 H=390 python3 rp1c2_drv.py &   — ~100 s until work/rs1/ready).
#   last line:  RS1 OK   (browser parts skipped = «RS1 OK (node only)»)
cd /home/claude/dev || exit 1; fail=0
node rs1_node.mjs | tail -1 | grep -q 'RS1_NODE OK' && echo "ok   rs1_node" || { echo "FAIL rs1_node"; fail=1; }
node rp1c4_info_node.mjs | tail -1 | grep -q 'INFO_NODE OK' && echo "ok   rp1c4_info_node (the hero's «i» text: no metres in the hands lines)" || { echo "FAIL rp1c4_info_node"; fail=1; }
if [ -f /home/claude/work/rs1/ready ]; then
  for f in rs1_a_page.js rs1_b_page.js; do
    r=$(TMO=3000 python3 rp1c2_q.py -t rs1 evalf $f) || { echo "FAIL $f (no answer)"; fail=1; continue; }
    echo "$r" | python3 -c "import sys,json; d=json.loads(json.loads(sys.stdin.read())); print('ok  ' if d['ok'] else 'FAIL', '$f', '' if d['ok'] else d['fails'])" | tee /tmp/_rs1_line; grep -q '^ok' /tmp/_rs1_line || fail=1
  done; tail=""
else tail=" (node only)"; fi
[ $fail = 0 ] && echo "RS1 OK$tail" || echo "RS1 FAIL"
