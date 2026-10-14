#!/bin/bash
# d1_test.sh — D1 (one death effect for every unit).  Prints "D1 OK" or the failures.
#   1. table: all 31 types of unitdefs.json -> rarity tier -> death colour (from rarity.js itself, bundled with esbuild) -> motes per unit (DIS.n of bunits.js)
#   2. static: kill() / the dead-view branch have no tumble, no clip, no landing dust, no sinking; corpse time <= 2 s; no new shader / program source (crowd.js untouched, no ShaderMaterial / onBeforeCompile added to bunits.js / bfx.js)
#   3. in-game (only when `python3 dev/d1_proof.py a new` has run: work/d1/a_data.json): every killed view of every type frozen until 0.35 s, thinner at 1.0 s, gone by 1.6 s, tier index = rarity; crowd slots freed; (b_data.json = the old bundle: frame-time comparison, informational)
R=/home/claude/bot/bluebot_v2/bluewall; C=$R/client; S=$C/src
cat > /home/claude/dev/d1_table.mjs <<'EOF'
import { RARITY, TIERS } from '../bot/bluebot_v2/bluewall/client/src/rarity.js';
import DEFS from '../bot/bluebot_v2/bluewall/client/src/unitdefs.json';
const out = {}; for (const t of Object.keys(DEFS.units)) { const T = RARITY[t]; out[t] = { tier: TIERS.indexOf(T), name: T.k, c: T.c }; }
console.log(JSON.stringify({ rows: out, tiers: TIERS.map((T) => T.c) }));
EOF
( cd $C && npx esbuild /home/claude/dev/d1_table.mjs --bundle --platform=node --format=cjs --outfile=/tmp/d1_table.cjs --log-level=error ) || { echo "D1 FAIL: esbuild"; exit 1; }
node /tmp/d1_table.cjs > /tmp/d1_table.json || { echo "D1 FAIL: table"; exit 1; }
python3 - <<'PY'
import json, re, os, sys, math
R = '/home/claude/bot/bluebot_v2/bluewall'; S = R + '/client/src/'; fails = []; B = '/home/claude/base_snapshot/client/src/'
def bad(m): fails.append(m)
T = json.load(open('/tmp/d1_table.json')); rows = T['rows']; tiers = T['tiers']
DEFS = json.load(open(S + 'unitdefs.json'))['units']
bu = open(S + 'bunits.js').read(); bf = open(S + 'bfx.js').read()
# ---- 1. the table
m = re.search(r"const DIS = \{ hold: ([\d.]+), end: ([\d.]+), gone: ([\d.]+), n: \[([\d, ]+)\], budget: (\d+) \}", bu)
if not m: bad('DIS table not found in bunits.js'); DIS = None
else: DIS = dict(hold=float(m[1]), end=float(m[2]), gone=float(m[3]), n=[int(x) for x in m[4].split(',')], budget=int(m[5]))
if DIS:
    if DIS['n'] != [18, 25, 32, 43, 54]: bad('motes per tier != 18/25/32/43/54 (the spec start 10/14/18/24/30, tuned by eye x1.8): %s' % DIS['n'])
    if DIS['hold'] != 0.35 or DIS['end'] != 1.3: bad('timeline != 0.35 / 1.3 s')
    if DIS['gone'] > 2.0: bad('corpse lives %.2f s (> 2 s)' % DIS['gone'])
if len(rows) != 31: bad('unitdefs has %d types (expected 31)' % len(rows))
want = ['#c3cfe0', '#4fe08a', '#b660ff', '#ffb52e', '#38b6ff']
if tiers != want: bad('rarity.js colours changed: %s' % tiers)
print('%-14s %-10s %-8s %s' % ('type', 'tier', 'colour', 'motes'))
for t, r in rows.items():
    d = DEFS[t]; p = math.sqrt(d['hp'] * d['dps']) / 3; i = 0
    while i < 4 and p >= (22, 60, 100, 200)[i]: i += 1
    if i != r['tier'] or r['c'] != want[i]: bad('%s: tier %s colour %s != expected %d %s' % (t, r['tier'], r['c'], i, want[i]))
    print('%-14s %-10s %-8s %d' % (t, r['name'], r['c'], DIS['n'][r['tier']] if DIS else -1))
# ---- 2. static
a = bu.index('// ---------------------------------------------------------------- death (D1)'); b = bu.index('// ---------------------------------------------------------------- events')
death = bu[a:b]
c = bu.index('      if (v.dead) {\n        const age'); d = bu.index('      // speed (smoothed), heading, lift'); dead = bu[c:d]
for name, txt in (('kill()', death), ('dead branch', dead)):
    for bad_ in ('tumble', '.play(', 'freezeAt', 'hooks.land', 'hooks.collapse', 'hideAt', 'sinkK', 'landAt', 'v.fall', 'Math.random'):
        if bad_ in txt: bad('%s still contains %s' % (name, bad_))
if 'v.removeAt = t + DIS.gone' not in death: bad('removeAt is not t + DIS.gone')
if 'RARITY[v.u.type]' not in death or 'TIERS' not in death: bad('death colour does not come from rarity.js')
if re.search(r'#[0-9a-fA-F]{6}', death): bad('a hard-coded colour in the death code (colours must come from rarity.js)')
if 'api.dissolve' not in bf or 'export const activeFX' not in bf: bad('bfx.js lacks dissolve / activeFX')
if open(S + 'crowd.js').read() != open(B + 'crowd.js').read(): bad('crowd.js differs from the base (D1 needs no shader / attribute change)')
for f in ('bunits.js', 'bfx.js'):
    now = open(S + f).read(); old = open(B + f).read()
    for pat in ('ShaderMaterial', 'onBeforeCompile', 'customProgramCacheKey', 'new THREE.Points', 'InstancedMesh'):
        if now.count(pat) > old.count(pat): bad('%s: more "%s" than the base (new shader / draw call source)' % (f, pat))
