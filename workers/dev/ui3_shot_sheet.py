# ui3_shot_sheet.py <look> <out.png> — UI3: render work/ui3/sheet/index.html (the icon / token sheet) for one look in a throw-away Chromium.
import sys
from playwright.sync_api import sync_playwright
look, out = sys.argv[1], sys.argv[2]
with sync_playwright() as p:
    b = p.chromium.launch(args=['--no-sandbox']); pg = b.new_page(viewport={'width': 910, 'height': 700})
    pg.goto(f'file:///home/claude/work/ui3/sheet/index.html?look={look}'); pg.wait_for_timeout(600); pg.screenshot(path=out); b.close()
