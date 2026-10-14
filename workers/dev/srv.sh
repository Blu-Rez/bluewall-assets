#!/bin/bash
# srv.sh start|stop : test server (memory state, stub config) on 8591
PIDF=/tmp/bw8591.pid
if [ "$1" = stop ]; then [ -f $PIDF ] && kill $(cat $PIDF) 2>/dev/null; rm -f $PIDF; exit 0; fi
[ -f $PIDF ] && kill $(cat $PIDF) 2>/dev/null; sleep 1
cd /home/claude/bot/bluebot_v2
PYTHONPATH=/home/claude/dev/stubcfg BLUEWALL_STATE=memory nohup python3 -m bluewall > /tmp/bw8591.log 2>&1 &
echo $! > $PIDF; sleep 3; tail -1 /tmp/bw8591.log
