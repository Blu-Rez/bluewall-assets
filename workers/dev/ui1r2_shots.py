# ui1r2_shots.py <before|after> [p|l|both] [scene-regex] — UI1-R2: every screen of the real game (HUD, Assist hub, Kingdom, Army, Shop, Rank / Clan / Friends / Log, Settings, toasts, building sheets next to the HUD),
# portrait 390x844 + landscape 844x390, one PNG per scene in $OUT/<tag>/ (default /home/claude/work/ui1r2/).  AUDIT=1 also runs ui1r2_audit.js on every scene (targets >= 44 px, outside the screen, endless animations,
# backdrop-filter, tiny text) and writes $OUT/<tag>/audit.json (summary: ui1r2_audit_sum.py).  AUDONLY=1 = audit without PNGs.
# Needs: bash dev/up.sh (static server :8777), bash dev/ui1r2_rig_build.sh <tag>, a chromium on CDP :9222 (see ui1r2_common.py), python3 dev/ui1r2_load.py <tag> (loads the page once, ~90 s).
# Rig note: the headless compositor sometimes does not present the WebGL canvas when no CSS animation runs anywhere -> the driver injects a 2 px invisible keep-alive animation (TEST ONLY, never shipped) and re-checks that the world is drawn.
import asyncio, sys, json, re, os, time
from playwright.async_api import async_playwright
from ui1r2_common import *
TAG = sys.argv[1]; ORI = sys.argv[2] if len(sys.argv) > 2 else 'both'; ONLY = re.compile(sys.argv[3]) if len(sys.argv) > 3 else None
OUT = os.environ.get('OUT', '/home/claude/work/ui1r2/') + f'{TAG}/'; os.makedirs(OUT, exist_ok=True)
CLOSE = """() => { const S = ['.bsh-dlg.on .bsh-b','.bsh.on .bsh-x','.bwa-ov.on','.bwh.on .bwh-x','.bwu.on .bwu-x','.bwa.on .bwa-x','.bws.on .bws-x','.bwk.on .bwk-x','.bw-set.on [data-a=setclose]'];
  let n = 0; for (let i = 0; i < 6; i++) { let any = false; for (const s of S) { const e = document.querySelector(s); if (e && e.offsetParent !== null) { e.click(); any = true; n++; } } if (!any) break; } return n; }"""
async def js_click(pg, sel, nth=0):
    return await pg.evaluate("([s, n]) => { const e = document.querySelectorAll(s)[n]; if (!e) return false; e.scrollIntoView({block:'nearest'}); e.click(); return true; }", [sel, nth])
async def settle(pg, t=0.45): await asyncio.sleep(t)
async def close_all(pg):
    for _ in range(3): await pg.evaluate(CLOSE); await asyncio.sleep(0.35)
    await pg.evaluate("() => { document.querySelectorAll('.bwu-pan,.bwa-pan,.bws-pan,.bwk-pan,.bw-panel').forEach(e => e.scrollTop = 0); }")
async def via_hub(pg, tile):
    await close_all(pg); await js_click(pg, '.bwh-btn'); await settle(pg, .6)
    ok = await js_click(pg, f'.bwh-t[data-a="{tile}"]'); await settle(pg, .8); return ok
async def scroll_body(pg, sel, frac=1.0):
    await pg.evaluate("([s, f]) => { const e = document.querySelector(s); if (e) e.scrollTop = (e.scrollHeight - e.clientHeight) * f; }", [sel, frac]); await settle(pg, .3)
async def shot(pg, name, ori):
    await pg.screenshot(path=f'{OUT}{name}_{ori}.png'); print('shot', name, ori, flush=True)
SC = []                       # (name, async fn(pg)) ; every scene must leave the page in a state where close_all works
def scene(name):
    def d(f): SC.append((name, f)); return f
    return d
class Skip(Exception): pass
AUDIT_ON = bool(os.environ.get('AUDIT')); AUDJS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ui1r2_audit.js')).read(); AUD = {}
async def scroll_body(pg, sel, frac=1.0, need=8):
    r = await pg.evaluate("([s, f]) => { const e = document.querySelector(s); if (!e) return -1; const m = e.scrollHeight - e.clientHeight; e.scrollTop = m * f; return m; }", [sel, frac]); await settle(pg, .3)
    if r < need: raise Skip(f'no overflow {sel} ({r})')
