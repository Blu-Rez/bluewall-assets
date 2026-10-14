#!/bin/bash
# u3_ports.sh : the two new portraits through the portrait pipeline (dev/s35/port copy in dev/u3_port): daemon -> frozen black / white pair per unit -> alpha -> 192 px WebP -> ONLY the lich / darkrider entries of portraits.js
cd /home/claude/dev/u3_port && rm -f q/* && (python3 pd.py > pd.log 2>&1 &)
for i in $(seq 1 1500); do [ -f q/READY ] && break; sleep 1; done
python3 shoot3.py "${1:-lich,darkrider}" 384 > shoot.log 2>&1
touch q/QUIT; sleep 4
python3 ../u3_mkports.py "${1:-lich,darkrider}" > mk.log 2>&1
echo PORTS_DONE > /home/claude/work/u3/ports.done
