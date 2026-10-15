#!/bin/bash
# ui1r4_before3q.sh — BEFORE (kit as started, page r4before) with a LONG queue (8 entries): the state in which the queue chips of the unit sheets were cut off sideways.  Results: work/ui1r4/before4q
cd /home/claude/dev
for i in 1 2 3; do python3 ui1r4_queue.py r4before >> /tmp/ui1r4_b3_queue.log 2>&1; done
OUT=/home/claude/work/ui1r4/ python3 ui1r4_sheets.py r4before before4q '^sheet_(barracks|training|stable|workshop|lair)$' 844x390,800x360,932x430 > /tmp/ui1r4_b3_sheets.log 2>&1
echo FINISHED > /tmp/ui1r4_b3_done.log