RESTORE = """() => { const u = __bw.ui, e = __bw.econ; if (!window.__prof0) window.__prof0 = { name: u.prof.name, level: u.prof.level, cups: u.prof.cups };
  u.setProfile(window.__prof0); u.setGems(e.wallet()); u.setPrem(e.prem()); const t = u.toastEl; if (t) t.classList.remove('on');
  if (window.__rank0) { e.rank = window.__rank0; e.social = window.__soc0; e.st.tro = window.__tro0; e.st.lg = window.__lg0; window.__rank0 = null; } }"""
# ---------------- HUD / chrome
@scene('hud_home')
async def _(pg): await close_all(pg)
@scene('hud_gems_full')
async def _(pg):
    await close_all(pg); await pg.evaluate("() => __bw.ui.setGems({ ruby: { n: 307000, cap: 307000 }, emerald: { n: 412000, cap: 692000 }, turq: { n: 229900, cap: 230000 } })"); await settle(pg, 1.0)
@scene('hud_prem_big')
async def _(pg):
    await close_all(pg); await pg.evaluate("() => { __bw.ui.setGems({ ruby: { n: 1250, cap: 307000 }, emerald: { n: 860, cap: 692000 }, turq: { n: 3400, cap: 230000 } }); __bw.ui.setPrem({ sap: 12500, onyx: 340 }); }"); await settle(pg, 1.2)
@scene('hud_gems_zero')
async def _(pg):
    await close_all(pg); await pg.evaluate("() => { __bw.ui.setGems({ ruby: { n: 0, cap: 307000 }, emerald: { n: 0, cap: 692000 }, turq: { n: 0, cap: 230000 } }); __bw.ui.setPrem({ sap: 0, onyx: 0 }); }"); await settle(pg, 1.2)
@scene('hud_name_long')
async def _(pg):
    await close_all(pg); await pg.evaluate("() => __bw.ui.setProfile({ name: 'Sir Bartholomew the Bold of the Seven Vales', level: 48, cups: 12345 })"); await settle(pg, .5)
@scene('hud_toast')
async def _(pg):
    await close_all(pg); await pg.evaluate("() => __bw.ui.toast('Not enough gems')"); await settle(pg, .9)
@scene('hud_toast_long')
async def _(pg):
    await close_all(pg); await pg.evaluate("() => __bw.ui.toast('Barracks: upgrade started - it finishes in 4h 00m')"); await settle(pg, .9)
@scene('assist_button_hot')
async def _(pg):
    await close_all(pg); await pg.evaluate("() => { const b = document.querySelector('.bwh-btn'); b.classList.add('hot'); b.querySelector('.bd').textContent = '3'; }"); await settle(pg, .3)
FORCE = """() => { let s = document.getElementById('x-force'); if (!s) { s = document.createElement('style'); s.id = 'x-force'; s.textContent = '.bw-ui .bwa-btn,.bw-ui .bwa-chip,.bw-ui .bwu-btn,.bw-ui .bwk-chip{display:block!important}.bw-ui .bwa-chip,.bw-ui .bwk-chip{display:flex!important}'; document.head.appendChild(s); }
  document.querySelector('.bwu-btn').classList.add('hot'); document.querySelector('.bwa-btn').classList.add('hot'); const b = document.querySelector('.bwu-btn .bd'); b.textContent = '2'; }"""
UNFORCE = "() => { const s = document.getElementById('x-force'); if (s) s.remove(); }"
@scene('corner_buttons_forced')
async def _(pg):
    await close_all(pg); await pg.evaluate(FORCE); await settle(pg, .5)
@scene('hub_open')
async def _(pg):
    await pg.evaluate(UNFORCE); await close_all(pg); await js_click(pg, '.bwh-btn'); await settle(pg, .8)
@scene('hub_attack_off')
async def _(pg):
    await close_all(pg); await js_click(pg, '.bwh-btn'); await settle(pg, .6); await pg.evaluate("() => { const a = document.querySelector('.bwh-a'); a.classList.remove('hot'); a.classList.add('off'); }"); await settle(pg, .3)
