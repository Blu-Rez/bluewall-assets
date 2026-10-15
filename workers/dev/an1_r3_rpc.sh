#!/bin/bash
# usage: an1_r3_rpc.sh <name> < js   — writes the JS into the rpc dir, waits for the answer, prints it  (AN1_RPC=dir)
R=${AN1_RPC:-/home/claude/work/an1r3/rpc}; N=$(date +%s%N | cut -c4-16)_$1; cat > $R/$N.js
for i in $(seq 1 ${AN1_WAIT:-600}); do [ -f $R/$N.out.json ] && break; sleep 0.5; done
sleep 0.5; cat $R/$N.out.json 2>/dev/null || echo '{"ok":false,"error":"timeout"}'
