#!/bin/bash
# ST1_R3: the FINAL after-frames (one bundle, dev/app_r3), one browser job at a time: day (+ checks), dusk, night (+ S01 gate for QA1-012)
cd /home/claude
python3 dev/qa1_walk_r3.py --tag r3c_day --hour 12.5 --stations 6-15 --checks > /tmp/walk_r3c_day.log 2>&1
python3 dev/qa1_walk_r3.py --tag r3c_dusk --hour 18.3 --stations 6-15 > /tmp/walk_r3c_dusk.log 2>&1
python3 dev/qa1_walk_r3.py --tag r3c_night --hour 23 --stations 1,6-15 > /tmp/walk_r3c_night.log 2>&1
echo CHAIN_DONE > /tmp/st1r3_chain3.done