@scene('toast_over_kingdom')
async def _(pg): await via_hub(pg, 'build'); await pg.evaluate("() => __bw.ui.toast('Builders are busy - wait or rush')"); await settle(pg, .8)
@scene('toast_over_army')
async def _(pg): await via_hub(pg, 'army'); await pg.evaluate("() => __bw.ui.toast('Not enough turquoise')"); await settle(pg, .8)
@scene('toast_over_shop')
async def _(pg): await via_hub(pg, 'shop'); await pg.evaluate("() => __bw.ui.toast('Boost armed for 7 days')"); await settle(pg, .8)
# ---------------- Kingdom panel
KT = lambda t: f'.bwu-tab[data-tab="{t}"]'
async def king(pg, tab='owned', cat='all'):
    await via_hub(pg, 'build'); await js_click(pg, KT(tab))
    if tab == 'owned': await js_click(pg, f'.bwu-cat[data-cat="{cat}"]')
    await settle(pg, .4)
@scene('king_owned')
async def _(pg): await king(pg)
@scene('king_owned_mid')
async def _(pg): await king(pg); await scroll_body(pg, '.bwu-body', .5)
@scene('king_owned_end')
async def _(pg): await king(pg); await scroll_body(pg, '.bwu-body', 1)
for cn in ['town', 'defense', 'army', 'resource']:
    def mk(cn):
        async def f(pg): await king(pg, 'owned', cn)
        return f
    scene(f'king_cat_{cn}')(mk(cn))
STATES = """() => { const P = __bw.econ.st.prog, E = Object.entries(P.structs), now = __bw.econ.now();
  E.forEach(([k, r], i) => { r.up = null; r.lv = r.lv || 12; r.next = { to: r.lv + 1, ok: true, cost: { ruby: 1200, emerald: 640 }, dur: 14400, info: {} };
    if (i % 5 === 1) { r.up = { to: r.lv + 1, end: now + 3 * 3600 + i * 311, dur: 14400, rush: 60, rush_cut: 0, rush_full: true }; r.next = null; }
    if (i % 5 === 2) r.next = { to: r.lv + 1, ok: false, why: 'cap', cost: null, dur: 0, info: { need_keep: 14 } };
    if (i % 5 === 3) r.next = { to: r.lv + 1, ok: true, cost: { ruby: 99000, emerald: 640 }, dur: 36000, info: {} };
    if (i % 5 === 4 && i > 8) r.next = null; });
  P.builders_busy = E.filter(([, r]) => r.up).length; }"""
@scene('king_mixed_states')
async def _(pg): await pg.evaluate(STATES); await king(pg)
@scene('king_mixed_mid')
async def _(pg): await king(pg); await scroll_body(pg, '.bwu-body', .5)
@scene('king_mixed_end')
async def _(pg): await king(pg); await scroll_body(pg, '.bwu-body', 1)
@scene('king_reserve')
async def _(pg): await king(pg, 'reserve')
@scene('king_reserve_end')
async def _(pg): await king(pg, 'reserve'); await scroll_body(pg, '.bwu-body', 1)
@scene('king_buy')
async def _(pg):
    await pg.evaluate("() => { const P = __bw.econ.st.prog; const E = Object.entries(P.structs); E.slice(-3).forEach(([k, r]) => { r.lv = 0; r.up = null; r.next = { to: 1, ok: true, cost: { ruby: 800, emerald: 300 }, dur: 600, info: {} }; }); }")
    await king(pg, 'buy')
@scene('king_buy_end')
async def _(pg): await king(pg, 'buy'); await scroll_body(pg, '.bwu-body', 1)
@scene('king_new')
async def _(pg): await king(pg, 'new')
@scene('king_new_mid')
async def _(pg): await king(pg, 'new'); await scroll_body(pg, '.bwu-body', .5)
@scene('king_new_end')
async def _(pg): await king(pg, 'new'); await scroll_body(pg, '.bwu-body', 1)
@scene('king_after_upgrade')
async def _(pg):
    await king(pg, 'owned', 'town'); await js_click(pg, '.bwu-go button[data-a="up"]', 0); await settle(pg, 1.0)
# ---------------- Army
QUEUE = """async () => { const a = __bw.econ.st.army; const by = {}; let n = 0; for (const [k, u] of Object.entries(a.units)) (by[u.fam] = by[u.fam] || []).push(k);
  for (const f of Object.keys(by)) for (const k of by[f].slice(0, 2)) { try { await __bw.armyUI.trainOne(k); n++; } catch (e) {} }
  return n; }"""
AT = lambda t: f'.bwa-tabs button[data-t="{t}"]'
async def army(pg, tab='troops'): await via_hub(pg, 'army'); await js_click(pg, AT(tab)); await settle(pg, .4)
@scene('army_troops')
async def _(pg): await army(pg)
for fr in (.25, .5, .75, 1.0):
    def mk(fr):
        async def f(pg): await army(pg); await scroll_body(pg, '.bwa-body', fr)
        return f
    scene(f'army_troops_scroll{int(fr*100)}')(mk(fr))
