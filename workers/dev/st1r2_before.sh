#!/bin/bash
# ST1_R2 baseline frames from the untouched kit bundle (dev_s35_before.html -> app_before/wall.js), one browser at a time
export PLAYWRIGHT_BROWSERS_PATH=${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}
cd /home/claude/dev
export PAGE=dev_s35_before.html CLOSE=1 SETTLE=8 VIEWS=map,quarter,quarter_near
for LV in 30 50; do
  HOUR=22   python3 st1r2_shots.py before_night_lv$LV $LV > /home/claude/work/st1r2/b_night_lv$LV.log 2>&1
  HOUR=13   python3 st1r2_shots.py before_day_lv$LV   $LV > /home/claude/work/st1r2/b_day_lv$LV.log 2>&1
  HOUR=18.8 python3 st1r2_shots.py before_dusk_lv$LV  $LV > /home/claude/work/st1r2/b_dusk_lv$LV.log 2>&1
done
echo DONE > /home/claude/work/st1r2/b_done.txt
