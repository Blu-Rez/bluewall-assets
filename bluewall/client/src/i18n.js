// UI strings (English only) + the info-sheet catalogue for everything the player can tap.
// info entries: id -> [icon, title, text]. infoFor(id) also resolves numbered / prefixed pick ids
// ('tower_3', 'cav_blue_knight', 'bld_stable_yard', 'hero_shieldmaiden', 'vault_ruby' …).

const INFO = {
  // ---- the castle
  keep: ['🏰', 'The Keep', 'Heart of your kingdom. The stronger the keep, the greater the army it can command.'],
  gate: ['🚪', 'Great Gate', 'The only way in. Giants guard it day and night, and the portcullis never sleeps.'],
  wall: ['🧱', 'The Blue Wall', 'Its blue runes never fade. Stone remembers every siege it has broken.'],
  tower: ['🗼', 'Wall Tower', 'Archers and catapults hold the high ground here; nothing crosses the moat unseen.'],
  crystal: ['💎', 'Blue Crystal', 'Source of the wall\'s power. While it shines, the wall stands.'],
  treasury: ['💰', 'Treasury', 'The kingdom\'s gold sleeps here behind iron doors and sworn guards.'],
  church: ['🔔', 'Bell Church', 'Its bell rings over the whole town every three hours.'],
  market: ['🛒', 'Town Market', 'Stalls, carts and the well in the square: the beating heart of the lower town.'],
  well: ['🪣', 'Well', 'Cold, clear water for the town, the troops and the horses.'],
  // ---- military buildings
  barracks: ['⚔️', 'Barracks', 'Recruits arrive as farmers and leave as soldiers. Drums at dawn, steel by dusk.'],
  forge: ['🔨', 'Forge', 'Swords, armour and catapult stones are hammered out in its roaring heat.'],
  smithy: ['⚒️', 'Smithy', 'Horseshoes, nails and hinges ring off the anvil from first light to last.'],
  training: ['🎯', 'Training Ground', 'Straw targets, wooden swords and bruised pride: where soldiers are made.'],
  archer: ['🏹', 'Archery Range', 'Bowmen loose a thousand arrows a day until every one finds the mark.'],
  camp: ['⛺', 'Army Camp', 'Tents in ordered rows, banners in the wind. The army is ready to march.'],
  stables: ['🐴', 'Stables', 'Hay, leather and warm breath. The cavalry\'s horses are groomed and shod here.'],
  watchtower: ['🗼', 'Watchtower', 'A lantern burns at the top all night. No rider crosses the fields unseen.'],
  cannon: ['💥', 'Cannon', 'Bronze, iron and black powder. One roar from its mouth and a siege line breaks.'],
  catapult_tower: ['🏯', 'Catapult Tower', 'Hurls stones the size of oxen over the walls at anyone foolish enough to approach.'],
  // ---- the town
  house: ['🏠', 'Townhouse', 'Timber, plaster and red tiles. More people, more gold for the crown.'],
  cottage: ['🏡', 'Cottage', 'A snug home for farmers and their families; smoke curls from the chimney at supper.'],
  mansion: ['🏛️', 'Mansion', 'Home of a noble house, with tall windows, a walled garden and opinions about everything.'],
  tavern: ['🍺', 'Tavern', 'Ale, songs and rumours from every road. Soldiers spend their pay here, and spies their evenings.'],
  bakery: ['🥖', 'Bakery', 'Ovens fired before dawn. Fresh bread feeds the town and the garrison alike.'],
  guild: ['📜', 'Guild Hall', 'Merchants and master craftsmen strike their bargains and keep the town\'s ledgers here.'],
  granary: ['🌾', 'Granary', 'The harvest is stored here, dry and safe, against long winters and longer sieges.'],
  windmill: ['🌾', 'Windmill & Farms', 'Golden fields and turning sails: the army marches on this bread.'],
  windmill_town: ['🌬️', 'Town Windmill', 'Its great sails turn the millstones that grind the town\'s flour.'],
  lumber: ['🪵', 'Lumber Yard', 'Oak and pine for houses, palisades and siege engines.'],
  cow: ['🐄', 'Cattle', 'Milk and meat for the people and the army.'],
  // ---- gem economy
  mine_ruby: ['🔴', 'Ruby Mine', 'A tunnel deep in the red rock; its winch wheel turns day and night.'],
  mine_emerald: ['🟢', 'Emerald Mine', 'The stamp mill crushes the green ore and the sluices wash out the stones.'],
  mine_turq: ['🔵', 'Turquoise Mine', 'The wooden crane hauls turquoise up from the heart of the mountain.'],
  vault_ruby: ['🔴', 'Ruby Vault', 'Iron-bound and guarded. Every ruby you collect is stored here; upgrade it to hold more.'],
  vault_emerald: ['🟢', 'Emerald Vault', 'Emeralds rest here behind three locks. A fuller vault, a richer kingdom.'],
  vault_turq: ['🔵', 'Turquoise Vault', 'Sky-blue stones stacked in oak chests. Raise its walls to store more turquoise.'],
  // ---- the army
  knight: ['🛡️', 'Mounted Knight', 'Plate armour, navy cloak and a longsword raised. Knights patrol the roads and the town streets.'],
  cavalry: ['🐎', 'Cavalry', 'Barded war-horses and blue-cloaked riders. When they charge, the ground itself remembers.'],
  horse: ['🐎', 'Horses', 'Black, white and bay: the finest horses in the realm, bred for the cavalry.'],
  axerider: ['🪓', 'Axe Riders', 'Roman-helmed riders on bay warhorses with long axes. Where they ride, the line breaks.'],
  pegasus: ['🪽', 'Pegasus', 'Winged steeds of the high air. They ride the winds above the wall, watching every road.'],
  dragon: ['🐉', 'Blue Dragon', 'Guardian of the sky. It circles the castle day and night, and fears nothing.'],
  dragons: ['🐉', 'Dragons', 'Born of blue fire and old magic. Raised from the egg, they grow into the terror of the skies.'],
  dragonling: ['🐲', 'Dragonling', 'Young, quick and fiercely loyal. One day it will darken the sky like its elders.'],
  giant: ['🗿', 'Giant Guard', 'Armoured giants with iron clubs, ready for battle at the gate.'],
  troll: ['🪨', 'Troll', 'Thick hide, thicker skull. Feed it well and it will hold any line.'],
  werewolf: ['🐺', 'Werewolf', 'Swift and savage under the moon. Enemies hear the howl long before they see it.'],
  soldier: ['⚔️', 'Soldier', 'Drilled, armoured and loyal to the crown.'],
  swordsman: ['⚔️', 'Swordsman', 'A great two-handed blade and a steel helm. Where he swings, the line opens.'],
  spearman: ['🔱', 'Spearman', 'Shield to shield, spear over spear: the wall that walks.'],
  guard: ['🛡️', 'Guard', 'Sword and shield at the gate. Nobody passes without the watchword.'],
  bowman: ['🏹', 'Archer', 'Keen eyes and a longbow. Strikes invaders long before they reach the wall.'],
  mage: ['🔮', 'Battle Mage', 'Speaks words older than the kingdom. The air crackles when the staff rises.'],
  imp: ['😈', 'Imp', 'Small, quick and mischievous. Useful, as long as someone keeps an eye on it.'],
  siege: ['🪵', 'Siege Engines', 'Catapults, rams and trebuchets: patience made of timber and rope.'],
  catapult: ['🪨', 'Catapult', 'Timber, rope and a bucket of stones. Walls fear it more than swords.'],
  trebuchet: ['🏗️', 'Trebuchet', 'The heaviest arm of the siege train; it can throw a boulder clean over a castle wall.'],
  ram: ['🐏', 'Battering Ram', 'An iron-capped trunk under a roof of hides. Gates do not argue with it for long.'],
  ballista: ['🎯', 'Ballista', 'A giant crossbow whose bolts can pin a dragon\'s wing.'],
  frost_spire: ['❄️', 'Frost Spire', 'A crystal spire that chills the air: everything caught in its light slows to a crawl.'],
  flame_tower: ['🔥', 'Flame Tower', 'A brazier tower that spits burning oil at anything that comes close to the wall.'],
  dragonbane: ['🏹', 'Dragonbane', 'A great harpoon engine made for one purpose: to bring dragons down.'],
  siege_tower: ['🏰', 'Siege Tower', 'A walking fortress on wheels, built to put soldiers on top of enemy walls.'],
  hero: ['👑', 'Hero', 'Legends ride with the army. Every hero brings a gift no soldier can match.'],
  hero_lord: ['👑', 'The Mounted Lord', 'On a white horse at the head of the column: the kingdom\'s banner made flesh.'],
  hero_shieldmaiden: ['🛡️', 'Shieldmaiden', 'Round shield, a blued war axe and no fear at all. Songs are already written about her.'],
  settings: ['⚙️', 'Settings', ''],
};

