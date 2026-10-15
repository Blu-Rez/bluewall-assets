#!/bin/bash
# ST1 baseline runs (?st1=0 = the stores / vaults / crystal exactly as before ST1), one browser job at a time
cd /home/claude/dev
export CLOSE=1 SETTLE=8 VIEWS=top,ctr,town
URLQ="st1=0" python3 st1_shots.py before_lv30 30 > /home/claude/work/st1/p_before_lv30.log 2>&1
URLQ="st1=0" python3 st1_shots.py before_lv50 50 > /home/claude/work/st1/p_before_lv50.log 2>&1
echo DONE > /home/claude/work/st1/p_before_done.txt
