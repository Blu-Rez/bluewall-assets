#!/bin/bash
# ui3_rig_build.sh — builds dev/ui3_rig.js (the REAL strategic UI modules + the real Econ, no world) into dev/app_ui1r2_rig/wall.js and the page dev/ui1r2_rig.html.   Then: python3 dev/ui3_rig_load.py   (seconds)
set -e
cd /home/claude/bot/bluebot_v2/bluewall/client
mkdir -p /home/claude/dev/app_ui1r2_rig
npx esbuild /home/claude/dev/ui3_rig.js --bundle --format=iife --target=es2020 --define:__BUILD__=\"1\" --legal-comments=none --log-level=warning --outfile=/home/claude/dev/app_ui1r2_rig/wall.js
cat > /home/claude/dev/ui1r2_rig.html <<'HTML'
<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
@font-face{font-family:Vazirmatn;src:url(/pub/Vazirmatn-Regular.woff2) format("woff2");font-weight:400}
@font-face{font-family:Vazirmatn;src:url(/pub/Vazirmatn-Bold.woff2) format("woff2");font-weight:700}
@font-face{font-family:Vazirmatn;src:url(/pub/Vazirmatn-Black.woff2) format("woff2");font-weight:900}
@font-face{font-family:"Libre Baskerville";src:url(/pub/baskerville-700.woff2) format("woff2");font-weight:700}
@font-face{font-family:"Libre Baskerville";src:url(/pub/baskerville-400.woff2) format("woff2");font-weight:400}
@font-face{font-family:"Noto Sans Tai Viet";src:url(/pub/taiviet.woff2) format("woff2")}
html,body{margin:0;height:100%;background:#050912 url(ui3_bg/map.jpg) center/cover no-repeat;overflow:hidden}#root{position:fixed;inset:0}</style></head>
<body><div id="root"></div><script>window.BW_ASSETS="assets/";</script><script src="app_ui1r2_rig/wall.js"></script></body></html>
HTML
echo "built -> http://127.0.0.1:8777/ui1r2_rig.html"