// other names the world may use for the same thing
const ALIAS = {
  stable: 'stables', stable_yard: 'stables', barn: 'stables', barn_small: 'stables', horse_barded: 'cavalry', horseman: 'knight', horseman_blue: 'cavalry',
  knights: 'knight', blue_knight: 'cavalry', rider: 'knight', riders: 'cavalry',
  watch_tower: 'watchtower', lookout: 'watchtower', cannons: 'cannon', cattower: 'catapult_tower', kk_cattower: 'catapult_tower', catapulttower: 'catapult_tower',
  pub: 'tavern', inn: 'tavern', baker: 'bakery', blacksmith: 'smithy', guildhall: 'guild', guild_hall: 'guild', manor: 'mansion', manor_house: 'mansion',
  barnhouse: 'cottage', farmhouse: 'cottage', hut: 'cottage', houses: 'house', townhouse: 'house', silo: 'granary', storehouse: 'granary',
  mill: 'windmill_town', town_windmill: 'windmill_town', windmill_tower: 'windmill_town', windmill_aartee: 'windmill', farm: 'windmill', farms: 'windmill',
  vault_turquoise: 'vault_turq', vault_emeralds: 'vault_emerald', vault_rubies: 'vault_ruby', mine_turquoise: 'mine_turq',
  kk_barracks: 'barracks', kk_archery: 'archer', archery: 'archer', archery_range: 'archer', archer_tower: 'tower', range: 'archer',
  tent: 'camp', general_tent: 'camp', army: 'camp', army_camp: 'camp', troops: 'camp', well_stone: 'well', castle_wall: 'wall', castle_wall_lp: 'wall',
  pegasi: 'pegasus', gryphon: 'pegasus', dragon_baby: 'dragonling', baby_dragon: 'dragonling', hill: 'giant', hill_giant: 'giant', giants: 'giant',
  swordsman_2h: 'swordsman', infantry: 'soldier', archer_unit: 'bowman', archers: 'bowman', inf_archer: 'bowman', unit_archer: 'bowman', wall_archer: 'bowman', skel_mage: 'mage', skeleton_mage: 'mage',
  mounted_lord: 'hero_lord', lord: 'hero_lord', shieldmaiden: 'hero_shieldmaiden', heroes: 'hero', frost: 'frost_spire', flame: 'flame_tower',
  trebuchet2: 'trebuchet', kenney: 'siege', siege_kenney: 'siege', siege_engines: 'siege',
};
// pick-id prefixes (spec / workstream naming) -> fallback entry when the exact name is unknown
const PREFIX = [['cav_', 'cavalry'], ['hero_', 'hero'], ['inf_', 'soldier'], ['unit_', 'soldier'], ['giant_', 'giant'], ['cr_', 'dragons'],
  ['siege_', 'siege'], ['bld_', null], ['town_', null], ['def_', null], ['army_', null], ['pick_', null]];