# ---- 3. in-game data (optional)
def load(tag):
    p = '/home/claude/work/d1/%s_data.json' % tag
    return json.load(open(p)) if os.path.exists(p) else None
A = load('a'); Bd = load('b'); seen = {}
if A:
    mass = [x for x in A['mass'] if 'units' in x]; by = {x['age']: x for x in mass}
    for age in (0.2, 0.4, 0.6, 0.8, 1.0, 1.3, 1.6):
        if age not in by: bad('mass run lacks age %s' % age)
    if by:
        for u in by[0.2]['units']:
            if u.get('none'): continue
            seen[u['type'] + ('/D' if u['side'] == 'D' else '')] = 1
        for i, u in enumerate(by[0.2]['units']):
            if u.get('none'): continue
            nm = u['type'] + ('/D' if u['side'] == 'D' else ''); r02 = u; r04 = by[0.4]['units'][i]; r10 = by[1.0]['units'][i]; r16 = by[1.6]['units'][i]
            exp = rows[u['type']]['tier']
            import math as _m
            for fld in ('H', 'cy'):
                if u.get(fld) is None or not _m.isfinite(u[fld]): bad('%s: %s is %s (NaN would hide the body / the motes)' % (nm, fld, u.get(fld)))
            for r_ in (r04, r10):
                if r_.get('rise') is not None and not _m.isfinite(r_['rise']): bad('%s: siege rise is NaN' % nm)
            if u.get('ti') != exp: bad('%s: death tier %s != rarity %s' % (nm, u.get('ti'), exp))
            f02 = r02['ratio'] if r02['ratio'] is not None else r02['sk']; f04 = r04['ratio'] if r04['ratio'] is not None else r04['sk']
            if f02 is None or abs(f02 - 1) > 1e-3: bad('%s: not frozen at 0.2 s (scale %s)' % (nm, f02))
            f10 = r10['ratio'] if r10['ratio'] is not None else r10['sk']
            if f10 is None or f10 > 0.8: bad('%s: not thinned at 1.0 s (scale %s)' % (nm, f10))
            gone = (r16['parts'] == 0) if r16['sk'] is None else (not r16['inList'])
            if not gone: bad('%s: still there at 1.6 s' % nm)
        n_alive = by[3.0]['views']; pre = A['pre']['views']; killed = len([x for x in by[0.2]['units'] if not x.get('none')])
        print('views: before %d, killed %d -> 3.0 s after the mass death %d' % (pre, killed, n_alive))
        if n_alive != pre - killed: bad('after the mass death %d views are left, expected %d (a corpse stayed or a living unit vanished)' % (n_alive, pre - killed))
        b0 = A['pre']['inst']; b3 = by[3.0]['inst']; drop = sum(b0[k] - b3[k] for k in b0 if b0[k] >= 0)
        for k in b0:
            if b0[k] >= 0 and b3[k] > b0[k]: bad('kind %s grew from %d to %d instances' % (k, b0[k], b3[k]))
        want = sum(x['parts'] for x in by[0.2]['units'] if not x.get('none') and x.get('sk') is None)
        if drop != want: bad('crowd instances freed (%d) != parts of the killed units (%d): slots not reused' % (drop, want))
        print('crowd instances freed by the mass death: %d = every part of the %d killed crowd units (the %d siege machines leave their own list)' % (drop, killed - len([x for x in by[0.2]['units'] if x.get('sk') is not None]), len([x for x in by[0.2]['units'] if x.get('sk') is not None])))
        progs = set(x['prog'] for x in A['mass'] if 'prog' in x) | set(f['prog'] for s in A['strips'].values() for f in s['frames'])
        print('programs seen over the whole death run (frames): %s' % sorted(progs))
        if len(progs) > 1: bad('shader programs changed during the deaths: %s' % sorted(progs))
        print('types with a dying view: %d (%s)' % (len(seen), ', '.join(sorted(seen))))
        miss = [t for t in rows if t not in seen]
        if miss: print('NOTE types without a view in this run (not drawn at all): %s' % ', '.join(miss))
    for nme, s in A['strips'].items():
        fr = s['frames']; print('strip %-9s %-12s ratio %s' % (nme, s['type'], [round(f['stat']['ratio'], 2) if f['stat'].get('ratio') is not None else None for f in fr]))
if A and Bd:
    def avg(D, key, ages=(0.4, 0.8, 1.2, 1.6)):
        v = [x[key] for x in D['mass'] if x.get('age') in ages and key in x]; return sum(v) / len(v) if v else float('nan')
    for k in ('views_ms_tick', 'fx_ms_tick', 'render_ms', 'calls'):
        print('PERF (software GL, informational) %-14s new %.2f  old %.2f' % (k, avg(A, k), avg(Bd, k)))
    print('programs new %s  old %s' % (sorted(set(x['prog'] for x in A['mass'] if 'prog' in x)), sorted(set(x['prog'] for x in Bd['mass'] if 'prog' in x))))
if fails:
    print('D1 FAIL'); [print(' -', f) for f in fails]; sys.exit(1)
print('D1 OK')
PY
