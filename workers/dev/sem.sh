#!/bin/bash
# sem.sh <cmd...> : run a browser/screenshot job with at most 2 running machine-wide (this box has 2 CPUs).
# Every agent wraps EVERY playwright/chromium run in it:  bash /home/claude/dev/sem.sh python3 shot.py ...
while true; do
  for i in 1 2; do
    exec 9>/tmp/bw_sem_$i.lock
    if flock -n 9; then timeout ${SEM_TIMEOUT:-900} "$@"; exit $?; fi
  done
  sleep 2
done
