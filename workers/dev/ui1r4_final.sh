#!/bin/bash
# ui1r4_final.sh — BEFORE census (kit as started) then the AFTER proof run (dev/ui1_menus_test.sh, full).  Logs: /tmp/ui1r4_final_*.log
cd /home/claude/dev
python3 ui1r2_load.py r4before > /tmp/ui1r4_final_load.log 2>&1
OUT=/home/claude/work/ui1r4/ python3 ui1r4_census.py r4before before3 '^(?!sheet_)' 844x390,800x360,932x430 > /tmp/ui1r4_final_before.log 2>&1
OUT=/home/claude/work/ui1r4/ python3 ui1r4_sheets.py r4before before3s '^sheet_(barracks|stable|workshop|lair|keep)$' 844x390,800x360,932x430 > /tmp/ui1r4_final_before_sheets.log 2>&1
bash ui1_menus_test.sh > /tmp/ui1r4_final_after.log 2>&1
echo FINISHED >> /tmp/ui1r4_final_after.log
