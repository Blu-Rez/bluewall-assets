import asyncio, base64, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        logs = []; pg.on('console', lambda m: logs.append(m.text[:200])); pg.on('pageerror', lambda e: logs.append('ERR ' + str(e)[:300]))
        await pg.set_content('<html><body></body></html>')
        await pg.add_script_tag(path='/home/claude/dev/aud/sfx_demo.bundle.js')
        r = await pg.evaluate('renderDemo()')
        open(sys.argv[1], 'wb').write(base64.b64decode(r['b64']))
        print('peak', round(r['peak'], 3), 'rms', round(r['rms'], 4), logs[:5])
        await b.close()
asyncio.run(main())
