#!/bin/bash
# ST1_R2 glow-strength looks (night, lv30): ?st1g=1 subtle / 2 medium (default) / 3 rich — the quarter, a vault close-up and a mine close-up
export PLAYWRIGHT_BROWSERS_PATH=${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers}
cd /home/claude/dev
for L in ${LOOKS:-1 3 2}; do
  URLQ="st1g=$L" HOUR=22 VIEWS=quarter_near CLOSE=1 ONLY=vault_ruby,vault_emerald,mine_ruby SETTLE=6 python3 st1r2_shots.py look${L}_night_lv30 30 > /home/claude/work/st1r2/look$L.log 2>&1
done
echo DONE > /home/claude/work/st1r2/looks_done.txt
