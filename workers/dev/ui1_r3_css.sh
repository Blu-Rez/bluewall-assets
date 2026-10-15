#!/bin/bash
# prints the CURRENT HUD3_CSS of client/src/ui_theme_r3.js (for live CSS iteration in the loaded game page: CSSFILE=/tmp/hud3.css python3 dev/ui1_r3_shots.py ...)
cd /home/claude/bot/bluebot_v2/bluewall/client && node --input-type=module -e "import('file://'+process.cwd()+'/src/ui_theme_r3.js').then(m=>process.stdout.write(m.HUD3_CSS))"
