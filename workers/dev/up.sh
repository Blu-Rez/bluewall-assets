#!/bin/bash
# static server for the dev pages: http://127.0.0.1:8777/dev.html
curl -s -o /dev/null -m 2 http://127.0.0.1:8777/ || (cd /home/claude/dev && nohup python3 -m http.server 8777 --bind 127.0.0.1 > /tmp/srv8777.log 2>&1 &)
sleep 1
