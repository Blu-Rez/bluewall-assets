#!/bin/bash
# ST1 "after" runs with the default look (auto: look 3 = the owner's storage_* Tripo halls), one browser job at a time, started when the baseline runs are done
cd /home/claude/dev
while [ ! -f /home/claude/work/st1/p_before_done.txt ]; do sleep 5; done
export CLOSE=1 SETTLE=8 VIEWS=top,ctr,town
python3 st1_shots.py after_lv30 30 > /home/claude/work/st1/p_after_lv30.log 2>&1
ONLY=quarter_free,store_wood,store_gold,vault_ruby,crystal python3 st1_shots.py after_lv50 50 > /home/claude/work/st1/p_after_lv50.log 2>&1
HOUR=22 VIEWS=ctr ONLY=quarter_free,vault_ruby,vault_emerald,store_gold,crystal python3 st1_shots.py night_lv30 30 > /home/claude/work/st1/p_night.log 2>&1
echo DONE > /home/claude/work/st1/p_after_done.txt
