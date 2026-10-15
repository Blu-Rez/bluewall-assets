#!/bin/bash
# ST1 proof runs, one browser job at a time: after (default look) / before (?st1=0) at lv30 + lv50, then night
cd /home/claude/dev
export CLOSE=1 SETTLE=8 VIEWS=top,ctr,town
python3 st1_shots.py after_lv30 30 > /home/claude/work/st1/p_after_lv30.log 2>&1
URLQ="st1=0" python3 st1_shots.py before_lv30 30 > /home/claude/work/st1/p_before_lv30.log 2>&1
python3 st1_shots.py after_lv50 50 > /home/claude/work/st1/p_after_lv50.log 2>&1
URLQ="st1=0" python3 st1_shots.py before_lv50 50 > /home/claude/work/st1/p_before_lv50.log 2>&1
HOUR=22 VIEWS=ctr ONLY=quarter_free,vault_ruby,vault_emerald,store_gold,crystal python3 st1_shots.py night_lv30 30 > /home/claude/work/st1/p_night.log 2>&1
echo ALLDONE > /home/claude/work/st1/p_done.txt
