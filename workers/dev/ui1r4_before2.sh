#!/bin/bash
# ui1r4_before2.sh — BEFORE re-measure with the FINAL probe on the kit as started (page ui1r2_r4before.html, built before any edit): the hero picker / old info card / welcome card (the earlier BEFORE run had the picker left open over the old card) and the six sheets with unit chips, queue filled.  Results: work/ui1r4/before4 (census) and before4s (sheets).
cd /home/claude/dev
for id in $(curl -s http://127.0.0.1:9222/json/list | python3 -c "import sys,json; [print(t['id']) for t in json.load(sys.stdin) if t['type']=='page']"); do curl -s http://127.0.0.1:9222/json/close/$id >/dev/null; done
python3 ui1r2_load.py r4before > /tmp/ui1r4_b2_load.log 2>&1
OUT=/home/claude/work/ui1r4/ python3 ui1r4_census.py r4before before4 '^(hero_picker|old_info_card|welcome_card)$' 844x390,800x360,932x430 > /tmp/ui1r4_b2_census.log 2>&1
python3 ui1r4_queue.py r4before > /tmp/ui1r4_b2_queue.log 2>&1
OUT=/home/claude/work/ui1r4/ python3 ui1r4_sheets.py r4before before4s '^sheet_(keep|barracks|training|stable|workshop|lair)$' 844x390,800x360,932x430 > /tmp/ui1r4_b2_sheets.log 2>&1
echo FINISHED > /tmp/ui1r4_b2_done.log