const T = {
  en: {
    soon: 'Coming soon',
    mine: { rate: 'Per hour', cap: 'Mine holds', ready: 'Ready', collect: 'Collect', empty: 'Nothing to collect yet', got: 'Collected', vault: 'Vault full — upgrade storage' },
    settings: 'Settings', close: 'Close', reset: 'Reset to defaults', tutorial: 'Replay the tutorial', reload: 'The game will reload to apply this',
    tabs: { sound: 'Sound', graphics: 'Graphics', controls: 'Controls', kingdom: 'Kingdom', about: 'About' },
    sound: { master: 'Master volume', music: 'Music', ambience: 'Ambience & weather', characters: 'Characters & animals', effects: 'Effects & UI', voice: 'Voice greeting', bgMute: 'Mute in background' },
    graphics: { quality: 'Graphics quality', shadows: 'Shadows', bloom: 'Bloom glow', resScale: 'Resolution', fps: 'Frame rate', idleEco: 'Power saver when idle', fpsMeter: 'Show FPS', coolMode: 'Cool mode (30 fps, runs cooler)', perfInfo: 'Performance info', shake: 'Camera shake' },
    controls: { rotSpeed: 'Rotate speed', zoomSpeed: 'Zoom speed', invertRotate: 'Invert rotation', haptics: 'Haptics' },
    kingdom: {
      date: 'Kingdom date', time: 'Time', owner: 'Owner tools',
      preview: 'Castle level preview', off: 'Off', lv: 'Level', real: 'Your real level', back: 'Back to the real level',
      note: 'Shows the castle as it looks at any level, on this device only. Your real level and resources are untouched.',
      tag: 'Preview',
    },
    opt: { auto: 'Auto', low: 'Low', medium: 'Medium', high: 'High', ultra: 'Ultra' },
    about: { title: 'About Blue Wall', ver: 'Version', made: 'Made for', credits: 'Models, textures & sounds by', thanks: 'Thanks to every artist who shared their work for free.' },
    tod: { dawn: 'Dawn', morning: 'Morning', noon: 'Noon', afternoon: 'Afternoon', dusk: 'Dusk', night: 'Night' },
    welcome: { pre: 'Welcome,', lord: 'My Lord', tap: 'Tap to enter', voice: 'Welcome, my lord.' },
    info: INFO,
  },
};

export function tr() { return T.en; }

// Resolve any pick id to an info entry: exact, alias, numbered ('tower_3', 'house12'), prefixed ('bld_stable_yard'),
// gem-suffixed ('vault_ruby_2'). Returns [icon, title, text] or null.
export function infoFor(id) {
  if (!id) return null;
  const look = (k) => INFO[k] || (ALIAS[k] && INFO[ALIAS[k]]) || null;
  let k = String(id).toLowerCase().replace(/[\s-]+/g, '_');
  let it = look(k); if (it) return it;
  k = k.replace(/[_.]?\d+$/, ''); it = look(k); if (it) return it;
  for (const [p, fb] of PREFIX) {
    if (!k.startsWith(p)) continue;
    const rest = k.slice(p.length);
    it = look(rest) || look(p + rest) || look(rest.split('_').slice(-1)[0]) || look(rest.split('_')[0]);
    if (it) return it;
    return fb ? INFO[fb] : null;
  }
  return look(k.split('_')[0]) || null;
}
