// Unit rarity: five tiers by how strong ONE soldier is (the very same formula the server uses for army power: sqrt(hp * dps) / 3), so the tier of a unit can never drift
// from its real strength:  Common < 22  ·  Rare < 60  ·  Epic < 100  ·  Legendary < 200  ·  Mythic >= 200.  The building level that opens a unit follows the tier (military.py UNITS: Common 1-4, Rare 5-8, Epic 9-12, Legendary 13-16, Mythic 17-20).   (Today: spear/sword/guard/archer/imp = Common, cavalry/pegasus/mage/catapult = Rare,
// baby dragon/ram/cannon/werewolf/trebuchet/shield maiden = Epic, giant/lord/hill giant = Legendary, dragon = Mythic.)
//   TIERS[i] = { k, name, c (colour), g (glow) },  RARITY[unit] = tier,  rarityStyle(unit) -> 'inline css variables' for the cards
import DEFS from './unitdefs.json';

export const TIERS = [
  { k: 'common', name: 'Common', c: '#c3cfe0', g: 'rgba(195,207,224,.4)' },        // steel
  { k: 'rare', name: 'Rare', c: '#4fe08a', g: 'rgba(79,224,138,.55)' },             // green
  { k: 'epic', name: 'Epic', c: '#b660ff', g: 'rgba(182,96,255,.62)' },             // purple
  { k: 'legendary', name: 'Legendary', c: '#ffb52e', g: 'rgba(255,181,46,.68)' },   // gold
  { k: 'mythic', name: 'Mythic', c: '#38b6ff', g: 'rgba(70,190,255,.95)' },         // the strongest is BLUE (the owner's rule)
];
const CUT = [22, 60, 100, 200];
export const unitPower = (t) => { const u = DEFS.units[t]; return u ? Math.sqrt(u.hp * u.dps) / 3 : 0; };
export const RARITY = {};
for (const t of Object.keys(DEFS.units)) { const p = unitPower(t); let i = 0; while (i < CUT.length && p >= CUT[i]) i++; RARITY[t] = TIERS[i]; }
export const rarityStyle = (t) => { const r = RARITY[t] || TIERS[0]; return `--rc:${r.c};--rg:${r.g}`; };
