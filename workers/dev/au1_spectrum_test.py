#!/usr/bin/env python3
"""AU1 (c): spectrum table of every one-shot the game can play. Synthesized ones are rendered in headless Chromium (OfflineAudioContext) from the REAL
audio.js / bsfx.js code at full level (the loudest case); the mp3 ones are decoded and scaled by the loudest vol the game plays them at (audio.js ONESHOT_MAX).
Fails (exit 1) when any one-shot has a sustained pure line above 1.8 kHz louder than -24 dBFS.
usage: au1_spectrum_test.py <bundle.js> [--json out.json] [--max-vol levels.json] [--quiet]"""
import sys, os, json, base64, asyncio
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import au1_spectrum as S
from playwright.async_api import async_playwright

# synthesized sounds that are not one-shots (they are looped / layered beds) are not part of the pass / fail
NOT_ONESHOT = {'thump_loop'}
SEEDS = 6


async def render_all(bundle):
    out = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        pg = await b.new_page()
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)[:300]))
        await pg.set_content('<html><body></body></html>')
        await pg.add_script_tag(path=bundle)
        names = await pg.evaluate('AU1R.names()')
        for n in names:
            secs = 8 if n in ('collapse', 'quake', 'thunder', 'rock', 'fanfare_win', 'fanfare_lose', 'horn', 'horn_low', 'cheer', 'sting') else 4
            out[n] = []
            for seed in range(1, SEEDS + 1):                    # sounds with random pitches / noise: every seed is analysed, the worst one counts
                b64 = await pg.evaluate('([n, s, d]) => AU1R.render(n, s, d)', [n, secs, seed])
                out[n].append(np.frombuffer(base64.b64decode(b64), dtype=np.float32).astype(np.float64))
        await b.close()
        if errs: print('PAGE ERRORS:', errs)
    return out


def main():
    a = sys.argv[1:]
    bundle = a[0]; js = a[a.index('--json') + 1] if '--json' in a else None
    lv = json.load(open(a[a.index('--max-vol') + 1])) if '--max-vol' in a else S.MAXVOL
    quiet = '--quiet' in a
    res = {}
    for n, xs in asyncio.run(render_all(bundle)).items():
        rs = [S.analyse(x, 44100) for x in xs]
        r = max(rs, key=lambda q: (q['pure_dbfs'] if q['pure_dbfs'] is not None else -999)); r['peak_dbfs'] = max(q['peak_dbfs'] for q in rs)
        r['kind'] = 'synth'; r['vol'] = 1.0; res[n] = r
    for n, r in S.table(None, lv).items(): r['kind'] = 'mp3'; res[n] = r
    bad = [n for n, r in res.items() if r['offender'] and n not in NOT_ONESHOT]
    if not quiet:
        print(f"{'one-shot':<24} loudest-case spectrum (pure = narrow line above {S.PURE_HZ:.0f} Hz holding >= {S.SUSTAIN_S}s; limit {S.LIMIT_DBFS} dBFS)")
        for n in sorted(res): print(S.fmt(n + ('' if res[n]['kind'] == 'synth' else f" ({res[n]['vol']})"), res[n]))
    if js: json.dump(res, open(js, 'w'), indent=1, sort_keys=True)
    print(f"one-shots analysed: {len(res)} ({sum(1 for r in res.values() if r['kind'] == 'synth')} synthesized, {sum(1 for r in res.values() if r['kind'] == 'mp3')} mp3)")
    if bad:
        print('FAIL pure tone > 1.8 kHz above -24 dBFS: ' + ', '.join(f"{n} ({res[n]['pure_hz']} Hz @ {res[n]['pure_dbfs']})" for n in bad)); sys.exit(1)
    print('ok   no one-shot has a pure tone > 1.8 kHz above -24 dBFS')


if __name__ == '__main__':
    main()
