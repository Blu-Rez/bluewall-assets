#!/bin/bash
# bg.sh NAME cmd... : run a command in the background, log to /home/claude/dev/fly/logs/NAME.log, pid to NAME.pid
mkdir -p /home/claude/dev/fly/logs; N=$1; shift
nohup "$@" > /home/claude/dev/fly/logs/$N.log 2>&1 &
echo $! > /home/claude/dev/fly/logs/$N.pid; echo started $N pid $(cat /home/claude/dev/fly/logs/$N.pid)
