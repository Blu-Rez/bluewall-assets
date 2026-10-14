#!/bin/bash
# ld_run.sh <jobs.json> <log> : queue a batch render in the background (one semaphore slot); poll the log for 'BATCH DONE'
cd /home/claude/dev/ld_art
nohup env SEM_TIMEOUT=1500 bash /home/claude/dev/sem.sh python3 ld_batch.py "$1" > "$2" 2>&1 &
echo queued
