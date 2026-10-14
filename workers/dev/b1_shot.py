#!/usr/bin/env python3
# b1_shot.py in.html out.png [w h] — screenshot an html page with the preinstalled chromium
import sys, os
from playwright.sync_api import sync_playwright
src, out = sys.argv[1], sys.argv[2]
W = int(sys.argv[3]) if len(sys.argv) > 3 else 2150; H = int(sys.argv[4]) if len(sys.argv) > 4 else 1700
with sync_playwright() as p:
    b = p.chromium.launch(executable_path=os.environ.get('PW_CHROMIUM', '/opt/pw-browsers/chromium'), args=['--no-sandbox'])
    pg = b.new_page(viewport={'width': W, 'height': H}); pg.goto('file://' + os.path.abspath(src)); pg.wait_for_timeout(400)
    pg.screenshot(path=out); b.close()
print('shot', out)
