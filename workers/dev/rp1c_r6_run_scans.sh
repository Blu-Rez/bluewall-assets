#!/bin/bash
# rp1c_r6_run_scans.sh TAG OUTPREFIX — start the hero (fresh module), run the R6 camera scan with the NEW camera and with the kit's (camKit), results in OUTPREFIX_new.json / OUTPREFIX_kit.json
TAG=${1:-r6}; OUT=${2:-/tmp/r6_scan}; D=/home/claude/dev; Q="python3 $D/rp1c2_q.py -t $TAG"
until [ -f /home/claude/work/$TAG/ready ]; do sleep 3; done
TMO=300 $Q eval "(async()=>{ const h=await window.__rpLoad('?v='+Date.now()); window.__h=h; await h.start('aylin'); window.__scanStep=12; return h.active; })()"
TMO=3000 $Q evalf $D/rp1c_r6_scan.js > ${OUT}_new.json 2>&1
$Q eval "window.__h.dev.camKit(true)" > /dev/null
TMO=3000 $Q evalf $D/rp1c_r6_scan.js > ${OUT}_kit.json 2>&1
$Q eval "window.__h.dev.camKit(false)" > /dev/null
echo done > ${OUT}_done
