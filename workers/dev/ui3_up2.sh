#!/bin/bash
# ui3_up2.sh — UI3: a SECOND headless chromium on CDP :9223 for the light rig (so the slow full-game census on :9222 does not starve it).  Use:  CDPPORT=9223 python3 ui3_rig_load.py ; CDPPORT=9223 python3 ui3_hud.py rig out
curl -s http://127.0.0.1:9223/json/version >/dev/null && { echo up; exit 0; }
nohup /opt/pw-browsers/chromium-1194/chrome-linux/chrome --headless=new --no-sandbox --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist --remote-debugging-port=9223 --user-data-dir=/tmp/ui3_rig_prof --window-size=844,390 --force-device-scale-factor=1 about:blank >/tmp/ui3_up2.log 2>&1 &
sleep 3; echo started
