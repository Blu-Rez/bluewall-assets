# ui1r4_scenes.py — UI1_R4: every menu of the real game, opened by its real button, plus the geometry probe (ui1r4_probe.js).
# Used by ui1r4_census.py (frames + UI1_R4_menus.md) and dev/ui1_menus_test.sh (UI1 MENUS OK).
# Needs the R2/R3 rig: bash dev/up.sh (static server :8777), OUT=... bash dev/ui1r2_browser.sh (chromium on CDP :9222), bash dev/ui1r2_rig_build.sh <tag>, then the page is loaded once (ui1r4_load.py <tag>).
import asyncio, json, os, re, sys
from ui1r4_common import *
D = os.path.dirname(os.path.abspath(__file__))
PROBE = open(os.path.join(D, 'ui1r4_probe.js')).read()
class Skip(Exception): pass
RESTORE = """() => { const u = __bw.ui, e = __bw.econ; if (!window.__prof0) window.__prof0 = { name: u.prof.name, level: u.prof.level, cups: u.prof.cups };
  u.setProfile(window.__prof0); u.setGems(e.wallet()); u.setPrem(e.prem()); const t = u.toastEl; if (t) t.classList.remove('on');
  if (window.__rank0) { e.rank = window.__rank0; e.social = window.__soc0; e.st.tro = window.__tro0; e.st.lg = window.__lg0; window.__rank0 = null; } }"""
async def scroll_body(pg, sel, frac=1.0, need=8):
    r = await pg.evaluate("([s, f]) => { const e = document.querySelector(s); if (!e) return -1; const m = e.scrollHeight - e.clientHeight; e.scrollTop = m * f; return m; }", [sel, frac]); await settle(pg, .3)
    if r < need: raise Skip(f'no overflow {sel} ({r})')
# --------------------------------------------------------------------------- openers
KT = lambda t: f'.bwu-tab[data-tab="{t}"]'
async def king(pg, tab='owned', cat='all'):
    await via_hub(pg, 'build'); await js_click(pg, KT(tab))
    if tab == 'owned': await js_click(pg, f'.bwu-cat[data-cat="{cat}"]')
    await settle(pg, .4)
STATES = """() => { const P = __bw.econ.st.prog, E = Object.entries(P.structs), now = __bw.econ.now();
  E.forEach(([k, r], i) => { r.up = null; r.lv = r.lv || 12; r.next = { to: r.lv + 1, ok: true, cost: { ruby: 1200, emerald: 640 }, dur: 14400, info: {} };
    if (i % 5 === 1) { r.up = { to: r.lv + 1, end: now + 3 * 3600 + i * 311, dur: 14400, rush: 60, rush_cut: 0, rush_full: true }; r.next = null; }
    if (i % 5 === 2) r.next = { to: r.lv + 1, ok: false, why: 'cap', cost: null, dur: 0, info: { need_keep: 14 } };
    if (i % 5 === 3) r.next = { to: r.lv + 1, ok: true, cost: { ruby: 99000, emerald: 640 }, dur: 36000, info: {} };
    if (i % 5 === 4 && i > 8) r.next = null; });
  P.builders_busy = E.filter(([, r]) => r.up).length; }"""
AT = lambda t: f'.bwa-tabs button[data-t="{t}"]'
async def army(pg, tab='troops'): await via_hub(pg, 'army'); await js_click(pg, AT(tab)); await settle(pg, .4)
QUEUE = """async () => { const a = __bw.econ.st.army; const by = {}; let n = 0; for (const [k, u] of Object.entries(a.units)) (by[u.fam] = by[u.fam] || []).push(k);
  for (const f of Object.keys(by)) for (const k of by[f].slice(0, 2)) { try { await __bw.armyUI.trainOne(k); n++; } catch (e) {} }
  return n; }"""