@scene('army_spells')
async def _(pg): await army(pg, 'spells')
@scene('army_spells_end')
async def _(pg): await army(pg, 'spells'); await scroll_body(pg, '.bwa-body', 1)
@scene('army_queue')
async def _(pg): await close_all(pg); print('queued', await pg.evaluate(QUEUE), flush=True); await army(pg); await settle(pg, .3)
@scene('army_queue_mid')
async def _(pg): await army(pg); await scroll_body(pg, '.bwa-body', .35)
@scene('army_queue_end')
async def _(pg): await army(pg); await scroll_body(pg, '.bwa-body', 1)
INFO_BY_RARITY = """(r) => { const c = [...document.querySelectorAll('.bwa-c:not(.sp)')].find((x) => (x.querySelector('.rt') || {}).textContent === r); if (!c) return false; c.querySelector('.inf').click(); return true; }"""
for rr in ('Common', 'Rare', 'Epic', 'Legendary', 'Mythic'):
    def mk(rr):
        async def f(pg):
            await army(pg); ok = await pg.evaluate(INFO_BY_RARITY, rr); await settle(pg, .6)
            if not ok: raise Skip('no ' + rr)
        return f
    scene(f'army_info_{rr.lower()}')(mk(rr))
@scene('army_info_mythic_end')
async def _(pg):
    await army(pg); await pg.evaluate(INFO_BY_RARITY, 'Mythic'); await settle(pg, .6); await scroll_body(pg, '.bwa-sheet', 1)
for si in range(5):
    def mk(si):
        async def f(pg):
            await army(pg, 'spells'); await js_click(pg, '.bwa-c.sp .inf', si); await settle(pg, .6)
        return f
    scene(f'army_spell_info_{si}')(mk(si))
@scene('army_emblem_picker')
async def _(pg): await via_hub(pg, 'army'); await js_click(pg, '.bwa-em'); await settle(pg, .6)
@scene('army_emblem_picker_end')
async def _(pg): await via_hub(pg, 'army'); await js_click(pg, '.bwa-em'); await settle(pg, .5); await scroll_body(pg, '.bwa-sheet', 1)
@scene('army_housing_full')
async def _(pg):
    await pg.evaluate("() => { const a = __bw.econ.st.army; window.__sp0 = a.space; a.space = 0; for (const f of Object.values(a.fam)) f.used = f.cap; }"); await army(pg); await settle(pg, .3)
@scene('army_housing_full_end')
async def _(pg): await army(pg); await scroll_body(pg, '.bwa-body', 1)
# ---------------- Shop
SB = '.bws-body'
ST = lambda t: f'.bws-tabs button[data-t="{t}"]'
async def shop(pg, tab='boost'): await via_hub(pg, 'shop'); await js_click(pg, ST(tab)); await settle(pg, .5)
@scene('shop_boosts')
async def _(pg): await shop(pg)
@scene('shop_boosts_mid')
async def _(pg): await shop(pg); await scroll_body(pg, SB, .5)
@scene('shop_boosts_end')
async def _(pg): await shop(pg); await scroll_body(pg, SB, 1)
@scene('shop_boost_picked')
async def _(pg):
    await shop(pg); await js_click(pg, '.bws-seg[data-g="p"] button', 0); await js_click(pg, '.bws-seg[data-g="d"] button', 2); await settle(pg, .4)
@scene('shop_boost_armed')
async def _(pg):
    await pg.evaluate("() => { const e = __bw.econ; if (e.st.prem) e.st.prem.sap = 90000; }")
    await shop(pg); await js_click(pg, '.bws-c .bws-buy', 0); await settle(pg, .4)
