#!/bin/bash
# the three vaults again (the crown gem raised over the Tripo hall), after the perf runs
cd /home/claude/dev
while [ ! -f /home/claude/work/st1/p_perf_done.txt ]; do sleep 5; done
CLOSE=1 SETTLE=8 VIEWS= ONLY=quarter_free,vault_ruby,vault_emerald,vault_turq python3 st1_shots.py vaults_lv30 30 > /home/claude/work/st1/p_vaults.log 2>&1
echo DONE > /home/claude/work/st1/p_vaults_done.txt
