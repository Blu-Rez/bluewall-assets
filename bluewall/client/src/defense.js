// Town defenses (owned by the "town" workstream): the weapons on the unroofed towers.
//   buildDefenses(ctx)      — during the world build, BEFORE the static batch is built (ctx.B, ctx.kit, ctx.hex, ctx.inst, ctx.pick, ctx.torch …)
//   lateDefenses(api)       — after the first frame; returns { update(t, dt, camera), ballistas }
// castle.js asks for a ballista or a cannon on each unroofed tower (ctx.weaponSites[i].kind). p22: the cannons are real now (cannons.js);
// `ballistas` stays the one handle the rest of the game uses (battle fire / hide / reset / Tesla replace) and routes to the right weapon.
import { createBallistas } from './ballista.js';
import { createCannons } from './cannons.js';
import { createQuadHouses } from './quadhouse.js';
import { createWizards } from './wizards.js';
import { createSpires } from './spires.js';                // p35: the frost spire and the flame tower on the roof caps
export function buildDefenses(ctx) { void ctx; }
export function lateDefenses(api) {
  const sites = api.ctx.weaponSites || [];
  const bal = createBallistas({ scene: api.scene, M: api.M, height: api.height, sites: sites.filter((s) => s.kind !== 'cannon' && s.kind !== 'quad' && s.kind !== 'wizard' && s.kind !== 'frost' && s.kind !== 'flame'), onFire: api.onFire });
  const can = createCannons({ scene: api.scene, M: api.M, sites: sites.filter((s) => s.kind === 'cannon'), onFire: api.onFire });
  const qh = createQuadHouses({ scene: api.scene, M: api.M, sites: sites.filter((s) => s.kind === 'quad'), onFire: api.onFire });
  const wz = createWizards({ scene: api.scene, sites: sites.filter((s) => s.kind === 'wizard') });
  const sp = createSpires({ scene: api.scene, M: api.M, sites: sites.filter((s) => s.kind === 'frost' || s.kind === 'flame') });
  const both = (fn) => (...a) => { if (bal[fn]) bal[fn](...a); if (can[fn]) can[fn](...a); if (qh[fn]) qh[fn](...a); if (wz[fn]) wz[fn](...a); if (sp[fn]) sp[fn](...a); };
  const weapons = {
    count: (bal.count || 0) + (can.count || 0) + (qh.count || 0) + (wz.count || 0) + (sp.count || 0),
    kindOf: (tid) => (can.has(tid) || qh.has(tid) ? 'cannon' : sp.has(tid) ? 'spire' : 'ballista'),                       // (the quad house also shoots balls)
    fire: (tid, x, y, z, q) => { if (can.has(tid)) can.fire(tid, x, y, z); else if (qh.has(tid)) qh.fire(tid, x, y, z, q); else if (wz.has(tid)) wz.fire(tid, x, y, z); else if (sp.has(tid)) sp.fire(tid); else if (bal.fire) bal.fire(tid, x, y, z); },
    hide: both('hide'), reset: both('reset'), replace: both('replace'), setManual: both('setManual'),
    update(t, dt, camera) { bal.update(t, dt, camera); can.update(t, dt, camera); qh.update(t, dt, camera); wz.update(t, dt, camera); sp.update(t, dt, camera); },
  };
  return { update(t, dt, camera) { weapons.update(t, dt, camera); }, ballistas: weapons };
}
