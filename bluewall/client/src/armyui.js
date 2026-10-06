// Army UI.  Home: the ATTACK button (bottom-left, % of the housing filled) and the ARMY chip above it; the chip opens the barracks sheet:
//   * Troops / Spells tabs with a grid of portrait cards (3D renders of the real models): tap = queue one more, hold = keep adding,
//     the little i opens the details, locked cards say which building level unlocks them
//   * every production building has a live queue: the soldiers come out ONE BY ONE, tap a queued soldier to take it out again (full refund),
//     Rush finishes the whole queue for turquoise
//   * the banner emblem (the emoji the enemy sees on your walls and flags) is picked from the round button in the header
// Rules live on the server (military.py); taps are batched (450 ms) into one train / brew request.
//   createArmyUI(mount, { econ, ui, audio, onAttack }) -> { open(), close(), update(), readiness(), attack() }
import { findOpponent } from './search.js';
import { createLoadView } from './bhud.js';
import { GEMS } from './ui.js';
import DEFS from './unitdefs.json';
import { PORTRAIT } from './portraits.js';
import { SPELLS, SPELL_ORDER, spellIcon } from './spells.js';
import { crestImg, normEmblem } from './emblems.js';
import { RARITY, rarityStyle } from './rarity.js';
import { TIER_AT, TIER_COL, TIER_NAME, PERK } from './unitlook.js';

export const NAME = { spear: 'Spearman', sword: 'Swordsman', guard: 'Shield Guard', archer: 'Archer', cavalry: 'Knight Cavalry', axerider: 'Axe Rider', pegasus: 'Winged Horse', baby: 'Baby Dragon', dragon: 'Dragon', catapult: 'Catapult', giant: 'Troll Giant', imp: 'Frost Imp', mage: 'Bone Mage', ram: 'Battering Ram', cannon: 'Cannon', werewolf: 'Werewolf', trebuchet: 'Trebuchet', hill: 'Hill Giant', shieldmaiden: 'Shieldmaiden', lord: 'Mounted Lord', dragonling: 'Dragonling', legionary: 'Legionary', captain: 'Captain', ogre: 'Ogre', gryphon: 'Gryphon', lich: 'Lich', treant: 'Treant', gryphonknight: 'Gryphon Knight', darkrider: 'Dark Rider', baby3: 'Triple Whelp', dragon3: 'Triple Dragon' };
const DESC = {
  spear: 'Spearman behind a shield wall. Cheap and quick to train: the backbone of every army.', sword: 'Claymore swordsman. Hits hard in melee and cuts through defenders.',
  guard: 'Sword and shield guard. Slow and very tough: soaks up arrows and ballista bolts.', archer: 'Shoots over the walls from a safe distance.',
  cavalry: 'Armoured knights on warhorses. Fast: ride down archers and siege crews.', pegasus: 'Winged horse. Flies over the walls and strikes from above.',
  baby: 'A young dragon. Flies and breathes fire on whatever it passes.', dragon: 'The legend. Flies, tough as a tower, and burns whole buildings.',
  catapult: 'Siege engine. Hurls rocks that smash walls and towers from far away.', giant: 'The troll walks through arrows and tears down buildings with its bare hands.',
  imp: 'A small, fast, frost-blue imp. Swarms the defenders and runs down the gunners.', mage: 'A skeleton caster. Its orbs burst on impact and hurt everyone in a small area, from far behind the line.',
  ram: 'A battering ram under a shield roof. Walks straight to the gate and smashes walls and buildings.', cannon: 'Siege cannon. A fast flat shot with heavy damage to towers and ballistae.',
  werewolf: 'A huge fast beast of the night. Rips through guards and runs down archers.', trebuchet: 'The longest reach in the army. Hurls huge boulders that crush a whole building block.',
  hill: 'A hammer-wielding hill giant. Slow, enormously tough and brutal against buildings.', shieldmaiden: 'A hero of the shield wall. Very tough, hits hard and holds the front line.',
  axerider: 'Heavy shock cavalry: Roman helm, plate and a long axe. Twice as tough as a knight and hits far harder.',
  lord: 'The mounted lord, a hero on a black warhorse. Charges deep into the base and cuts down everything in the way.',
  dragonling: 'A small green dragon. Quick in the air and breathes green fire on whatever it passes.',
  legionary: 'A Roman legionary with tower shield and short sword. Cheap, disciplined and quick to train.',
  captain: 'The captain, your first hero. His Banner makes every soldier around him hit harder for a few seconds.',
  ogre: 'A brutal ogre with a spiked club. Every blow lands on a whole crowd, not only on its target.',
  gryphon: 'A winged beast of the high crags. Fast, strong, and it falls on the enemy from the air.',
  lich: 'A skeletal lich. Its death-orbs burst over a wide area and burn through massed defenders from far behind the line.',
  treant: 'An ancient walking tree. Slow, enormous, and it heals itself while it fights.',
  gryphonknight: 'A hero knight riding a gryphon. Dive Strike drops on the nearest foe like a thunderbolt.',
  darkrider: 'A hero in black armour on a dark dragon. Shadow Breath doubles and widens its fire for six seconds.',
  baby3: 'A young three-headed dragon: three breaths at once, a wide curtain of fire.',
  dragon3: 'The rarest of all: a huge three-headed dragon that rains fire over whole blocks of the castle.',
};
const FAM = { barracks: 'Barracks', training: 'Training Ground', stable: 'Stable', lair: 'Dragon Lair', workshop: 'Siege Workshop' };
// line icons (fallback when a portrait is missing, and the tiny ones in the result list).  24 x 24, drawn with currentColor.
export const ICON = {
  spear: 'M4 20L17 7M14 4l6-1-1 6-5-5zM4 20l-1 1M7 17l2 2',
  sword: 'M20.5 3.5L10 14M14 4l6.5-.5L20 10M7.5 11.5l5 5M10 14l-5.5 5.5M3.5 20.5h2',
  guard: 'M12 3l7.5 3v6c0 4.2-3.2 7.2-7.5 9-4.3-1.8-7.5-4.8-7.5-9V6zM12 7v11M8 11h8',
  archer: 'M7 3c10 3 10 15 0 18M7 3v18M3 12h16M15.5 8.5L19 12l-3.5 3.5',
  cavalry: 'M5 20v-6l2-5 4 1 2-4 4 2-1 4 3 3v5M9 20v-4M16 20v-4M11 9l2 2',
  axerider: 'M4 21v-5l2-4 3 1 2-3 3 1M8 21v-3M13 21v-3M12 10l7-7M15 3l5 1-1 5-3-2',
  pegasus: 'M4 20v-5l3-4 3 1 2-3M10 12l9-8c1 6-1 10-6 11M8 20v-4M14 20v-4M13 9c-3-1-5 0-6 2',
  baby: 'M5 17c0-5 4-9 9-9l4-3-1 5c2 2 1 6-3 7l-2 3-3-2zM10 11h.01',
  dragon: 'M3 15c3-1 4-5 8-6l1-5 3 3 5-1-3 4c1 4-3 9-8 9-3 0-5-1-6-4zM12 12h.01',
  catapult: 'M3 19h18M6 19l3-8M14 19l-3-8M9 11l8-7M17 4l3 1-1 3M4 21h3M14 21h3',
  giant: 'M9 4h6l1 5-2 2v4l2 5h-3l-1-4-1 4H8l2-5v-4L8 9z',
  imp: 'M6 5l3 3M18 5l-3 3M7 9h10l1 6-3 5H9l-3-5zM9 12h.01M15 12h.01M10 16h4',
  mage: 'M12 2l5 9H7zM5 11h14M9 14a3 3 0 0 0 6 0M10 20l2-3 2 3M12 22v0',
  ram: 'M3 15h14l3-3v-2l-3-1H6l-3 3zM6 15v4M14 15v4M17 9l3-2',
  cannon: 'M3 14h13l5-4v6l-5-2H3zM7 17v3M13 17v3M4 20h12',
  werewolf: 'M5 20l1-8 3-3-1-5 4 3 4-3-1 5 3 3 1 8M9 13h.01M15 13h.01M10 17h4',
  trebuchet: 'M4 20h14M7 20l3-12M15 20l-3-12M10 8l8-4M18 4l2 1-1 3M3 21l2-1',
  hill: 'M8 4h8l1 4-2 2v3l3 7h-4l-1-5-1 5H8l3-7v-3L7 8zM17 2l4 3-2 3',
  shieldmaiden: 'M12 2l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V5zM12 6v10M8 10h8M16 3l3 2',
  lord: 'M3 21v-6l2-4 3 1 2-4 4 2-1 3 3 2v6M7 21v-4M14 21v-4M12 5l3-3 2 2',
  dragonling: 'M8 8l-2-4 4 2M16 8l2-4-4 2M7 9h10l1 5-3 4H9l-3-4zM3 11l4 1M21 11l-4 1M10 12h.01M14 12h.01',
  legionary: 'M6 4h12v9c0 4-3 6-6 8-3-2-6-4-6-8zM12 6v12M9 11h6M19 3l-5 5',
  captain: 'M12 2l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V5zM12 2v18M5 7h14M9 14l3-3 3 3',
  ogre: 'M7 5h10l2 5-2 5v5h-3v-3h-4v3H7v-5L5 10zM9 10h.01M15 10h.01M9 14h6M19 3l2 5',
  gryphon: 'M4 18l5-4 3 1 4-6 4 2-3 3 1 4-4 1-3 3-3-2zM12 9l-2-5M16 7l1-4M8 14h.01',
  lich: 'M12 2l5 9H7zM8 11v4a4 4 0 0 0 8 0v-4M10 20l2-3 2 3M12 7h.01M9 14l-4 4M15 14l4 4',
  treant: 'M12 22v-8M12 14l-5-4M12 14l5-4M12 10l-4-5M12 10l4-5M12 8V3M9 22h6',
  gryphonknight: 'M3 19l5-4 3 1 4-6 4 2-3 3 1 4-4 1-3 3-3-2zM13 9l-2-5M17 7l1-4M12 3l3 1',
  darkrider: 'M3 15c3-1 4-5 8-6l1-5 3 3 5-1-3 4c1 4-3 9-8 9-3 0-5-1-6-4zM12 12h.01M7 4l2 3M3 8l3 2',
  baby3: 'M12 14c-3 0-5-2-5-5l1-4 2 3 2-3 2 3 2-3 1 4c0 3-2 5-5 5zM8 20l4-6 4 6M10 9h.01M14 9h.01',
  dragon3: 'M3 15c3-1 4-5 8-6M12 14c-3 0-6-3-6-8l2 3 2-5 2 5 2-5 2 5 2-3c0 5-3 8-6 8zM12 14l-4 7M12 14l4 7M9 6h.01M15 6h.01',
  ready: 'M5 19L17 7M14 6h4v4M4 20l2-2M19 19L7 7M10 6H6v4M20 20l-2-2',
};
export const icon = (k, sz = 26) => `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON[k] || ICON.ready}"/></svg>`;
// the round portrait of a soldier (3D render) or the line icon when there is none
export const unitPic = (k, sz = 40) => PORTRAIT[k] ? `<img src="${PORTRAIT[k]}" width="${sz}" height="${sz}" alt="" draggable="false" style="border-radius:50%;object-fit:cover;display:block">` : icon(k, Math.round(sz * 0.7));
const WHY = { gems: 'Not enough gems', locked: 'Upgrade the building first', family_full: 'This building is full', army_full: 'Army housing is full (upgrade the Training Ground)', not_built: 'Build it first',
  no_training: 'Build the Training Ground', slow: 'Too fast, try again', bad: 'Not possible', offline: 'Offline preview', closed: 'Attacks are not open yet', no_army: 'Train some soldiers first', queue_full: 'The queue is full', too_long: 'The queue is too long',
  spell_full: 'The Forge cannot hold more spells', hero_cap: 'No free hero slot (at most 3 of each hero)' };