INFO_BY_RARITY = """(r) => { const c = [...document.querySelectorAll('.bwa-c:not(.sp)')].find((x) => (x.querySelector('.rt') || {}).textContent === r); if (!c) return false; c.querySelector('.inf').click(); return true; }"""
ST = lambda t: f'.bws-tabs button[data-t="{t}"]'
async def shop(pg, tab='boost'): await via_hub(pg, 'shop'); await js_click(pg, ST(tab)); await settle(pg, .5)
RT = lambda t: f'.bwk.on .bwk-tabs button[data-t="{t}"]'
async def rank(pg, tab='lb'): await via_hub(pg, 'rank'); await js_click(pg, RT(tab)); await settle(pg, .5)
STUB = """() => { const e = __bw.econ; if (!window.__rank0) { window.__rank0 = e.rank; window.__soc0 = e.social; window.__tro0 = e.st.tro; window.__lg0 = e.st.lg; }
  const E = ['swords', 'wings', 'dragon', 'axes', 'heart', 'crown', 'tower', 'wolf', 'eagle', 'lion', 'bear', 'serpent'], N = ['Aylin the Bold', 'Kaveh', 'Roxana', 'Darius', 'Shirin', 'Blue Heart', 'Bahram', 'Mina', 'Arash', 'Leila', 'Farid', 'Nasrin'];
  const top = N.map((n, i) => ({ r: i + 1, n, e: E[i], tro: 3200 - i * 190, lg: Math.max(0, 5 - Math.floor(i / 2)), me: n === 'Blue Heart' }));
  e.st.tro = 1480; e.st.lg = 3;
  e.rank = async () => ({ ok: true, top, me: { rank: 6, tro: 1480, best: 1500, lg: 3, n: 'Blue Heart', e: 'swords' }, invite: { link: 'https://t.me/example_game?start=ref_k7Qx2', pay: 1000, keep: 3, done: 4, max: 50 } });
  const mem = N.slice(0, 7).map((n, i) => ({ id: i + 1, n, e: E[i], lg: Math.max(0, 5 - i), k: 30 - i, tro: 2600 - i * 240, owner: i === 0, me: n === 'Blue Heart' }));
  const now = e.now(), loot = (a, b) => ({ ruby: a, emerald: b });
  e.social = async (path, body) => {
    if (path === '/api/clan') return window.__clanMine ? { ok: true, mine: { tag: 'BLUE', name: 'Blue Vanguard', n: mem.length, max: 30, tro: 14800, me_owner: true, members: mem } } : { ok: true, min_keep: 2, max: 30, top: [
      { id: 1, tag: 'BLUE', name: 'Blue Vanguard', n: 12, max: 30, tro: 14800 }, { id: 2, tag: 'ICE', name: 'Frost Wardens', n: 30, max: 30, tro: 12100 }, { id: 3, tag: 'LION', name: 'Iron Lions', n: 8, max: 30, tro: 9300 }, { id: 4, tag: 'STAR', name: 'Night Watch', n: 3, max: 30, tro: 2100 }] };
    if (path === '/api/friends') return { ok: true, pay: 1000, keep: 3, max: 50, link: 'https://t.me/example_game?start=ref_k7Qx2', friends: N.slice(1, 7).map((n, i) => ({ n, e: E[i + 1], lg: 3 - (i >> 1), k: 3 + i, tro: 900 - i * 110, paid: i < 3 })) };
    if (path === '/api/log') return { ok: true, log: [
      { k: 'a', who: 'Kaveh', stars: 3, pct: 100, loot: loot(48200, 22100), tro: 41, t: now - 600 }, { k: 'd', who: 'Roxana', stars: 2, pct: 74, loot: loot(31000, 9100), tro: -28, t: now - 3900 },
      { k: 'd', who: 'Darius', stars: 0, pct: 31, loot: {}, tro: 12, t: now - 9000 }, { k: 'a', who: 'Shirin', stars: 1, pct: 52, loot: loot(12400, 0), tro: 18, t: now - 20000 },
      { k: 'a', who: 'Bahram', stars: 0, pct: 20, loot: {}, tro: -10, t: now - 52000 }, { k: 'd', who: 'Mina', stars: 3, pct: 100, loot: loot(77000, 31000), tro: -40, t: now - 90000 }, { k: 'a', who: 'Arash', stars: 2, pct: 81, loot: loot(26000, 11000), tro: 28, t: now - 130000 }] };
    return { ok: false }; }; }"""