@scene('shop_defense')
async def _(pg): await shop(pg, 'def')
@scene('shop_gems')
async def _(pg): await shop(pg, 'gem')
# ---------------- Rank / social
RB = '.bwk.on .bwk-body'
RT = lambda t: f'.bwk.on .bwk-tabs button[data-t="{t}"]'
async def rank(pg, tab='lb'): await via_hub(pg, 'rank'); await js_click(pg, RT(tab)); await settle(pg, .5)
@scene('rank_leaderboard')
async def _(pg): await rank(pg)
@scene('rank_leagues')
async def _(pg): await rank(pg, 'lg')
@scene('rank_leagues_end')
async def _(pg): await rank(pg, 'lg'); await scroll_body(pg, RB, 1)
@scene('rank_invite')
async def _(pg): await rank(pg, 'inv')
@scene('rank_invite_end')
async def _(pg): await rank(pg, 'inv'); await scroll_body(pg, RB, 1)
@scene('clan_home')
async def _(pg): await via_hub(pg, 'clan')
@scene('clan_create_form')
async def _(pg): await via_hub(pg, 'clan'); await js_click(pg, '.bwc-btn[data-a="create"]'); await settle(pg, .5)
@scene('friends')
async def _(pg): await via_hub(pg, 'friends')
@scene('log_history')
async def _(pg): await via_hub(pg, 'log')
# ---- populated server states (rank / clan / friends / log answer from the stubs below; the rig has no server)
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
@scene('rank_board_full')
async def _(pg): await populated(pg); await rank(pg, 'lb')
@scene('rank_board_full_end')
async def _(pg): await populated(pg); await rank(pg, 'lb'); await scroll_body(pg, RB, 1)
@scene('rank_leagues_cobalt')
async def _(pg): await populated(pg); await rank(pg, 'lg')
@scene('rank_invite_link')
async def _(pg): await populated(pg); await rank(pg, 'inv')
@scene('rank_invite_link_end')
async def _(pg): await populated(pg); await rank(pg, 'inv'); await scroll_body(pg, RB, 1)
@scene('clan_join_list')
async def _(pg): await populated(pg); await via_hub(pg, 'clan'); await settle(pg, .6)
@scene('clan_join_list_end')
async def _(pg): await populated(pg); await via_hub(pg, 'clan'); await settle(pg, .5); await scroll_body(pg, RB, 1)
@scene('clan_mine')
async def _(pg): await populated(pg, True); await via_hub(pg, 'clan'); await settle(pg, .6)
@scene('clan_mine_end')
async def _(pg): await populated(pg, True); await via_hub(pg, 'clan'); await settle(pg, .5); await scroll_body(pg, RB, 1)
@scene('friends_list')
async def _(pg): await populated(pg); await via_hub(pg, 'friends'); await settle(pg, .6)
@scene('friends_list_end')
async def _(pg): await populated(pg); await via_hub(pg, 'friends'); await settle(pg, .5); await scroll_body(pg, RB, 1)
@scene('log_list')
async def _(pg): await populated(pg); await via_hub(pg, 'log'); await settle(pg, .6)
@scene('log_list_end')
async def _(pg): await populated(pg); await via_hub(pg, 'log'); await settle(pg, .5); await scroll_body(pg, RB, 1)
# ---------------- Settings
for tab in ('sound', 'graphics', 'controls', 'about'):
    def mk(tab, frac):
        async def f(pg):
            await via_hub(pg, 'set'); await js_click(pg, f'.bw-tab[data-t="{tab}"]'); await settle(pg, .4)
            if frac is not None: await scroll_body(pg, '.bw-body', frac)
        return f
    scene(f'settings_{tab}')(mk(tab, None)); scene(f'settings_{tab}_mid')(mk(tab, .5)); scene(f'settings_{tab}_end')(mk(tab, 1))
# ---------------- Building sheets over the HUD (round-1 sheets next to the round-2 HUD)
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
async def open_sheet(pg, id, dist):
    await close_all(pg); found = None
    for az in (0.9, 2.4, 3.9, 5.4, 1.6, 3.1, 4.6):
        r = await pg.evaluate(POSE, [id, dist, az])
        if r is None: raise Skip('no pick ' + id)
        await rerender(pg, 6); found = await pg.evaluate(FIND, [id])
        if found.get('ok'): break
    if not found.get('ok'): raise Skip('cannot hit ' + id)
    await pg.evaluate("([x, y]) => { __bw.ctl.onTap(x, y); }", [found['x'], found['y']])
    for _ in range(40):
        ok = await pg.evaluate("() => { const s = document.querySelector('.bsh.on'); if (!s) return false; const r = s.getBoundingClientRect(); return getComputedStyle(s).transform === 'none' && r.top < innerHeight - 40; }")
        if ok: break
        await asyncio.sleep(0.3)
    await settle(pg, .6)
async def sheet_close(pg):
    await pg.evaluate("() => document.querySelector('.bsh.on .bsh-x') && document.querySelector('.bsh.on .bsh-x').click()"); await settle(pg, .8)
    await pg.evaluate(CAMBACK); await rerender(pg, 4)