const fmtN = (n) => Math.floor(n).toLocaleString('en-US');
function fmtT(s) { s = Math.max(0, Math.ceil(s)); const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), c = s % 60; return d ? `${d}d ${h}h` : h ? `${h}h ${String(m).padStart(2, '0')}m` : m ? `${m}:${String(c).padStart(2, '0')}` : `${c}s`; }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CSS = `
.bwa-btn{pointer-events:auto;position:absolute;left:calc(12px + var(--sl));bottom:calc(var(--sb) + 16px);width:92px;height:96px;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .15s,opacity .6s}
.bwa-btn:active{transform:scale(.93)}
.bw-ui.wel>.bwa-btn,.bw-ui.wel>.bwa-chip{opacity:0;pointer-events:none}
.bwa-btn .ring{position:absolute;left:3px;top:2px;width:80px;height:80px;border-radius:50%;background:conic-gradient(from 0deg,#8fe0ff calc(var(--p,0) * 1%),#0a1c3e 0);box-shadow:0 6px 16px rgba(0,0,0,.6),0 0 0 2px #01060f,0 0 20px rgba(90,170,255,.3)}
.bwa-btn .ring:before{content:"";position:absolute;inset:-3px;border-radius:50%;background:conic-gradient(from 200deg,#f2f7ff,#8aa0bd 20%,#3a4d6e 40%,#d6e4f5 58%,#6d83a6 78%,#f2f7ff);z-index:-1}
.bwa-btn .core{position:absolute;left:10px;top:9px;width:66px;height:66px;border-radius:50%;background:radial-gradient(circle at 50% 25%,#2f4f86,#0b1f4a 58%,#030a1c);box-shadow:inset 0 2px 7px rgba(170,215,255,.5),inset 0 -6px 12px rgba(0,0,0,.6);display:grid;place-items:center;color:#d9f2ff;overflow:hidden}
.bwa-btn .core svg{filter:drop-shadow(0 2px 2px rgba(0,0,0,.7));width:34px;height:34px;margin-top:-6px}
.bwa-btn .core b{position:absolute;left:0;right:0;bottom:7px;text-align:center;font-size:13px;color:#d9f2ff;text-shadow:0 1px 0 #000,0 0 6px #000;letter-spacing:.3px}
.bwa-btn .core:after{content:"";position:absolute;left:-60%;top:0;width:40%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);transform:skewX(-18deg);opacity:0}
.bwa-btn.hot .core:after{animation:bwaGleam 3.2s ease-in-out infinite}
.bwa-btn.hot .ring{box-shadow:0 6px 16px rgba(0,0,0,.6),0 0 0 2px #01060f,0 0 24px rgba(255,90,100,.8)}
@keyframes bwaGleam{0%,55%{left:-60%;opacity:0}60%{opacity:.9}100%{left:130%;opacity:0}}
.bwa-btn .lb{position:absolute;left:0;right:0;bottom:0;text-align:center;font-size:11px;letter-spacing:2.4px;color:#ffe6e8;text-shadow:0 1px 0 #01060f,1px 0 0 #01060f,-1px 0 0 #01060f,0 0 6px rgba(0,0,0,.85);padding-left:2px}
.bwa-btn.off{filter:grayscale(.6) brightness(.8)}
.bwa-chip{pointer-events:auto;position:absolute;left:calc(14px + var(--sl));bottom:calc(var(--sb) + 118px);height:30px;padding:0 12px 0 8px;display:flex;align-items:center;gap:5px;border-radius:15px;font-size:11.5px;letter-spacing:.8px;color:#cfe8ff;
  background:linear-gradient(180deg,rgba(24,52,104,.92),rgba(5,14,36,.94));border:1px solid rgba(140,200,255,.45);box-shadow:0 3px 10px rgba(0,0,0,.5);cursor:pointer;transition:opacity .6s}
.bwa-chip svg{width:17px;height:17px}.bwa-chip i{font-style:normal;color:#7dffb5;margin-left:2px}
.bwa{position:absolute;inset:0;pointer-events:auto;z-index:12;background:rgba(0,3,10,.66);opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s;font-family:'Libre Baskerville','Noto Sans Tai Viet',Georgia,serif;color:#eaf6ff;-webkit-tap-highlight-color:transparent}
.bwa.on{opacity:1;visibility:visible}
.bwa *{box-sizing:border-box}
.bwa-pan{position:absolute;left:max(22px,calc(var(--sl) + 16px));right:max(22px,calc(var(--sr) + 16px));top:calc(var(--st) + max(64px,12vh));bottom:calc(var(--sb) + max(64px,12vh));max-width:440px;margin:0 auto;display:flex;flex-direction:column;border-radius:22px;overflow:hidden;
  background:linear-gradient(180deg,#0d2a5c,#050f26 38%,#020712);border:1.5px solid rgba(150,200,255,.4);box-shadow:0 20px 60px rgba(0,0,0,.7),inset 0 1px 0 rgba(200,230,255,.25);transform:translateY(18px) scale(.98);transition:transform .3s}
.bwa.on .bwa-pan{transform:none}
.bwa-h{display:flex;align-items:center;gap:11px;padding:12px 12px 6px 12px}
.bwa-em{flex:0 0 auto;position:relative;width:48px;height:52px;display:grid;place-items:center;cursor:pointer;color:#fff;background:none;border:0;padding:0;font-family:inherit;filter:drop-shadow(0 3px 5px rgba(0,0,0,.55))}
.bwa-em:after{content:"✎";position:absolute;right:-4px;bottom:-4px;width:19px;height:19px;border-radius:50%;display:grid;place-items:center;font-size:11px;background:#1b4fb8;border:1.5px solid #cfe6ff;color:#fff}
.bwa-h .t{flex:1;min-width:0}.bwa-h .t b{display:block;font-size:19px;color:#e6f6ff;letter-spacing:.5px}.bwa-h .t span{font-size:11.5px;color:#8fb4e0;letter-spacing:.6px}.bwa-h .t span b{display:inline;font-size:inherit;color:#bfe6ff}
.bwa-x{width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:rgba(255,255,255,.08);border:1px solid rgba(150,200,255,.25);font-size:14px;cursor:pointer}
.bwa-hs{margin:4px 14px 2px}
.bwa-hs .r{display:flex;justify-content:space-between;align-items:baseline;font-size:12px;color:#a9c4e6}.bwa-hs .r b{color:#eaf6ff;font-size:14px}.bwa-hs .r em{font-style:normal;color:#7dffb5}
.bwa-bar{position:relative;margin-top:5px;height:11px;border-radius:6px;background:#020814;border:1px solid rgba(120,190,255,.35);overflow:hidden}
.bwa-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:6px;background:linear-gradient(90deg,#2b86ff,#7ef0ff);box-shadow:0 0 8px rgba(110,232,255,.7);transition:width .4s}
.bwa-bar i.q{background:repeating-linear-gradient(45deg,#2f9f6a,#2f9f6a 5px,#1f7a4f 5px,#1f7a4f 10px);box-shadow:none;opacity:.9}
.bwa-tabs{display:flex;gap:6px;margin:10px 12px 0;padding:4px;border-radius:14px;background:rgba(2,8,20,.7);border:1px solid rgba(120,190,255,.2)}
.bwa-tabs button{flex:1;padding:9px 6px;border-radius:11px;border:0;background:transparent;color:#8fb4e0;font-weight:700;font-size:13px;line-height:1;font-family:inherit;letter-spacing:1.2px;cursor:pointer;text-transform:uppercase}
.bwa-tabs button.on{color:#fff;background:linear-gradient(180deg,#3d8cff,#1b4fb8);box-shadow:0 2px 8px rgba(40,110,230,.5)}
.bwa-body{flex:1;overflow-y:auto;padding:6px 10px 14px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.bwa-ft{padding:8px 12px 12px;background:linear-gradient(0deg,#020712 60%,rgba(2,7,18,0))}
.bwa-ft button{width:100%;padding:13px;border-radius:15px;border:1px solid #ffc4c9;background:linear-gradient(180deg,#ff6b78,#b81f34);color:#fff;font-weight:700;font-size:15px;letter-spacing:1.5px;font-family:inherit;cursor:pointer;box-shadow:0 4px 14px rgba(220,40,60,.4)}
.bwa-ft button:disabled{opacity:.5;filter:grayscale(.5)}
.bwa-sec{margin:10px 2px 4px;font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:#7fa6d8;display:flex;justify-content:space-between}
.bwa-lane{margin:7px 0;padding:9px 10px;border-radius:14px;background:linear-gradient(180deg,rgba(40,90,170,.2),rgba(10,30,70,.25));border:1px solid rgba(120,190,255,.28)}
.bwa-lane .hd{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#cfe6ff}.bwa-lane .hd b{flex:1;font-size:13px;color:#eaf6ff}.bwa-lane .hd .tm{color:#7ef0ff;font-variant-numeric:tabular-nums}
.bwa-lane .rush{padding:5px 9px;border-radius:10px;border:1px solid #bff6ff;background:linear-gradient(180deg,#6ff0ff,#1b86c8);color:#021;font-weight:700;font-size:12px;line-height:1;font-family:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:3px}
.bwa-lane .rush:disabled{opacity:.45;filter:grayscale(.6)}.bwa-lane .rush .gem3{width:15px;height:15px}
.bwa-lane .it{display:flex;gap:7px;margin-top:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}.bwa-lane .it::-webkit-scrollbar{display:none}
.bwa-lane .mi{flex:0 0 auto;position:relative;width:46px;height:46px;border-radius:50%;cursor:pointer;touch-action:pan-x;background:#0a1c3e;border:2px solid #6fa8e8;padding:0}
.bwa-lane .mi:first-child{border-color:#7ef0ff;box-shadow:0 0 0 2px rgba(126,240,255,.3),0 0 12px rgba(126,240,255,.5)}
.bwa-lane .mi .nn{position:absolute;right:-5px;bottom:-5px;min-width:20px;height:20px;padding:0 4px;border-radius:10px;display:grid;place-items:center;font-size:11.5px;font-weight:700;color:#fff;background:#1b4fb8;border:1.5px solid #cfe6ff;text-shadow:0 1px 0 #000}
.bwa-lane .mi .rm{position:absolute;left:-5px;top:-5px;width:17px;height:17px;border-radius:50%;display:grid;place-items:center;font-size:12px;line-height:1;background:#b81f34;border:1.5px solid #ffc4c9;color:#fff}
.bwa-lane .mi svg{position:absolute;inset:0;margin:auto;color:#cfe9ff}
.bwa-lane .hint{margin-top:5px;font-size:10.5px;color:#7f9cc4}
.bwa-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:4px}
.bwa-c{position:relative;display:flex;flex-direction:column;align-items:center;padding:6px 4px 7px;border-radius:15px;cursor:pointer;user-select:none;-webkit-user-select:none;touch-action:pan-y;transition:transform .12s,box-shadow .12s;
  background:linear-gradient(180deg,#1b3f80,#08162f);border:1.5px solid var(--rc,#7fa6d8);box-shadow:0 3px 9px rgba(0,0,0,.5),0 0 10px var(--rg,transparent),inset 0 1px 0 rgba(200,230,255,.3)}
.bwa-c .rt{position:absolute;left:50%;top:-8px;transform:translateX(-50%);padding:0 7px;height:15px;line-height:15px;border-radius:8px;font-size:8.5px;font-style:normal;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;white-space:nowrap;color:#06122e;background:var(--rc);box-shadow:0 1px 4px rgba(0,0,0,.6);z-index:2}
.bwa-c:active:not(.lk){transform:scale(.95)}
.bwa-c.pop{animation:bwaPop .25s}@keyframes bwaPop{50%{transform:scale(1.07);box-shadow:0 0 18px rgba(126,240,255,.7)}}
.bwa-c .pic{width:100%;aspect-ratio:1/0.92;border-radius:11px;overflow:hidden;display:grid;place-items:center;background:radial-gradient(circle at 50% 30%,#17356d,#050d20);color:#bfe6ff}
.bwa-c .pic img{width:100%;height:100%;object-fit:cover;display:block;pointer-events:none}
.bwa-c .pic svg{width:46%;height:46%}
.bwa-c.sp .pic{background:radial-gradient(circle at 50% 35%,#162f60,#050d20)}.bwa-c.sp .pic svg{width:74%;height:74%}
.bwa-c b.nm{margin-top:5px;font-size:11.5px;color:#eaf6ff;text-align:center;line-height:1.15;min-height:2.3em;display:flex;align-items:center}
.bwa-c .cs{display:flex;gap:7px;justify-content:center;flex-wrap:wrap;font-size:11.5px;color:#e6f2ff;margin-top:2px;min-height:17px}.bwa-c .cs span{display:inline-flex;align-items:center;gap:2px}.bwa-c .cs span.no{color:#ff9aa8}.bwa-c .cs .gem3{width:15px;height:15px}
.bwa-c .pic{position:relative}.bwa-c .lvb{position:absolute;left:4px;bottom:4px;padding:1px 6px;border-radius:8px;font-size:10px;font-style:normal;font-weight:800;color:#06122e;background:var(--tc);box-shadow:0 1px 3px rgba(0,0,0,.6);z-index:2}
.bwa-c .own{position:absolute;left:4px;top:4px;padding:1px 7px;border-radius:9px;font-size:12px;font-style:normal;font-weight:700;color:#fff;background:rgba(2,8,20,.82);border:1px solid rgba(150,200,255,.5);text-shadow:0 1px 0 #000}
.bwa-c .qd{position:absolute;right:4px;top:4px;padding:1px 7px;border-radius:9px;font-size:12px;font-style:normal;font-weight:700;color:#fff;background:linear-gradient(180deg,#38c47a,#1c7a4a);border:1px solid #b6ffd6;display:none}
.bwa-c.has .qd{display:block}
.bwa-c .inf{position:absolute;right:4px;bottom:4px;width:19px;height:19px;border-radius:50%;display:grid;place-items:center;font:italic 700 11px/1 Georgia,serif;color:#cfe6ff;background:rgba(2,8,20,.75);border:1px solid rgba(150,200,255,.5)}
.bwa-c.lk{cursor:default}.bwa-c.lk .pic{filter:grayscale(.85) brightness(.5)}.bwa-c.lk .lock{display:flex}.bwa-c .lock{display:none;position:absolute;left:0;right:0;top:10%;flex-direction:column;align-items:center;gap:3px;font-size:10.5px;color:#fff;text-align:center;padding:0 6px;text-shadow:0 1px 0 #000,0 0 6px #000;pointer-events:none}
.bwa-c .lock i{font-style:normal;font-size:22px}
.bwa-c.full:not(.lk) .pic{filter:saturate(.6) brightness(.8)}
.bwa-note{margin:14px 6px 4px;font-size:11.5px;line-height:1.7;color:#8fa9cc;text-align:center}
.bwa-ov{position:absolute;inset:0;z-index:5;background:rgba(0,3,10,.72);display:none;align-items:center;justify-content:center;padding:18px}.bwa-ov.on{display:flex}
.bwa-sheet{width:100%;max-width:360px;max-height:100%;overflow-y:auto;border-radius:20px;padding:16px;background:linear-gradient(180deg,#12356f,#06142e);border:1.5px solid rgba(160,205,255,.5);box-shadow:0 18px 50px rgba(0,0,0,.7)}
.bwa-sheet h3{margin:0 0 4px;font-size:18px;color:#eaf6ff;text-align:center}.bwa-sheet p{margin:6px 0 10px;font-size:12.5px;line-height:1.6;color:#b9d2f0;text-align:center}
.bwa-sheet .big{width:120px;height:120px;margin:0 auto 6px;border-radius:50%;overflow:hidden;border:2px solid #cfe0f5;display:grid;place-items:center;background:radial-gradient(circle at 50% 30%,#1c3d7a,#050c1c);color:#bfe6ff}.bwa-sheet .big img{width:100%;height:100%;object-fit:cover}.bwa-sheet .big svg{width:80%;height:80%}
.bwa-c .gdb{position:absolute;left:4px;bottom:34px;padding:1px 6px;border-radius:9px;font-size:11px;font-style:normal;font-weight:700;color:#fff;background:linear-gradient(180deg,#2a5fc2,#102a63);border:1px solid #9cc4ff}
.bwa-gd{margin:2px 0 10px;padding:8px 12px;border-radius:14px;background:linear-gradient(180deg,rgba(40,90,190,.35),rgba(6,20,50,.6));border:1px solid rgba(150,200,255,.45);text-align:center;color:#dfeeff}
.bwa-gd>b{display:block;font-size:13px;margin-bottom:6px;color:#eaf6ff}.bwa-gd.off{opacity:.65}.bwa-gd.off span{font-size:12px;color:#b9d2f0}
.bwa-gd .gc{display:flex;align-items:center;justify-content:center;gap:14px}.bwa-gd .gc em{font-style:normal;font-size:20px;font-weight:800;min-width:60px}.bwa-gd .gc em i{font-style:normal;font-size:13px;opacity:.7;font-weight:600}
.bwa-gd button{width:40px;height:40px;border-radius:50%;border:1.5px solid #bcd9ff;background:linear-gradient(180deg,#2d63c7,#0e2a66);color:#fff;font-size:22px;font-weight:700;line-height:1}.bwa-gd button:disabled{opacity:.35}
.bwa-gd small{display:block;margin-top:7px;font-size:11.5px;line-height:1.5;color:#b9d2f0}
.bwa-sheet .st{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}.bwa-sheet .st span{padding:4px 10px;border-radius:10px;font-size:12px;color:#dfeeff;background:rgba(2,8,20,.5);border:1px solid rgba(150,200,255,.3)}
.bwa-sheet .st span .gem3{width:15px;height:15px;vertical-align:-3px}
.bwa-emg{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:10px}
.bwa-emg button{aspect-ratio:1;border-radius:16px;border:2px solid rgba(160,205,255,.22);background:radial-gradient(circle at 50% 30%,rgba(40,80,150,.45),rgba(5,12,28,.85));display:grid;place-items:center;cursor:pointer;padding:4px;color:#fff;font-family:inherit}
.bwa-emg button.on{border-color:#8fd8ff;box-shadow:0 0 0 2px rgba(120,200,255,.4),0 0 16px rgba(80,170,255,.7)}
@media (orientation:landscape) and (max-height:560px){.bwa-pan{max-width:560px;left:calc(14px + var(--sl));right:calc(14px + var(--sr));top:calc(var(--st) + 22px);bottom:calc(var(--sb) + 22px)}.bwa-btn{transform:scale(.8)}.bwa-grid{grid-template-columns:repeat(5,1fr)}}
`;

