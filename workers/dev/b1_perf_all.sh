#!/bin/bash
# B1 perf before / after (the DoD asks for `python3 dev/p38_perf.py perf 30`): base = shared source without the B1 hook, new = with the hook (flag off), flag = ?b1town=1
cd /home/claude/dev
export VIEWS=${VIEWS:-top,ctr,town}; export SKIPINTRO=1
echo "== BASE"; PAGE=dev_b1base.html python3 b1_perf.py base 30
echo "== NEW (flag off)"; PAGE=dev_b1.html python3 b1_perf.py new 30
echo "== NEW (?b1town=1)"; PAGE=dev_b1.html EXTRA='&b1town=1' SHOT=1 python3 b1_perf.py flag 30
echo PERF_DONE
