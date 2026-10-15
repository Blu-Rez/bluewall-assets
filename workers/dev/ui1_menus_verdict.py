# ui1_menus_verdict.py <results.json> [more results.json ...] — the verdict of the UI1_R4 menu census: every opened menu must pass at every size.
#   FAIL / ERR  -> exit 1.   SKIP is allowed only when the scene could not be reached by its real button (listed, never hidden), and at least MINOK cells must really have been opened and probed.
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ui1r4_rules import verdict          # the same pass / fail rule as the census table (UI1_R4_menus.md)
MINOK = int(__import__('os').environ.get('MINOK', '80'))
res = {}
for f in sys.argv[1:]: res.update(json.load(open(f)))
ok = fail = skip = err = 0; bad = []; skips = {}
for k, v in sorted(res.items()):
    if 'skip' in v:
        if k.startswith('zz_end'): continue
        skip += 1; skips.setdefault(k.split('|')[0], v['skip']); continue
    if 'error' in v: err += 1; bad.append(k + '  ERR ' + v['error']); continue
    H = int(k.split('|')[1].split('x')[1]); why = verdict(v, H) + ([f for f in v.get('fail', [])] if not v.get('ok') else [])
    if not why: ok += 1
    else: fail += 1; bad.append(k + '  FAIL ' + ' | '.join(dict.fromkeys(why))[:200])
sizes = sorted({k.split('|')[1] for k in res}); scenes = sorted({k.split('|')[0] for k in res if not res[k].get('skip')})
print(f'UI1 menus: {ok} cells ok, {fail} fail, {err} error, {skip} skipped · {len(scenes)} menus opened · sizes {sizes}')
for s, why in sorted(skips.items()): print('  not opened by its real button:', s, '-', why)
for b in bad: print('  ' + b)
if fail or err: print('UI1 MENUS FAILED'); sys.exit(1)
if len(sizes) < 3: print('UI1 MENUS FAILED (fewer than 3 sizes were run)'); sys.exit(1)
if ok < MINOK: print(f'UI1 MENUS FAILED (only {ok} cells opened; need {MINOK})'); sys.exit(1)
print('UI1 MENUS OK')
