#!/bin/bash
# dq.sh DIR N "steps (newline separated)" -> waits for DIR/cmd/N.out and prints it
D=$1; N=$2; printf '%s\n' "$3" > $D/cmd/$N.txt
for i in $(seq 1 ${T:-100}); do [ -f $D/cmd/$N.out ] && { cat $D/cmd/$N.out; exit 0; }; sleep 1; done
echo "(still running: $D/cmd/$N.out)"
