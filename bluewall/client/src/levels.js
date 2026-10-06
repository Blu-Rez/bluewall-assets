// Structure levels (1-20) and what they look like. The look itself (wood / stone / iron / gold / diamond / blue crystal and the pieces that
// unlock with level) is done on the GPU by skin.js; this module owns the levels and the few non-batched things that depend on them.
//   createLevels(api) -> { setEntity(id, lv), setMany({id: lv}), setLevel(n) (all structures), get(id), tier(id), LV, update() }
// api: { scene, M, ctx, TROOF, flags, town, mines, Q }
import { ENT, setEntityLevel, levelOf, tierOf, TIER_NAME } from './skin.js';

export function createLevels(api) {
  const { M, ctx, flags } = api;
  const LV = { rune: 1 };
  function apply() {
    const wall = levelOf('wall'), keep = levelOf('keep');
    if (flags.mesh) flags.mesh.visible = wall >= 4;
    const b = keep >= 20 ? 1.3 : keep >= 16 ? 0.95 : keep >= 12 ? 0.7 : keep >= 8 ? 0.45 : 0;
    if (ctx.beam) { ctx.beam.visible = b > 0; ctx.beam.scale.set(0.6 + b * 0.6, 1, 0.6 + b * 0.6); }
    if (M.banner) M.banner.color.setScalar(wall >= 4 ? 1 : 0.6);
    LV.rune = tierOf(keep) / 5;
    for (const f of ctx.levelHooks || []) { try { f(); } catch (e) { console.warn('level hook', e); } }
  }
  const api2 = {
    LV,
    get: (id) => levelOf(id),
    tier: (id) => tierOf(levelOf(id)),
    tierName: (id) => TIER_NAME[tierOf(levelOf(id))],
    setEntity(id, lv) { setEntityLevel(id, lv); apply(); },
    setMany(o) { for (const [id, lv] of Object.entries(o || {})) if (ENT[id]) setEntityLevel(id, lv); if (o && o.wall != null) setEntityLevel('townwall', o.wall); apply(); },
    setLevel(n) { n = Math.max(1, Math.min(30, Math.round(+n || 30))); for (const id of Object.keys(ENT)) if (ENT[id] > 0) setEntityLevel(id, n); apply(); },
    update() {},
  };
  return api2;
}
