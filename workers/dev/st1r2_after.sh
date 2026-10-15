#!/bin/bash
# ST1_R2 final frames of the new build (default look 2), one browser at a time: the same views / hours / levels as the baseline
export PLAYWRIGHT_BROWSERS_PATH=${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}
cd /home/claude/dev
export CLOSE=1 SETTLE=8 VIEWS=map,quarter,quarter_near
for LV in 30 50; do
  HOUR=22   python3 st1r2_shots.py after_night_lv$LV $LV > /home/claude/work/st1r2/a_night_lv$LV.log 2>&1
  HOUR=13   python3 st1r2_shots.py after_day_lv$LV   $LV > /home/claude/work/st1r2/a_day_lv$LV.log 2>&1
  HOUR=18.8 python3 st1r2_shots.py after_dusk_lv$LV  $LV > /home/claude/work/st1r2/a_dusk_lv$LV.log 2>&1
done
echo DONE > /home/claude/work/st1r2/a_done.txt
