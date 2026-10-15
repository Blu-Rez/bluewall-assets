import asyncio, sys
from playwright.async_api import async_playwright
from ui1r2_common import *
async def main():
    async with async_playwright() as p:
        b, pg = await load(p, sys.argv[1])
        print('page ok', pg.url)
asyncio.run(main())
