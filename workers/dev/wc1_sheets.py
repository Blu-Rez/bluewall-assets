# WC1: the numbered weapon sheets (one per sister, 3 options each, library models only = zero Tripo tokens, a glowing gem in her own colour on every weapon).
#   usage: python3 wc1_sheets.py [sister ...]   -> /home/claude/work/wc1/out/sheet_<sister>.png
import asyncio, sys, json
sys.path.insert(0, '/home/claude/dev')
from wc1_shot import *
OUT = '/home/claude/work/wc1/out/'
P = lambda pack, name, kind, len, **k: dict(pack=pack, name=name, kind=kind, len=len, **k)
SIS = {
 'elina': dict(dist=3.2, ty=0.95, title='ELINA', sub='fire · melee striker · short sword on the HIP (left, hilt forward)', default=1, opts=[
   dict(name='arming sword (your earlier pick #1)', items=[P('weapons_swords_medium', 'sword_med_arming', 'sword', 0.95)]),
   dict(name='kilij (curved)', items=[P('weapons_swords_medium', 'sword_med_kilij', 'sword', 0.92)]),
   dict(name='sabre', items=[P('weapons_swords_medium', 'sword_med_sabre', 'sword', 0.95)])]),
 'elika': dict(dist=2.8, ty=0.92, title='ELIKA', sub='wind · fast scout · two daggers, one on each HIP', default=2, opts=[
   dict(name='khanjar pair', items=[P('weapons_daggers_1', 'dagger_khanjar', 'dagger', 0.38, slot='L'), P('weapons_daggers_1', 'dagger_khanjar', 'dagger', 0.38, slot='R')]),
   dict(name='kris pair (wavy blade)', items=[P('weapons_daggers_1', 'dagger_kris', 'dagger', 0.40, slot='L'), P('weapons_daggers_1', 'dagger_kris', 'dagger', 0.40, slot='R')]),
   dict(name='jewelled pair', items=[P('weapons_daggers_2', 'dagger_jewelled', 'dagger', 0.37, slot='L'), P('weapons_daggers_2', 'dagger_jewelled', 'dagger', 0.37, slot='R')])]),
 'melika': dict(dist=3.5, ty=1.0, title='MELIKA', sub='plant · ranged healer · bow on the SHOULDER (slung on the back) + quiver on the right hip', default=1, opts=[
   dict(name='persian bow + persian quiver', items=[P('weapons_bows', 'bow_persian', 'bow', 1.25), P('weapons_arrows_quivers', 'quiver_persian', 'quiver', 0.62)]),
   dict(name='longbow + leather quiver', items=[P('weapons_bows', 'bow_longbow', 'bow', 1.55), P('weapons_arrows_quivers', 'quiver_leather', 'quiver', 0.62)]),
   dict(name='composite bow + persian quiver', items=[P('weapons_bows', 'bow_composite', 'bow', 1.15), P('weapons_arrows_quivers', 'quiver_persian', 'quiver', 0.62)])]),
 'mobina': dict(dist=4.4, ty=1.12, title='MOBINA', sub='stone · tank · hammer on the BACK / shoulder', default=1, opts=[
   dict(name='maul', items=[P('weapons_hammers_big', 'hammer_maul', 'hammer', 1.05)]),
   dict(name='sledge', items=[P('weapons_hammers_big', 'hammer_sledge', 'hammer', 1.00)]),
   dict(name='stone club', items=[P('weapons_hammers_big', 'club_stone', 'hammer', 0.95)])]),
 'aylin': dict(dist=3.4, ty=0.98, title='AYLIN', sub='water · support healer · staff IN THE HAND (always)', default=3, opts=[
   dict(name='serpent staff', items=[P('weapons_staffs_magic', 'staff_serpent', 'staff', 1.60)]),
   dict(name='royal sceptre', items=[P('weapons_staffs_magic', 'sceptre_royal', 'staff', 1.50)]),
   dict(name='wizard staff', items=[P('weapons_staffs_magic', 'staff_wizard', 'staff', 1.65)])]),
 'aylar': dict(dist=4.9, ty=1.25, title='AYLAR', sub='ice · controller · spear on the BACK / shoulder', default=1, opts=[
   dict(name='long spear', items=[P('weapons_spears', 'spear_long', 'spear', 1.85)]),
   dict(name='trident', items=[P('weapons_spears', 'spear_trident', 'spear', 1.75)]),
   dict(name='glaive', items=[P('weapons_polearms', 'polearm_glaive', 'spear', 1.85)])]),
}
W, H = 1500, 1150; ROWS = [(64, 410), (474, 410), (884, 230)]
async def sheet(p, key, spec, defidx=None):
    b, pg, logs = await open_page(p, W, H); res = []
    await pg.evaluate("([w, h]) => { __wc1.resize(w, h); __wc1.renderer.setClearColor(0x0b111b); __wc1.renderer.setScissorTest(false); __wc1.renderer.clear(); __wc1.renderer.setScissorTest(true); }", [W, H])
    cw = W // 3
    for i, o in enumerate(spec['opts']):
        info = await pg.evaluate("(o) => __wc1.dress(o)", dict(sister=key, items=o['items'], drawn=False)); res.append(info)
        await pg.evaluate("""([i, cw, rows, dist, ty]) => { const w = __wc1; w.scene.background.set(0x1b2536); w.setDrawn(false); w.syncHalo(); w.frameFigure(2.55, 0.10, 32, dist, ty); w.panel(i * cw, rows[0][0], cw, rows[0][1]);
            w.setDrawn(true); w.syncHalo(); w.frameFigure(0.62, 0.10, 32, dist, ty); w.panel(i * cw, rows[1][0], cw, rows[1][1]);
            const s = w.showcase(true); w.scene.background.set(0x121a28); w.frameShowcase(cw / rows[2][1], 26); w.panel(i * cw, rows[2][0], cw, rows[2][1]); w.showcase(false); }""", [i, cw, ROWS, spec.get('dist', 2.75), spec.get('ty', 0.92)])
    # labels (DOM, captured by the screenshot)
    gem = res[0]['gem']
    await pg.evaluate("""([key, spec, W, cw, rows, gem, defidx]) => { const w = __wc1; w.clearLabels();
        w.label(spec.title, 18, 8, { size: 30, bold: true, color: gem.el }); w.label(spec.sub, 18 + spec.title.length * 24 + 20, 18, { size: 15, color: '#cfd8e6' });
        w.label('gem = ' + gem.name + ' colour ' + gem.el + ' (glows)', W - 330, 20, { size: 13, color: gem.el });
        spec.opts.forEach((o, i) => { const x = i * cw; const d = i + 1 === defidx; w.label((i + 1) + (d ? '   ★ DEFAULT' : ''), x + 12, rows[0][0] + 4, { size: 34, bold: true, color: d ? '#ffd24a' : '#ffffff' }); w.label(o.name, x + 12, rows[0][0] + 44, { size: 15, color: '#e8eef8' });
            w.label('at rest (behind-left)', x + 12, rows[0][0] + rows[0][1] - 22, { size: 12, color: '#9fb0c8' }); w.label('drawn (fight) ', x + 12, rows[1][0] + rows[1][1] - 22, { size: 12, color: '#9fb0c8' }); w.label('the weapon alone', x + 12, rows[2][0] + rows[2][1] - 20, { size: 12, color: '#9fb0c8' }); }); }""", [key, spec, W, cw, ROWS, gem, defidx or spec['default']])
    path = f"{OUT}sheet_{key}.png"; await pg.screenshot(path=path); print(key, res[0]['kinds'], logs[:2]); await b.close(); return path
async def main():
    keys = sys.argv[1:] or list(SIS)
    async with async_playwright() as p:
        for k in keys: await sheet(p, k, SIS[k])
if __name__ == '__main__': asyncio.run(main())