async def populated(pg, mine=False):
    await pg.evaluate(STUB); await pg.evaluate("(m) => { window.__clanMine = m; }", mine)
# ---- building sheets: tap the building on the real map (camera posed over it), exactly like a finger
POSE = """([id, dist, az]) => { const w = __bw.world, THREE = __bw.THREE, c = __bw.ctl, cam = __bw.camera; const pk = w.picks.find((q) => q.id === id); if (!pk) return null;
  if (!window.__cam0) window.__cam0 = { t: c.target.clone(), d: c.dist, p: c.polar, a: c.azim };
  const ctr = pk.box.getCenter(new THREE.Vector3()); c.target.set(ctr.x, 0, ctr.z); c.dist = dist; c.polar = 1.0; c.azim = az; c.intro = null;
  const W = innerWidth, H = innerHeight; cam.setViewOffset(W, H, 0, Math.round(H * (W < H ? 0.2 : 0.0)), W, H); return [ctr.x, ctr.y, ctr.z]; }"""
FIND = """([want]) => { const w = __bw.world, THREE = __bw.THREE, cam = __bw.camera, ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), hit = new THREE.Vector3();
  const pk = w.picks.find((q) => q.id === want); const bx = pk.box, ctr = bx.getCenter(new THREE.Vector3());
  const pts = [ctr, new THREE.Vector3(ctr.x, bx.max.y - 0.5, ctr.z), new THREE.Vector3(ctr.x, bx.min.y + 1.2, ctr.z), new THREE.Vector3(bx.min.x + 1, ctr.y, ctr.z), new THREE.Vector3(bx.max.x - 1, ctr.y, ctr.z), new THREE.Vector3(ctr.x, ctr.y, bx.min.z + 1), new THREE.Vector3(ctr.x, ctr.y, bx.max.z - 1)];
  cam.updateMatrixWorld(); let first = null;
  for (const p of pts) { const v = p.clone().project(cam); if (Math.abs(v.x) > 0.9 || v.y > 0.55 || v.y < -0.9) continue; const x = (v.x + 1) / 2 * innerWidth, y = (1 - v.y) / 2 * innerHeight;
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, cam); let best = null, bd = 1e9;
    for (const q of w.picks) if (ray.ray.intersectBox(q.box, hit)) { const d = hit.distanceTo(cam.position); if (d < bd) { bd = d; best = q.id; } }
    if (!first) first = { x, y, hit: best }; if (best === want) return { x, y, hit: best, ok: true }; }
  return first ? { ...first, ok: false } : { ok: false }; }"""
CAMBACK = "() => { const c = __bw.ctl, o = window.__cam0; __bw.camera.clearViewOffset && __bw.camera.clearViewOffset(); if (o) { c.target.copy(o.t); c.dist = o.d; c.polar = o.p; c.azim = o.a; window.__cam0 = null; } }"
async def open_sheet(pg, id, dist=120):
    await close_all(pg); found = None
    for az in (0.9, 2.4, 3.9, 5.4, 1.6, 3.1, 4.6, 0.0):
        r = await pg.evaluate(POSE, [id, dist, az])
        if r is None: raise Skip('no pick ' + id)
        await rerender(pg, 6); found = await pg.evaluate(FIND, [id])
        if found.get('ok'): break
    if not found.get('ok'): raise Skip('cannot hit ' + id)
    await pg.evaluate("([x, y]) => { __bw.ctl.onTap(x, y); }", [found['x'], found['y']])
    for _ in range(40):
        ok = await pg.evaluate("() => { const s = document.querySelector('.bsh.on'); if (!s) return false; const r = s.getBoundingClientRect(); return getComputedStyle(s).transform === 'none' && r.top < innerHeight - 20; }")
        if ok: break
        await asyncio.sleep(0.3)
    else: raise Skip('no sheet opened for ' + id)
    await settle(pg, .6)
