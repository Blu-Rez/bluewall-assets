#!/bin/bash
# long-lived headless chromium with a debugging port, so driver scripts can reconnect to the SAME loaded game (no 90 s reload per iteration)
nohup /opt/pw-browsers/chromium-1194/chrome-linux/chrome --headless=new --no-sandbox --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist \
  --remote-debugging-port=9222 --user-data-dir=/tmp/ui1r2_prof --window-size=390,844 --force-device-scale-factor=1 about:blank > ${OUT:-/tmp}/ui1r2_chrome.log 2>&1 &
sleep 3; curl -s http://127.0.0.1:9222/json/version | head -3
