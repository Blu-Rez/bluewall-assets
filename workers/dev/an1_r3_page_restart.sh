#!/bin/bash
# restart the persistent RPC page (kills the old one by pid file)
cd /home/claude/dev
[ -f /tmp/an1_page.pid ] && kill $(cat /tmp/an1_page.pid) 2>/dev/null
sleep 1
rm -f /home/claude/work/an1r3/rpc/*
nohup python3 an1_r3_page.py > /home/claude/work/an1r3/page.log 2>&1 &
echo $! > /tmp/an1_page.pid