async def sheet_close(pg):
    await pg.evaluate("() => document.querySelector('.bsh.on .bsh-x') && document.querySelector('.bsh.on .bsh-x').click()"); await settle(pg, .8)
    await pg.evaluate(CAMBACK); await rerender(pg, 4)
# --------------------------------------------------------------------------- the scene table
SC = []     # dict(name, group, fn, root, pan, close)
def scene(name, group, root, pan=None, close=None):
    def d(f): SC.append(dict(name=name, group=group, fn=f, root=root, pan=pan, close=close)); return f
    return d
HUB = dict(root='.bwh.on', pan='.bwh-pan', close='.bwh-x')
@scene('hub', 'Hub', **HUB)
async def _(pg): await close_all(pg); await js_click(pg, '.bwh-btn'); await settle(pg, .8)
KG = dict(root='.bwu.on', pan='.bwu-pan', close='.bwu-x')
@scene('kingdom_owned', 'Kingdom', **KG)
async def _(pg): await king(pg)
@scene('kingdom_owned_mixed', 'Kingdom', **KG)
async def _(pg): await pg.evaluate(STATES); await king(pg)
@scene('kingdom_town', 'Kingdom', **KG)
async def _(pg): await king(pg, 'owned', 'town')
@scene('kingdom_reserve', 'Kingdom', **KG)
async def _(pg): await king(pg, 'reserve')
@scene('kingdom_buy', 'Kingdom', **KG)
async def _(pg):
    await pg.evaluate("() => { const P = __bw.econ.st.prog; Object.entries(P.structs).slice(-3).forEach(([k, r]) => { r.lv = 0; r.up = null; r.next = { to: 1, ok: true, cost: { ruby: 800, emerald: 300 }, dur: 600, info: {} }; }); }")
    await king(pg, 'buy')
@scene('kingdom_new', 'Kingdom', **KG)
async def _(pg): await king(pg, 'new')
AR = dict(root='.bwa.on', pan='.bwa-pan', close='.bwa-x')
@scene('army_troops', 'Army', **AR)
async def _(pg): await army(pg)
@scene('army_spells', 'Army', **AR)
async def _(pg): await army(pg, 'spells')
@scene('army_queue', 'Army', **AR)
async def _(pg): await close_all(pg); await pg.evaluate(QUEUE); await army(pg)
for rr in ('Common', 'Mythic'):
    def mk(rr):
        async def f(pg):
            await army(pg); ok = await pg.evaluate(INFO_BY_RARITY, rr); await settle(pg, .6)
            if not ok: raise Skip('no ' + rr)
        return f
    scene(f'army_unit_info_{rr.lower()}', 'Army', root='.ucp.on', pan='.ucp', close='.ucp-back')(mk(rr))
