// WC1 unit checks (pure data, Node): carry.js defaults by weapon class + the kit fields kind / carry / gem / optional grip in validateKit.  Prints ok/FAIL lines and "WC1 UNIT OK".
import { KINDS, CARRY_OF, MOUNT, HOLD, weaponKind, carryOf } from '../bot/bluebot_v2/bluewall/web/assets/rpg/combat/carry.js';
import { validateKit } from '../bot/bluebot_v2/bluewall/web/assets/rpg/combat.js';
import ELINA from '../bot/bluebot_v2/bluewall/web/assets/rpg/combat/kit_elina.js';
let fails = 0, passes = 0; const ok = (c, msg) => { if (c) { passes++; console.log('ok   ' + msg); } else { fails++; console.log('FAIL ' + msg); } };
// the owner's rule (carry by class)
const rule = { short_sword: 'hip', sword: 'hip', dagger: 'hip', big_sword: 'back', bow: 'back', staff: 'hand', quiver: 'hip', spear: 'back', hammer: 'back', axe: 'back' };
for (const k of Object.keys(rule)) ok(carryOf({ kind: k, len: 1 }) === rule[k], `kind ${k} -> carry ${rule[k]} (default)`);
ok(KINDS.every((k) => CARRY_OF[k] && HOLD[k] != null), 'every kind has a carry default and a hold point');
ok(['hip', 'back_blade', 'back_pole', 'back_bow', 'quiver', 'hip_pair'].every((m) => MOUNT[m] && MOUNT[m].bone && MOUNT[m].pos.length === 3 && MOUNT[m].dir.length === 3), 'the mount table is complete (bone + pos + dir)');
ok(carryOf({ kind: 'short_sword', carry: 'back', len: 0.7 }) === 'back' && carryOf({ kind: 'big_sword', carry: 'hip', len: 1.4 }) === 'hip' && carryOf({ kind: 'sword', carry: 'hand', len: 0.9 }) === 'hand', 'the kit field `carry` overrides the class default');
ok(carryOf({ kind: 'short_sword', carry: 'neck', len: 0.7 }) === 'hip', 'an unknown `carry` value falls back to the class default');
// no `kind`: read from the file name, then the length
ok(weaponKind({ url: 'combat/staff_wizard.glb', len: 1.65 }) === 'staff' && weaponKind({ url: 'combat/bow_persian.glb', len: 1.2 }) === 'bow' && weaponKind({ url: 'combat/quiver_x.glb', len: 0.6 }) === 'quiver', 'kind from the file name: staff / bow / quiver');
ok(weaponKind({ url: 'combat/dagger_kris.glb', len: 0.4 }) === 'dagger' && weaponKind({ url: 'combat/sword_xl_claymore.glb', len: 1.45 }) === 'big_sword' && weaponKind({ url: 'combat/sword_arming.glb', len: 0.6 }) === 'short_sword', 'kind from the file name / length: dagger, big sword, short sword');
ok(weaponKind({ url: 'combat/spear_long.glb', len: 1.85 }) === 'spear' && weaponKind({ url: 'combat/hammer_maul.glb', len: 1.05 }) === 'hammer', 'kind from the file name: spear, hammer');
// the kit validator
const clone = () => JSON.parse(JSON.stringify(ELINA)), W0 = ELINA.weapons && ELINA.weapons[0];
ok(!!W0, 'kit_elina has a weapon to mutate');
const good = (mut, label) => { const k = clone(); mut(k); const r = validateKit(k); ok(r.ok, `accepted: ${label}${r.ok ? '' : '  ' + r.errors.join(' | ')}`); };
const bad = (mut, expect, label) => { const k = clone(); mut(k); const r = validateKit(k); ok(!r.ok && r.errors.some((e) => e.includes(expect)), `refused: ${label} -> "${expect}"${r.ok ? ' (ACCEPTED!)' : '  ' + r.errors.slice(0, 2).join(' | ')}`); };
good((k) => {}, 'the shipped kit unchanged');
for (const kd of KINDS) good((k) => { k.weapons[0].kind = kd; }, `kind: '${kd}'`);
for (const c of ['hip', 'back', 'hand']) good((k) => { k.weapons[0].carry = c; }, `carry: '${c}'`);
good((k) => { k.weapons[0].gem = false; }, 'gem: false');
good((k) => { delete k.weapons[0].grip; k.weapons[0].kind = 'staff'; }, 'a weapon without `grip` (optional)');
bad((k) => { k.weapons[0].kind = 'laser'; }, 'kit.weapons[0].kind', 'an unknown weapon kind');
bad((k) => { k.weapons[0].carry = 'neck'; }, 'kit.weapons[0].carry', 'an unknown carry place');
bad((k) => { k.weapons[0].gem = 'yes'; }, 'kit.weapons[0].gem', 'gem that is not a boolean');
bad((k) => { k.weapons[0].grip = { b: [1, 2], pos: [0, 0, 0] }; }, 'grip', 'a malformed grip');
bad((k) => { k.weapons[0].wear = 'belt'; }, 'kit.weapons[0].wear: unknown field', 'a typo in a weapon field (nothing can be tied on her)');
console.log(`\n${passes} checks passed, ${fails} failed`); console.log(fails ? 'WC1 UNIT FAILED' : 'WC1 UNIT OK'); process.exit(fails ? 1 : 0);