export function createArmyUI(mount, { econ, ui, audio, onAttack, onShop } = {}) {
  const host = (ui && ui.root) || mount;
  const stEl = document.createElement('style'); stEl.textContent = CSS; document.head.appendChild(stEl);
  const btn = document.createElement('div'); btn.className = 'bwa-btn';
  btn.innerHTML = `<div class="ring"></div><div class="core">${icon('ready', 34)}<b></b></div><div class="lb">ATTACK</div>`;
  const chip = document.createElement('div'); chip.className = 'bwa-chip'; chip.innerHTML = `${icon('guard', 17)}<span>ARMY</span><i></i>`;
  const pan = document.createElement('div'); pan.className = 'bwa';
  pan.innerHTML = `<div class="bwa-pan"><div class="bwa-h"><button class="bwa-em" data-a="emblem" aria-label="Banner emblem"></button><div class="t"><b>Army</b><span></span></div><div class="bwa-x" data-a="x">✕</div></div>
    <div class="bwa-hs"></div>
    <div class="bwa-tabs"><button data-a="tab" data-t="troops" class="on">Troops</button><button data-a="tab" data-t="spells">Spells</button></div>
    <div class="bwa-body"></div>
    <div class="bwa-ft"><button data-a="attack">⚔  FIND A TARGET</button></div>
    <div class="bwa-ov"></div></div>`;
  host.appendChild(btn); host.appendChild(chip); host.appendChild(pan);
  const $ = (s) => pan.querySelector(s);
  const HS = $('.bwa-hs'), BODY = $('.bwa-body'), OV = $('.bwa-ov'), EM = $('.bwa-em'), SUB = $('.bwa-h .t span');
  const S = { open: false, tab: 'troops', pend: {}, tm: {}, chain: Promise.resolve(), busy: false, lastGet: 0, hold: null };
  const A = () => econ && econ.st && econ.st.army;
  const now = () => econ.now();
  const click = () => { audio && audio.click && audio.click(); ui && ui.haptic && ui.haptic('light'); };
  const toast = (m) => ui && ui.toast && ui.toast(m);

  // ------------------------------------------------------------------ numbers
  const pk = (k, id) => k + ':' + id;
  const unitT = (u, a) => Math.max(1, DEFS.units[u].t / (DEFS.speed[Math.max(1, a.fam[DEFS.units[u].fam].lv) - 1] || 1));
  const spellT = (k, a) => Math.max(1, DEFS.spells[k].t / (DEFS.speed[Math.max(1, a.spell.lv) - 1] || 1));
  const pending = (kind) => Object.entries(S.pend).filter(([k]) => k[0] === kind).map(([k, n]) => [k.slice(2), n]);
  // what is still free once the pending taps are counted (the server re-checks everything)
  function room(a) {
    const gems = { ...econ.st.gems }, fam = {}; let all = a.cap - a.space - a.queued, sp = a.spell.cap - a.spell.used;
    for (const f of DEFS.families) fam[f] = a.fam[f].cap - a.fam[f].used - a.fam[f].q.reduce((s, b) => s + b.n * DEFS.units[b.u].space, 0);
    for (const [u, n] of pending('u')) { const d = DEFS.units[u]; all -= n * d.space; fam[d.fam] -= n * d.space; for (const g in d.cost) gems[g] -= d.cost[g] * n; }
    for (const [k, n] of pending('s')) { const d = DEFS.spells[k]; sp -= n * d.space; for (const g in d.cost) gems[g] -= d.cost[g] * n; }
    return { gems, fam, all, sp };
  }
  function whyNot(kind, id, a) {
    const r = room(a), have = econ.st.gems;
    if (kind === 'u') {
      const d = DEFS.units[id], row = a.units[id], f = a.fam[d.fam];
      if (!row || !f) return 'locked';
      if (!f.lv) return 'not_built'; if (!row.open) return 'locked';
      if (a.cap <= 0) return 'no_training';
      if (row.hero && row.hero.held + (S.pend[pk('u', id)] || 0) >= row.hero.cap) return 'hero_cap';        // (p35 K2: at most three of each hero; the 2nd and 3rd copy open with the building level)
      for (const g in d.cost) if (r.gems[g] < d.cost[g]) return 'gems';
      if (r.fam[d.fam] < d.space) return 'family_full'; if (r.all < d.space) return 'army_full';
      if (f.q.length >= 6 && f.q[f.q.length - 1].u !== id) return 'queue_full';
      return null;
    }
    const d = DEFS.spells[id], row = a.spell.spells[id];
    if (!a.spell.lv) return 'not_built'; if (!row.open) return 'locked';
    for (const g in d.cost) if (r.gems[g] < d.cost[g]) return 'gems';
    if (r.sp < d.space) return 'spell_full';
    if (a.spell.q.length >= 6 && a.spell.q[a.spell.q.length - 1].u !== id) return 'queue_full';
    void have; return null;
  }
  // a lane as the player sees it right now: the head batch has delivered `done` pieces since the last server answer
  function laneNow(q) {
    if (!q || !q.length) return { items: [], done: 0, left: 0 };
    const t = now(), h = q[0], remain = Math.max(0, Math.min(h.n, Math.ceil((h.fin - t) / h.t - 1e-6))), done = h.n - remain;
    const items = q.map((b, i) => ({ u: b.u, n: i === 0 ? remain : b.n, t: b.t, si: i })).filter((b) => b.n > 0);
    return { items, done, left: Math.max(0, q[q.length - 1].fin - t), headU: h.u, nextIn: Math.max(0, h.fin - (remain - 1) * h.t - t) };
  }

  // ------------------------------------------------------------------ top button / chip
  function updateBtn() {
    const a = A(); if (!a || !a.fam || !a.spell) { btn.style.display = chip.style.display = 'none'; return; }
    btn.style.display = chip.style.display = '';
    btn.style.setProperty('--p', a.ready); btn.querySelector('b').textContent = a.ready + '%';
    btn.classList.toggle('hot', a.ready >= 40 && a.attack); btn.classList.toggle('off', !a.attack || a.space <= 0);
    const q = Object.values(a.fam).filter((f) => f.q.length).length + (a.spell.q.length ? 1 : 0); chip.querySelector('i').textContent = q ? '· ' + q : '';
  }

  // ------------------------------------------------------------------ cards
  const costHtml = (cost, r) => Object.keys(cost).map((g) => `<span class="${r.gems[g] < cost[g] ? 'no' : ''}">${GEMS[g]}${fmtN(cost[g])}</span>`).join('');
  function unitCard(u, a, r) {
    const d = DEFS.units[u], row = a.units[u], f = a.fam[d.fam]; if (!row || !f) return '';       // (an older server without this unit)
    const lk = !row.open, p = S.pend[pk('u', u)] || 0;
    const ln = laneNow(f.q), queued = ln.items.filter((b) => b.u === u).reduce((s, b) => s + b.n, 0) + p, owned = row.n + (ln.headU === u ? ln.done : 0);
    const lock = lk ? `<div class="lock"><i>🔒</i>${f.lv ? FAM[d.fam] + ' Lv ' + d.lv : 'Build the ' + FAM[d.fam]}</div>` : '';
    const tier = row.tier | 0, lvb = !lk && row.ulv ? `<i class="lvb" style="--tc:${TIER_COL[tier]}">Lv ${row.ulv}</i>` : '';
    const hero = row.hero || null, noSlot = !!hero && hero.held + (S.pend[pk('u', u)] || 0) >= hero.cap, full = !lk && (r.fam[d.fam] < d.space || r.all < d.space || noSlot);
    return `<div class="bwa-c${lk ? ' lk' : ''}${queued ? ' has' : ''}${full ? ' full' : ''}" data-k="u" data-id="${u}" data-r="${RARITY[u].k}" style="${rarityStyle(u)}"><div class="pic">${PORTRAIT[u] ? `<img src="${PORTRAIT[u]}" alt="" draggable="false">` : icon(u, 40)}${lvb}</div>${lock}
      <i class="rt">${RARITY[u].name}</i><i class="own" data-own="${u}">×${fmtN(owned)}${hero ? `/${hero.max}` : ''}</i>${(a.guard && a.guard[u]) ? `<i class="gdb" title="Castle guardians">🛡${a.guard[u]}</i>` : ''}<i class="qd" data-qd="${u}">+${queued}</i><b class="nm">${NAME[u]}</b><div class="cs">${costHtml(d.cost, r)}</div><span class="inf" data-a="info" data-k="u" data-id="${u}">i</span></div>`;
  }
  function spellCard(k, a, r) {
    const d = DEFS.spells[k], row = a.spell.spells[k], lk = !row.open, p = S.pend[pk('s', k)] || 0;
    const ln = laneNow(a.spell.q), queued = ln.items.filter((b) => b.u === k).reduce((s, b) => s + b.n, 0) + p, owned = row.n + (ln.headU === k ? ln.done : 0);
    const lock = lk ? `<div class="lock"><i>🔒</i>${a.spell.lv ? 'Forge Lv ' + d.lv : 'Build the Forge'}</div>` : '';
    const full = !lk && r.sp < d.space;
    return `<div class="bwa-c sp${lk ? ' lk' : ''}${queued ? ' has' : ''}${full ? ' full' : ''}" data-k="s" data-id="${k}"><div class="pic">${spellIcon(k, 90)}</div>${lock}
      <i class="own" data-own="${k}">×${fmtN(owned)}</i><i class="qd" data-qd="${k}">+${queued}</i><b class="nm">${SPELLS[k].name}</b><div class="cs">${costHtml(d.cost, r)}</div><span class="inf" data-a="info" data-k="s" data-id="${k}">i</span></div>`;
  }
  function laneHtml(title, lv, q, kind, fam) {
    const ln = laneNow(q); if (!ln.items.length) return '';
    const rush = kind === 'u' ? a0().fam[fam].rush : a0().spell.rush;
    const mini = ln.items.map((b, i) => `<div class="mi" data-a="rm" data-k="${kind}" data-f="${fam || ''}" data-i="${b.si}" data-u="${b.u}">${kind === 'u' ? unitPic(b.u, 42) : spellIcon(b.u, 42)}<span class="nn" data-nn="${fam || 'sp'}:${i}">${b.n}</span><span class="rm">−</span></div>`).join('');
    return `<div class="bwa-lane" data-lane="${fam || 'sp'}"><div class="hd"><b>${title}${lv ? ' · Lv ' + lv : ''}</b><span class="tm" data-tm="${fam || 'sp'}">${fmtT(ln.left)}</span>
      <button class="rush" data-a="rush" data-k="${kind}" data-f="${fam || ''}" ${econ.st.gems.turq < rush ? 'disabled' : ''}>${rush > 0 ? `Rush ${GEMS.turq}${fmtN(rush)}` : 'Finish free'}</button></div><div class="it">${mini}</div><div class="hint">Tap a queued one to take it out · full refund</div></div>`;
  }
  const a0 = () => A();

  function render() {
    const a = A(); if (!a || !a.fam || !a.spell) return;
    const r = room(a), pct = a.cap ? Math.min(100, (a.space / a.cap) * 100) : 0, pq = a.cap ? Math.min(100 - pct, ((a.queued + (a.cap - a.space - a.queued - r.all)) / a.cap) * 100) : 0;
    EM.innerHTML = crestImg(econ.st.emblem, 44);
    SUB.innerHTML = `${esc(econ.st.name || '')}${econ.st.name ? ' · ' : ''}Power <b>${fmtN(a.power)}</b>${a.shield > now() ? ' · Shield ' + fmtT(a.shield - now()) : ''}`;
    const ab = econ.boosts ? econ.boosts().army : null, abl = ab ? `<div class="r" style="margin-top:4px;color:#8fe0ff"><span>⚡ Army boost +${ab.p}% — training ${ab.p}% faster</span><span>${fmtT(ab.end - now())}</span></div>` : '';
    if (S.tab === 'troops') HS.innerHTML = abl + `<div class="r"><span>Housing <b>${fmtN(a.space)}</b> / ${fmtN(a.cap)}${a.queued ? ` <em>(+${a.queued} training)</em>` : ''}</span><span>Ready <b>${a.ready}%</b></span></div><div class="bwa-bar"><i style="width:${pct.toFixed(1)}%"></i><i class="q" style="left:${pct.toFixed(1)}%;width:${pq.toFixed(1)}%"></i></div>`;
    else {
      const sp = a.spell, qs = sp.q.reduce((x, b) => x + b.n * DEFS.spells[b.u].space, 0), pend = Math.max(0, sp.cap - sp.used - r.sp);
      const pp = sp.cap ? Math.min(100, ((sp.used - qs) / sp.cap) * 100) : 0, pqs = sp.cap ? Math.max(0, Math.min(100 - pp, ((qs + pend) / sp.cap) * 100)) : 0;
      HS.innerHTML = `<div class="r"><span>Spell housing <b>${fmtN(sp.used - qs)}</b> / ${fmtN(sp.cap)}${qs ? ` <em>(+${qs} brewing)</em>` : ''}</span><span>Forge <b>Lv ${sp.lv}</b></span></div><div class="bwa-bar"><i style="width:${pp.toFixed(1)}%"></i><i class="q" style="left:${pp.toFixed(1)}%;width:${pqs.toFixed(1)}%"></i></div>`;
    }
    pan.querySelectorAll('.bwa-tabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === S.tab));
    const go = $('.bwa-ft button'); go.disabled = !a.attack || (a.space - Object.entries(a.guard || {}).reduce((q, [u, n]) => q + n * ((DEFS.units[u] && DEFS.units[u].space) || 0), 0)) <= 0; go.textContent = a.attack ? '⚔  FIND A TARGET' : 'ATTACKS ARE NOT OPEN YET';
    let h = '';
    if (S.tab === 'troops') {
      const lanes = DEFS.families.map((f) => laneHtml(FAM[f], a.fam[f].lv, a.fam[f].q, 'u', f)).join('');
      if (lanes) h += `<div class="bwa-sec"><span>In training</span></div>${lanes}`;
      h += `<div class="bwa-sec"><span>Tap to train · hold to keep adding</span></div><div class="bwa-grid">${DEFS.order.map((u) => unitCard(u, a, r)).join('')}</div>`;
      h += '<div class="bwa-note">Housing is set by your Training Ground; every building holds its own kind of soldiers. The Forge adds armour and damage to the whole army.</div>';
    } else {
      const lane = laneHtml('Forge', a.spell.lv, a.spell.q, 's', '');
      if (lane) h += `<div class="bwa-sec"><span>Brewing</span></div>${lane}`;
      h += `<div class="bwa-sec"><span>Tap to brew · hold to keep adding</span></div><div class="bwa-grid">${SPELL_ORDER.map((k) => spellCard(k, a, r)).join('')}</div>`;
      h += '<div class="bwa-note">Spells are brewed in the Forge with turquoise and cast during an attack: pick one at the right edge, then tap the battlefield. Each spell is used up when cast.</div>';
    }
    const sy = BODY.scrollTop; BODY.innerHTML = h; BODY.scrollTop = sy;
    updateBtn();
  }

  // cheap refresh of one card after a tap (no full re-render, the finger stays on the card)
  function touchCard(kind, id) {
    const a = A(), card = BODY.querySelector(`.bwa-c[data-k="${kind}"][data-id="${id}"]`); if (!a || !card) return;
    const p = S.pend[pk(kind, id)] || 0, srv = kind === 'u' ? laneNow(a.fam[DEFS.units[id].fam].q) : laneNow(a.spell.q);
    const q = srv.items.filter((b) => b.u === id).reduce((s, b) => s + b.n, 0) + p;
    card.querySelector('.qd').textContent = '+' + q; card.classList.toggle('has', q > 0);
    card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop');
    const r = room(a); card.querySelectorAll('.cs span').forEach((sp, i) => { const g = Object.keys((kind === 'u' ? DEFS.units[id] : DEFS.spells[id]).cost)[i]; sp.classList.toggle('no', r.gems[g] < (kind === 'u' ? DEFS.units[id] : DEFS.spells[id]).cost[g]); });
    HSrefresh();
  }
  const HSrefresh = () => { clearTimeout(S.hsT); S.hsT = setTimeout(() => { if (S.open) { const y = BODY.scrollTop; render(); BODY.scrollTop = y; } }, 600); };

  // ------------------------------------------------------------------ taps -> one request
  function addOne(kind, id) {
    const a = A(); if (!a) return false;
    const why = whyNot(kind, id, a);
    if (why) { toast(WHY[why] || 'Not possible'); return false; }
    const key = pk(kind, id); S.pend[key] = (S.pend[key] || 0) + 1;
    audio && audio.click && audio.click(); touchCard(kind, id);
    clearTimeout(S.tm[key]); S.tm[key] = setTimeout(() => flush(kind, id), 450);
    return true;
  }
  function flush(kind, id) {
    const key = pk(kind, id), n = S.pend[key]; if (!n) return; delete S.pend[key]; delete S.tm[key];
    S.chain = S.chain.then(async () => {
      const j = await econ.army(kind === 'u' ? 'train' : 'brew', { u: id, n });
      if (!(j && j.ok)) toast(WHY[(j && j.why) || 'bad'] || 'Not possible');
      if (S.open) render(); else updateBtn();
    });
  }
  async function act(op, body, msg) {
    const j = await econ.army(op, body);
    if (j && j.ok) { if (msg) toast(msg); } else toast(WHY[(j && j.why) || 'bad'] || 'Not possible');
    if (S.open) render();
    return j;
  }
  // press and hold on a card
  function holdStart(e, card) {
    const kind = card.dataset.k, id = card.dataset.id; if (card.classList.contains('lk')) { const a = A(); const w = a ? whyNot(kind, id, a) : null; if (a) toast(w ? WHY[w] : 'Locked'); return; }
    let did = false; const t0 = performance.now();
    const rep = () => { if (!addOne(kind, id)) { stop(); return; } did = true; S.hold.iv = setTimeout(rep, Math.max(55, 170 - (performance.now() - t0) / 14)); };
    const stop = () => { if (!S.hold) return; clearTimeout(S.hold.to); clearTimeout(S.hold.iv); const h = S.hold; S.hold = null; if (!h.fired && !h.cancel) addOne(kind, id); };
    S.hold = { to: setTimeout(() => { if (S.hold) { S.hold.fired = true; rep(); } }, 380), fired: false, cancel: false, stop, x: e.clientX, y: e.clientY };
    void did;
  }

  // level line + perks of a unit (unitlook.js / military.py: the level of its building; a perk from every tier on)
  function heroLine(id, a) {                                                      // p35 K2: heroes are limited to three of each, opened one by one by the building level
    const row = a.units[id], H = row && row.hero; if (!H) return '';
    const at = (DEFS.heroes && DEFS.heroes[id]) || [];
    const slots = [0, 1, 2].map((i) => `<span style="${H.cap > i ? 'color:#8ce99a;border-color:#8ce99a' : 'opacity:.55'}">${H.cap > i ? '●' : '○'} ${i + 1}${at[i] ? ' · ' + FAM[DEFS.units[id].fam] + ' Lv ' + at[i] : ''}</span>`).join('');
    return `<div class="st" style="margin:0 0 8px"><span>Hero: at most 3 of each</span>${slots}</div>`;
  }
  function lvLine(id, a) {
    const row = a.units[id] || {}, L = row.ulv || 1, t = row.tier | 0, d = DEFS.units[id];
    const perks = [2, 3, 4, 5].map((k) => `<span style="${t >= k ? `color:${TIER_COL[k]};border-color:${TIER_COL[k]}` : 'opacity:.45'}">${t >= k ? '★' : '☆'} ${PERK[k][0]} <em style="font-style:normal;opacity:.75">${PERK[k][1]}</em>${t >= k ? '' : ` · Lv ${TIER_AT[k]}`}</span>`).join('');
    return `<div class="st" style="margin:-2px 0 8px"><span style="color:${TIER_COL[t]};border-color:${TIER_COL[t]}">Level ${L} · ${TIER_NAME[t]}</span><span>${FAM[d.fam]} sets its level</span></div><div class="st" style="margin:0 0 8px">${perks}</div>`;
  }
  // ------------------------------------------------------------------ guardians (p32): a giant / hill giant / baby dragon / dragon can stand in the castle instead of going to war
  function guardRow(id, a) {
    const gd = DEFS.guardians && DEFS.guardians[id]; if (!gd) return '';
    const slots = (a.gslots && a.gslots[id]) || 0, n = (a.guard && a.guard[id]) || 0, own = (a.units[id] && a.units[id].n) || 0;
    if (slots <= 0) return `<div class="bwa-gd off"><b>🛡 Castle guardian</b><span>Opens at Castle Lv ${gd.unlock}</span></div>`;
    return `<div class="bwa-gd"><b>🛡 Castle guardian</b><div class="gc"><button data-g="-1" ${n <= 0 ? 'disabled' : ''}>−</button><em>${n} <i>/ ${slots}</i></em><button data-g="1" ${n >= Math.min(slots, own) ? 'disabled' : ''}>+</button></div>
      <small>${n ? 'Stays home and fights for your castle — it cannot join an attack.' : 'Stand it in your castle: it defends there and stays out of your attacks.'}${own < 1 ? ' (You have none yet.)' : ''}</small></div>`;
  }
  async function guardTap(id, d) {
    const a = A(); const n = Math.max(0, ((a.guard && a.guard[id]) || 0) + d);
    click(); const j = await act('guard', { u: id, n });
    if (j && j.ok && S.open) showInfo('u', id);
  }
  // ------------------------------------------------------------------ details / emblem sheets
  function showInfo(kind, id) {
    const a = A(); let h;
    if (kind === 'u') {
      const d = DEFS.units[id], f = a.fam[d.fam], t = unitT(id, a);
      h = `<div class="bwa-sheet"><div class="big">${PORTRAIT[id] ? `<img src="${PORTRAIT[id]}" alt="">` : icon(id, 60)}</div><h3>${NAME[id]}</h3><div class="st" style="margin:-4px 0 8px"><span style="color:${RARITY[id].c};border-color:${RARITY[id].c}">${RARITY[id].name}</span></div><p>${DESC[id]}</p>
        ${guardRow(id, a)}${lvLine(id, a)}${heroLine(id, a)}<div class="st"><span>HP ${fmtN((a.units[id] && a.units[id].hp) || d.hp)}</span><span>Damage ${(a.units[id] && a.units[id].dps) || d.dps}/s</span><span>${d.rng ? 'Range ' + d.rng + ' m' : 'Melee'}</span><span>Space ${d.space}</span>${d.air ? '<span>Flying</span>' : ''}<span>⏱ ${fmtT(t)} each</span><span>Needs ${FAM[d.fam]} Lv ${d.lv}</span></div>
        <div class="st" style="margin-top:8px">${Object.keys(d.cost).map((g) => `<span>${GEMS[g]} ${d.cost[g]}</span>`).join('')}</div></div>`;
      void f;
    } else {
      const d = DEFS.spells[id], s = SPELLS[id];
      h = `<div class="bwa-sheet"><div class="big">${spellIcon(id, 120)}</div><h3>${s.name}</h3><p>${s.desc}</p>
        <div class="st"><span>Space ${d.space}</span><span>⏱ ${fmtT(spellT(id, a))} each</span><span>Needs Forge Lv ${d.lv}</span></div>
        <div class="st" style="margin-top:8px">${Object.keys(d.cost).map((g) => `<span>${GEMS[g]} ${d.cost[g]}</span>`).join('')}</div></div>`;
    }
    OV.innerHTML = h; OV.classList.add('on');
    OV.onclick = (e) => { const g = e.target.closest('[data-g]'); if (g) { e.stopPropagation(); if (!g.disabled) guardTap(id, +g.dataset.g); return; } if (e.target.closest('.bwa-gd')) return; OV.classList.remove('on'); OV.onclick = null; };
  }
  function showEmblems() {
    const cur = normEmblem(econ.st.emblem);
    OV.innerHTML = `<div class="bwa-sheet"><h3>Your banner</h3><p>This crest flies on your walls and flags. Attackers see it, and so does everyone you attack.</p><div class="bwa-emg">${DEFS.emblems.map((e) => `<button data-e="${e}" class="${e === cur ? 'on' : ''}" aria-label="${e}">${crestImg(e, 56)}</button>`).join('')}</div></div>`;
    OV.classList.add('on');
    OV.onclick = async (e) => {
      const b = e.target.closest('[data-e]');
      if (!b) { if (!e.target.closest('.bwa-sheet')) { OV.classList.remove('on'); OV.onclick = null; } return; }
      click(); OV.classList.remove('on'); OV.onclick = null; EM.innerHTML = crestImg(b.dataset.e, 44);
      const j = await econ.setEmblem(b.dataset.e); if (j && !j.ok) toast(WHY[j.why] || 'Not possible'); else toast('Banner changed');
    };
  }

  // ------------------------------------------------------------------ events
  pan.addEventListener('pointerdown', (e) => {
    const card = e.target.closest('.bwa-c'); if (!card || e.target.closest('[data-a="info"]')) return;
    holdStart(e, card);
  });
  const endHold = (e) => { if (S.hold) { if (e.type === 'pointercancel' || e.type === 'pointerleave') S.hold.cancel = true; S.hold.stop(); } };
  pan.addEventListener('pointerup', endHold); pan.addEventListener('pointercancel', endHold);
  pan.addEventListener('pointermove', (e) => { if (S.hold && Math.hypot(e.clientX - S.hold.x, e.clientY - S.hold.y) > 10) { S.hold.cancel = true; S.hold.stop(); } });
  BODY.addEventListener('scroll', () => { if (S.hold) { S.hold.cancel = true; S.hold.stop(); } }, { passive: true });
  pan.addEventListener('click', (e) => {
    const t = e.target.closest('[data-a]'); if (!t) { if (e.target === pan) close(); return; }
    const a = t.dataset.a; click();
    if (a === 'x') return close();
    if (a === 'attack') { close(); return attack(); }
    if (a === 'tab') { S.tab = t.dataset.t; BODY.scrollTop = 0; return render(); }
    if (a === 'emblem') return showEmblems();
    if (a === 'info') { e.stopPropagation(); return showInfo(t.dataset.k, t.dataset.id); }
    if (a === 'rush') return t.dataset.k === 'u' ? act('speedup', { fam: t.dataset.f }, 'Ready!') : act('brewspeed', {}, 'Ready!');
    if (a === 'rm') {
      const kind = t.dataset.k, i = +t.dataset.i, fam = t.dataset.f;
      return kind === 'u' ? act('cancel', { fam, i, n: 1 }, null) : act('brewcancel', { i, n: 1 }, null);
    }
  });
  async function attack() {
    const a = A();
    if (!a || !a.attack) { toast(WHY.closed); return; }
    if (a.space <= 0) { toast(WHY.no_army); open(); return; }
    if (S.busy) return; S.busy = true;
    try {
      const L = createLoadView(mount, { title: '', sub: 'Scouting the land…' }).show(), ctl = { cancelled: false }; L.onCancel(() => { ctl.cancelled = true; });      // (the one loading screen: a percentage while the opponent is found - and while the scouting cooldown runs out)
      let r; try { r = await findOpponent(econ, { ctl, onProgress: (f, t) => L.progress(f * 0.35, t) }); } catch (e) { r = { ok: false, why: 'bad' }; }
      if (r.ok) { L.noCancel(); if (onAttack) onAttack(r.target, L); else L.hide(); } else { L.hide(); if (r.why !== 'cancel') toast(WHY[r.why || 'bad'] || 'Not possible'); }
    } finally { S.busy = false; }
  }
  btn.addEventListener('click', () => { click(); attack(); });
  chip.addEventListener('click', () => { click(); open(); });

  function open() { S.open = true; pan.classList.add('on'); render(); }
  function close() { for (const k of Object.keys(S.tm)) { clearTimeout(S.tm[k]); const [kind, id] = [k[0], k.slice(2)]; flush(kind, id); } S.open = false; pan.classList.remove('on'); OV.classList.remove('on'); }

  // soldiers come out one by one: tick every second, refresh from the server when one is due
  setInterval(() => {
    const a = A(); if (!a || !a.fam || !a.spell) return;
    const t = performance.now();
    const lanes = [...DEFS.families.map((f) => [f, a.fam[f].q, 'u']), ['sp', a.spell.q, 's']];
    let due = false;
    for (const [f, q, kind] of lanes) {
      if (!q || !q.length) continue;
      const ln = laneNow(q); if (ln.done > 0) due = true;
      if (S.open) {
        const tm = pan.querySelector(`[data-tm="${f}"]`); if (tm) tm.textContent = fmtT(ln.left);
        ln.items.forEach((b, i) => { const nn = pan.querySelector(`[data-nn="${f}:${i}"]`); if (nn) nn.textContent = b.n; });
        if (ln.headU) { const o = pan.querySelector(`[data-own="${ln.headU}"]`); const base = kind === 'u' ? a.units[ln.headU].n : a.spell.spells[ln.headU].n; if (o) o.textContent = '×' + fmtN(base + ln.done) + (kind === 'u' && a.units[ln.headU].hero ? '/' + a.units[ln.headU].hero.max : ''); }
      }
    }
    if (due && t - S.lastGet > 5000) { S.lastGet = t; econ.army('get').then(() => { if (S.open && !Object.keys(S.pend).length) render(); else updateBtn(); }); }
  }, 1000);

  const emblem = () => { open(); showEmblems(); };
  return { open, close, readiness: () => (A() ? A().ready : 0), update() { if (S.open && !Object.keys(S.pend).length && !S.hold) render(); else updateBtn(); }, attack, emblem };
}
