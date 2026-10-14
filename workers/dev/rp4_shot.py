# RP4 proof driver: loads dev/rp4_dev.html (software GL), runs a scripted scenario with __rp4.step(), saves frames.   usage: python3 rp4_shot.py <scenario.py>
import asyncio, sys, json, os
from playwright.async_api import async_playwright
URL = 'http://127.0.0.1:8766/rp4_dev.html'
async def open_page(p, w=960, h=540, extra='', dpr=1):
    b = await p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=dpr); logs = []
    pg.on('pageerror', lambda e: logs.append('PAGEERR ' + str(e)[:400])); pg.on('console', lambda m: logs.append(m.type + ' ' + m.text[:300]) if m.type in ('error', 'warning') else None)
    await pg.goto(f'{URL}?manual=1&w={w}&h={h}{extra}'); 
    try: await pg.wait_for_function('window.__ready===true || window.__err', timeout=90000)
    except Exception as e: logs.append('WAIT ' + str(e)[:200])
    err = await pg.evaluate('window.__err||null')
    return b, pg, logs, err

async def js(pg, code):
    return await pg.evaluate(code)
async def until(pg, pred, max_sec=3.0, dt=1/60):
    """step the dev page tick by tick until pred (JS expression) is true; returns the sim time"""
    return await pg.evaluate("""([pred, maxSec, dt]) => { const r = window.__rp4; let t = 0; while (t < maxSec) { if (eval(pred)) return t; r.step(dt, dt); t += dt; } return -1; }""", [pred, max_sec, dt])
