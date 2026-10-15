#!/bin/bash
# ui1r4_css.sh — writes the CSS of client/src/ui_theme_r4.js to /tmp/ui1r4_kit4.css (for live injection with CSSFILE=... python3 ui1r4_census.py ...)
cd /home/claude/bot/bluebot_v2/bluewall/client/src && node --input-type=module -e "import('./ui_theme_r4.js').then(m => process.stdout.write(m.KIT4_CSS))" > /tmp/ui1r4_kit4.css && wc -c /tmp/ui1r4_kit4.css
