# ui1r4_queue.py <page-tag> — puts units into the training queues (the same call the census scene `army_queue` makes), so the unit-training sheets are measured WITH queue chips (the state in which the barracks sheet scrolled its title under the top edge)
import asyncio, sys
sys.path.insert(0, '/home/claude/dev')
from playwright.async_api import async_playwright
from ui1r4_common import *
import ui1r4_scenes as S
async def main():
    async with async_playwright() as p:
        b, pg = await get_page(p, sys.argv[1]); print('queued', await pg.evaluate(S.QUEUE))
asyncio.run(main())