@scene('army_spell_info', 'Army', root='.bwa-ov.on', pan='.bwa-sheet', close='.bwa-sheet button')
async def _(pg): await army(pg, 'spells'); await js_click(pg, '.bwa-c.sp .inf', 0); await settle(pg, .6)
@scene('army_emblem_picker', 'Army', root='.bwa-ov.on', pan='.bwa-sheet', close='.bwa-sheet button')
async def _(pg): await via_hub(pg, 'army'); await js_click(pg, '.bwa-em'); await settle(pg, .6)
SH = dict(root='.bws.on', pan='.bws-pan', close='.bws-x')
@scene('shop_boosts', 'Shop', **SH)
async def _(pg): await shop(pg)
@scene('shop_defense', 'Shop', **SH)
async def _(pg): await shop(pg, 'def')
@scene('shop_gems', 'Shop', **SH)
async def _(pg): await shop(pg, 'gem')
RK = dict(root='.bwk.on', pan='.bwk-pan', close='.bwk-x')
@scene('rank_leaderboard', 'Rank / Clan / Friends / Log', **RK)
async def _(pg): await populated(pg); await rank(pg, 'lb')
@scene('rank_leagues', 'Rank / Clan / Friends / Log', **RK)
async def _(pg): await populated(pg); await rank(pg, 'lg')
@scene('rank_invite', 'Rank / Clan / Friends / Log', **RK)
async def _(pg): await populated(pg); await rank(pg, 'inv')
@scene('clan_join', 'Rank / Clan / Friends / Log', **RK)
async def _(pg): await populated(pg); await via_hub(pg, 'clan'); await settle(pg, .6)
@scene('clan_create', 'Rank / Clan / Friends / Log', **RK)
async def _(pg): await populated(pg); await via_hub(pg, 'clan'); await js_click(pg, '.bwc-btn[data-a="create"]'); await settle(pg, .5)
@scene('clan_mine', 'Rank / Clan / Friends / Log', **RK)
async def _(pg): await populated(pg, True); await via_hub(pg, 'clan'); await settle(pg, .6)
@scene('friends', 'Rank / Clan / Friends / Log', **RK)
async def _(pg): await populated(pg); await via_hub(pg, 'friends'); await settle(pg, .6)
@scene('battle_log', 'Rank / Clan / Friends / Log', **RK)
async def _(pg): await populated(pg); await via_hub(pg, 'log'); await settle(pg, .6)
SE = dict(root='.bw-set.on', pan='.bw-panel', close='[data-a=setclose]')
for tab in ('sound', 'graphics', 'controls', 'about'):
    def mk(tab):
        async def f(pg): await via_hub(pg, 'set'); await js_click(pg, f'.bw-tab[data-t="{tab}"]'); await settle(pg, .4)
        return f
    scene(f'settings_{tab}', 'Settings (+ owner tools)', **SE)(mk(tab))
@scene('settings_graphics_owner_tools', 'Settings (+ owner tools)', **SE)
async def _(pg):
    await via_hub(pg, 'set'); await js_click(pg, '.bw-tab[data-t="graphics"]'); await settle(pg, .4)
    await pg.evaluate("() => { const b = document.querySelector('.bw-body'); const h = [...b.querySelectorAll('div')].find((d) => d.textContent === 'OWNER TOOLS'); if (h) h.scrollIntoView({block:'start'}); else b.scrollTop = b.scrollHeight; }"); await settle(pg, .4)
# building sheets (tap the building)
SHEETS = [('keep', 'keep', 130), ('wall', 'wall', 150), ('tower', 'tower', 120), ('barracks', 'barracks', 110), ('forge', 'forge', 110), ('training', 'training', 60), ('stable', 'stable', 110), ('workshop', 'workshop', 110),
          ('lair', 'lair', 110), ('archer', 'archer tower', 110), ('vault_ruby', 'vault ruby', 90), ('vault_emerald', 'vault emerald', 90), ('vault_turq', 'vault turquoise', 90), ('mine_ruby', 'mine ruby', 140), ('mine_emerald', 'mine emerald', 140),
          ('mine_turq', 'mine turquoise', 140), ('ws:farm', 'production: farm', 110), ('ws:sawmill_00', 'production: sawmill', 110), ('ws:smelter_00', 'production: smelter', 110), ('ws:mint_00', 'production: mint', 110)]
for pid, label, dist in SHEETS:
    def mk(pid, dist):
        async def f(pg):
            try: await sheet_close(pg)
            except Exception: pass
            await open_sheet(pg, pid, dist)
        return f
    scene('sheet_' + re.sub(r'[^a-z0-9]+', '_', pid.lower()).strip('_'), 'Building sheets', root='.bsh.on', pan=None, close='.bsh-x')(mk(pid, dist))
