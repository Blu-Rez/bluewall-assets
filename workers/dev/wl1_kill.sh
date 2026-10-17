#!/bin/bash
# WL1: stop a running wl1_shot.py and its headless browser (kept in a file so the pattern is not in the caller's own command line)
ps aux | grep -E "[w]l1_shot.py|[h]eadless_shell|[c]hrome" | awk '{print $2}' | xargs -r kill
sleep 2
ps aux | grep -E "[w]l1_shot.py|[h]eadless_shell" | wc -l