@scene('sheet_barracks')
async def _(pg): await open_sheet(pg, 'barracks', 110)
@scene('sheet_mine')
async def _(pg): await sheet_close(pg); await open_sheet(pg, 'mine_ruby', 140)
@scene('sheet_forge')
async def _(pg): await sheet_close(pg); await open_sheet(pg, 'forge', 110)
@scene('sheet_dialog')
async def _(pg):
    for bid, dist in (('wall', 150), ('keep', 130), ('forge', 110)):
        await sheet_close(pg)
        try: await open_sheet(pg, bid, dist)
        except Skip: continue
        bb = await pg.evaluate("() => { const b = document.querySelector('.bsh-go .bsh-b:not([disabled]):not(.dis)'); if (!b) return null; const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, b.textContent]; }")
        if not bb: continue
        print('dialog try', bid, bb[2][:40], flush=True)
        await pg.mouse.move(bb[0], bb[1]); await pg.mouse.down(); await asyncio.sleep(1.8); await pg.mouse.up(); await settle(pg, 1.2)
        if await pg.evaluate("() => document.querySelector('.bsh-dlg') && document.querySelector('.bsh-dlg').classList.contains('on')"): return
    raise Skip('no dialog')
@scene('zz_end')
async def _(pg): await sheet_close(pg); await close_all(pg); raise Skip('end marker')

KEEP = """() => { if (document.getElementById('x-keep')) return; const s = document.createElement('style'); s.id = 'x-keep'; s.textContent = '@keyframes xk{from{transform:translateX(0)}to{transform:translateX(2px)}}#xk{position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none;z-index:1;animation:xk .5s linear infinite alternate}'; document.head.appendChild(s); const d = document.createElement('div'); d.id = 'xk'; document.body.appendChild(d); }"""
async def rerender(pg, need=6):
    await pg.evaluate(KEEP)
    f0 = await pg.evaluate('() => __bw.frames'); await pg.evaluate('() => __bw.pause(false)')
    for _ in range(120):
        await asyncio.sleep(0.5)
        if (await pg.evaluate('() => __bw.frames')) - f0 >= need: break
    await asyncio.sleep(1.0); await pg.evaluate('() => __bw.pause(true)'); await settle(pg, .5)
async def flat(pg, w, h):
    from PIL import Image, ImageStat; import io
    png = await pg.screenshot(clip={'x': 0, 'y': int(h * .4), 'width': 8, 'height': int(h * .4)}); im = Image.open(io.BytesIO(png)).convert('RGB')
    return sum(ImageStat.Stat(im).stddev) / 3 < 5
async def ensure_world(pg, w, h):
    for k in range(5):
        if not await flat(pg, w, h): return True
        print('world flat, retry', k, flush=True)
        await pg.set_viewport_size({'width': h, 'height': w}); await asyncio.sleep(.8); await rerender(pg, 8); await pg.set_viewport_size({'width': w, 'height': h}); await asyncio.sleep(.8); await rerender(pg, 10)
    return False
async def main():
    async with async_playwright() as p:
        b, pg = await load(p, TAG)
        b.contexts[0].on('page', lambda q: asyncio.ensure_future(q.close()))
        for ori, (w, h) in (('p', (390, 844)), ('l', (844, 390))):
            if ORI != 'both' and ORI != ori: continue
            await pg.evaluate(PREP); await pg.set_viewport_size({'width': w, 'height': h}); await rerender(pg); await close_all(pg); print('world ok', await ensure_world(pg, w, h), 'programs', await pg.evaluate('() => __bw.renderer.info.programs.length'), 'calls', await pg.evaluate('() => __bw.renderer.info.render.calls'), flush=True)
            for i, (name, fn) in enumerate(SC):
                if ONLY and not ONLY.search(name): continue
                try:
                    await pg.evaluate(RESTORE); await fn(pg)
                    if not os.environ.get('AUDONLY'): await shot(pg, f'{i:02d}_{name}', ori)
                    if AUDIT_ON: AUD[f'{ori}/{i:02d}_{name}'] = await pg.evaluate(AUDJS)
                except Skip as ex: print('SKIP', name, ori, str(ex)[:100], flush=True)
                except Exception as ex: print('FAIL', name, ori, str(ex)[:200], flush=True)
            await close_all(pg)
        if AUDIT_ON: json.dump(AUD, open(f'{OUT}audit.json', 'w'), indent=0)
        await b.close()
asyncio.run(main())