# the two confirmation dialogs of the building sheet (bsheet.js `ask`): «Cancel the upgrade?» (the secondary button of a building that is being upgraded) and «Finish now?» (hold the Rush button).  A building with an upgrade running is forced into the state (the census does the same to the Kingdom list), the dialog is opened by the REAL tap / hold.
FORCE_UP = """(pid) => { const e = __bw.econ, P = e.st.prog, r = P.structs[pid]; if (!r) return false; const now = e.now(); r.lv = r.lv || 12; r.up = { to: r.lv + 1, end: now + 3 * 3600, dur: 14400, rush: 60, rush_cut: 0, rush_full: true }; r.next = null; P.builders_busy = Math.max(1, P.builders_busy | 0); return true; }"""
DLG_ON = "() => !!(document.querySelector('.bsh-dlg') && document.querySelector('.bsh-dlg').classList.contains('on'))"
async def open_dialog(pg, kind):
    for bid, dist in (('forge', 110), ('keep', 130), ('barracks', 110), ('wall', 150)):
        try: await sheet_close(pg)
        except Exception: pass
        if not await pg.evaluate(FORCE_UP, bid): continue
        try: await open_sheet(pg, bid, dist)
        except Skip: continue
        await settle(pg, .6)
        if kind == 'cancel': sel = '.bsh-row .bsh-b[data-b="s"]:not([disabled]):not(.dis)'
        else: sel = '.bsh-go .bsh-b[data-hold]:not([disabled]):not(.dis)'
        bb = await pg.evaluate("(sel) => { const b = document.querySelector(sel); if (!b) return null; const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }", sel)
        if not bb: continue
        await pg.mouse.move(bb[0], bb[1]); await pg.mouse.down()
        await asyncio.sleep(1.8 if kind == 'rush' else 0.12); await pg.mouse.up(); await settle(pg, 1.2)
        if await pg.evaluate(DLG_ON): return
    raise Skip('no dialog')
@scene('sheet_confirm_dialog', 'Building sheets', root='.bsh-dlg.on', pan=None, close='.bsh-b')
async def _(pg): await open_dialog(pg, 'cancel')
@scene('sheet_confirm_rush', 'Building sheets', root='.bsh-dlg.on', pan=None, close='.bsh-b')
async def _(pg): await open_dialog(pg, 'rush')
# the hero picker (RP1C owns it; the census only opens it by its real crown button and measures it)
async def close_pick(pg):
    await pg.evaluate("() => { const x = document.querySelector('.rp-pick .rp-x'); if (x) x.click(); const p = document.querySelector('.rp-pick'); if (p) p.remove(); }")
@scene('hero_picker', 'Hero', root='.rp-pick', pan=None, close='.rp-x')
async def _(pg):
    await close_pick(pg); await close_all(pg)
    box = await pg.evaluate("() => { const b = document.querySelector('.rp-open'); if (!b || b.style.display === 'none') return null; const r = b.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return [r.left + r.width / 2, r.top + r.height / 2, t === b || b.contains(t)]; }")
    if not box: raise Skip('no hero crown button (.rp-open) in this build')
    if not box[2]: raise Skip('the crown button is covered at this size')
    await pg.mouse.click(box[0], box[1])
    try: await pg.wait_for_selector('.rp-pick', timeout=90000)
    except Exception: raise Skip('the picker did not open in 90 s (hero module load)')
    await settle(pg, 1.2)
# the old one-card info sheet of ui.js (ui.show): a building tap that has no building sheet of its own
async def open_old_card(pg, ids=('well', 'crystal', 'house', 'market', 'church', 'treasury', 'lumber', 'camp')):
    for pid in ids:
        try: await sheet_close(pg)
        except Exception: pass
        await close_all(pg); found = None
        for az in (0.9, 2.4, 3.9, 5.4):
            r = await pg.evaluate(POSE, [pid, 90, az])
            if r is None: break
            await rerender(pg, 6); found = await pg.evaluate(FIND, [pid])
            if found.get('ok'): break
        if not found or not found.get('ok'): continue
        await pg.evaluate("([x, y]) => { __bw.ctl.onTap(x, y); }", [found['x'], found['y']])
        for _ in range(14):
            if await pg.evaluate("() => !!document.querySelector('.bw-sheet.on')"): await settle(pg, .8); return pid
            await asyncio.sleep(0.3)
    raise Skip('no tap target opens the old info card (tried ' + ', '.join(ids) + ')')
@scene('old_info_card', 'Info card (ui.js)', root='.bw-sheet.on', pan='.bw-sheet', close='.bw-sheet .bw-x')
async def _(pg): await open_old_card(pg)
# the cinematic welcome card WITH the raid report (the longest content it ever carries); shown by the same ui.showWelcome main.js calls at start-up
async def drop_welcome(pg):
    await pg.evaluate("() => { document.querySelectorAll('.bw-wel').forEach((e) => e.remove()); __bw.ui.root.classList.remove('wel'); }")
@scene('welcome_card', 'Welcome card', root='.bw-wel', pan=None, close=None)
async def _(pg):
    await close_all(pg); await drop_welcome(pg)
    await pg.evaluate("""() => { const now = Date.now() / 1000; const raids = [{ who: 'Sir Aldric of the Marches', stars: 2, pct: 71, tro: -23, t: now - 3600, loot: { ruby: 43000, emerald: 12000 } }, { who: 'Lady Ines', stars: 0, pct: 34, tro: 12, t: now - 7200 },
      { who: 'Baron Voss', stars: 3, pct: 100, tro: -31, t: now - 9000, loot: { turq: 8000, ruby: 120000 } }, { who: 'Another', stars: 1, pct: 40, tro: -5, t: now - 9999 }];
      __bw.ui.showWelcome({ date: '750/07/23', tod: 'afternoon', time: '14:00' }, { auto: 600, raids }); }""")
    for _ in range(8): await pg.screenshot(clip={'x': 0, 'y': 0, 'width': 2, 'height': 2}); await asyncio.sleep(.6)
@scene('zz_end', 'end', root='body')
async def _(pg):
    try: await sheet_close(pg)
    except Exception: pass
    await close_all(pg); raise Skip('end marker')
async def ensure_clean(pg):
    await close_pick(pg); await drop_welcome(pg)
    await pg.evaluate("() => { document.querySelectorAll('.bsh-dlg.on .bsh-b').forEach((b) => b.click()); }"); await close_all(pg)
async def run_scene(pg, sc, W, H, safe, shot_path=None):
    """opens the scene, probes it, optionally shoots it; returns the probe dict (or {'skip': why})."""
    try:
        await pg.evaluate(RESTORE); await sc['fn'](pg)
    except Skip as ex: return {'skip': str(ex)}
    except Exception as ex: return {'error': str(ex)[:200]}
    return await probe_scene(pg, sc, W, H, safe, shot_path)
async def probe_scene(pg, sc, W, H, safe, shot_path=None):
    """probes (and shoots) the scene that is open right now at the current viewport size."""
    await settle(pg, .3)
    for _ in range(2): await pg.screenshot(clip={'x': 0, 'y': 0, 'width': 2, 'height': 2}); await asyncio.sleep(.35)       # (a frame must be produced for CSS transitions to advance in the headless compositor)
    res = await pg.evaluate(f'({PROBE})', {'root': sc['root'], 'pan': sc['pan'], 'close': sc['close'], 'W': W, 'H': H, 'safe': safe})
    if shot_path: await pg.screenshot(path=shot_path, timeout=240000)
    return res
