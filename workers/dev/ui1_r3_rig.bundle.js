(() => {
  // src/settings.js
  var KEY = "bw_settings_v1";
  var DEFAULTS = {
    // sound
    master: 0.9,
    music: 0.6,
    ambience: 0.8,
    characters: 0.8,
    effects: 0.8,
    voice: true,
    bgMute: true,
    // graphics (grass / trees / viewDist have no UI row; main.js and world.js read them)
    quality: "auto",
    shadows: true,
    bloom: true,
    grass: "high",
    trees: "high",
    resScale: 1,
    fps: 60,
    idleEco: true,
    viewDist: 1,
    // display
    fpsMeter: false,
    shake: true,
    // p28: cool mode (30 fps, render scale <= 1, shadows 1/6, no mirror, no bloom) and the on-device performance overlay
    coolMode: false,
    perfInfo: false,
    // controls
    rotSpeed: 1,
    zoomSpeed: 1,
    invertRotate: false,
    haptics: true,
    // owner-only: preview the castle at any level (0 = real level)
    previewLevel: 0
  };
  var RANGE = {
    master: [0, 1],
    music: [0, 1],
    ambience: [0, 1],
    characters: [0, 1],
    effects: [0, 1],
    resScale: [0.5, 1],
    viewDist: [0.5, 2],
    rotSpeed: [0.5, 2],
    zoomSpeed: [0.5, 2],
    previewLevel: [0, 30]
  };
  var clean = (k, v) => {
    const d = DEFAULTS[k];
    if (typeof v !== typeof d || typeof v === "number" && !Number.isFinite(v)) return d;
    if (k === "fps") return v === 30 ? 30 : 60;
    if (k === "previewLevel") v = Math.round(v);
    const r = RANGE[k];
    return r ? Math.min(r[1], Math.max(r[0], v)) : v;
  };
  var subs = /* @__PURE__ */ new Set();
  var S = { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const j = JSON.parse(raw);
      for (const k of Object.keys(DEFAULTS)) if (j && k in j) S[k] = clean(k, j[k]);
    }
  } catch (e) {
  }
  var saveT = 0;
  var save = () => {
    saveT = 0;
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch (e) {
    }
  };
  var saveSoon = () => {
    if (!saveT) saveT = setTimeout(save, 300);
  };
  try {
    addEventListener("pagehide", () => {
      if (saveT) {
        clearTimeout(saveT);
        save();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && saveT) {
        clearTimeout(saveT);
        save();
      }
    });
  } catch (e) {
  }
  var settings = new Proxy(S, {
    set(o, k, v) {
      if (k in DEFAULTS) v = clean(k, v);
      if (o[k] === v) return true;
      o[k] = v;
      saveSoon();
      for (const f of subs) {
        try {
          f(k, v);
        } catch (e) {
          console.warn(e);
        }
      }
      return true;
    }
  });
  var onSetting = (f) => {
    subs.add(f);
    return () => subs.delete(f);
  };
  function resetSettings({ keep = ["previewLevel"] } = {}) {
    for (const k of Object.keys(DEFAULTS)) if (!keep.includes(k)) settings[k] = DEFAULTS[k];
  }

  // src/i18n.js
  var INFO = {
    // ---- the castle
    keep: ["\u{1F3F0}", "The Keep", "Heart of your kingdom. The stronger the keep, the greater the army it can command."],
    gate: ["\u{1F6AA}", "Great Gate", "The only way in. Giants guard it day and night, and the portcullis never sleeps."],
    wall: ["\u{1F9F1}", "The Blue Wall", "Its blue runes never fade. Stone remembers every siege it has broken."],
    tower: ["\u{1F5FC}", "Wall Tower", "Archers and catapults hold the high ground here; nothing crosses the moat unseen."],
    crystal: ["\u{1F48E}", "Blue Crystal", "Source of the wall's power. While it shines, the wall stands."],
    treasury: ["\u{1F4B0}", "Treasury", "The kingdom's gold sleeps here behind iron doors and sworn guards."],
    church: ["\u{1F514}", "Bell Church", "Its bell rings over the whole town every three hours."],
    market: ["\u{1F6D2}", "Town Market", "Stalls, carts and the well in the square: the beating heart of the lower town."],
    well: ["\u{1FAA3}", "Well", "Cold, clear water for the town, the troops and the horses."],
    // ---- military buildings
    barracks: ["\u2694\uFE0F", "Barracks", "Recruits arrive as farmers and leave as soldiers. Drums at dawn, steel by dusk."],
    forge: ["\u{1F528}", "Forge", "Swords, armour and catapult stones are hammered out in its roaring heat."],
    smithy: ["\u2692\uFE0F", "Smithy", "Horseshoes, nails and hinges ring off the anvil from first light to last."],
    training: ["\u{1F3AF}", "Training Ground", "Straw targets, wooden swords and bruised pride: where soldiers are made."],
    archer: ["\u{1F3F9}", "Archery Range", "Bowmen loose a thousand arrows a day until every one finds the mark."],
    camp: ["\u26FA", "Army Camp", "Tents in ordered rows, banners in the wind. The army is ready to march."],
    stables: ["\u{1F434}", "Stables", "Hay, leather and warm breath. The cavalry's horses are groomed and shod here."],
    watchtower: ["\u{1F5FC}", "Watchtower", "A lantern burns at the top all night. No rider crosses the fields unseen."],
    cannon: ["\u{1F4A5}", "Cannon", "Bronze, iron and black powder. One roar from its mouth and a siege line breaks."],
    catapult_tower: ["\u{1F3EF}", "Catapult Tower", "Hurls stones the size of oxen over the walls at anyone foolish enough to approach."],
    // ---- the town
    house: ["\u{1F3E0}", "Townhouse", "Timber, plaster and red tiles. More people, more gold for the crown."],
    cottage: ["\u{1F3E1}", "Cottage", "A snug home for farmers and their families; smoke curls from the chimney at supper."],
    mansion: ["\u{1F3DB}\uFE0F", "Mansion", "Home of a noble house, with tall windows, a walled garden and opinions about everything."],
    tavern: ["\u{1F37A}", "Tavern", "Ale, songs and rumours from every road. Soldiers spend their pay here, and spies their evenings."],
    bakery: ["\u{1F956}", "Bakery", "Ovens fired before dawn. Fresh bread feeds the town and the garrison alike."],
    guild: ["\u{1F4DC}", "Guild Hall", "Merchants and master craftsmen strike their bargains and keep the town's ledgers here."],
    granary: ["\u{1F33E}", "Granary", "The harvest is stored here, dry and safe, against long winters and longer sieges."],
    windmill: ["\u{1F33E}", "Windmill & Farms", "Golden fields and turning sails: the army marches on this bread."],
    windmill_town: ["\u{1F32C}\uFE0F", "Town Windmill", "Its great sails turn the millstones that grind the town's flour."],
    lumber: ["\u{1FAB5}", "Lumber Yard", "Oak and pine for houses, palisades and siege engines."],
    cow: ["\u{1F404}", "Cattle", "Milk and meat for the people and the army."],
    // ---- gem economy
    mine_ruby: ["\u{1F534}", "Ruby Mine", "A tunnel deep in the red rock; its winch wheel turns day and night."],
    mine_emerald: ["\u{1F7E2}", "Emerald Mine", "The stamp mill crushes the green ore and the sluices wash out the stones."],
    mine_turq: ["\u{1F535}", "Turquoise Mine", "The wooden crane hauls turquoise up from the heart of the mountain."],
    vault_ruby: ["\u{1F534}", "Ruby Vault", "Iron-bound and guarded. Every ruby you collect is stored here; upgrade it to hold more."],
    vault_emerald: ["\u{1F7E2}", "Emerald Vault", "Emeralds rest here behind three locks. A fuller vault, a richer kingdom."],
    vault_turq: ["\u{1F535}", "Turquoise Vault", "Sky-blue stones stacked in oak chests. Raise its walls to store more turquoise."],
    // ---- the army
    knight: ["\u{1F6E1}\uFE0F", "Mounted Knight", "Plate armour, navy cloak and a longsword raised. Knights patrol the roads and the town streets."],
    cavalry: ["\u{1F40E}", "Cavalry", "Barded war-horses and blue-cloaked riders. When they charge, the ground itself remembers."],
    horse: ["\u{1F40E}", "Horses", "Black, white and bay: the finest horses in the realm, bred for the cavalry."],
    axerider: ["\u{1FA93}", "Axe Riders", "Roman-helmed riders on bay warhorses with long axes. Where they ride, the line breaks."],
    pegasus: ["\u{1FABD}", "Pegasus", "Winged steeds of the high air. They ride the winds above the wall, watching every road."],
    dragon: ["\u{1F409}", "Blue Dragon", "Guardian of the sky. It circles the castle day and night, and fears nothing."],
    dragons: ["\u{1F409}", "Dragons", "Born of blue fire and old magic. Raised from the egg, they grow into the terror of the skies."],
    dragonling: ["\u{1F432}", "Dragonling", "Young, quick and fiercely loyal. One day it will darken the sky like its elders."],
    giant: ["\u{1F5FF}", "Giant Guard", "Armoured giants with iron clubs, ready for battle at the gate."],
    troll: ["\u{1FAA8}", "Troll", "Thick hide, thicker skull. Feed it well and it will hold any line."],
    werewolf: ["\u{1F43A}", "Werewolf", "Swift and savage under the moon. Enemies hear the howl long before they see it."],
    soldier: ["\u2694\uFE0F", "Soldier", "Drilled, armoured and loyal to the crown."],
    swordsman: ["\u2694\uFE0F", "Swordsman", "A great two-handed blade and a steel helm. Where he swings, the line opens."],
    spearman: ["\u{1F531}", "Spearman", "Shield to shield, spear over spear: the wall that walks."],
    guard: ["\u{1F6E1}\uFE0F", "Guard", "Sword and shield at the gate. Nobody passes without the watchword."],
    bowman: ["\u{1F3F9}", "Archer", "Keen eyes and a longbow. Strikes invaders long before they reach the wall."],
    mage: ["\u{1F52E}", "Battle Mage", "Speaks words older than the kingdom. The air crackles when the staff rises."],
    imp: ["\u{1F608}", "Imp", "Small, quick and mischievous. Useful, as long as someone keeps an eye on it."],
    siege: ["\u{1FAB5}", "Siege Engines", "Catapults, rams and trebuchets: patience made of timber and rope."],
    catapult: ["\u{1FAA8}", "Catapult", "Timber, rope and a bucket of stones. Walls fear it more than swords."],
    trebuchet: ["\u{1F3D7}\uFE0F", "Trebuchet", "The heaviest arm of the siege train; it can throw a boulder clean over a castle wall."],
    ram: ["\u{1F40F}", "Battering Ram", "An iron-capped trunk under a roof of hides. Gates do not argue with it for long."],
    ballista: ["\u{1F3AF}", "Ballista", "A giant crossbow whose bolts can pin a dragon's wing."],
    frost_spire: ["\u2744\uFE0F", "Frost Spire", "A crystal spire that chills the air: everything caught in its light slows to a crawl."],
    flame_tower: ["\u{1F525}", "Flame Tower", "A brazier tower that spits burning oil at anything that comes close to the wall."],
    dragonbane: ["\u{1F3F9}", "Dragonbane", "A great harpoon engine made for one purpose: to bring dragons down."],
    siege_tower: ["\u{1F3F0}", "Siege Tower", "A walking fortress on wheels, built to put soldiers on top of enemy walls."],
    hero: ["\u{1F451}", "Hero", "Legends ride with the army. Every hero brings a gift no soldier can match."],
    hero_lord: ["\u{1F451}", "The Mounted Lord", "On a white horse at the head of the column: the kingdom's banner made flesh."],
    hero_shieldmaiden: ["\u{1F6E1}\uFE0F", "Shieldmaiden", "Round shield, a blued war axe and no fear at all. Songs are already written about her."],
    settings: ["\u2699\uFE0F", "Settings", ""]
  };
  var T = {
    en: {
      soon: "Coming soon",
      mine: { rate: "Per hour", cap: "Mine holds", ready: "Ready", collect: "Collect", empty: "Nothing to collect yet", got: "Collected", vault: "Vault full \u2014 upgrade storage" },
      settings: "Settings",
      close: "Close",
      reset: "Reset to defaults",
      tutorial: "Replay the tutorial",
      reload: "The game will reload to apply this",
      tabs: { sound: "Sound", graphics: "Graphics", controls: "Controls", kingdom: "Kingdom", about: "About" },
      sound: { master: "Master volume", music: "Music", ambience: "Ambience & weather", characters: "Characters & animals", effects: "Effects & UI", voice: "Voice greeting", bgMute: "Mute in background" },
      graphics: { quality: "Graphics quality", shadows: "Shadows", bloom: "Bloom glow", resScale: "Resolution", fps: "Frame rate", idleEco: "Power saver when idle", fpsMeter: "Show FPS", coolMode: "Cool mode (30 fps, runs cooler)", perfInfo: "Performance info", shake: "Camera shake" },
      controls: { rotSpeed: "Rotate speed", zoomSpeed: "Zoom speed", invertRotate: "Invert rotation", haptics: "Haptics" },
      kingdom: {
        date: "Kingdom date",
        time: "Time",
        owner: "Owner tools",
        preview: "Castle level preview",
        off: "Off",
        lv: "Level",
        real: "Your real level",
        back: "Back to the real level",
        note: "Shows the castle as it looks at any level, on this device only. Your real level and resources are untouched.",
        tag: "Preview"
      },
      opt: { auto: "Auto", low: "Low", medium: "Medium", high: "High", ultra: "Ultra" },
      about: { title: "About Blue Wall", ver: "Version", made: "Made for", credits: "Models, textures & sounds by", thanks: "Thanks to every artist who shared their work for free." },
      tod: { dawn: "Dawn", morning: "Morning", noon: "Noon", afternoon: "Afternoon", dusk: "Dusk", night: "Night" },
      welcome: { pre: "Welcome,", lord: "My Lord", tap: "Tap to enter", voice: "Welcome, my lord." },
      info: INFO
    }
  };
  function tr() {
    return T.en;
  }

  // src/ui_theme_r2.js
  var DISPLAY = "Cinzel,'Libre Baskerville',Vazirmatn,Georgia,serif";
  var LEATHER = "linear-gradient(180deg,#3c2a1b 0%,#291c11 52%,#1b120b 100%)";
  var LEATHER2 = "linear-gradient(180deg,#4a3622,#2d2014)";
  var PARCH = "linear-gradient(180deg,#ecdcb2,#d6bf8a)";
  var BRASS = "linear-gradient(180deg,#f5d583,#c0892a 54%,#8f6014)";
  var BRASS2 = "linear-gradient(180deg,#ffe9a6,#d49a2a 54%,#9a6a14)";
  var BTN = "linear-gradient(180deg,#5b4731,#3b2c1c)";
  var WAR = "linear-gradient(180deg,#b8483a,#7a2018 54%,#4d120d)";
  var WELL = "linear-gradient(180deg,#120b06,#1d130b)";
  var PLATE = "inset 0 0 0 4px #1b120b,inset 0 0 0 5px rgba(196,154,84,.55)";
  var CAP = "inset 0 0 0 2px rgba(27,18,11,.9),inset 0 0 0 3px rgba(196,154,84,.32)";
  var EMB = "inset 0 1px 0 rgba(255,244,200,.85),inset 0 -3px 0 rgba(70,40,6,.55)";
  var RING = "conic-gradient(from 210deg,#ffe9a6,#c0892a 18%,#6b4510 38%,#f5d583 55%,#a8731d 75%,#ffe9a6)";
  var INK = "#3a2a14";
  var CREAM = "#f4e8cc";
  var MUTE = "#c9b48a";
  var GOLD = "#e0b255";
  var RIM = "#8a6a3a";
  var DARKB = "#4d300a";
  var badgeC = () => `<svg class="k-lvb" viewBox="0 0 60 60" width="60" height="60" aria-hidden="true"><defs><linearGradient id="kLb1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f5d583"/><stop offset=".54" stop-color="#c0892a"/><stop offset="1" stop-color="#8f6014"/></linearGradient><linearGradient id="kLb2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3622"/><stop offset="1" stop-color="#1b120b"/></linearGradient></defs><path d="M30 2.5L54.5 16.5v27L30 57.5 5.5 43.5v-27z" fill="url(#kLb1)" stroke="#2c1a05" stroke-width="1.6" stroke-linejoin="round"/><path d="M30 8.5L49.5 19.5v21L30 51.5 10.5 40.5v-21z" fill="url(#kLb2)" stroke="#2c1a05" stroke-width="1"/><path d="M30 11.8L46.7 21.4v17.2L30 48.2 13.3 38.6V21.4z" fill="none" stroke="rgba(224,178,85,.6)" stroke-width="1"/></svg>`;
  var gearC = () => `<svg class="k-lvg" viewBox="0 0 22 22" width="22" height="22" aria-hidden="true"><circle cx="11" cy="11" r="10" fill="url(#kLb1)" stroke="#2c1a05" stroke-width="1.2"/><g fill="none" stroke="#2c1a05" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="2.8"/><path d="M11 4.3v2.1M11 15.6v2.1M4.3 11h2.1M15.6 11h2.1M6.3 6.3l1.5 1.5M14.2 14.2l1.5 1.5M15.7 6.3l-1.5 1.5M7.8 14.2l-1.5 1.5"/></g></svg>`;
  var KIT2_CSS = `
.bw-ui *{scrollbar-color:#8a6a3a #1b120b}
.bw-ui .bwu-body,.bw-ui .bwa-body,.bw-ui .bws-body,.bw-ui .bwk-body,.bw-ui .bw-body,.bw-ui .bwa-sheet,.bw-ui .bwh-pan{scrollbar-width:thin}
/* ---- top HUD: scrim, level badge, name plate, gem capsules, special gems */
.bw-ui .bw-top{background:linear-gradient(rgba(20,11,4,.6),rgba(20,11,4,0))}
.bw-ui .bw-lvl .k-lvb{display:block;filter:drop-shadow(0 3px 5px rgba(0,0,0,.6))}
.bw-ui .bw-lvl .lvn{font:900 19px/1 ${DISPLAY};color:${CREAM};text-shadow:0 1px 0 #000,0 0 6px rgba(0,0,0,.85)}
.bw-ui .bw-lvl .gear{left:36px;top:36px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.7))}
.bw-ui .bw-lvl:before{content:"";position:absolute;left:-8px;top:-8px;right:-8px;bottom:-8px}
.bw-ui .bw-who{background:${LEATHER};border:1px solid ${RIM};border-left:0;box-shadow:0 3px 9px rgba(0,0,0,.5),${CAP}}
.bw-ui .bw-who .nm{font-family:${DISPLAY};font-weight:900;letter-spacing:.6px;color:${CREAM};text-shadow:0 1px 0 #000}
.bw-ui .bw-who .sub{color:${GOLD}}
.bw-ui .bw-g{background:${LEATHER};border:1px solid ${RIM};box-shadow:0 3px 9px rgba(0,0,0,.5),${CAP}}
.bw-ui .bw-g .ct{color:${CREAM}}.bw-ui .bw-g .ct .num{text-shadow:0 1px 0 #000}
.bw-ui .bw-g .ct small{color:${MUTE}}
.bw-ui .bw-g .tk{background:#120b06;box-shadow:inset 0 0 0 1px rgba(196,154,84,.38)}
.bw-ui .bw-g.full{border-color:var(--gl)}
.bw-ui .bw-g.full:after{opacity:.5}
.bw-ui .bw-p{background:${LEATHER};border:1px solid ${RIM};box-shadow:0 3px 9px rgba(0,0,0,.5),${CAP}}
.bw-ui .bw-p:before{content:"";position:absolute;left:-8px;right:-4px;top:-10px;bottom:-10px}
.bw-ui .bw-p .ct{color:${CREAM}}
.bw-ui .bw-p[data-p="sap"]{border-color:#7f93d6}.bw-ui .bw-p[data-p="onyx"]{border-color:#b9b2a4}
.bw-ui .bw-toast{padding:11px 20px;border-radius:14px;background:${LEATHER};border:1px solid ${RIM};color:${CREAM};font-size:13.5px;box-shadow:${CAP},0 8px 22px rgba(0,0,0,.62)}
/* ---- the corner buttons (Kingdom / Army / Rank): brass ring, leather core; no gleam that runs forever */
.bw-ui .bwu-btn .ring{background:${RING};box-shadow:0 5px 14px rgba(0,0,0,.55),0 0 0 1.5px #1b0f05}
.bw-ui .bwu-btn .core{background:radial-gradient(circle at 50% 28%,#5a4328,#2a1c10 62%,#140c06);box-shadow:inset 0 2px 6px rgba(255,226,160,.4),inset 0 -6px 12px rgba(0,0,0,.55)}
.bw-ui .bwu-btn.hot .ring{box-shadow:0 5px 14px rgba(0,0,0,.55),0 0 0 1.5px #1b0f05,0 0 22px rgba(245,213,131,.85)}
.bw-ui .bwu-btn .core svg{color:${CREAM}}
.bw-ui .bwu-btn .lb,.bw-ui .bwa-btn .lb{font-family:${DISPLAY};color:${CREAM};text-shadow:0 1px 0 #140c06,1px 0 0 #140c06,-1px 0 0 #140c06,0 0 6px rgba(0,0,0,.85)}
.bw-ui .bwa-btn .ring{background:conic-gradient(from 0deg,#f5d583 calc(var(--p,0) * 1%),#1b120b 0);box-shadow:0 6px 16px rgba(0,0,0,.6),0 0 0 2px #1b0f05}
.bw-ui .bwa-btn .ring:before{background:${RING}}
.bw-ui .bwa-btn .core{background:radial-gradient(circle at 50% 25%,#5a4328,#2a1c10 58%,#140c06);box-shadow:inset 0 2px 7px rgba(255,226,160,.4),inset 0 -6px 12px rgba(0,0,0,.6)}
.bw-ui .bwa-btn .core svg,.bw-ui .bwa-btn .core b{color:${CREAM}}
.bw-ui .bwa-btn.hot .ring{box-shadow:0 6px 16px rgba(0,0,0,.6),0 0 0 2px #1b0f05,0 0 24px rgba(245,213,131,.85)}
.bw-ui .bwa-chip,.bw-ui .bwk-chip{height:44px;background:${LEATHER};border:1px solid ${RIM};color:${CREAM};box-shadow:${CAP},0 3px 10px rgba(0,0,0,.5)}
.bw-ui .bwa-chip i{color:#c5e58b}
/* ---- the Assist button (bottom right): brass bezel, leather core, a steady glow when something waits */
.bw-ui .bwh-btn .halo{background:radial-gradient(circle,rgba(245,213,131,.4) 0,rgba(196,134,42,.15) 46%,rgba(196,134,42,0) 70%);animation:none;opacity:.55}
.bw-ui .bwh-btn .bez{background:${RING};box-shadow:0 5px 14px rgba(0,0,0,.6),0 0 0 1.5px #1b0f05,inset 0 1px 1px rgba(255,244,200,.7)}
.bw-ui .bwh-btn .bez:after{animation:none;opacity:0}
.bw-ui .bwh-btn .core{background:radial-gradient(circle at 50% 28%,#5a4328,#2a1c10 58%,#140c06);box-shadow:inset 0 2px 6px rgba(255,226,160,.4),inset 0 -4px 8px rgba(0,0,0,.6),0 0 0 1px #1b0f05}
.bw-ui .bwh-btn .core:before{background:linear-gradient(rgba(255,240,200,.22),rgba(255,240,200,0))}
.bw-ui .bwh-btn .seal{animation:none;filter:drop-shadow(0 2px 2px rgba(0,0,0,.65))}
.bw-ui .bwh-btn .gem{background:radial-gradient(circle at 36% 30%,#fff,#ffe9a6 30%,#d49a2a 62%,#8f6014);box-shadow:0 0 0 1px #2c1a05,0 0 7px 1px rgba(245,213,131,.6)}
.bw-ui .bwh-btn .gem:after{animation:none;opacity:.35;background:radial-gradient(circle,rgba(255,233,166,.85),rgba(245,213,131,0) 70%)}
.bw-ui .bwh-btn.hot .pulse{animation:none;opacity:1;box-shadow:0 0 0 2px rgba(245,213,131,.95),0 0 14px rgba(245,213,131,.7)}
.bw-ui .bwh-btn:before{content:"";position:absolute;left:-6px;right:-6px;top:-6px;bottom:-6px}
/* ---- shared panel chrome: Army, Shop, Rank / Clan, Settings, Hub (the Kingdom page got it in round 1) */
.bw-ui .bwa,.bw-ui .bws,.bw-ui .bwk,.bw-ui .bw-set{background:rgba(12,6,2,.68)}
.bw-ui .bwh{background:radial-gradient(ellipse at 50% 46%,rgba(30,16,6,.5),rgba(10,5,2,.8))}
.bw-ui .bwa-pan,.bw-ui .bws-pan,.bw-ui .bwk-pan,.bw-ui .bw-panel,.bw-ui .bwh-pan{border-radius:18px;background:${LEATHER};border:1px solid ${RIM};box-shadow:${PLATE},0 20px 60px rgba(0,0,0,.72);color:${CREAM}}
.bw-ui .bwa-h .t b,.bw-ui .bws-h b,.bw-ui .bwk-h .t b,.bw-ui .bwh-h .tt b,.bw-ui .bw-ph .t{font-family:${DISPLAY};font-weight:900;letter-spacing:.8px;text-transform:uppercase;color:${CREAM};text-shadow:none}
.bw-ui .bwk-h .t b{color:var(--lc,${CREAM})}
.bw-ui .bwk-h .t b{font-size:17px;letter-spacing:.4px}
.bw-ui .bwa-h .t span,.bw-ui .bwk-h .t span,.bw-ui .bwh-h .tt span{color:${MUTE}}
.bw-ui .bwk-h .t>span{display:block;line-height:1.45;font-size:12.5px}
.bw-ui .bwk-h .t>span{position:relative}
.bw-ui .bwk-h .t>span>svg{position:absolute;left:0;top:3px;margin:0}
.bw-ui .bwk-h .t>span>svg+b{margin-left:21px}
.bw-ui .bwk-h .t>span b{display:inline;font-family:inherit;font-size:14px;letter-spacing:0;text-transform:none;font-weight:700}
.bw-ui .bwk-h .t span.bwc-tag{display:inline-block;margin:0 6px 0 0;padding:1px 6px;font-size:11px;line-height:1.4;color:#2c1a05;vertical-align:1px}
.bw-ui .bwa-h .t span b{color:${GOLD}}
.bw-ui .bwa-x,.bw-ui .bws-x,.bw-ui .bwk-x,.bw-ui .bwh-x,.bw-ui .bwnav{flex:0 0 auto;width:44px;height:44px;border-radius:12px;background:${BTN};border:1px solid ${RIM};color:${CREAM};box-shadow:inset 0 1px 0 rgba(255,226,160,.22)}
.bw-ui .bwa-tabs,.bw-ui .bws-tabs,.bw-ui .bwk-tabs{background:rgba(0,0,0,.3);border:1px solid rgba(196,154,84,.32)}
.bw-ui .bwa-tabs button,.bw-ui .bws-tabs button,.bw-ui .bwk-tabs button{min-height:44px;color:${MUTE};font-family:${DISPLAY};font-weight:900}
.bw-ui .bwa-tabs button.on,.bw-ui .bws-tabs button.on,.bw-ui .bwk-tabs button.on{color:#2c1a05;background:${BRASS};border:1px solid ${DARKB};box-shadow:${EMB}}
.bw-ui .bwk-tabs button .dot{background:#9bd05a;box-shadow:none}
.bw-ui .bw-ph{border-bottom-color:rgba(196,154,84,.3)}
.bw-ui .bw-kd div{background:rgba(255,226,160,.07);border-color:rgba(196,154,84,.4)}
.bw-ui .bw-kd span{color:${GOLD}}.bw-ui .bw-kd b{color:${CREAM}}
.bw-ui .bw-tabs{border-bottom-color:rgba(196,154,84,.25)}
.bw-ui .bw-tabs{gap:4px}
.bw-ui .bw-tab{min-height:44px;padding:7px 9px;display:flex;align-items:center;color:${MUTE};background:rgba(255,226,160,.06)}
.bw-ui .bw-tab.on{color:#2c1a05;background:${BRASS};border-color:${DARKB};box-shadow:${EMB}}
/* ---- Settings */
.bw-ui .bw-row{border-bottom-color:rgba(196,154,84,.2)}
.bw-ui .bw-row .l{color:${CREAM}}.bw-ui .bw-row .v{color:${GOLD}}
.bw-ui .bw-row input[type=range]{height:44px;margin-top:0;background:linear-gradient(90deg,#c4872a var(--p,50%),rgba(255,226,160,.16) var(--p,50%)) center/100% 6px no-repeat}
.bw-ui .bw-row input[type=range]::-webkit-slider-thumb{width:26px;height:26px;background:radial-gradient(circle at 35% 30%,#fff3c4,#c0892a);border:2px solid #2c1a05}
.bw-ui .bw-row input[type=range]::-moz-range-thumb{width:24px;height:24px;background:#d49a2a;border:2px solid #2c1a05}
.bw-ui .bw-seg span{min-height:44px;display:inline-flex;align-items:center;padding:0 14px;color:${CREAM};background:${BTN};border:1px solid ${RIM}}
.bw-ui .bw-seg span.on{color:#2c1a05;background:${BRASS};border-color:${DARKB};box-shadow:${EMB}}
.bw-ui .bw-tg{background:#1d130b;box-shadow:inset 0 0 0 1px ${RIM}}
.bw-ui .bw-tg:before{content:"";position:absolute;left:-6px;right:-6px;top:-9px;bottom:-9px}
.bw-ui .bw-tg::after{background:${MUTE}}
.bw-ui .bw-tg.on{background:linear-gradient(90deg,#8f6014,#e0b255)}.bw-ui .bw-tg.on::after{background:#2c1a05}
.bw-ui .bw-btnw{min-height:48px;border:1px solid ${RIM};background:${BTN};color:${CREAM}}
.bw-ui .bw-about h3{color:${GOLD};font-family:${DISPLAY}}.bw-ui .bw-about p{color:${MUTE}}
.bw-ui .bw-cred{color:${MUTE}}.bw-ui .bw-cred b{color:${GOLD}}.bw-ui .bw-cred .lc{color:#a8926a}.bw-ui .bw-cred h4{color:${GOLD}}
.bw-ui .bw-cred div{border-bottom-color:rgba(196,154,84,.18)}
/* ---- Hub */
.bw-ui .bwh-pan:before{background:linear-gradient(90deg,rgba(245,213,131,0),rgba(245,213,131,.9),rgba(245,213,131,0));background-size:100% 100%;background-position:0 0}
.bw-ui .bwh.on .bwh-pan:before{animation:none}
.bw-ui .bwh-sep{background:linear-gradient(90deg,rgba(196,154,84,0),rgba(196,154,84,.65),rgba(196,154,84,0))}
.bw-ui .bwh-a{min-height:80px;background:${BRASS};border:1px solid ${DARKB};color:#2c1a05;box-shadow:${EMB},0 4px 10px rgba(0,0,0,.45)}
.bw-ui .bwh-a:after{display:none}.bw-ui .bwh.on .bwh-a.hot:after{animation:none}
.bw-ui .bwh-a .bz{background:${RING}}
.bw-ui .bwh-a .ring{background:conic-gradient(from 0deg,#ffe9a6 calc(var(--p,0) * 1%),#1b120b 0);box-shadow:0 0 0 1.5px #1b0f05}
.bw-ui .bwh-a .core{background:radial-gradient(circle at 50% 24%,#5a4328,#2a1c10 62%,#140c06);box-shadow:inset 0 2px 6px rgba(255,226,160,.4)}
.bw-ui .bwh-a .tx b{font-family:${DISPLAY};font-weight:900;color:#2c1a05;text-shadow:0 1px 0 rgba(255,244,200,.55)}
.bw-ui .bwh-a .tx small{color:${DARKB}}.bw-ui .bwh-a .ch{color:#2c1a05;opacity:1}
.bw-ui .bwh-a.hot{background:${BRASS2};border-color:#2c1a05;box-shadow:${EMB},0 0 0 2px rgba(255,240,190,.9),0 4px 14px rgba(0,0,0,.5)}
.bw-ui .bwh.on .bwh-a.hot .core:after{animation:none;opacity:.55;box-shadow:inset 0 0 12px 1px rgba(255,226,160,.9)}
.bw-ui .bwh-t{background:${LEATHER2};border:1px solid ${RIM};box-shadow:inset 0 1px 0 rgba(255,226,160,.2),0 3px 8px rgba(0,0,0,.4)}
.bw-ui .bwh-t:active{border-color:#f5d583}
.bw-ui .bwh-t .ic{background:${RING}}
.bw-ui .bwh-t .ic>i{color:${CREAM};background:radial-gradient(circle at 50% 26%,#5a4328,#2a1c10 60%,#140c06);box-shadow:inset 0 2px 5px rgba(255,226,160,.3)}
.bw-ui .bwh-t .ic .gem3{filter:drop-shadow(0 1px 2px rgba(0,0,0,.7))}
.bw-ui .bwh-t b{color:${CREAM}}.bw-ui .bwh-t small{font-size:11px;color:${MUTE}}
/* ---- Army */
.bw-ui .bwa-em:after{background:${BRASS};border-color:${DARKB};color:#2c1a05}
.bw-ui .bwa-hs .r{color:${MUTE}}.bw-ui .bwa-hs .r b{color:${CREAM}}.bw-ui .bwa-hs .r em{color:#c5e58b}
.bw-ui .bwa-bar{background:#120b06;border-color:rgba(196,154,84,.5)}
.bw-ui .bwa-bar i{background:linear-gradient(90deg,#c4872a,#f5d583);box-shadow:none}
.bw-ui .bwa-bar i.q{background:repeating-linear-gradient(45deg,#8f6014,#8f6014 5px,#6b4510 5px,#6b4510 10px);opacity:1}
.bw-ui .bwa-ft{background:linear-gradient(0deg,#1b120b 60%,rgba(27,18,11,0))}
.bw-ui .bwa-ft button{min-height:56px;border:1px solid #2c0a06;background:${WAR};color:#fff1d6;font-family:${DISPLAY};font-weight:900;box-shadow:inset 0 1px 0 rgba(255,214,190,.45),inset 0 -3px 0 rgba(60,8,4,.6),0 4px 12px rgba(0,0,0,.45)}
.bw-ui .bwa-sec{color:${GOLD}}
.bw-ui .bwa-lane{background:rgba(255,226,160,.07);border-color:rgba(196,154,84,.42)}
.bw-ui .bwa-lane .hd,.bw-ui .bwa-lane .hd b{color:${CREAM}}.bw-ui .bwa-lane .hd .tm{color:${GOLD}}
.bw-ui .bwa-lane .rush{min-height:44px;padding:0 14px;border:1px solid ${DARKB};background:${BRASS2};color:#2c1a05;box-shadow:${EMB}}
.bw-ui .bwa-lane .mi{background:#1b120b;border-color:${RIM}}
.bw-ui .bwa-lane .mi:first-child{border-color:#f5d583;box-shadow:0 0 0 2px rgba(245,213,131,.3),0 0 10px rgba(245,213,131,.45)}
.bw-ui .bwa-lane .mi .nn{background:${BRASS};border-color:${DARKB};color:#2c1a05;text-shadow:none}
.bw-ui .bwa-lane .mi svg{color:${CREAM}}
.bw-ui .bwa-lane .hint{color:${MUTE};font-size:11px}
.bw-ui .bwa-c{background:${PARCH};border:2px solid var(--rc,${RIM});box-shadow:0 0 0 1px #2c1a05,0 3px 9px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,250,225,.7)}
.bw-ui .bwa-c .pic{background:radial-gradient(circle at 50% 30%,#5a4328,#1b120b 82%);box-shadow:inset 0 0 0 1px rgba(58,42,20,.7)}
.bw-ui .bwa-c.sp .pic{background:radial-gradient(circle at 50% 35%,#4a3622,#140c06)}
.bw-ui .bwa-c b.nm{color:${INK}}
.bw-ui .bwa-c .cs{color:${INK}}.bw-ui .bwa-c .cs span.no{color:#8a1226}
/* mother (AR1 merge): the soldier card's stat row + train time were light-on-navy; on the parchment panel they need ink */
.bw-ui .bwa-c.u .sr{color:${INK}}.bw-ui .bwa-c.u .sr svg{opacity:1}.bw-ui .bwa-c.u .cs .tm{color:#6b4a12}
.bw-ui .bwa-c .own{background:#2a1c10;border-color:${RIM};color:${CREAM}}
.bw-ui .bwa-c .qd{background:${BRASS};border-color:${DARKB};color:#2c1a05;text-shadow:none}
.bw-ui .bwa-c .gdb{background:#2a1c10;border-color:${GOLD};color:${CREAM}}
/* mother (AR1 merge): the card's info button is AR1's round 'i' (44x44 hit area, bottom-right of the picture) \u2014 UI1-R2's dark box + top move removed */
.bw-ui .bwa-c .rt{font-size:10px;letter-spacing:1px}.bw-ui .bws-tag{font-size:10px}.bw-ui .bwu-tab small{font-size:11px}
.bw-ui .bwu-cat{position:relative}.bw-ui .bwu-cat:before{content:"";position:absolute;left:-3px;right:-3px;top:-10px;bottom:-10px}.bw-ui .bwa-c .qd{top:32px}
.bw-ui .bwa-note{color:${MUTE}}
.bw-ui .bwa-ov{background:rgba(12,6,2,.74)}
.bw-ui .bwa-sheet{background:${LEATHER};border:1px solid ${RIM};box-shadow:${PLATE},0 18px 50px rgba(0,0,0,.72);color:${CREAM}}
.bw-ui .bwa-sheet h3{font-family:${DISPLAY};text-transform:uppercase;letter-spacing:.8px;color:${CREAM}}
.bw-ui .bwa-sheet p{color:${MUTE}}
.bw-ui .bwa-sheet .big{border-color:${GOLD};background:radial-gradient(circle at 50% 30%,#5a4328,#140c06);color:${CREAM}}
.bw-ui .bwa-sheet .st span{background:rgba(255,226,160,.08);border-color:rgba(196,154,84,.42);color:${CREAM}}
.bw-ui .bwa-gd{background:rgba(255,226,160,.07);border-color:rgba(196,154,84,.42);color:${CREAM}}
.bw-ui .bwa-gd>b,.bw-ui .bwa-gd.off span,.bw-ui .bwa-gd small{color:${MUTE}}
.bw-ui .bwa-gd button{width:44px;height:44px;border:1px solid ${DARKB};background:${BRASS};color:#2c1a05;box-shadow:${EMB}}
.bw-ui .bwa-emg button{min-height:44px;border-color:rgba(196,154,84,.35);background:radial-gradient(circle at 50% 30%,rgba(90,67,40,.7),rgba(20,12,6,.9))}
.bw-ui .bwa-emg{grid-template-columns:repeat(4,minmax(0,1fr))}.bw-ui .bwa-emg button>*{max-width:100%;height:auto}
.bw-ui .bwa-emg button.on{border-color:#f5d583;box-shadow:0 0 0 2px rgba(245,213,131,.4),0 0 12px rgba(245,213,131,.5)}
/* ---- Shop */
.bw-ui .bws-bal span{background:${LEATHER};border-color:${RIM};color:${CREAM};box-shadow:${CAP}}
.bw-ui .bws-bal span.s{border-color:#7f93d6}.bw-ui .bws-bal span.o{background:${LEATHER};border-color:#b9b2a4}
.bw-ui .bws-note{color:${MUTE}}.bw-ui .bws-note b{color:${CREAM}}
.bw-ui .bws-sm{color:${MUTE}}
.bw-ui .bws-c .bws-note,.bw-ui .bws-how .bws-sm{color:#5a4524}.bw-ui .bws-c .bws-note b{color:${INK}}
.bw-ui .bws-c{background:${PARCH};border:1px solid ${RIM};box-shadow:0 0 0 1px #2c1a05,0 3px 9px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,250,225,.7)}
.bw-ui .bws-c.gold{border-color:#c0892a;box-shadow:0 0 0 1px #2c1a05,0 0 0 3px rgba(245,213,131,.55),0 3px 9px rgba(0,0,0,.45)}
.bw-ui .bws-c .nm b{color:${INK}}.bw-ui .bws-c .nm small{font-size:11px;color:#6d5636}
.bw-ui .bws-c .art{filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}
.bw-ui .bws-on{color:#10200a;background:linear-gradient(180deg,#a9c970,#5f7f2c);box-shadow:none}
.bw-ui .bws-tag{color:#2c1a05;background:${BRASS};border-color:${DARKB}}
.bw-ui .bws-seg button{min-height:44px;height:44px;border:1px solid #2c1a05;background:${BTN};color:${CREAM}}
.bw-ui .bws-seg button.on{color:#2c1a05;background:${BRASS};border-color:${DARKB};box-shadow:${EMB}}
.bw-ui .bws-row .sp{color:#6d5636}
.bw-ui .bws-buy{min-height:44px;height:44px;border:1px solid ${DARKB};background:${BRASS};color:#2c1a05;box-shadow:${EMB}}
.bw-ui .bws-buy.ok{background:${BRASS2};border-color:#2c1a05;box-shadow:${EMB},0 0 0 2px #fff0bf}
.bw-ui .bws-buy.dim{opacity:.6;filter:grayscale(.35)}
.bw-ui .bws-done{color:#10200a;border-color:#5f7f2c;background:linear-gradient(180deg,#a9c970,#5f7f2c)}
.bw-ui .bws-how{background:${PARCH};border:1px solid ${RIM};box-shadow:0 0 0 1px #2c1a05,0 3px 9px rgba(0,0,0,.45)}
.bw-ui .bws-how b{color:${INK}}.bw-ui .bws-how ol{color:${INK}}.bw-ui .bws-how ol em{color:#8f6014}
.bw-ui .bws-rt{border-bottom-color:rgba(58,42,20,.25);color:${INK}}
.bw-ui .bws-rt .ar{color:#8f6014}.bw-ui .bws-rt .sr,.bw-ui .bws-rt .ds{color:${INK}}
.bw-ui .bws-rt.hl{background:rgba(192,137,42,.22)}
/* ---- Rank / Clan / Friends / Log */
.bw-ui .bwk-pg .r{color:${MUTE}}.bw-ui .bwk-pg .r b{color:${CREAM}}
.bw-ui .bwk-bar{background:#120b06;border-color:rgba(196,154,84,.5)}
.bw-ui .bwk-bar i{background:linear-gradient(90deg,#c4872a,#f5d583);box-shadow:none}
.bw-ui .bwk-row{background:rgba(255,226,160,.07);border-color:rgba(196,154,84,.38);color:${CREAM}}
.bw-ui .bwk-row.me{border-color:#f5d583;background:rgba(245,213,131,.16);box-shadow:0 0 0 1px #f5d583}
.bw-ui .bwk-row .rk{color:${MUTE}}
.bw-ui .bwk-row .rk.m{color:var(--mc);text-shadow:0 1px 0 #000}
.bw-ui .bwk-row .nm b,.bw-ui .bwk-row .tp{color:${CREAM}}.bw-ui .bwk-row .nm span{color:${MUTE}}.bw-ui .bwk-row .tp svg{color:${GOLD}}
.bw-ui .bwk-row.cur{border-color:var(--lc);box-shadow:0 0 0 1px var(--lc)}
.bw-ui .bwk-row[style*="#43e0ff"] .rk.m{color:#f2c75c}
.bw-ui .bwk-row[style*="#dbe8f7"] .rk.m{color:#dfe3e8}
.bw-ui .bwk-row[style*="#8fa6c4"] .rk.m{color:#cf9460}
.bw-ui .bwk-pan .bwk-h{gap:10px}
.bw-ui .bwk-pan .bwk-h .bd,.bw-ui .bwk-pan .bwk-h .bd .lgb{width:48px}
.bw-ui .bwk-gap{color:#a8926a}.bw-ui .bwk-empty{color:${MUTE}}
.bw-ui .bwk-how{background:rgba(0,0,0,.28);border-color:rgba(196,154,84,.35);color:${MUTE}}.bw-ui .bwk-how b{color:${CREAM}}
.bw-ui .bwk-inv h3{font-family:${DISPLAY};text-transform:uppercase;letter-spacing:.8px;color:${CREAM}}.bw-ui .bwk-inv p{color:${MUTE}}
.bw-ui .bwk-inv .pay{background:${BRASS};border:1px solid ${DARKB};color:#2c1a05;box-shadow:${EMB}}.bw-ui .bwk-inv .pay small{color:${DARKB}}
.bw-ui .bwk-inv .stp li{background:rgba(255,226,160,.07);border-color:rgba(196,154,84,.38);color:${CREAM}}
.bw-ui .bwk-inv .stp i{background:${BRASS};border-color:${DARKB};color:#2c1a05}
.bw-ui .bwk-inv .st,.bw-ui .bwk-inv .st b{color:${MUTE}}
.bw-ui .bwk-lk input,.bw-ui .bwc-in input{min-height:44px;background:${WELL};border:1px solid ${RIM};color:${CREAM}}
.bw-ui .bwk-lk button,.bw-ui .bwk-sh,.bw-ui .bwc-btn,.bw-ui .bwc-row .go,.bw-ui .bwc-inv button{min-height:44px;border:1px solid ${DARKB};background:${BRASS};color:#2c1a05;box-shadow:${EMB}}
.bw-ui .bwk-sh,.bw-ui .bwc-btn{min-height:52px;font-family:${DISPLAY};font-weight:900}
.bw-ui .bwc-btn.sec,.bw-ui .bwc-btn.dng,.bw-ui .bwc-row .go.x{background:${BTN};border-color:${RIM};color:${CREAM};box-shadow:none}
.bw-ui .bwc-row .go.x{min-width:44px}
.bw-ui .bwc-row{gap:8px}
.bw-ui .bwc-row .nm span{text-transform:none;letter-spacing:.2px;font-size:11.5px}
.bw-ui .bwc-row .nm b{font-size:14px;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.2;overflow-wrap:anywhere}
.bw-ui .bwc-row .tp{font-size:13.5px;gap:3px}
.bw-ui .bwc-row .go{padding:8px 10px}
.bw-ui .bwc-tag{color:#2c1a05;background:${BRASS};border-color:${DARKB}}
.bw-ui .bwc-h3{color:${GOLD}}
.bw-ui .bwc-card{background:rgba(255,226,160,.07);border-color:rgba(196,154,84,.42)}
.bw-ui .bwc-card .top b,.bw-ui .bwc-card .sub b{color:${CREAM}}.bw-ui .bwc-card .sub{color:${MUTE}}
.bw-ui .bwc-lg{background:rgba(255,226,160,.07);border-color:rgba(196,154,84,.35)}
.bw-ui .bwc-lg:before{background:${GOLD}}.bw-ui .bwc-lg.d:before{background:#8a7a5a}
.bw-ui .bwc-lg.new{border-color:#f5d583;box-shadow:0 0 0 1px #f5d583}
.bw-ui .bwc-lg .ic{color:${GOLD}}.bw-ui .bwc-lg.d .ic{color:#a8926a}
.bw-ui .bwc-lg .mid b,.bw-ui .bwc-lg .rt{color:${CREAM}}.bw-ui .bwc-lg .mid span,.bw-ui .bwc-lg .rt small{color:${MUTE}}
.bw-ui .bwc-inv{background:rgba(0,0,0,.28);border-color:rgba(196,154,84,.4)}
.bw-ui .bwc-inv .t{color:${MUTE}}.bw-ui .bwc-inv .t b{color:${CREAM}}
.bw-ui .bwc-ok{color:#c5e58b}.bw-ui .bwc-wait{color:${MUTE}}.bw-ui .bwc-err{color:#f0b890}
.bw-ui .bwc-row .nm span i.bwc-ok{color:#c5e58b}.bw-ui .bwc-row .nm span i.bwc-wait{color:${MUTE}}
.bw-ui .bwc-row svg path[fill="#43e0ff"]{fill:${GOLD};stroke:#6a4a10}
.bw-ui .bwc-row .nm b svg{display:inline-block;vertical-align:-1px;margin-right:2px}
/* ---- landscape (phone held sideways, 390 px high): tighter headers so the lists keep room */
@media (orientation:landscape) and (max-height:560px){
.bw-ui .bwu-pan .bwu-h{padding:6px 14px 4px}
.bw-ui .bwu-pan .bwu-bl{padding:2px 14px 6px}
.bw-ui .bwu-pan .bwu-bl .bwu-b{padding:3px 6px 4px}
.bw-ui .bwu-pan .bwu-tabs{padding:5px 12px}
.bw-ui .bwu-pan .bwu-tabs .bwu-tab{height:44px;padding:0 4px}
.bw-ui .bwu-pan .bwu-cats{padding:5px 12px 2px}
.bw-ui .bwa-pan .bwa-h{padding:7px 12px 3px}
.bw-ui .bwa-pan .bwa-tabs,.bw-ui .bws-pan .bws-tabs,.bw-ui .bwk-pan .bwk-tabs{margin-top:6px}
.bw-ui .bwa-pan .bwa-ft{padding:5px 12px 8px}
.bw-ui .bwa-pan .bwa-ft button{min-height:44px;padding:8px}
.bw-ui .bws-pan .bws-h{padding:7px 12px 4px 16px}
.bw-ui .bwk-pan .bwk-h{padding:7px 12px 3px 14px;gap:10px}
.bw-ui .bwk-pan .bwk-h .bd,.bw-ui .bwk-pan .bwk-h .bd .lgb{width:46px}
.bw-ui .bw-panel .bw-ph{padding:7px 16px 6px}
.bw-ui .bw-panel .bw-kd{padding:6px 16px 0}
.bw-ui .bw-panel .bw-kd div{padding:4px 10px}
.bw-ui .bw-panel .bw-tabs{padding:6px 12px}
}
`;
  function injectKit2() {
    if (typeof document === "undefined" || document.getElementById("k-kit2")) return;
    const st2 = document.createElement("style");
    st2.id = "k-kit2";
    st2.textContent = KIT2_CSS;
    document.head.appendChild(st2);
  }

  // src/ui_theme_r3.js
  var HUD_DEFAULT = 3;
  var SAFE = (side) => `max(env(safe-area-inset-${side},0px),calc(var(--tg-safe-area-inset-${side},0px) + var(--tg-content-safe-area-inset-${side},0px)))`;
  var HUD3_CSS = `
/* ---- safe insets: one definition for the whole HUD (panels, sheets and the hub read the same variables) */
html[data-hud]{--hl:${SAFE("left")};--hr:${SAFE("right")};--ht:${SAFE("top")};--hb:${SAFE("bottom")}}
html[data-hud] .bw-ui{--sl:var(--hl);--sr:var(--hr);--st:var(--ht);--sb:var(--hb)}
/* ---- the crown (hero entry, main.js \`.rp-open\`): 48 px, placed per layout (its inline left/top are overridden) */
html[data-hud] .rp-open{width:48px!important;height:48px!important;border:2px solid #c9a05a!important;background:linear-gradient(180deg,#4a3622,#2d2014)!important;color:#f4e8cc!important;box-shadow:0 3px 9px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,236,190,.3)!important}
html[data-hud] .rp-open:active{transform:scale(.92)}
html[data-hud] .rp-open svg{width:24px;height:24px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.7))}
html[data-hud="1"] .rp-open{left:calc(var(--hl) + 10px)!important;right:auto!important;bottom:auto!important;top:min(calc(50% - 24px),calc(100% - 218px - var(--hb)))!important}
html[data-hud="2"] .rp-open{left:calc(var(--hl) + 10px)!important;right:auto!important;bottom:auto!important;top:calc(var(--ht) + 62px)!important}
html[data-hud="3"] .rp-open{left:auto!important;top:auto!important;right:calc(var(--hr) + 19px)!important;bottom:calc(var(--hb) + 84px)!important}
/* ---- the resources: one compact column top-right (three mined gems; layout 1 adds the two special gems under them as a half-width pair, same column width) */
html[data-hud="1"] .bw-ui .bw-pm{left:auto;right:calc(10px + var(--sr));top:calc(var(--st) + 10px + 105px * var(--u));justify-content:flex-end;gap:4px;transform-origin:100% 0}
html[data-hud="1"] .bw-ui .bw-pm .bw-p{width:62px;margin:0}
html[data-hud="1"] .bw-ui .bw-pm .bw-p .ct{left:25px;right:7px;font-size:11.5px}
html[data-hud="2"] .bw-ui .bw-pm{left:calc(62px + var(--sl));top:calc(var(--st) + 73px)}
/* ---- Assist stays bottom-right (primary action zone) \u2014 only its margins become safe insets */
html[data-hud] .bw-ui .bwh-btn{right:calc(14px + var(--sr));bottom:calc(var(--sb) + 14px)}
/* ---- the hero buttons (rpg.js): a thumb arc round the bottom-right corner, exit / camera / gate in one row under Telegram's Close (the left column stays free for the joystick); safe insets; >= 44 px; no backdrop blur */
html[data-hud] .rp-b{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
html[data-hud] .rp-b[data-rp="jump"]{width:78px!important;height:78px!important;right:calc(var(--hr) + 16px)!important;bottom:calc(var(--hb) + 22px)!important}
html[data-hud] .rp-b[data-rp="dodge"]{width:62px!important;height:62px!important;right:calc(var(--hr) + 104px)!important;bottom:calc(var(--hb) + 14px)!important}
html[data-hud] .rp-b[data-rp="sprint"]{width:58px!important;height:58px!important;right:calc(var(--hr) + 22px)!important;bottom:calc(var(--hb) + 110px)!important}
html[data-hud] .rp-b[data-rp="act"]{width:62px!important;height:62px!important;right:calc(var(--hr) + 98px)!important;bottom:calc(var(--hb) + 94px)!important}
html[data-hud] .rp-b[data-rp="exit"]{width:44px!important;height:44px!important;left:calc(var(--hl) + 12px)!important;top:calc(var(--ht) + 6px)!important}
html[data-hud] .rp-b[data-rp="cam"]{width:46px!important;height:46px!important;left:calc(var(--hl) + 66px)!important;top:calc(var(--ht) + 5px)!important}
html[data-hud] .rp-b[data-rp="gate"]{width:46px!important;height:46px!important;left:calc(var(--hl) + 120px)!important;top:calc(var(--ht) + 5px)!important}
html[data-hud] .rp-perf{right:calc(var(--hr) + 8px)!important}
`;
  function hudLayout() {
    let v = 0;
    try {
      v = +(new URLSearchParams(location.search).get("hud") || 0);
    } catch (e) {
    }
    if (!(v >= 1 && v <= 3)) {
      try {
        v = +(localStorage.getItem("bw_hud") || 0);
      } catch (e) {
        v = 0;
      }
    }
    return v >= 1 && v <= 3 ? Math.floor(v) : HUD_DEFAULT;
  }
  function setHudLayout(n, keep) {
    n = +n;
    if (!(n >= 1 && n <= 3)) n = HUD_DEFAULT;
    if (typeof document !== "undefined") document.documentElement.setAttribute("data-hud", String(n));
    if (keep) {
      try {
        localStorage.setItem("bw_hud", String(n));
      } catch (e) {
      }
    }
    return n;
  }
  function injectHudR3() {
    if (typeof document === "undefined") return;
    if (!document.getElementById("k-hud3")) {
      const st2 = document.createElement("style");
      st2.id = "k-hud3";
      st2.textContent = HUD3_CSS;
      document.head.appendChild(st2);
    }
    setHudLayout(hudLayout());
    try {
      window.__bwHud = (n) => setHudLayout(n, true);
    } catch (e) {
    }
  }

  // src/assets.js
  var BASE = (window.BW_ASSETS || "/assets/").replace(/\/?$/, "/");

  // src/ui.js
  var GEM_KEYS = ["ruby", "emerald", "turq"];
  var PREM_KEYS = ["sap", "onyx"];
  var gemImg = (k) => `<img class="gem3" alt="" draggable="false" decoding="async" src="${BASE}ui/gem_${k}.webp">`;
  var GEMS = Object.fromEntries([...GEM_KEYS, ...PREM_KEYS].map((k) => [k, gemImg(k)]));
  var LQ = {
    ruby: { l: "#ff9aab", m: "#ee2a4c", d: "#8e0a26", g: "#ff5a76" },
    emerald: { l: "#9cf7c6", m: "#19c46c", d: "#05703a", g: "#3fe592" },
    turq: { l: "#d4fbff", m: "#35d6ff", d: "#0a7fb8", g: "#6fe8ff" }
  };
  var FONT = "'Libre Baskerville','Noto Sans Tai Viet',Georgia,serif";
  var CSS = `
.bw-ui{position:absolute;inset:0;overflow:hidden;overflow:clip;pointer-events:none;z-index:10;direction:ltr;text-align:left;font-family:${FONT};font-weight:700;color:#e6f2ff;
  --glass:rgba(3,8,20,.72);--line:rgba(120,190,255,.32);
  --st:calc(var(--tg-safe-area-inset-top,0px) + var(--tg-content-safe-area-inset-top,0px));--sb:var(--tg-safe-area-inset-bottom,0px);--sl:calc(var(--tg-safe-area-inset-left,0px) + var(--tg-content-safe-area-inset-left,0px));--sr:calc(var(--tg-safe-area-inset-right,0px) + var(--tg-content-safe-area-inset-right,0px));--hs:.64}
.bw-ui .num{color:#fff;white-space:nowrap;text-shadow:0 1.5px 0 #01060f,1px 0 0 #01060f,-1px 0 0 #01060f,0 -1px 0 #01060f,0 0 5px rgba(0,0,0,.7)}
.bw-top{position:absolute;left:0;right:0;top:0;height:calc(var(--st) + 120px);background:linear-gradient(rgba(0,6,20,.5),rgba(0,6,20,0));pointer-events:none}
/* ---- level badge + name (top LEFT), the two special gems directly under them side by side; the three mined gems stay on the RIGHT. The Assist button is the only button on the HUD */
.bw-ui{--u:calc(var(--hs) / .64)}
.bw-lvl{pointer-events:auto;position:absolute;left:calc(8px + var(--sl));top:calc(var(--st) + 8px);width:60px;height:60px;cursor:pointer;-webkit-tap-highlight-color:transparent;transform:scale(calc(var(--u) * .8));transform-origin:0 0;z-index:2}
.bw-lvl:active{transform:scale(calc(var(--u) * .75))}
.bw-ui>.bw-top,.bw-ui>.bw-lvl,.bw-ui>.bw-who,.bw-ui>.bw-gems{transition:opacity .8s ease}
.bw-ui.wel>.bw-top,.bw-ui.wel>.bw-lvl,.bw-ui.wel>.bw-who,.bw-ui.wel>.bw-gems{opacity:0}
.bw-lvl .lvn{position:absolute;left:0;right:0;top:19px;text-align:center;font-size:19px}
.bw-lvl .gear{position:absolute;left:39px;top:39px}
.bw-who{position:absolute;left:calc(8px + var(--sl) + 33px * var(--u));top:calc(var(--st) + 11px * var(--u));transform:scale(var(--u));transform-origin:0 0;width:150px;box-sizing:border-box;padding:5px 14px 5px 22px;border-radius:0 14px 14px 0;text-align:left;
  background:linear-gradient(90deg,rgba(6,18,44,.82),rgba(6,18,44,.62) 70%,rgba(6,18,44,.35));border:1px solid rgba(150,205,255,.32);border-left:0;box-shadow:0 3px 9px rgba(0,0,0,.4);pointer-events:none}
.bw-who .nm{unicode-bidi:plaintext;font-size:14.5px;letter-spacing:.3px;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bw-who .sub{display:flex;align-items:center;gap:4px;margin-top:1px;font-size:11px;line-height:14px;color:#9fd2ff;font-variant-numeric:tabular-nums}.bw-who .sub svg{width:12px;height:12px}
/* ---- gem capsules (top right) */
.bw-gems{position:absolute;right:calc(10px + var(--sr));top:calc(var(--st) + 10px);width:128px;display:flex;flex-direction:column;gap:7px;pointer-events:none;transform:scale(var(--u));transform-origin:100% 0}
.bw-g{position:relative;height:28px;border-radius:14px;background:linear-gradient(180deg,rgba(28,60,120,.9),rgba(4,12,32,.94));border:1px solid rgba(150,205,255,.42);box-shadow:0 3px 9px rgba(0,0,0,.45),inset 0 1px 0 rgba(200,232,255,.24)}
.bw-g .gm{position:absolute;left:-8px;top:-6px;width:38px;height:38px;z-index:2}
.bw-g .ct{position:absolute;left:30px;right:10px;top:1px;display:flex;align-items:baseline;justify-content:flex-end;gap:3px;white-space:nowrap;font-size:14px;line-height:21px}
.bw-g .ct small{font-size:9.5px;color:#9fc4ea;font-weight:700}
.bw-g .tk{position:absolute;left:32px;right:11px;bottom:4px;height:3px;border-radius:2px;background:rgba(255,255,255,.13);overflow:hidden}
.bw-g .fl{height:100%;width:0;border-radius:2px;background:linear-gradient(90deg,var(--d),var(--m) 55%,var(--l));transition:width .9s cubic-bezier(.2,.8,.2,1)}
.bw-g.full{border-color:var(--gl)}
.bw-g.full .ct span{color:var(--l)}
.bw-g.full:after{content:"";position:absolute;inset:-2px;border-radius:16px;box-shadow:0 0 11px 2px var(--gl);opacity:.55;pointer-events:none}
.gem3{width:100%;height:100%;object-fit:contain;display:block;filter:drop-shadow(0 2px 3px rgba(0,0,0,.55));pointer-events:none;user-select:none}
.bw-col i .gem3{width:26px;height:26px}
.bw-g.pop .gm{animation:bwPop .6s}
@keyframes bwPop{40%{transform:scale(1.2)}}
/* ---- the two special gems (left, directly under the level + name, side by side; together exactly as wide as the name box, never wider): deep-blue sapphire and black onyx. No vault and no gauge: they are bought or won; tap = the shop */
.bw-pm{position:absolute;left:calc(8px + var(--sl));top:calc(var(--st) + 8px + 58px * var(--u));display:flex;flex-direction:row;gap:3px;transform:scale(var(--u));transform-origin:0 0;pointer-events:none;transition:opacity .8s ease}
.bw-ui.wel>.bw-pm{opacity:0}
.bw-p{pointer-events:auto;position:relative;box-sizing:border-box;width:84px;height:28px;margin-left:6px;border-radius:14px;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:transform .12s;background:linear-gradient(180deg,var(--c1),var(--c2));border:1px solid var(--bd);box-shadow:0 3px 9px rgba(0,0,0,.45),inset 0 1px 0 var(--hl)}
.bw-p:active{transform:scale(.95)}
.bw-p .gm{position:absolute;left:-7px;top:-6px;width:36px;height:36px;z-index:2}
.bw-p .ct{position:absolute;left:28px;right:12px;top:0;text-align:right;font-size:13.5px;line-height:26px;white-space:nowrap}
.bw-p[data-p="sap"]{--c1:rgba(22,56,160,.96);--c2:rgba(2,8,40,.98);--bd:rgba(120,165,255,.7);--hl:rgba(170,200,255,.38)}
.bw-p[data-p="onyx"]{--c1:rgba(46,53,70,.98);--c2:rgba(1,2,5,.99);--bd:rgba(205,218,242,.6);--hl:rgba(232,240,255,.32)}
.bw-p.pop .gm{animation:bwPop .6s}
/* ---- misc */
.bw-fps{position:absolute;left:50%;transform:translateX(-50%);top:calc(var(--st) + 3px);font:700 10px ${FONT};color:#9fe3ff;background:rgba(0,0,0,.4);padding:2px 7px;border-radius:8px;display:none;pointer-events:none;white-space:nowrap}
.bw-toast{position:absolute;z-index:90;left:50%;transform:translateX(-50%);top:calc(var(--st) + 112px);max-width:86vw;width:max-content;box-sizing:border-box;text-align:center;line-height:1.35;padding:9px 16px;border-radius:18px;background:var(--glass);border:1px solid var(--line);font-size:13px;opacity:0;transition:opacity .6s;pointer-events:none}
.bw-toast.on{opacity:1}
.bw-sheet{pointer-events:auto;position:absolute;z-index:11;left:12px;right:12px;bottom:calc(var(--sb) + 14px);max-width:520px;margin:0 auto;padding:16px 18px 18px;border-radius:20px;background:linear-gradient(180deg,rgba(11,30,66,.95),rgba(3,8,20,.97));border:1px solid var(--line);box-shadow:0 10px 40px rgba(0,0,0,.55);transform:translateY(160%);transition:transform 220ms cubic-bezier(.22,1,.36,1)}
.bw-sheet.on{transform:none;transition-duration:320ms}
.bw-sheet .h{display:flex;align-items:center;gap:10px;font-size:18px;color:#d9f2ff}
.bw-sheet .h .e{font-size:24px}
.bw-sheet .d{margin-top:8px;font-size:13.5px;font-weight:400;line-height:1.75;color:#a9c4e6}
.bw-sheet .chip{display:inline-block;margin-top:10px;padding:5px 12px;border-radius:999px;background:rgba(95,182,255,.12);border:1px solid var(--line);font-size:12px;color:#9fd8ff}
.bw-x{position:absolute;right:6px;top:6px;width:44px;height:44px;border-radius:10px;display:grid;place-items:center;background:rgba(255,255,255,.07);font-size:16px;cursor:pointer;pointer-events:auto}
.bw-mine{margin-top:12px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.bw-mine div{padding:8px 6px;border-radius:12px;background:rgba(95,182,255,.08);border:1px solid rgba(120,190,255,.2);text-align:center}
.bw-mine b{display:block;font-size:18px;color:#fff}.bw-mine span{font-size:10.5px;font-weight:400;color:#9fc4e8}
.bw-col{margin-top:12px;width:100%;padding:12px;border-radius:14px;border:1px solid #bfe6ff;background:linear-gradient(180deg,#5fb6ff,#1b4fb8);color:#fff;font:700 15px ${FONT};cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 6px 18px rgba(27,79,184,.45)}
.bw-col i svg{width:24px;height:24px;display:block}.bw-col:disabled{opacity:.45;filter:grayscale(.4)}
/* ---- settings */
.bw-set{position:absolute;inset:0;z-index:13;pointer-events:auto;background:rgba(0,3,10,.6);opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s}
.bw-set.on{opacity:1;visibility:visible}
.bw-panel{position:absolute;left:max(22px,calc(var(--sl) + 16px));right:max(22px,calc(var(--sr) + 16px));top:calc(var(--st) + max(64px,12vh));bottom:calc(var(--sb) + max(64px,12vh));max-width:440px;margin:0 auto;display:flex;flex-direction:column;border-radius:22px;overflow:hidden;
  background:linear-gradient(180deg,rgba(9,26,60,.97),rgba(2,6,16,.98));border:1px solid var(--line);box-shadow:0 20px 60px rgba(0,0,0,.65);transform:translateY(16px) scale(.98);transition:transform .3s}
.bw-set.on .bw-panel{transform:none}
.bw-ph{display:flex;align-items:center;gap:10px;padding:14px 16px 10px;border-bottom:1px solid rgba(120,190,255,.18)}
.bw-ph .t{flex:1;font-size:18px;color:#d9f2ff}
.bw-kd{display:flex;gap:10px;padding:10px 16px 2px}
.bw-kd div{flex:1;padding:8px 10px;border-radius:12px;background:rgba(95,182,255,.07);border:1px solid rgba(120,190,255,.18)}
.bw-kd span{display:block;font-size:10px;font-weight:400;letter-spacing:1.5px;text-transform:uppercase;color:#7fb4e6}
.bw-kd b{display:block;margin-top:3px;font-size:15px;color:#fff}
.bw-tabs{display:flex;gap:6px;padding:10px 12px;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid rgba(120,190,255,.12)}
.bw-tabs::-webkit-scrollbar{display:none}
.bw-tab{flex:0 0 auto;padding:7px 12px;border-radius:12px;font-size:13px;color:#a9bfe0;background:rgba(255,255,255,.04);border:1px solid transparent;cursor:pointer;white-space:nowrap}
.bw-tab.on{color:#03122b;background:linear-gradient(180deg,#d9f2ff,#6fc0ff);border-color:#bfe6ff}
.bw-body{flex:1;overflow-y:auto;padding:8px 16px 18px;-webkit-overflow-scrolling:touch}
.bw-row{padding:12px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.bw-row .l{display:flex;justify-content:space-between;align-items:center;font-size:14px;color:#dce9fb;gap:10px}
.bw-row .v{font-size:13px;color:#8fd3ff}
.bw-row input[type=range]{width:100%;margin-top:10px;-webkit-appearance:none;appearance:none;height:6px;border-radius:6px;background:linear-gradient(90deg,#4aa8ff var(--p,50%),rgba(255,255,255,.12) var(--p,50%));outline:none}
.bw-row input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffffff,#6fc0ff);border:2px solid #0b2a5c;box-shadow:0 2px 8px rgba(0,0,0,.5)}
.bw-row input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:#6fc0ff;border:2px solid #0b2a5c}
.bw-seg{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.bw-seg span{padding:7px 11px;border-radius:10px;font-size:12.5px;color:#c4d4ee;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);cursor:pointer}
.bw-seg span.on{color:#03122b;background:linear-gradient(180deg,#d9f2ff,#6fc0ff);border-color:#bfe6ff}
.bw-tg{width:46px;height:26px;border-radius:26px;background:rgba(255,255,255,.12);position:relative;cursor:pointer;flex:0 0 auto;transition:background .2s}
.bw-tg::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#dfe7f6;transition:transform .2s}
.bw-tg.on{background:linear-gradient(90deg,#1b4fb8,#4aa8ff)}.bw-tg.on::after{transform:translateX(20px)}
.bw-btnw{margin-top:16px;width:100%;padding:11px;border-radius:12px;border:1px solid var(--line);background:rgba(95,182,255,.08);color:#9fd8ff;font:700 13px ${FONT};cursor:pointer}
.bw-about h3{margin:10px 0 4px;color:#d9f2ff;font-size:16px}.bw-about p{margin:6px 0;color:#a9c4e6;font-size:13px;font-weight:400;line-height:1.8}
.bw-cred{font-size:12px;font-weight:400;line-height:1.7;color:#cfdaf0;margin-top:8px}
.bw-cred div{padding:5px 0;border-bottom:1px dashed rgba(255,255,255,.07)}.bw-cred b{color:#8fd3ff}.bw-cred .lc{color:#6f9fd0;font-size:11px}
.bw-cred h4{margin:14px 0 4px;color:#5fb6ff;letter-spacing:1px;font-size:12px}
/* ---- welcome card (over the live scene) */
.bw-wel{position:absolute;inset:0;pointer-events:auto;z-index:30;overflow:hidden;cursor:pointer;opacity:1;transition:opacity .8s ease}
.bw-wel.out{opacity:0;pointer-events:none}
.bw-wel .bg{position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 45%,rgba(10,30,70,.62),rgba(2,6,18,.93))}
.bw-wel .grade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(18,44,96,.30),rgba(5,12,30,.06) 40%,rgba(2,6,16,.55))}
.bw-wel .rays{position:absolute;left:50%;top:-30%;width:180%;height:120%;margin-left:-90%;background:repeating-conic-gradient(from 0deg at 50% 0%,rgba(140,200,255,.0) 0deg 6deg,rgba(140,200,255,.07) 6deg 9deg);
  -webkit-mask-image:radial-gradient(60% 70% at 50% 0%,#000,transparent);mask-image:radial-gradient(60% 70% at 50% 0%,#000,transparent);opacity:.9}
.bw-wel canvas{position:absolute;inset:0;width:100%;height:100%}
.bw-wel .lb{position:absolute;left:0;right:0;height:11vh;background:#000;transition:transform 1.1s cubic-bezier(.2,.8,.2,1)}
.bw-wel .lb.t{top:0;transform:translateY(-100%)}.bw-wel .lb.b{bottom:0;transform:translateY(100%)}
.bw-wel.in .lb{transform:none}
.bw-wel .blk{position:absolute;left:0;right:0;top:50%;transform:translateY(-55%);text-align:center}
.bw-wel .blk>*{opacity:0;transform:translateY(14px);transition:opacity 1.1s ease,transform 1.1s cubic-bezier(.2,.8,.2,1)}
.bw-wel.in .blk>*{opacity:1;transform:none}
.bw-wel .pre{font-size:15px;letter-spacing:9px;padding-left:9px;color:#dcefff;text-shadow:0 0 18px rgba(120,190,255,.6);transition-delay:.35s}
.bw-wel .lord{margin-top:8px;font-size:clamp(46px,15vw,64px);line-height:1.08;letter-spacing:.5px;
  background:linear-gradient(180deg,#ffffff 0%,#dff1ff 40%,#8fc8ff 78%,#4e93ea 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
  filter:drop-shadow(0 2px 0 rgba(1,8,24,.9)) drop-shadow(0 0 22px rgba(90,170,255,.55));transition-delay:.6s}
.bw-wel .dv{display:flex;align-items:center;justify-content:center;gap:8px;margin:16px auto 14px;transition-delay:.9s}
.bw-wel .dv b{width:80px;height:1px;background:linear-gradient(90deg,rgba(207,234,255,0),#cfeaff)}.bw-wel .dv b:last-child{transform:scaleX(-1)}
.bw-wel .dv i{width:8px;height:8px;transform:rotate(45deg);border:1.2px solid #cfeaff;box-shadow:0 0 8px rgba(120,200,255,.9)}
.bw-wel .dt{font-size:17px;letter-spacing:5px;padding-left:5px;color:#eaf6ff;text-shadow:0 0 14px rgba(110,190,255,.6),0 2px 0 #000;transition-delay:1.1s}
.bw-wel .tm{margin-top:8px;font-size:12px;letter-spacing:4px;padding-left:4px;text-transform:uppercase;color:#a9d6ff;text-shadow:0 2px 0 #000;transition-delay:1.25s}
.bw-wel .rp{width:min(326px,calc(100% - 36px));margin:18px auto 0;padding:11px 12px 10px;box-sizing:border-box;border-radius:18px;text-align:left;background:linear-gradient(180deg,rgba(14,36,82,.78),rgba(3,9,24,.82));border:1px solid rgba(150,205,255,.42);box-shadow:0 10px 30px rgba(0,0,0,.55),inset 0 1px 0 rgba(200,230,255,.2);transition-delay:1.5s}
.bw-wel .rp h4{margin:0 0 7px;font-size:11px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#9fd8ff;text-align:center}
.bw-wel .rp .rw{display:flex;align-items:center;gap:9px;padding:7px 4px;border-top:1px solid rgba(150,205,255,.16)}
.bw-wel .rp .rw:first-of-type{border-top:0}
.bw-wel .rp .ic{flex:0 0 auto;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;color:#ffb3c0;background:rgba(255,120,140,.14);border:1px solid rgba(255,150,170,.4)}
.bw-wel .rp .rw.ok .ic{color:#9ff0c8;background:rgba(110,240,180,.12);border-color:rgba(130,240,190,.4)}
.bw-wel .rp .mid{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.bw-wel .rp .mid b{font-size:13.5px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bw-wel .rp .mid span{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:400;color:#a9c9ee;white-space:nowrap}
.bw-wel .rp .mid i{display:inline-flex;align-items:center;gap:2px;font-style:normal;color:#ffc2cc;font-weight:700}
.bw-wel .rp .mid i .gem3{width:14px;height:14px}
.bw-wel .rp .cu{flex:0 0 auto;text-align:right;font-size:16px;color:#ff9fb0;font-variant-numeric:tabular-nums;line-height:1}
.bw-wel .rp .cu small{display:block;margin-top:2px;font-size:9px;font-weight:400;letter-spacing:1px;color:#a9c9ee;text-transform:uppercase}
.bw-wel .rp .rw.ok .cu{color:#8ff0c0}
.bw-wel .rp .more{padding:5px 0 0;font-size:11px;font-weight:400;text-align:center;color:#a9c9ee;border-top:1px solid rgba(150,205,255,.16)}
.bw-wel.has-rp .blk{top:11vh;bottom:11vh;transform:none;display:flex;flex-direction:column;justify-content:center}
.bw-wel.has-rp .lord{font-size:clamp(36px,11.5vw,50px)}.bw-wel.has-rp .dv{margin:10px auto 8px}
@media (max-height:620px){.bw-wel .rp .rw:nth-of-type(n+3){display:none}.bw-wel.has-rp .lord{font-size:34px}.bw-wel.has-rp .rp{margin-top:10px}}
.bw-wel .tap{position:absolute;left:0;right:0;bottom:calc(5.5vh - 7px);text-align:center;font-size:11px;letter-spacing:6px;padding-left:6px;text-transform:uppercase;color:#9fc8ef;opacity:0;transition:opacity 1s ease 1.8s}
.bw-wel.in .tap{opacity:.85;animation:bwTap 2.4s ease-in-out 2.8s infinite}
@keyframes bwTap{50%{opacity:.35}}
/* ---- landscape phones: the sheet moves to the side so it never covers the middle of the view */
@media (orientation:landscape) and (max-height:560px){
  .bw-ui{--hs:.58}
  .bw-sheet{left:auto;right:calc(12px + var(--sr));width:min(360px,44vw);margin:0;max-height:calc(100% - var(--st) - 120px);overflow:auto;padding:12px 14px 14px}
  .bw-panel{max-width:560px;left:calc(14px + var(--sl));right:calc(14px + var(--sr));top:calc(var(--st) + 22px);bottom:calc(var(--sb) + 22px)}
  .bw-toast{top:calc(var(--st) + 78px)}
}
`;
  var SCHEMA = {
    sound: [["master", "range", 0, 1, 0.05, "%"], ["music", "range", 0, 1, 0.05, "%"], ["ambience", "range", 0, 1, 0.05, "%"], ["characters", "range", 0, 1, 0.05, "%"], ["effects", "range", 0, 1, 0.05, "%"], ["voice", "toggle"], ["bgMute", "toggle"]],
    graphics: [["quality", "seg", ["auto", "low", "medium", "high", "ultra"], true], ["shadows", "toggle"], ["bloom", "toggle"], ["resScale", "range", 0.5, 1, 0.05, "%"], ["fps", "seg", [30, 60]], ["idleEco", "toggle"], ["fpsMeter", "toggle"], ["coolMode", "toggle"], ["perfInfo", "toggle"], ["shake", "toggle"]],
    controls: [["rotSpeed", "range", 0.5, 2, 0.1, "x"], ["zoomSpeed", "range", 0.5, 2, 0.1, "x"], ["invertRotate", "toggle"], ["haptics", "toggle"]],
    about: null
  };
  var CUP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0z" fill="currentColor" fill-opacity=".25"/><path d="M7 6H4.5v1.6A3.2 3.2 0 0 0 7.7 10.8M17 6h2.5v1.6a3.2 3.2 0 0 1-3.2 3.2M12 14v4M8 20h8"/></svg>';
  var fmt = (n) => (n = Number.isFinite(+n) ? Math.max(0, +n) : 0, n >= 1e7 ? Math.floor(n / 1e6) + "M" : n >= 1e6 ? (Math.floor(n / 1e5) / 10).toFixed(1) + "M" : n >= 1e5 ? Math.floor(n / 1e3) + "K" : n >= 1e4 ? (Math.floor(n / 100) / 10).toFixed(1) + "K" : Math.floor(n).toLocaleString("en-US"));
  var SHIELD_I = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z"/></svg>';
  var starI = (on) => `<svg viewBox="0 0 24 24" width="12" height="12" style="display:block"><path d="M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.7l1.3-6.6L2.5 9.5l6.6-.8z" fill="${on ? "#ffcf45" : "rgba(255,255,255,.12)"}" stroke="${on ? "#a8780a" : "rgba(255,255,255,.18)"}" stroke-width="1"/></svg>`;
  var escH = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
  var agoS = (s) => s < 90 ? "just now" : s < 3600 ? Math.round(s / 60) + " min ago" : s < 86400 ? Math.round(s / 3600) + " h ago" : Math.round(s / 86400) + " d ago";
  function raidReport(raids) {
    const now = Date.now() / 1e3, lost = raids.filter((r) => r.stars > 0 || (r.tro || 0) < 0 || Object.keys(r.loot || {}).length), n = raids.length;
    const head = lost.length ? n === 1 ? "Raided while you were away" : `${n} raids while you were away` : n === 1 ? "Your walls held" : `Your walls held ${n} times`;
    const rows = raids.slice(0, 3).map((r) => {
      const held = !(r.stars > 0), tro = Math.round(r.tro || 0);
      const gems = Object.entries(r.loot || {}).filter(([g, v]) => v > 0 && GEMS[g]).map(([g, v]) => `<i>${GEMS[g]}\u2212${fmt(v)}</i>`).join("");
      const cup = tro ? `<div class="cu">${tro > 0 ? "+" : "\u2212"}${Math.abs(tro)}<small>cups</small></div>` : '<div class="cu"></div>';
      return `<div class="rw${held ? " ok" : ""}"><div class="ic">${SHIELD_I}</div><div class="mid"><b>${held ? "Held against " : "Raided by "}${escH(r.who || "a stranger")}</b><span>${held ? "" : [1, 2, 3].map((k) => starI(k <= r.stars)).join("") + '<em style="font-style:normal">' + Math.round(r.pct || 0) + "%</em>"}<em style="font-style:normal">${agoS(Math.max(0, now - (r.t || now)))}</em></span>${gems ? `<span>${gems}</span>` : ""}</div>${cup.replace('class="cu"', 'class="cu' + (tro > 0 ? " up" : "") + '"')}</div>`;
    }).join("");
    const more = n > 3 ? `<div class="more">+ ${n - 3} more in your Log</div>` : "";
    return `<div class="rp"><h4>${head}</h4>${rows}${more}</div>`;
  }
  var UI = class {
    constructor(opts) {
      const st2 = document.createElement("style");
      st2.textContent = CSS;
      document.head.appendChild(st2);
      injectKit2();
      injectHudR3();
      const root2 = document.createElement("div");
      root2.className = "bw-ui";
      (opts.mount || document.body).appendChild(root2);
      this.root = root2;
      this.tg = opts.tg;
      this.opts = opts;
      this.tab = "sound";
      this.shown = {};
      this.prof = { name: "", level: 1 };
      this.build();
      onSetting((k) => {
        if (k === "fpsMeter") this.fps.style.display = settings.fpsMeter ? "block" : "none";
      });
    }
    build() {
      const t = tr(), root2 = this.root;
      root2.innerHTML = `<div class="bw-top"></div>
      <div class="bw-lvl" data-a="set">${badgeC()}<div class="lvn num">1</div><div class="gear">${gearC()}</div></div>
      <div class="bw-who"><div class="nm num"></div><div class="sub"></div></div>
      <div class="bw-gems">${GEM_KEYS.map((k) => `<div class="bw-g" data-g="${k}" style="--l:${LQ[k].l};--m:${LQ[k].m};--d:${LQ[k].d};--gl:${LQ[k].g}">
        <div class="gm">${GEMS[k]}</div><div class="ct num"><span>0</span><small>/ 0</small></div><div class="tk"><div class="fl"></div></div></div>`).join("")}</div>
      <div class="bw-pm">${PREM_KEYS.map((k) => `<div class="bw-p" data-p="${k}" role="button" aria-label="${k === "sap" ? "Sapphire" : "Onyx"}"><div class="gm">${GEMS[k]}</div><div class="ct num"><span>0</span></div></div>`).join("")}</div>
      <div class="bw-fps"></div>
      <div class="bw-toast"></div>
      <div class="bw-sheet"><div class="bw-x" data-a="close">\u2715</div><div class="h"><span class="e"></span><span class="t"></span></div><div class="d"></div><div class="bw-mx"></div><span class="chip">${t.soon}</span></div>
      <div class="bw-set"><div class="bw-panel"><div class="bw-ph"><span class="t">${t.settings}</span><div class="bw-x" style="position:static" data-a="setclose">\u2715</div></div>
        <div class="bw-kd"><div><span>${t.kingdom.date}</span><b class="kd-d">\u2014</b></div><div><span>${t.kingdom.time}</span><b class="kd-t">\u2014</b></div></div>
        <div class="bw-tabs"></div><div class="bw-body"></div></div></div>`;
      const q = (s) => root2.querySelector(s);
      this.sheet = q(".bw-sheet");
      this.fps = q(".bw-fps");
      this.set = q(".bw-set");
      this.toastEl = q(".bw-toast");
      this.fps.style.display = settings.fpsMeter ? "block" : "none";
      this.rows = {};
      for (const k of GEM_KEYS) {
        const el = q(`[data-g="${k}"]`);
        this.rows[k] = { el, n: el.querySelector(".ct span"), cap: el.querySelector(".ct small"), fl: el.querySelector(".fl") };
      }
      this.prows = {};
      for (const k of PREM_KEYS) {
        const el = q(`[data-p="${k}"]`);
        this.prows[k] = { el, n: el.querySelector(".ct span") };
        el.addEventListener("click", () => {
          this.haptic("light");
          this.opts.onShop && this.opts.onShop(k);
        });
      }
      q('[data-a="close"]').addEventListener("click", () => this.hide());
      q('[data-a="set"]').addEventListener("click", () => {
        this.haptic("light");
        this.opts.onClick && this.opts.onClick();
        this.openSettings(true);
      });
      q('[data-a="setclose"]').addEventListener("click", () => this.openSettings(false));
      this.set.addEventListener("click", (e) => {
        if (e.target === this.set) this.openSettings(false);
      });
      this.renderTabs();
    }
    get settingsOpen() {
      return this.set.classList.contains("on");
    }
    openSettings(on) {
      this.set.classList.toggle("on", on);
      if (on) {
        this.paintClock();
        this.renderBody();
      }
    }
    renderTabs() {
      const t = tr(), tabs = this.root.querySelector(".bw-tabs");
      tabs.innerHTML = Object.keys(SCHEMA).map((k) => `<div class="bw-tab${k === this.tab ? " on" : ""}" data-t="${k}">${t.tabs[k]}</div>`).join("");
      tabs.querySelectorAll(".bw-tab").forEach((el) => el.addEventListener("click", () => {
        this.tab = el.dataset.t;
        this.haptic("light");
        this.renderTabs();
        this.renderBody();
      }));
    }
    renderBody() {
      const t = tr(), body = this.root.querySelector(".bw-body"), list = SCHEMA[this.tab];
      if (!list) {
        this.renderAbout(body);
        return;
      }
      const Lb = t[this.tab] || {};
      body.innerHTML = "";
      for (const [key, type, a, b, step, unit] of list) {
        const row = document.createElement("div");
        row.className = "bw-row";
        const label = Lb[key] || key;
        if (type === "toggle") {
          row.innerHTML = `<div class="l"><span>${label}</span><div class="bw-tg${settings[key] ? " on" : ""}"></div></div>`;
          row.querySelector(".bw-tg").addEventListener("click", (e) => {
            settings[key] = !settings[key];
            e.currentTarget.classList.toggle("on", settings[key]);
            this.haptic("light");
          });
        } else if (type === "range") {
          const f = (v2) => unit === "%" ? Math.round(v2 * 100) + "%" : unit === "x" ? (+v2).toFixed(1) + "\xD7" : String(v2);
          row.innerHTML = `<div class="l"><span>${label}</span><span class="v">${f(settings[key])}</span></div><input type="range" min="${a}" max="${b}" step="${step}" value="${settings[key]}">`;
          const inp = row.querySelector("input"), v = row.querySelector(".v");
          const paint = () => inp.style.setProperty("--p", (inp.value - a) / (b - a) * 100 + "%");
          paint();
          inp.addEventListener("input", () => {
            settings[key] = +inp.value;
            v.textContent = f(inp.value);
            paint();
          });
        } else if (type === "seg") {
          const reload = b === true;
          row.innerHTML = `<div class="l"><span>${label}</span></div><div class="bw-seg">${a.map((o) => `<span data-v="${o}" class="${String(settings[key]) === String(o) ? "on" : ""}">${t.opt[o] || o}</span>`).join("")}</div>`;
          row.querySelectorAll("span[data-v]").forEach((el) => el.addEventListener("click", () => {
            const raw = el.dataset.v, val = typeof a[0] === "number" ? +raw : raw;
            if (settings[key] === val) return;
            settings[key] = val;
            this.haptic("light");
            row.querySelectorAll("span[data-v]").forEach((x) => x.classList.toggle("on", x === el));
            if (reload) {
              this.toast(t.reload);
              setTimeout(() => location.reload(), 900);
            }
          }));
        }
        body.appendChild(row);
      }
      const rb = document.createElement("button");
      rb.className = "bw-btnw";
      rb.textContent = t.reset;
      rb.addEventListener("click", () => {
        resetSettings();
        this.renderBody();
      });
      body.appendChild(rb);
      if (this.opts.owner && this.opts.onOwner) {
        const hd = document.createElement("div");
        hd.textContent = "OWNER TOOLS";
        hd.style.cssText = "margin:16px 2px 2px;font-size:11px;letter-spacing:2px;opacity:.7";
        body.appendChild(hd);
        for (const [k, label] of [["max", "Max level (50): everything full"], ["royal", "Showcase: 4 Tesla coils + the Dragonling"], ["plain", "Remove the showcase"], ["gems", "Test balance: +200 sapphire, +40 onyx"]]) {
          const ob = document.createElement("button");
          ob.className = "bw-btnw";
          ob.textContent = label;
          ob.style.marginTop = "8px";
          ob.addEventListener("click", async () => {
            this.haptic("light");
            ob.disabled = true;
            let ok = false;
            try {
              ok = await this.opts.onOwner(k);
            } catch (e) {
              ok = false;
            }
            ob.disabled = false;
            this.toast(ok ? "Done" : "Not available right now");
          });
          body.appendChild(ob);
        }
      }
      if (this.opts.onTutorial) {
        const tb = document.createElement("button");
        tb.className = "bw-btnw";
        tb.textContent = t.tutorial || "Replay the tutorial";
        tb.style.marginTop = "8px";
        tb.addEventListener("click", () => {
          this.haptic("light");
          this.opts.onTutorial();
        });
        body.appendChild(tb);
      }
    }
    async renderAbout(body) {
      const t = tr().about;
      body.innerHTML = `<div class="bw-about"><h3>${t.title}</h3><p>${t.ver}: <b>${this.opts.version || "4.0"}</b><br>${t.made}: <b>Blue Hearts</b></p>
      <p>${t.thanks}</p><h3>${t.credits}</h3><div class="bw-cred">\u2026</div></div>`;
      const box = body.querySelector(".bw-cred");
      try {
        const r = await fetch((window.BW_ASSETS || "/assets/") + "credits.json", { cache: "no-cache" });
        const j = await r.json();
        const esc3 = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
        const groups = {};
        for (const it of j.items) (groups[it.group || "Models"] = groups[it.group || "Models"] || []).push(it);
        box.innerHTML = Object.entries(groups).map(([g, items]) => `<h4>${esc3(g)}</h4>` + items.map((it) => `<div>${esc3(it.name)} \u2014 <b>${esc3(it.by)}</b> <span class="lc">(${esc3(it.license)})</span></div>`).join("")).join("");
      } catch (e) {
        box.textContent = "Quaternius \xB7 KayKit \xB7 Poly Haven \xB7 OpenGameArt (CC0)";
      }
    }
    toast(msg) {
      const el = this.toastEl;
      el.textContent = msg;
      el.classList.add("on");
      clearTimeout(this._tt);
      this._tt = setTimeout(() => el.classList.remove("on"), 2500);
    }
    // c = { date, time, hour } — shown inside the settings panel only
    setClock(c) {
      this._clock = c;
      if (this.settingsOpen) this.paintClock();
    }
    paintClock() {
      const c = this._clock;
      if (!c) return;
      this.root.querySelector(".kd-d").textContent = c.date;
      this.root.querySelector(".kd-t").textContent = `${tr().tod[c.tod] || ""} \xB7 ${c.time}`;
    }
    // p = { name, level }
    setProfile(p) {
      this.prof = { ...this.prof, ...p };
      this.root.querySelector(".bw-who .nm").textContent = this.prof.name || "";
      this.root.querySelector(".bw-lvl .lvn").textContent = this.prof.level || 1;
      const sub = this.root.querySelector(".bw-who .sub"), c = this.prof.cups;
      if (sub) {
        const h = c == null ? "" : CUP + "<span>" + Math.max(0, Math.floor(c)).toLocaleString("en-US") + "</span>";
        if (sub.dataset.h !== h) {
          sub.innerHTML = h;
          sub.dataset.h = h;
        }
        sub.style.display = c == null ? "none" : "";
      }
    }
    // g = { ruby: { n, cap }, ... } — counts roll up, gauges glide, FULL pulses
    setGems(g) {
      for (const k of GEM_KEYS) {
        const v = g[k];
        if (!v) continue;
        const R = this.rows[k], cap = Math.max(1, v.cap || 1), to = Math.max(0, v.n || 0), from = this.shown[k] ?? to;
        const pct = Math.min(100, to / cap * 100), full = to >= cap;
        R.el.classList.toggle("full", full);
        R.cap.textContent = "/ " + fmt(cap);
        R.fl.style.width = pct.toFixed(1) + "%";
        this.shown[k] = to;
        if (to > from && this._ready) {
          R.el.classList.remove("pop");
          void R.el.offsetWidth;
          R.el.classList.add("pop");
          const t0 = performance.now(), dur = 900, el = R.n, id = R.anim = (R.anim || 0) + 1;
          const step = () => {
            if (R.anim !== id) return;
            const f = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - f, 3);
            el.textContent = fmt(from + (to - from) * e);
            if (f < 1) requestAnimationFrame(step);
          };
          step();
        } else {
          R.anim = (R.anim || 0) + 1;
          R.n.textContent = fmt(to);
        }
      }
      this._ready = true;
    }
    // the special gems: { sap, onyx } (no cap): the count rolls up when it grows
    setPrem(p) {
      if (!p) return;
      for (const k of PREM_KEYS) {
        const R = this.prows && this.prows[k];
        if (!R) continue;
        const to = Math.max(0, p[k] || 0), key = "p_" + k, from = this.shown[key] ?? to;
        this.shown[key] = to;
        if (to > from && this._ready) {
          R.el.classList.remove("pop");
          void R.el.offsetWidth;
          R.el.classList.add("pop");
          const t0 = performance.now(), dur = 900, el = R.n, id = R.anim = (R.anim || 0) + 1;
          const step = () => {
            if (R.anim !== id) return;
            const f = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - f, 3);
            el.textContent = fmt(from + (to - from) * e);
            if (f < 1) requestAnimationFrame(step);
          };
          step();
        } else {
          R.anim = (R.anim || 0) + 1;
          R.n.textContent = fmt(to);
        }
      }
    }
    // mine sheet: production numbers + collect button; get() returns { ready, rate, cap, room }
    showMine(id, get, onCollect) {
      const it = tr().info[id];
      if (!it) return;
      const t = tr().mine, gem = id.replace("mine_", "");
      this.show(id);
      const box = this.sheet.querySelector(".bw-mx");
      this.sheet.querySelector(".chip").style.display = "none";
      box.innerHTML = `<div class="bw-mine"><div><b class="r1">0</b><span>${t.ready}</span></div><div><b class="r2">0</b><span>${t.rate}</span></div><div><b class="r3">0</b><span>${t.cap}</span></div></div>
      <button class="bw-col"><i>${GEMS[gem]}</i><span>${t.collect}</span></button>`;
      const btn = box.querySelector(".bw-col"), lab = btn.querySelector("span");
      const paint = () => {
        if (this.open !== id) return;
        const q = get();
        box.querySelector(".r1").textContent = fmt(q.ready);
        box.querySelector(".r2").textContent = fmt(Math.round(q.rate));
        box.querySelector(".r3").textContent = fmt(Math.floor(q.cap));
        const room = q.room ?? Infinity;
        btn.disabled = q.ready < 1 || room < 1 || this._busy;
        lab.textContent = room < 1 ? t.vault : q.ready < 1 ? t.empty : `${t.collect} +${fmt(Math.min(q.ready, room))}`;
      };
      paint();
      clearInterval(this._mt);
      this._mt = setInterval(() => {
        if (this.open !== id) {
          clearInterval(this._mt);
          return;
        }
        paint();
      }, 1e3);
      btn.addEventListener("click", async () => {
        if (this._busy) return;
        this._busy = true;
        paint();
        this.haptic("medium");
        let n = 0;
        try {
          n = await onCollect();
        } catch (e) {
          console.warn("collect", e);
        } finally {
          this._busy = false;
        }
        lab.textContent = n > 0 ? `${t.got} +${fmt(n)}` : t.empty;
        btn.disabled = true;
        setTimeout(paint, 1400);
      });
    }
    setFPS(v, worst) {
      if (settings.fpsMeter) this.fps.textContent = v + " FPS" + (worst ? " \xB7 " + worst + " ms" : "");
    }
    // worst = longest frame in the last second (a hitch shows up here)
    showHint() {
    }
    haptic(kind = "light") {
      if (!settings.haptics) return;
      try {
        this.tg && this.tg.HapticFeedback && this.tg.HapticFeedback.impactOccurred(kind);
      } catch (e) {
      }
    }
    show(id) {
      const it = tr().info[id];
      if (!it) return;
      this.sheet.querySelector(".bw-mx").innerHTML = "";
      this.sheet.querySelector(".chip").style.display = "";
      this.sheet.querySelector(".e").textContent = it[0];
      this.sheet.querySelector(".t").textContent = it[1];
      this.sheet.querySelector(".d").textContent = it[2];
      this.sheet.classList.add("on");
      this.root.classList.add("sheet-on");
      this.open = id;
      this.haptic("light");
    }
    hide() {
      this.sheet.classList.remove("on");
      this.root.classList.remove("sheet-on");
      this.open = null;
    }
    // ------------------------------------------------ cinematic welcome card over the live scene
    // c = { date, time, tod } ; resolves when the player taps (or after `auto` seconds)
    // raids = the attacks on this kingdom while the player was away (newest first): [{ who, stars, pct, tro, loot, t }]; with a report the card waits for a tap
    showWelcome(c, { auto = 9, raids = null } = {}) {
      const t = tr(), el = document.createElement("div");
      el.className = "bw-wel";
      const rp = raids && raids.length ? raidReport(raids) : "";
      if (rp) {
        el.classList.add("has-rp");
        auto = Math.max(auto, 45);
      }
      el.innerHTML = `<div class="bg"></div><div class="grade"></div><div class="rays"></div><canvas></canvas><div class="lb t"></div><div class="lb b"></div>
      <div class="blk"><div class="pre">${t.welcome.pre.toUpperCase()}</div><div class="lord">${t.welcome.lord}</div><div class="dv"><b></b><i></i><b></b></div>
      <div class="dt">${c.date}</div><div class="tm">${t.tod[c.tod] || ""} \xB7 ${c.time}</div>${rp}</div><div class="tap">${t.welcome.tap}</div>`;
      this.root.appendChild(el);
      this.root.classList.add("wel");
      const cv2 = el.querySelector("canvas"), g = cv2.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = cv2.width = Math.round(el.clientWidth * dpr), H = cv2.height = Math.round(el.clientHeight * dpr);
      const motes = Array.from({ length: 26 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: (0.6 + Math.random() * 1.8) * dpr, v: (6 + Math.random() * 16) * dpr, a: Math.random() * 6.28 }));
      const spr = document.createElement("canvas");
      spr.width = spr.height = 32;
      {
        const sg = spr.getContext("2d"), gr = sg.createRadialGradient(16, 16, 0, 16, 16, 16);
        gr.addColorStop(0, "rgba(200,230,255,1)");
        gr.addColorStop(1, "rgba(200,230,255,0)");
        sg.fillStyle = gr;
        sg.fillRect(0, 0, 32, 32);
      }
      let alive = true, last = performance.now(), acc = 0;
      const tick = (now) => {
        if (!alive) return;
        requestAnimationFrame(tick);
        const dt0 = Math.min(0.1, (now - last) / 1e3);
        last = now;
        acc += dt0;
        if (acc < 0.033) return;
        const dt = acc;
        acc = 0;
        g.clearRect(0, 0, W, H);
        for (const m of motes) {
          m.y -= m.v * dt;
          m.a += dt;
          m.x += Math.sin(m.a) * 6 * dpr * dt;
          if (m.y < -10) {
            m.y = H + 10;
            m.x = Math.random() * W;
          }
          g.globalAlpha = 0.35 + 0.35 * Math.sin(m.a * 2);
          const d = m.r * 6;
          g.drawImage(spr, m.x - d / 2, m.y - d / 2, d, d);
        }
        g.globalAlpha = 1;
      };
      requestAnimationFrame(tick);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("in")));
      return new Promise((resolve) => {
        let done = false;
        const go = (tapped) => {
          if (done) return;
          done = true;
          clearTimeout(timer);
          if (tapped) this.haptic("medium");
          el.classList.add("out");
          this.root.classList.remove("wel");
          setTimeout(() => {
            alive = false;
            el.remove();
          }, 850);
          resolve(tapped);
        };
        const timer = setTimeout(() => go(false), auto * 1e3);
        el.addEventListener("click", () => go(true));
      });
    }
  };

  // src/spellart.js
  var P = {
    lightning: { c1: "#9fe0ff", c2: "#1f56ff", c3: "#06133f", glow: "#7fd0ff" },
    heal: { c1: "#9bffc2", c2: "#14a850", c3: "#032c18", glow: "#7dffb0" },
    freeze: { c1: "#e6fbff", c2: "#35a3ea", c3: "#05284a", glow: "#bff1ff" },
    rage: { c1: "#ffd36b", c2: "#e5391a", c3: "#3d0504", glow: "#ff9a4a" },
    quake: { c1: "#f0d6a2", c2: "#9a6a36", c3: "#2e1a0a", glow: "#ffb35a" }
  };
  var SPELL_KEYS = Object.keys(P);

  // src/unitdefs.json
  var unitdefs_default = { units: { spear: { fam: "barracks", lv: 1, space: 1, hp: 120, dps: 9, rng: 0, spd: 1, cost: { ruby: 3, emerald: 1 }, t: 20, role: "infantry", size: "light", layer: "ground", prefer: "near" }, sword: { fam: "barracks", lv: 4, space: 1, hp: 135, dps: 15, rng: 0, spd: 1.05, cost: { ruby: 6, emerald: 2 }, t: 30, role: "infantry", size: "light", layer: "ground", prefer: "near" }, guard: { fam: "barracks", lv: 6, space: 2, hp: 330, dps: 12, rng: 0, spd: 0.9, cost: { ruby: 10, emerald: 6 }, t: 50, role: "tank", size: "light", layer: "ground", prefer: "defence" }, archer: { fam: "training", lv: 1, space: 1, hp: 80, dps: 11, rng: 26, spd: 1, cost: { ruby: 4, emerald: 2 }, t: 26, role: "ranged", size: "light", layer: "ground", prefer: "near" }, cavalry: { fam: "stable", lv: 7, space: 3, hp: 300, dps: 24, rng: 0, spd: 2.1, cost: { ruby: 15, emerald: 5 }, t: 90, role: "cavalry", size: "medium", layer: "ground", prefer: "raid" }, axerider: { fam: "stable", lv: 16, space: 5, hp: 780, dps: 48, rng: 0, spd: 2, cost: { ruby: 44, emerald: 22, turq: 7 }, t: 200, role: "cavalry", size: "medium", layer: "ground", prefer: "near" }, pegasus: { fam: "stable", lv: 12, space: 4, hp: 360, dps: 30, rng: 0, spd: 2.6, cost: { ruby: 20, turq: 23 }, t: 150, role: "air", air: true, size: "medium", layer: "air", prefer: "raid" }, baby: { fam: "lair", lv: 13, space: 8, hp: 900, dps: 55, rng: 18, spd: 1.8, cost: { turq: 65, ruby: 23 }, t: 420, role: "air", air: true, size: "heavy", layer: "air", prefer: "antiair" }, dragon: { fam: "lair", lv: 27, space: 24, hp: 3400, dps: 150, rng: 22, spd: 1.9, cost: { turq: 511, ruby: 180 }, t: 1500, role: "air", air: true, size: "huge", layer: "air", prefer: "antiair" }, catapult: { fam: "workshop", lv: 9, space: 6, hp: 420, dps: 70, rng: 44, spd: 0.5, cost: { ruby: 20, emerald: 14 }, t: 180, role: "siege", size: "medium", layer: "ground", prefer: "standoff" }, giant: { fam: "workshop", lv: 19, space: 12, hp: 2300, dps: 48, rng: 0, spd: 0.8, cost: { ruby: 62, turq: 21 }, t: 360, role: "giant", size: "heavy", layer: "wade", prefer: "defence" }, imp: { fam: "lair", lv: 4, space: 2, hp: 170, dps: 24, rng: 0, spd: 1.9, cost: { turq: 7, ruby: 3 }, t: 45, role: "cavalry", size: "light", layer: "ground", prefer: "raid" }, mage: { fam: "lair", lv: 7, space: 3, hp: 150, dps: 40, rng: 30, spd: 0.95, cost: { turq: 18, ruby: 8 }, t: 75, role: "ranged", size: "medium", layer: "ground", prefer: "near" }, ram: { fam: "workshop", lv: 13, space: 5, hp: 750, dps: 62, rng: 0, spd: 0.9, cost: { ruby: 20, emerald: 20 }, t: 150, role: "giant", size: "medium", layer: "ground", prefer: "gate" }, cannon: { fam: "workshop", lv: 15, space: 7, hp: 520, dps: 84, rng: 36, spd: 0.5, cost: { ruby: 37, emerald: 22 }, t: 220, role: "siege", size: "heavy", layer: "ground", prefer: "standoff" }, werewolf: { fam: "workshop", lv: 16, space: 8, hp: 1250, dps: 58, rng: 0, spd: 2.3, cost: { ruby: 41, turq: 15 }, t: 280, role: "cavalry", size: "heavy", layer: "ground", prefer: "raid" }, trebuchet: { fam: "workshop", lv: 18, space: 10, hp: 640, dps: 118, rng: 62, spd: 0.4, cost: { ruby: 58, emerald: 37 }, t: 330, role: "siege", size: "heavy", layer: "ground", prefer: "standoff" }, hill: { fam: "workshop", lv: 24, space: 16, hp: 3300, dps: 64, rng: 0, spd: 0.85, cost: { ruby: 106, turq: 37 }, t: 520, role: "giant", size: "huge", layer: "wade", prefer: "defence" }, shieldmaiden: { fam: "barracks", lv: 15, space: 6, hp: 1150, dps: 52, rng: 0, spd: 1.15, cost: { ruby: 38, emerald: 20, turq: 6 }, t: 210, role: "tank", size: "medium", layer: "ground", prefer: "defence" }, lord: { fam: "stable", lv: 20, space: 8, hp: 1500, dps: 74, rng: 0, spd: 2.3, cost: { ruby: 71, emerald: 25, turq: 17 }, t: 270, role: "cavalry", size: "heavy", layer: "ground", prefer: "raid" }, dragonling: { fam: "lair", lv: 18, space: 6, hp: 660, dps: 44, rng: 15, spd: 1.9, cost: { turq: 50, ruby: 21 }, t: 240, role: "air", air: true, size: "medium", layer: "air", prefer: "antiair" }, legionary: { fam: "barracks", lv: 2, space: 1, hp: 150, dps: 11, rng: 0, spd: 1, cost: { ruby: 5, emerald: 2 }, t: 24, role: "infantry", size: "light", layer: "ground", prefer: "near" }, captain: { fam: "barracks", lv: 7, space: 4, hp: 700, dps: 36, rng: 0, spd: 1.1, cost: { ruby: 26, emerald: 12, turq: 4 }, t: 120, role: "tank", size: "medium", layer: "ground", prefer: "near" }, ogre: { fam: "workshop", lv: 22, space: 13, hp: 2700, dps: 62, rng: 0, spd: 0.9, cost: { ruby: 100, turq: 30 }, t: 420, role: "giant", size: "huge", layer: "ground", prefer: "defence" }, gryphon: { fam: "stable", lv: 23, space: 9, hp: 1300, dps: 60, rng: 0, spd: 2.5, cost: { ruby: 48, turq: 66 }, t: 300, role: "air", air: true, size: "heavy", layer: "air", prefer: "raid" }, lich: { fam: "lair", lv: 25, space: 9, hp: 800, dps: 110, rng: 34, spd: 0.95, cost: { turq: 72, ruby: 62 }, t: 380, role: "ranged", size: "heavy", layer: "ground", prefer: "near" }, treant: { fam: "workshop", lv: 26, space: 15, hp: 4e3, dps: 55, rng: 0, spd: 0.8, cost: { ruby: 80, emerald: 60, turq: 22 }, t: 520, role: "giant", size: "huge", layer: "ground", prefer: "defence" }, gryphonknight: { fam: "stable", lv: 25, space: 10, hp: 1900, dps: 100, rng: 0, spd: 2.4, cost: { ruby: 78, emerald: 22, turq: 32 }, t: 330, role: "air", air: true, size: "heavy", layer: "air", prefer: "raid" }, darkrider: { fam: "lair", lv: 28, space: 20, hp: 4200, dps: 190, rng: 24, spd: 1.9, cost: { turq: 300, ruby: 150 }, t: 900, role: "air", air: true, size: "huge", layer: "air", prefer: "antiair" }, baby3: { fam: "lair", lv: 29, space: 20, hp: 3e3, dps: 140, rng: 20, spd: 1.8, cost: { turq: 480, ruby: 200 }, t: 1100, role: "air", air: true, size: "huge", layer: "air", prefer: "antiair" }, dragon3: { fam: "lair", lv: 30, space: 48, hp: 8e3, dps: 360, rng: 24, spd: 1.8, cost: { turq: 1300, ruby: 450 }, t: 3200, role: "air", air: true, size: "huge", layer: "air", prefer: "antiair" } }, order: ["spear", "sword", "guard", "archer", "cavalry", "axerider", "pegasus", "baby", "dragon", "catapult", "giant", "imp", "mage", "ram", "cannon", "werewolf", "trebuchet", "hill", "shieldmaiden", "lord", "dragonling", "legionary", "captain", "ogre", "gryphon", "lich", "treant", "gryphonknight", "darkrider", "baby3", "dragon3"], families: ["barracks", "training", "stable", "lair", "workshop"], spells: { lightning: { lv: 1, space: 1, cost: { turq: 8, ruby: 4 }, t: 40 }, heal: { lv: 2, space: 1, cost: { turq: 8, emerald: 4 }, t: 45 }, freeze: { lv: 4, space: 1, cost: { turq: 12 }, t: 60 }, rage: { lv: 6, space: 2, cost: { turq: 16, ruby: 8 }, t: 90 }, quake: { lv: 9, space: 2, cost: { turq: 20, ruby: 10 }, t: 120 } }, spell_order: ["lightning", "heal", "freeze", "rage", "quake"], emblems: ["swords", "wings", "dragon", "axes", "heart", "crown", "tower", "wolf", "eagle", "lion", "bear", "serpent", "flame", "star", "moon", "sun", "bolt", "pine", "anchor", "arrows", "stag", "frost", "helm", "gem"], spell_cap: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52], max_level: 50, army_cap: [60, 88, 116, 144, 172, 200, 228, 256, 284, 312, 340, 368, 396, 424, 452, 480, 508, 536, 564, 592, 620, 648, 676, 704, 732, 760, 788, 816, 844, 872, 900, 928, 956, 984, 1012, 1040, 1068, 1096, 1124, 1152, 1180, 1208, 1236, 1264, 1292, 1320, 1348, 1376, 1404, 1432], fam_cap: { barracks: [28, 42, 56, 70, 84, 98, 112, 126, 140, 154, 168, 182, 196, 210, 224, 238, 252, 266, 280, 294, 308, 322, 336, 350, 364, 378, 392, 406, 420, 434, 448, 462, 476, 490, 504, 518, 532, 546, 560, 574, 588, 602, 616, 630, 644, 658, 672, 686, 700, 714], training: [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350, 360, 370, 380, 390, 400, 410, 420, 430, 440, 450, 460, 470, 480, 490, 500, 510], stable: [16, 24, 32, 40, 48, 56, 64, 72, 80, 88, 96, 104, 112, 120, 128, 136, 144, 152, 160, 168, 176, 184, 192, 200, 208, 216, 224, 232, 240, 248, 256, 264, 272, 280, 288, 296, 304, 312, 320, 328, 336, 344, 352, 360, 368, 376, 384, 392, 400, 408], lair: [24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180, 192, 204, 216, 228, 240, 252, 264, 276, 288, 300, 312, 324, 336, 348, 360, 372, 384, 396, 408, 420, 432, 444, 456, 468, 480, 492, 504, 516, 528, 540, 552, 564, 576, 588, 600, 612], workshop: [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350, 360, 370, 380, 390, 400, 410, 420, 430, 440, 450, 460, 470, 480, 490, 500, 510] }, speed: [1, 1.08, 1.16, 1.24, 1.32, 1.4, 1.48, 1.56, 1.64, 1.72, 1.8, 1.88, 1.96, 2.04, 2.12, 2.2, 2.28, 2.36, 2.44, 2.52, 2.6, 2.68, 2.76, 2.84, 2.92, 3, 3.08, 3.16, 3.24, 3.32, 3.4, 3.48, 3.56, 3.64, 3.72, 3.8, 3.88, 3.96, 4.04, 4.12, 4.2, 4.28, 4.36, 4.44, 4.52, 4.6, 4.68, 4.76, 4.84, 4.92], forge_mult: [1, 1.06, 1.12, 1.18, 1.24, 1.3, 1.36, 1.42, 1.48, 1.54, 1.6, 1.66, 1.72, 1.78, 1.84, 1.9, 1.96, 2.02, 2.08, 2.14, 2.2, 2.26, 2.32, 2.38, 2.44, 2.5, 2.56, 2.62, 2.68, 2.74, 2.8, 2.86, 2.92, 2.98, 3.04, 3.1, 3.16, 3.22, 3.28, 3.34, 3.4, 3.46, 3.52, 3.58, 3.64, 3.7, 3.76, 3.82, 3.88, 3.94], lvl_step: 0.035, tier_at: [1, 6, 12, 18, 24, 30], perks: { "2": "armor", "3": "swift", "4": "fury", "5": "laststand" }, heroes: { captain: [7, 26, 30], shieldmaiden: [15, 26, 30], lord: [20, 26, 30], gryphonknight: [25, 26, 30], darkrider: [28, 29, 30] }, defences: { tower: { hits: "both", w: 1, rng: 34, cd: 0.9, splash: 0, minr: 0, pick: "near", mult: { light: 1.5, medium: 1, heavy: 0.6, air: 1 }, unlock: 1, n: [3, 11, 15] }, cannon: { hits: "ground", w: 2.2, rng: 40, cd: 3, splash: 3.5, minr: 7, pick: "dense", mult: { light: 1.8, medium: 1, heavy: 0.35, air: 0 }, unlock: 4, n: [1, 3, 13] }, wizard: { hits: "both", w: 1.8, rng: 36, cd: 1.4, splash: 2, minr: 0, pick: "dense", mult: { light: 1.3, medium: 1.2, heavy: 0.7, air: 1 }, unlock: 7, n: [1, 4, 21] }, ballista: { hits: "both", w: 2.2, rng: 46, cd: 2.6, splash: 0, minr: 0, pick: "air", mult: { light: 0.35, medium: 1, heavy: 2.6, air: 2.2 }, unlock: 12, n: [2, 6, 22] }, quad: { hits: "ground", w: 2.4, rng: 34, cd: 1.3, splash: 1.1, minr: 0, pick: "near", mult: { light: 1.1, medium: 1.3, heavy: 0.8, air: 0 }, unlock: 15, n: [1, 3, 25], volley: 4 }, keep: { hits: "both", w: 1.2, rng: 40, cd: 1.6, splash: 0, minr: 0, pick: "near", mult: { light: 1, medium: 1, heavy: 1, air: 1 }, unlock: 1 }, frost: { hits: "both", w: 1.5, rng: 38, cd: 2.2, splash: 5, minr: 0, pick: "dense", mult: { light: 1, medium: 1, heavy: 1, air: 0.6 }, unlock: 18, n: [1, 3, 30], slow: 0.5, slow_t: 3.5 }, flame: { hits: "ground", w: 2.6, rng: 22, cd: 1.1, splash: 2.6, minr: 0, pick: "near", mult: { light: 2, medium: 1.4, heavy: 0.7, air: 0 }, unlock: 22, n: [1, 3, 30] }, dragonbane: { hits: "both", w: 3, rng: 58, cd: 3.4, splash: 0, minr: 0, pick: "air", mult: { light: 0.25, medium: 0.8, heavy: 1.6, air: 3.2 }, unlock: 23, n: [1, 3, 30] }, tesla: { hits: "both", w: 2, rng: 32, cd: 1.5, splash: 0, minr: 0, pick: "near", mult: { light: 1.3, medium: 1, heavy: 0.8, air: 1 }, chain: 3 } }, garrison_at: [[1, 20], [7, 70], [15, 150], [22, 230], [30, 300]], garrison_mix: { guard: 0.55, archer: 0.25, heavy: 0.1, reserve: 0.1 }, defence_pairs: [[1, "tower", ["spear", "archer"]], [4, "cannon", ["sword", "imp"]], [7, "wizard", ["mage", "cavalry"]], [12, "ballista", ["pegasus"]], [15, "quad", ["cannon"]], [18, "frost", ["dragonling", "trebuchet"]], [19, "giant", ["giant"]], [22, "flame", ["ogre"]], [23, "dragonbane", ["gryphon"]], [24, "baby", ["hill"]], [24, "hill", ["hill"]], [27, "dragon", ["dragon"]]], guardians: { giant: { unlock: 19, n: [2, 4] }, baby: { unlock: 24, n: [2, 4] }, hill: { unlock: 24, n: [2, 2] }, dragon: { unlock: 27, n: [2, 2] } }, bot_ratio: [0.9, 1.5] };

  // src/emblems.js
  var TAU = Math.PI * 2;
  var EMBLEM_IDS = [
    "swords",
    "wings",
    "dragon",
    "axes",
    "heart",
    "crown",
    "tower",
    "wolf",
    "eagle",
    "lion",
    "bear",
    "serpent",
    "flame",
    "star",
    "moon",
    "sun",
    "bolt",
    "pine",
    "anchor",
    "arrows",
    "stag",
    "frost",
    "helm",
    "gem"
  ];
  var OLD = ["\u2694\uFE0F", "\u{1F5E1}\uFE0F", "\u{1F409}", "\u{1F528}", "\u2764\uFE0F", "\u{1F451}", "\u{1F6E1}\uFE0F", "\u{1F43A}", "\u{1F985}", "\u{1F981}", "\u{1F43B}", "\u{1F40D}", "\u{1F525}", "\u2B50", "\u{1F319}", "\u2600\uFE0F", "\u26A1", "\u{1F332}", "\u2693", "\u{1F3F9}", "\u{1F3F0}", "\u2744\uFE0F", "\u{1F434}", "\u{1F48E}", "\u{1F5DD}\uFE0F", "\u{1F339}", "\u{1F982}", "\u{1FA93}", "\u{1F989}", "\u{1F417}", "\u{1F98A}", "\u{1F480}"];
  var OLD_TO = ["swords", "wings", "dragon", "axes", "heart", "crown", "helm", "wolf", "eagle", "lion", "bear", "serpent", "flame", "star", "moon", "sun", "bolt", "pine", "anchor", "arrows", "tower", "frost", "stag", "gem", "tower", "heart", "serpent", "axes", "eagle", "bear", "wolf", "helm"];
  var LEGACY = Object.fromEntries(OLD.map((e, i) => [e, OLD_TO[i]]));
  var strip = (s) => String(s || "").replace(/️/g, "");
  var LEG2 = Object.fromEntries(Object.entries(LEGACY).map(([k, v]) => [strip(k), v]));
  function normEmblem(e) {
    if (EMBLEM_IDS.includes(e)) return e;
    return LEG2[strip(e)] || EMBLEM_IDS[0];
  }
  var FIELD = {
    // enamel of the field: [lit centre, shadowed edge]
    navy: ["#3a86ea", "#081f52"],
    ink: ["#46505f", "#04060b"],
    steel: ["#8099bd", "#1d2c44"],
    deep: ["#2a62c4", "#040c26"],
    teal: ["#2a93b2", "#042532"],
    indigo: ["#5867d6", "#080d38"]
  };
  var FILLS = {
    forged: {
      i: [[0, "#ffffff"], [0.36, "#e4f0fb"], [0.49, "#a3bdd8"], [0.55, "#d2e3f3"], [1, "#86a3c4"]],
      // polished silver
      s: [[0, "#e9f0f8"], [0.44, "#a9b9ce"], [0.52, "#71839f"], [1, "#55667e"]],
      // darker steel
      b: [[0, "#97e4ff"], [0.5, "#3299f2"], [1, "#1150b4"]],
      // blue enamel inlay
      k: [[0, "#0b1a36"], [1, "#050c1c"]],
      // ink (eyes, slots)
      g: [[0, "#ffffff"], [0.35, "#a6e9ff"], [1, "#2aa3ff"]],
      // jewels / glowing eyes
      d: [[0, "#4189e4"], [1, "#0f3a86"]]
      // deep blue enamel
    },
    gilded: {
      i: [[0, "#fffbea"], [0.36, "#ffe08c"], [0.49, "#c48d22"], [0.55, "#f1c552"], [1, "#a26f17"]],
      s: [[0, "#f6e7bf"], [0.44, "#c9a560"], [0.52, "#8c6a2c"], [1, "#6e5122"]],
      b: [[0, "#97e4ff"], [0.5, "#3299f2"], [1, "#1150b4"]],
      k: [[0, "#1a1208"], [1, "#090603"]],
      g: [[0, "#ffffff"], [0.35, "#a6e9ff"], [1, "#2aa3ff"]],
      d: [[0, "#4189e4"], [1, "#0f3a86"]]
    },
    flat: {
      i: [[0, "#f7fcff"], [1, "#a8d6ff"]],
      b: [[0, "#52c6ff"], [1, "#1b78dd"]],
      s: [[0, "#dde6f2"], [1, "#7d91ad"]],
      k: [[0, "#0b1a36"], [1, "#050c1c"]],
      g: [[0, "#d8f4ff"], [1, "#37b8ff"]],
      d: [[0, "#2b6fd0"], [1, "#0f3a86"]]
    }
  };
  var RIMS = {
    forged: {
      rim: [[0, "#f6faff"], [0.2, "#bccadc"], [0.44, "#5e6f89"], [0.52, "#8798b1"], [0.78, "#d6e1ee"], [1, "#55667f"]],
      stud: ["#ffffff", "#aebdd2", "#36445b"],
      bezel: [[0, "#ffffff"], [0.5, "#9fb0c8"], [1, "#3a4860"]],
      hi: "#ffffff",
      lo: "#030a1c",
      line: "rgba(2,8,20,0.92)"
    },
    gilded: {
      rim: [[0, "#fff8de"], [0.2, "#f3cf6e"], [0.44, "#8f6215"], [0.52, "#c3912c"], [0.78, "#ffe39a"], [1, "#7c5512"]],
      stud: ["#fffbe8", "#e9bd55", "#6d4a10"],
      bezel: [[0, "#fffbe8"], [0.5, "#e2b24a"], [1, "#6d4a10"]],
      hi: "#fffaf0",
      lo: "#1c1004",
      line: "rgba(30,18,4,0.92)"
    }
  };
  var OUT = "rgba(2,9,24,0.88)";
  var f1 = (n) => +n.toFixed(2);
  function poly(pts) {
    return "M" + pts.map((p) => f1(p[0]) + " " + f1(p[1])).join(" L") + " Z";
  }
  function starPts(cx, cy, n, r1, r2, rot = -Math.PI / 2) {
    const o = [];
    for (let i = 0; i < n * 2; i++) {
      const a = rot + i * Math.PI / n, r = i % 2 ? r2 : r1;
      o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return o;
  }
  function circle(cx, cy, r) {
    return `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
  }
  function ellipse(cx, cy, rx, ry) {
    return `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${rx * 2} 0 a${rx} ${ry} 0 1 0 ${-rx * 2} 0 Z`;
  }
  var mir = (st2, d, o = {}) => [[st2, d, o], [st2, d, { ...o, mx: 1 }]];
  var sword = (r, mx) => [
    // a longsword: tapered blade ending in a point, fuller, curved guard, wrapped grip, pommel
    ["i", "M46.1 62 L46.1 33 C46.3 24 48.4 17 50 7 C51.6 17 53.7 24 53.9 33 L53.9 62 Z", { r, mx }],
    ["s", "M50 8 C51.6 17 53.7 24 53.9 33 L53.9 62 L50 62 Z", { r, mx, ol: false, a: 0.6 }],
    ["k", "M49.45 20 H50.55 V58 H49.45 Z", { r, mx, ol: false, a: 0.5 }],
    ["s", "M35 63 C35 59.5 38.5 59 42 59 H58 C61.5 59 65 59.5 65 63 C65 66.5 62 67.6 58 66.6 H42 C38 67.6 35 66.5 35 63 Z", { r, mx }],
    ["i", circle(35, 63, 2.3), { r, mx }],
    ["i", circle(65, 63, 2.3), { r, mx }],
    ["d", "M47.3 66.5 H52.7 V78.5 H47.3 Z", { r, mx }],
    ["s", circle(50, 82, 4.2), { r, mx }],
    ["b", circle(50, 82, 1.8), { r, mx, ol: false }]
  ];
  var axe = (r, mx) => [
    ["s", "M48.2 24 H51.8 V86 H48.2 Z", { r, mx }],
    ["i", "M52 22 C68 15 82 22 82 40 C82 52 76 58 70 62 C72 52 68 44 52 44 Z", { r, mx }],
    ["b", "M56 28 C66 25 74 28 76 38 C70 34 62 33 56 34 Z", { r, mx, ol: false, a: 0.7 }],
    ["d", "M47 84 H53 V90 H47 Z", { r, mx }]
  ];
  var arrow = (r) => {
    const o = { r, p: [50, 90] };
    return [
      ["s", "M48.8 22 H51.2 V88 H48.8 Z", o],
      ["i", "M50 6 L60 28 L50 23 L40 28 Z", o],
      ["b", "M50 74 L60 90 H54 L50 84 L46 90 H40 Z", o],
      ["b", "M50 62 L58 74 H53 L50 69 L47 74 H42 Z", o]
    ];
  };
  var CHARGES = {
    // two blades crossed over a small steel ring
    swords: () => [...sword(-42), ...sword(42, 1)],
    // a blade rising between two wings of feathers
    wings: () => [
      ...mir("s", "M45 60 L14 46 L24 44 L8 32 L22 32 L14 20 L32 26 L26 14 L44 34 Z"),
      ...mir("i", "M45 56 L24 44 L34 43 L22 33 L34 34 L28 26 L44 38 Z", { ol: false, a: 0.85 }),
      ...sword(0)
    ],
    // the head of a dragon, front on, horned, eyes alight
    dragon: () => [
      ...mir("s", "M54 34 C58 24 66 16 78 12 C73 21 70 28 70 38 Z"),
      ...mir("s", "M56 54 L82 48 L76 58 L90 62 L72 68 L66 72 Z"),
      ["i", "M50 24 C60 24 68 32 70 42 L76 52 L68 58 L66 70 L58 80 L56 90 L50 86 L44 90 L42 80 L34 70 L32 58 L24 52 L30 42 C32 32 40 24 50 24 Z", {}],
      ...mir("k", "M54 42 L68 38 L64 48 L56 50 Z", { ol: false }),
      ...mir("g", "M56 44 L65 41 L63 46 L57 48 Z", { ol: false }),
      ...mir("b", "M52 62 L58 68 L55 76 L52 70 Z", { a: 0.85 }),
      ...mir("k", circle(54, 62, 1.9), { ol: false }),
      ...mir("s", "M48 80 L50 90 L52 80 Z", { ol: false }),
      ["b", "M47 30 L50 36 L53 30 L50 24 Z", {}]
    ],
    // two axes crossed
    axes: () => [...axe(-34, 1), ...axe(34), ["b", circle(50, 52, 4.5), {}]],
    // the Blue Hearts heart, cut like a gem
    heart: () => [
      ["b", "M50 84 C22 64 14 44 20 32 C26 20 42 20 50 32 C58 20 74 20 80 32 C86 44 78 64 50 84 Z", {}],
      ["d", "M50 84 C74 68 84 50 80 34 C79 52 68 68 50 84 Z", { ol: false, a: 0.7 }],
      // cut like a gem: a table and facets catching the light
      ["g", "M50 34 L40 27 C33 25 25 27 22 33 L36 42 Z", { ol: false, a: 0.55 }],
      ["i", "M50 34 L36 42 L50 52 L64 42 Z", { ol: false, a: 0.32 }],
      ["k", "M50 52 L64 42 L79 33 C82 46 74 60 50 84 Z", { ol: false, a: 0.18 }],
      ["k", "M22 33 L36 42 L50 52 L64 42 L79 33 M50 34 L36 42 M50 34 L64 42 M50 52 L50 83 M36 42 L31 64 M64 42 L69 64", { w: 0.9, ol: false, a: 0.4 }],
      ["i", "M26 38 C25 30 32 26 39 29", { w: 4.2, ol: false }],
      ["i", circle(31, 45, 2.6), { ol: false, a: 0.9 }]
    ],
    crown: () => [
      ["i", "M22 34 L38 52 L50 28 L62 52 L78 34 L74 68 H26 Z", {}],
      ["s", "M24 66 H76 V77 H24 Z", {}],
      ["b", "M34 64 L38 52 L50 66 L62 52 L66 64 Z", { ol: false, a: 0.55 }],
      ["g", circle(22, 31, 4.6), {}],
      ["g", circle(50, 25, 4.6), {}],
      ["g", circle(78, 31, 4.6), {}],
      ["g", poly([[34, 71.5], [37.5, 68], [41, 71.5], [37.5, 75]]), { ol: false }],
      ["g", poly([[48.5, 71.5], [50, 68], [51.5, 71.5], [50, 75]]), { ol: false }],
      ["g", poly([[59, 71.5], [62.5, 68], [66, 71.5], [62.5, 75]]), { ol: false }]
    ],
    // a castle keep, flag flying
    tower: () => [
      ["k", "M49.4 10 H50.8 V30 H49.4 Z", { ol: false }],
      ["b", "M50 10 L66 15 L50 21 Z", {}],
      ["i", "M28 82 V30 H38 V37 H44 V30 H56 V37 H62 V30 H72 V82 Z", {}],
      ["s", "M28 46 H72 V51 H28 Z", { ol: false, a: 0.9 }],
      ["d", "M28 51 H72 V82 H28 Z", { ol: false, a: 0.35 }],
      ["k", "M42 82 V68 C42 58 58 58 58 68 V82 Z", { ol: false }],
      ["k", "M47.5 37 H52.5 V47 H47.5 Z", { ol: false }],
      ["b", "M37.5 60 H40.5 V68 H37.5 Z M59.5 60 H62.5 V68 H59.5 Z", { ol: false }]
    ],
    // a wolf, front on
    wolf: () => [
      ["i", "M50 26 L60 30 L68 14 L74 42 L82 54 L72 62 L66 74 L56 82 L50 88 L44 82 L34 74 L28 62 L18 54 L26 42 L32 14 L40 30 Z", {}],
      ...mir("b", "M62 30 L68 20 L70 38 Z", { ol: false, a: 0.85 }),
      ...mir("s", "M50 54 L60 62 L50 80 L40 62 Z", { ol: false, a: 0.55 }),
      ...mir("k", "M54 46 L68 42 L64 52 L56 52 Z", { ol: false }),
      ...mir("g", "M57 47 L66 45 L63 50 L58 50 Z", { ol: false }),
      ["k", "M43 66 H57 L50 76 Z", { ol: false }],
      ...mir("s", "M68 60 L78 66 L68 70 Z", { ol: false, a: 0.8 })
    ],
    // an eagle with its wings spread
    eagle: () => [
      ...mir("s", "M55 46 C66 38 80 30 92 36 L84 40 L92 46 L82 48 L88 58 L76 54 L78 64 L66 58 L56 68 Z"),
      ...mir("i", "M55 48 C64 42 74 36 84 38 L78 42 L84 47 L76 50 L80 56 L70 53 L70 60 L60 56 Z", { ol: false, a: 0.85 }),
      ["i", "M50 36 C56 36 58 42 58 50 L58 64 L50 74 L42 64 L42 50 C42 42 44 36 50 36 Z", {}],
      // the head in profile, turned to dexter: a hooked beak, a fierce eye, a ruff of neck feathers
      ["s", "M43 40 L41 33 L45 35 L44 29 L49 33 L50 27 L54 33 L57 29 L57 36 L60 34 L57 41 Z", {}],
      ["i", "M45 37 C41 31 42 22 49 19 C55 17 60 20 60 26 C60 31 57 35 55 38 Z", {}],
      ["b", "M45.5 22.5 C40 21.5 35 24 34.5 29.5 C34.4 31 35.6 31.6 36.4 30.4 C38 28 41 27.6 44.6 28.4 Z", {}],
      ["k", "M47.8 23.2 L53.4 21.6 L52.2 24.6 Z", { ol: false }],
      ["g", circle(51.4, 23.1, 0.85), { ol: false }],
      ["s", "M43 72 H57 L60 88 L50 82 L40 88 Z", {}],
      ["d", "M50 50 L55 58 L50 70 L45 58 Z", { ol: false, a: 0.7 }]
    ],
    // a lion's head and mane
    lion: () => [
      ["d", poly(starPts(50, 52, 14, 44, 33)), {}],
      ["b", poly(starPts(50, 52, 14, 37, 29)), { ol: false, a: 0.85 }],
      ["i", "M50 26 C64 26 72 36 72 50 C72 62 66 72 58 78 L50 82 L42 78 C34 72 28 62 28 50 C28 36 36 26 50 26 Z", {}],
      ...mir("k", "M36 46 L47 49 L45 53 L35 51 Z", { ol: false }),
      ...mir("g", "M38 47.5 L45 49.5 L44 51.5 L37.5 50.5 Z", { ol: false }),
      ["s", "M43 58 H57 L50 68 Z", { ol: false, a: 0.8 }],
      ["k", "M44 57 H56 L50 63 Z", { ol: false }],
      ["k", "M50 63 V70 M50 70 C46 74 42 73 40 70 M50 70 C54 74 58 73 60 70", { w: 1.6, ol: false }]
    ],
    // a bear's head
    bear: () => [
      ...mir("s", circle(29, 32, 11)),
      ...mir("b", circle(29, 32, 5.5), { ol: false }),
      ["i", "M50 22 C70 22 80 36 80 52 C80 70 66 84 50 84 C34 84 20 70 20 52 C20 36 30 22 50 22 Z", {}],
      ["s", ellipse(50, 66, 15, 12), { ol: false }],
      ["k", "M43 58 H57 L50 67 Z", { ol: false }],
      ["k", "M50 67 V73 M50 73 C46 77 42 76 40 73 M50 73 C54 77 58 76 60 73", { w: 1.5, ol: false }],
      ...mir("k", "M33 42 L47 47 L45 51 L33 47 Z", { ol: false }),
      ...mir("g", circle(40, 49, 2.4), { ol: false })
    ],
    // a coiled serpent
    serpent: () => [
      ["k", "M62 28 C34 20 22 46 46 52 C68 58 66 80 36 76", { w: 14, ol: false, a: 0.9 }],
      ["i", "M62 28 C34 20 22 46 46 52 C68 58 66 80 36 76", { w: 10 }],
      ["b", "M62 28 C34 20 22 46 46 52 C68 58 66 80 36 76", { w: 4.2, ol: false, a: 0.8 }],
      ["i", "M58 22 C62 14 76 14 80 22 C82 28 74 34 66 33 C60 32 56 28 58 22 Z", {}],
      ["k", circle(70, 21, 1.8), { ol: false }],
      ["g", circle(70.4, 20.6, 0.9), { ol: false }],
      ["k", "M80 24 L88 26 M88 26 L92 23 M88 26 L92 29", { w: 1.4, ol: false }]
    ],
    // a blue flame
    flame: () => [
      ["b", "M50 8 C54 26 74 34 72 58 C71 74 62 86 50 86 C38 86 29 74 28 58 C27 46 34 40 38 28 C41 36 44 38 46 38 C44 28 46 18 50 8 Z", {}],
      ["i", "M50 42 C53 54 62 58 61 70 C60 78 56 82 50 82 C44 82 40 78 39 70 C38 60 45 56 50 42 Z", {}],
      ["g", "M50 60 C52 66 55 68 54 73 C53 77 51 78 50 78 C49 78 47 77 46 73 C45 68 48 66 50 60 Z", { ol: false, a: 0.9 }]
    ],
    // an eight-pointed compass star
    star: () => {
      const o = [], P4 = starPts(50, 50, 8, 40, 14);
      for (let i = 0; i < 8; i++) {
        const a = P4[i * 2], b = P4[(i * 2 + 1) % 16], c = P4[(i * 2 + 15) % 16], long = i % 2 === 0, r = long ? 1 : 0.7;
        const tip = [50 + (a[0] - 50) * r, 50 + (a[1] - 50) * r];
        o.push([i % 2 ? "s" : "i", poly([[50, 50], c, tip]), { ol: true }], ["b", poly([[50, 50], tip, b]), { ol: true, a: 0.95 }]);
      }
      o.push(["g", circle(50, 50, 5), {}]);
      return o;
    },
    moon: () => {
      const c1 = [46, 52, 35], c2 = [62, 42, 29], dx = c2[0] - c1[0], dy = c2[1] - c1[1], d = Math.hypot(dx, dy);
      const a = (c1[2] ** 2 - c2[2] ** 2 + d * d) / (2 * d), h = Math.sqrt(c1[2] ** 2 - a * a), mx = c1[0] + a * dx / d, my = c1[1] + a * dy / d;
      const P1 = [mx + h * dy / d, my - h * dx / d], P22 = [mx - h * dy / d, my + h * dx / d];
      const A = (p) => f1(p[0]) + " " + f1(p[1]);
      return [
        ["i", `M${A(P1)} A${c1[2]} ${c1[2]} 0 1 0 ${A(P22)} A${c2[2]} ${c2[2]} 0 1 1 ${A(P1)} Z`, {}],
        ["g", poly(starPts(72, 62, 4, 11, 3.4)), {}],
        ["g", poly(starPts(66, 26, 4, 6.5, 2.2)), {}]
      ];
    },
    sun: () => [
      ["b", poly(starPts(50, 50, 12, 42, 24)), {}],
      ["i", poly(starPts(50, 50, 12, 36, 24, -Math.PI / 2 + Math.PI / 12)), { ol: false, a: 0.7 }],
      ["i", circle(50, 50, 19), {}],
      ["g", circle(50, 50, 12.5), { ol: false }],
      ["i", circle(46, 46, 4.5), { ol: false, a: 0.9 }]
    ],
    bolt: () => [
      ["b", "M60 8 L26 54 H45 L38 92 L76 42 H55 Z", {}],
      ["i", "M58 16 L34 50 H49 L44 78 L68 46 H52 Z", { ol: false, a: 0.9 }],
      ["g", "M57 24 L42 46 H51 L48 62 L61 44 H52 Z", { ol: false, a: 0.8 }]
    ],
    pine: () => [
      ["s", "M45 76 H55 V90 H45 Z", {}],
      ["d", "M50 10 L66 34 H58 L72 54 H62 L80 76 H20 L38 54 H28 L42 34 H34 Z", {}],
      ["i", "M50 10 L66 34 H58 L72 54 H62 L80 76 H50 Z", { ol: false, a: 0.88 }],
      ["b", "M50 22 L58 34 L50 34 Z M50 44 L62 54 L50 54 Z M50 62 L68 76 L50 76 Z", { ol: false, a: 0.55 }]
    ],
    anchor: () => [
      ["k", "M24 56 C26 76 40 84 50 84 C60 84 74 76 76 56 M50 30 V82 M36 40 H64", { w: 10.5, ol: false, a: 0.9 }],
      ["i", "M50 30 V82 M36 40 H64", { w: 6.6 }],
      ["i", "M24 56 C26 76 40 84 50 84 C60 84 74 76 76 56", { w: 6.6 }],
      ["i", "M16 60 L26 50 L32 64 Z M84 60 L74 50 L68 64 Z", {}],
      ["i", circle(50, 22, 7.5), {}],
      ["k", circle(50, 22, 3.4), { ol: false }],
      ["b", "M50 31 V80", { w: 2, ol: false, a: 0.7 }]
    ],
    arrows: () => [...arrow(-27), ...arrow(27), ...arrow(0)],
    // stag antlers over a skull
    stag: () => {
      const beam = "M53 58 C62 46 64 34 72 16", tines = "M62 42 L78 38 M65 32 L81 26 M69 22 L75 8 M57 52 L70 54";
      return [
        ["k", beam + tines, { w: 8, ol: false, a: 0.9, mx: 0 }],
        ["k", beam + tines, { w: 8, ol: false, a: 0.9, mx: 1 }],
        ["i", beam, { w: 5.2 }],
        ["i", beam, { w: 5.2, mx: 1 }],
        ["i", tines, { w: 3.4 }],
        ["i", tines, { w: 3.4, mx: 1 }],
        ...mir("s", "M42 52 L24 56 L36 64 Z"),
        ["i", "M40 52 C40 46 60 46 60 52 L58 72 L50 88 L42 72 Z", {}],
        ...mir("k", "M43 58 L48 60 L46 63 Z", { ol: false }),
        ["k", "M47 78 H53 L50 84 Z", { ol: false }]
      ];
    },
    // an ice crystal
    frost: () => {
      const o = [];
      const arm = "M50 50 V14 M50 30 L40 20 M50 30 L60 20 M50 42 L42 34 M50 42 L58 34";
      for (let i = 0; i < 6; i++) o.push(["k", arm, { w: 7.4, r: i * 60, ol: false, a: 0.9 }]);
      for (let i = 0; i < 6; i++) o.push(["i", arm, { w: 4, r: i * 60, ol: false }]);
      o.push(["b", poly(starPts(50, 50, 6, 11, 8, 0)), {}], ["g", circle(50, 50, 4), { ol: false }]);
      return o;
    },
    // a knight's helm with a plume
    helm: () => [
      ["b", "M50 20 C42 4 62 2 74 10 C66 12 62 18 58 26 Z", {}],
      ["i", "M28 84 V46 C28 28 38 18 50 18 C62 18 72 28 72 46 V84 H62 V70 H38 V84 Z", {}],
      ["s", "M28 84 V46 C28 40 29 36 32 32 L34 84 Z", { ol: false, a: 0.7 }],
      ["k", "M33 44 H67 V52 H33 Z", { ol: false }],
      ["k", "M46.5 52 H53.5 V68 H46.5 Z", { ol: false }],
      ["g", "M35 46 H65 V49.5 H35 Z", { ol: false, a: 0.9 }],
      ["b", "M38 66 H62 V70 H38 Z", { ol: false, a: 0.8 }]
    ],
    // a cut gem
    gem: () => [
      ["i", "M26 36 L38 22 H62 L74 36 L50 84 Z", {}],
      ["b", "M26 36 L38 22 L44 36 Z", { ol: false }],
      ["s", "M74 36 L62 22 L56 36 Z", { ol: false }],
      ["i", "M38 22 H62 L56 36 H44 Z", { ol: false }],
      ["b", "M26 36 H44 L50 84 Z", { ol: false, a: 0.95 }],
      ["g", "M44 36 H56 L50 84 Z", { ol: false }],
      ["d", "M56 36 H74 L50 84 Z", { ol: false }],
      ["k", "M26 36 H74 M38 22 L44 36 L50 84 L56 36 L62 22 M26 36 L44 36 M74 36 L56 36", { w: 1, ol: false, a: 0.55 }]
    ]
  };
  var FIELD_OF = {
    swords: "navy",
    wings: "deep",
    dragon: "ink",
    axes: "steel",
    heart: "deep",
    crown: "indigo",
    tower: "navy",
    wolf: "steel",
    eagle: "deep",
    lion: "indigo",
    bear: "teal",
    serpent: "ink",
    flame: "ink",
    star: "deep",
    moon: "indigo",
    sun: "navy",
    bolt: "ink",
    pine: "teal",
    anchor: "deep",
    arrows: "steel",
    stag: "teal",
    frost: "navy",
    helm: "ink",
    gem: "deep"
  };
  var CREST_STYLE = "forged";
  var P2 = {};
  var p2 = (d) => P2[d] || (P2[d] = new Path2D(d));
  function grad(g, stops, y0 = 8, y1 = 92) {
    const gr = g.createLinearGradient(0, y0, 0, y1);
    for (const [o, c] of stops) gr.addColorStop(o, c);
    return gr;
  }
  function drawOps(g, ops, F, lw) {
    for (const [st2, d, o] of ops) {
      g.save();
      if (o.r) {
        const px = o.p ? o.p[0] : 50, py = o.p ? o.p[1] : 50;
        g.translate(px, py);
        g.rotate(o.r * Math.PI / 180);
        g.translate(-px, -py);
      }
      if (o.mx) {
        g.translate(100, 0);
        g.scale(-1, 1);
      }
      if (o.a != null) g.globalAlpha = o.a;
      const path = p2(d), stops = F[st2] || F.i;
      if (o.w) {
        g.lineWidth = o.w;
        g.strokeStyle = st2 === "k" ? stops[0][1] : grad(g, stops);
        g.stroke(path);
      } else {
        g.fillStyle = grad(g, stops);
        g.fill(path);
        if (o.ol !== false) {
          g.lineWidth = lw;
          g.strokeStyle = OUT;
          g.stroke(path);
        }
      }
      g.restore();
    }
  }
  var SHIELD0 = "M13 8 H87 V50 C87 74 68 90 50 97 C32 90 13 74 13 50 Z";
  var SHIELD0_IN = "M19 14 H81 V50 C81 70 65 84 50 90 C35 84 19 70 19 50 Z";
  function drawFlat(g, id, cx, cy, size) {
    const ops = (CHARGES[id] || CHARGES.swords)(), fld = FIELD[FIELD_OF[id]] || FIELD.navy;
    g.save();
    g.translate(cx - size / 2, cy - size / 2);
    g.scale(size / 100, size / 100);
    g.lineJoin = "round";
    g.lineCap = "round";
    g.save();
    g.translate(0, 2.4);
    g.fillStyle = "rgba(0,6,20,0.45)";
    g.fill(p2(SHIELD0));
    g.restore();
    const rim = g.createLinearGradient(0, 8, 0, 97);
    rim.addColorStop(0, "#f2f8ff");
    rim.addColorStop(0.45, "#aebdd2");
    rim.addColorStop(1, "#5f7391");
    g.fillStyle = rim;
    g.fill(p2(SHIELD0));
    g.strokeStyle = OUT;
    g.lineWidth = 2;
    g.stroke(p2(SHIELD0));
    const fg = g.createLinearGradient(0, 14, 0, 90);
    fg.addColorStop(0, fld[0]);
    fg.addColorStop(1, fld[1]);
    g.fillStyle = fg;
    g.fill(p2(SHIELD0_IN));
    g.strokeStyle = "rgba(2,9,24,0.8)";
    g.lineWidth = 1.4;
    g.stroke(p2(SHIELD0_IN));
    g.save();
    g.clip(p2(SHIELD0_IN));
    const sh = g.createLinearGradient(0, 14, 0, 56);
    sh.addColorStop(0, "rgba(255,255,255,0.20)");
    sh.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = sh;
    g.fillRect(0, 14, 100, 42);
    g.restore();
    g.strokeStyle = "rgba(190,225,255,0.5)";
    g.lineWidth = 0.9;
    g.stroke(p2(SHIELD0_IN));
    g.save();
    g.clip(p2(SHIELD0_IN));
    g.translate(50, 53);
    g.scale(0.86, 0.86);
    g.translate(-50, -50);
    drawOps(g, ops, FILLS.flat, 1.5);
    g.restore();
    g.restore();
  }
  var SHIELD = "M11 6 C25 9.5 38 9.5 50 4.5 C62 9.5 75 9.5 89 6 L87.5 50 C87.5 74 68.5 90.5 50 97.5 C31.5 90.5 12.5 74 12.5 50 Z";
  var SHIELD_IN = "M18.2 13.2 C28.5 15.6 39.5 15.4 50 11.6 C60.5 15.4 71.5 15.6 81.8 13.2 L81 50 C81 70 65 83.8 50 90.2 C35 83.8 19 70 19 50 Z";
  var STUDS = [[17.2, 10.6], [82.8, 10.6], [32, 11.7], [68, 11.7], [15.5, 31], [84.5, 31], [15.7, 52], [84.3, 52], [26.4, 77.4], [73.6, 77.4], [50, 93.6]];
  var CACHE = /* @__PURE__ */ new Map();
  function cv(w, h = w) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }
  function silhouette(src, color) {
    const c = cv(src.width, src.height), x = c.getContext("2d");
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = "source-in";
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function edgeBand(sil, dx, dy, color) {
    const c = cv(sil.width, sil.height), x = c.getContext("2d");
    x.drawImage(sil, 0, 0);
    x.globalCompositeOperation = "destination-out";
    x.drawImage(sil, dx, dy);
    x.globalCompositeOperation = "source-in";
    x.fillStyle = color;
    x.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function bevel(g, d, o, hi, lo) {
    const P4 = p2(d);
    const ring = (dx, dy) => {
      const q = new Path2D();
      q.rect(-30, -30, 160, 160);
      q.addPath(P4, new DOMMatrix().translate(dx, dy));
      return q;
    };
    g.save();
    g.clip(P4);
    g.fillStyle = hi;
    g.fill(ring(o, o), "evenodd");
    g.fillStyle = lo;
    g.fill(ring(-o, -o), "evenodd");
    g.restore();
  }
  function stud(g, x, y, r, R) {
    g.fillStyle = "rgba(0,4,14,0.6)";
    g.beginPath();
    g.arc(x + r * 0.22, y + r * 0.34, r * 1.08, 0, TAU);
    g.fill();
    const rg = g.createRadialGradient(x - r * 0.42, y - r * 0.46, r * 0.08, x, y, r);
    rg.addColorStop(0, R.stud[0]);
    rg.addColorStop(0.45, R.stud[1]);
    rg.addColorStop(1, R.stud[2]);
    g.fillStyle = rg;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }
  function sparkle(g, x, y, r, a = 0.95) {
    g.save();
    g.globalAlpha = a;
    g.fillStyle = "#ffffff";
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const an = i * Math.PI / 4, rr = i % 2 ? r * 0.16 : r;
      g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr);
    }
    g.closePath();
    g.fill();
    g.restore();
  }
  function sapphire(g, x, y, r, R, big) {
    const bz = g.createRadialGradient(x - r * 0.5, y - r * 0.6, r * 0.1, x, y, r * 1.4);
    for (const [o, c] of R.bezel) bz.addColorStop(o, c);
    g.fillStyle = "rgba(0,4,14,0.6)";
    g.beginPath();
    g.arc(x + r * 0.2, y + r * 0.35, r * 1.42, 0, TAU);
    g.fill();
    g.fillStyle = bz;
    g.beginPath();
    g.arc(x, y, r * 1.36, 0, TAU);
    g.fill();
    const oct = [];
    for (let i = 0; i < 8; i++) {
      const an = Math.PI / 8 + i * Math.PI / 4;
      oct.push([x + Math.cos(an) * r, y + Math.sin(an) * r]);
    }
    const rg = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.05, x, y + r * 0.15, r * 1.05);
    rg.addColorStop(0, "#f2fdff");
    rg.addColorStop(0.22, "#86e0ff");
    rg.addColorStop(0.58, "#1d7fe6");
    rg.addColorStop(1, "#051d55");
    g.fillStyle = rg;
    g.beginPath();
    oct.forEach(([px, py]) => g.lineTo(px, py));
    g.closePath();
    g.fill();
    if (big) {
      g.strokeStyle = "rgba(220,245,255,0.35)";
      g.lineWidth = r * 0.07;
      g.beginPath();
      const t = oct.map(([px, py]) => [x + (px - x) * 0.5, y + (py - y) * 0.5]);
      t.forEach(([px, py]) => g.lineTo(px, py));
      g.closePath();
      oct.forEach(([px, py], i) => {
        g.moveTo(px, py);
        g.lineTo(t[i][0], t[i][1]);
      });
      g.stroke();
    }
    g.fillStyle = "rgba(255,255,255,0.92)";
    g.beginPath();
    g.ellipse(x - r * 0.34, y - r * 0.38, r * 0.26, r * 0.16, -0.6, 0, TAU);
    g.fill();
  }
  function diaper(g) {
    g.save();
    g.lineWidth = 0.35;
    g.strokeStyle = "rgba(255,255,255,0.07)";
    g.beginPath();
    for (let i = -100; i <= 200; i += 9) {
      g.moveTo(i, 0);
      g.lineTo(i + 100, 100);
      g.moveTo(i, 0);
      g.lineTo(i - 100, 100);
    }
    g.stroke();
    g.fillStyle = "rgba(255,255,255,0.09)";
    for (let y = 4.5, row = 0; y < 100; y += 9, row++) for (let x = row % 2 * 4.5; x < 100; x += 9) {
      g.beginPath();
      for (let k = 0; k < 4; k++) {
        const an = k * Math.PI / 2;
        g.moveTo(x, y);
        g.arc(x + Math.cos(an) * 0.7, y + Math.sin(an) * 0.7, 0.62, 0, TAU);
      }
      g.fill();
    }
    g.restore();
  }
  function mixHex(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16), ch = (p, s) => p >> s & 255;
    let o = 0;
    for (const s of [16, 8, 0]) o |= Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t) << s;
    return "#" + o.toString(16).padStart(6, "0");
  }
  function renderCrest(id, S3, style) {
    const k = S3 / 100, R = RIMS[style] || RIMS.forged, F = FILLS[style] || FILLS.forged;
    const big = S3 >= 96, mid = S3 >= 56, small = S3 < 76;
    const ops = (CHARGES[id] || CHARGES.swords)(), fld0 = FIELD[FIELD_OF[id]] || FIELD.navy;
    const fld = small ? [mixHex(fld0[0], "#ffffff", 0.08), mixHex(fld0[1], fld0[0], 0.42)] : fld0;
    const out = cv(S3), g = out.getContext("2d");
    g.lineJoin = "round";
    g.lineCap = "round";
    g.save();
    g.scale(k, k);
    g.save();
    g.shadowColor = "rgba(0,4,16,0.62)";
    g.shadowBlur = 2.4 * k;
    g.shadowOffsetY = 1.1 * k;
    g.fillStyle = "#081222";
    g.fill(p2(SHIELD));
    g.restore();
    const rim = g.createLinearGradient(14, 2, 86, 98);
    for (const [o, c2] of R.rim) rim.addColorStop(o, small ? mixHex(c2, "#ffffff", 0.22) : c2);
    g.fillStyle = rim;
    g.fill(p2(SHIELD));
    if (big) {
      g.save();
      g.clip(p2(SHIELD));
      let s = 7 + id.length * 13;
      const rnd = () => (s = s * 16807 % 2147483647) / 2147483647;
      for (let i = 0; i < 70; i++) {
        const x = 8 + rnd() * 84, y = 3 + rnd() * 95, r = 0.5 + rnd() * 1.1;
        g.fillStyle = rnd() < 0.5 ? "rgba(255,255,255,0.10)" : "rgba(0,8,24,0.12)";
        g.beginPath();
        g.ellipse(x, y, r * 1.4, r, rnd() * 3, 0, TAU);
        g.fill();
      }
      g.restore();
    }
    bevel(g, SHIELD, Math.max(0.9, 1.1 / k), R.hi, "rgba(3,10,28,0.55)");
    g.lineWidth = Math.max(0.7, 0.9 / k);
    g.strokeStyle = R.line;
    g.stroke(p2(SHIELD));
    g.save();
    g.clip(p2(SHIELD_IN));
    const fg = g.createRadialGradient(40, 28, 3, 50, 50, 64);
    fg.addColorStop(0, fld[0]);
    fg.addColorStop(1, fld[1]);
    g.fillStyle = fg;
    g.fillRect(0, 0, 100, 100);
    if (big) diaper(g);
    g.shadowColor = "rgba(0,3,12,0.95)";
    g.shadowBlur = 2.6 * k;
    g.shadowOffsetX = 0.5 * k;
    g.shadowOffsetY = 1.2 * k;
    g.lineWidth = 2.2;
    g.strokeStyle = "rgba(0,3,12,0.9)";
    g.stroke(p2(SHIELD_IN));
    g.restore();
    g.save();
    g.lineWidth = Math.max(0.5, 0.75 / k);
    g.strokeStyle = "rgba(2,8,20,0.85)";
    g.stroke(p2(SHIELD_IN));
    g.translate(0.45, 0.6);
    g.strokeStyle = "rgba(220,236,255,0.35)";
    g.clip(p2(SHIELD));
    g.stroke(p2(SHIELD_IN));
    g.restore();
    g.restore();
    const ch = cv(S3), c = ch.getContext("2d");
    c.lineJoin = "round";
    c.lineCap = "round";
    const cs = small ? 0.88 : 0.82;
    c.scale(k, k);
    c.clip(p2(SHIELD_IN));
    c.translate(50, small ? 53 : 53.5);
    c.scale(cs, cs);
    c.translate(-50, -50);
    drawOps(c, ops, F, S3 >= 160 ? 1.25 : S3 >= 80 ? 1.5 : 2.1);
    const sil = silhouette(ch, "#fff");
    g.save();
    g.scale(k, k);
    g.clip(p2(SHIELD_IN));
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.shadowColor = "rgba(0,3,12,0.8)";
    g.shadowBlur = 1.8 * k;
    g.shadowOffsetX = 0.7 * k;
    g.shadowOffsetY = 1.5 * k;
    g.drawImage(silhouette(ch, "rgba(0,3,12,0.9)"), 0, 0);
    g.restore();
    g.drawImage(ch, 0, 0);
    const b = Math.max(1, Math.round(0.8 * k));
    g.globalAlpha = small ? 0.45 : 0.8;
    g.drawImage(edgeBand(sil, b, b, R.hi), 0, 0);
    g.globalAlpha = small ? 0.3 : 0.55;
    g.drawImage(edgeBand(sil, -b, -b, R.lo), 0, 0);
    g.globalAlpha = 1;
    if (mid) {
      const sp = cv(S3), x = sp.getContext("2d");
      x.drawImage(sil, 0, 0);
      x.globalCompositeOperation = "source-in";
      const lg = x.createLinearGradient(0.18 * S3, 0.12 * S3, 0.78 * S3, 0.88 * S3);
      lg.addColorStop(0, "rgba(255,255,255,0.5)");
      lg.addColorStop(0.3, "rgba(255,255,255,0)");
      lg.addColorStop(0.58, "rgba(255,255,255,0)");
      lg.addColorStop(0.66, "rgba(255,255,255,0.16)");
      lg.addColorStop(0.74, "rgba(255,255,255,0)");
      x.fillStyle = lg;
      x.fillRect(0, 0, S3, S3);
      g.drawImage(sp, 0, 0);
    }
    g.save();
    g.scale(k, k);
    if (mid) for (const [x, y] of STUDS) stud(g, x, y, 1.45, R);
    sapphire(g, 50, 8.6, S3 >= 56 ? 3.1 : 3.6, R, big);
    if (big) {
      sparkle(g, 48.6, 7.3, 3.4, 0.9);
      sparkle(g, 19.5, 18, 2.6, 0.55);
    }
    g.restore();
    return out;
  }
  function drawCrest(g, id, cx, cy, size) {
    id = normEmblem(id);
    if (CREST_STYLE === "flat") return drawFlat(g, id, cx, cy, size);
    const t = g.getTransform ? g.getTransform() : null, sc = t ? Math.hypot(t.a, t.b) || 1 : 1;
    const S3 = Math.max(16, Math.min(1024, Math.round(size * sc))), key = id + "|" + S3 + "|" + CREST_STYLE;
    let c = CACHE.get(key);
    if (!c) {
      c = renderCrest(id, S3, CREST_STYLE);
      if (CACHE.size > 80) CACHE.delete(CACHE.keys().next().value);
      CACHE.set(key, c);
    }
    g.drawImage(c, cx - size / 2, cy - size / 2, size, size);
  }
  var URLS = /* @__PURE__ */ new Map();
  function crestURL(id, px = 64) {
    id = normEmblem(id);
    const k = id + "@" + px;
    let u = URLS.get(k);
    if (u) return u;
    const S3 = Math.round(px * 2), c = document.createElement("canvas");
    c.width = S3;
    c.height = S3;
    drawCrest(c.getContext("2d"), id, S3 / 2, S3 / 2, S3 * 0.98);
    u = c.toDataURL("image/png");
    URLS.set(k, u);
    return u;
  }
  function crestImg(id, px = 24, cls = "crest", style = "display:block") {
    return `<img class="${cls}" src="${crestURL(id, px)}" width="${px}" height="${px}" alt="" draggable="false" style="${style};object-fit:contain;pointer-events:none">`;
  }

  // src/portraits.js
  var PORTRAIT = {
    "spear": "data:image/webp;base64,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",
    "sword": "data:image/webp;base64,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",
    "guard": "data:image/webp;base64,UklGRhItAABXRUJQVlA4WAoAAAAQAAAAvwAAvwAAQUxQSLwZAAABDAZtG0ly+MPe/45AREyA112HK25pcGZ9oW7R4CTrC13K8qwF7rEXrexl90tdmx+0w15b/Mm0oRxHCDZa25a3jfVKcsrMPMwMZWZmOj1TZmZuTyltp5mUGULTpExhjsNxHIcTMzOjbFn6vve9rx+iT17pz7NWREyAL2ybTdu2beuLiFRqqey2bbu527Zt27Ztuw/btkd3b3brtnuvLZec4qK79xT5OiImwPx/8iJNTiwpYJasgZmZAgx08UnRhqUK0Dvk1F+8PP5fj95/zYYgDUrMYL27f/arGf6Zg6/esDLalEyAIT/xT+aqk+sPX5n0zFOjH98UbUShsDEHXP4VyFrrALye6vWrlq8sXPMTE25AecacNKsfsKT3EwP1W9ZvLKj9LBxpPBIyh3wDWEtqkVLDA90djfFbjDUcFfNsB7IiWHm9h6GNRuE9sGTqWl0mWL5sNsocv8ATGSo+NK4fZYBjfay5GLP/y31SO+HH+jq64o6Mncb0qjQVY/Z/ekVa4fd1d7e3R8nS+rFYQ4mYgwvxydD1tnZ0tHTbbFzntcVFG0nEHFKGT6bxtuaWhtYo2efdsSZi5tByfDJ1vU31NfVdXnYfPj9uiFjzMA4txyfjWGtNZVVTP9k6/6OZ/htS4zAWrsAn43hXXVl5fftwVnLulR9MahjGIuPxyTjeUVu2tbKpT1kl546fjzaKxKIT3Cdj29dctmVrVVuCYHPHR2ENwlhgvFdkrKGOmpLi8qZ+ZaJMvJOfM20OYfPrWiyf3/Y0lpeVVXf7pBddQ5lguRJrCuHQHxqxZDnUUltVXdU8REadUZSBU8ccKs1AIuHN+GTpddTVNDS19HnKAETmPueTmoGZj/DJUtGW+saW9t6EI4dy7y0r2gSMS7Bk63V3NLd19gx6OcH6b7AGoCwWdcrGDXR1NrX29A95ygkdv5wUnpj9EUu2w9297U0dvX2DcXJc+c6k6Fqc7z7ZKtrT29zc3dc36OUqd95fB4stYs5zPll7ff09Tc2d3b3DyhWW0r3DocjC4YObcdn5seHuxuaO9q5Y7rAsMuHIImY+PoH60b6uli6fEejzb6NxRcyT+ATuooOMRDl+g0YVMX+3VsGNWF//weL6HsvIdi4A0dJCYlJz2LCUmZz1fWetghuq87PDso9YTMk8gE9a55wV6a1TQLa80gvicSQmNQXYdCkHp/zurmPWP+TX77l7p/5SaOuw2aGZa4lFpPzTF2kT5aVLpl590Gp86iIn/HvQPVsFEKzvdxFS4hn8dG9dddnFZ68/cilLyZICS5/2uIMdGcpvzIMEpLISm8Ix7Zf75e2wQ/eAiAKoCbD+uEacspN1WVH50aR4lCU8KUn0/Ppvl4+dN+vAURsASQXQBGbPCWCz8uMJZVX7c90Sj3EnltS2h7TfW0WApACWZ8wNg/hZxfq7lI3XPgIL6Efy0wDyre3Utef/nbKygvHJUJ752wasMnO9LQ3RrDr5B2g4iT2wqUT96CEJd++4e37ysqUR5ZN5ZqcJYDOiva6mwWaT88cLoNEoiwyjFJb55ja8JOQs0PdA2OSFABSOiGEzaqtoiSkbfF40kR8bVJc4mwLnXW8+xk8C5HxY/FdjDEASh5fgZxLtJ0BHwygTiiZxPV4q0f7zUatxqQBZvKe3wwQgmb3zcUoXsOOiUCQa0Z1m4adS9Ps9fjNglQ4sFA4BA4iY7d4FpVBQllkmHA1idluDn4LOja+aB/AyQT75mgFMwISMua4VJQUv/69GoyFs9lyHJXlwycYHQoXYTMBmHz0cDGNCeWZMj8uNz7smhWPCZt/NsklDyxdvefeIDrmM8Mqr8/oxY0KR0K++weVEdO4hEo7JM3/HCtG3ZFExT15KNl7X/vRIIiFj9r0xP4pygeNKLB4SJ3sliK0rbLN64CNcFuDDa8bsetEbn5V55FDgtLGlEg+Jc9wX1GxuhaE34wRYOuaM3c54f0UXufQGAcuOpIAkcQFWlC1fHBOrGlA23sr3S2b+8qFWUHBiU32S/m4aEJJ4Ho+Fn46vRRtqslG8d7D5ul9NERKBi4EZRQDyVdCAIJmXcDOnTCqA6rW4LOzQl2e/5oEABaatc6YNA75fQQpJ8sy7mjZl8g8eXWtRFokf8uNgAQRxz2YgKYXoXps/sQGh/GofEhF55llWjv/vx/UML7CkVRIOsAIcdAz3tCuVrCXD1rIZnxQhrP/ElKDeYevU5Stb0MZokqy1pHUCBN60OW1b3lmHAxxFoyd/+0MTSpLXsrHYIb22CGHdiEfK4QQ4/+TgZ4AEsYKK5tX/Pdccbx1IvRMee+GVDZ7I2OdbGDGHzW+g10qkfeXPfzh30w+zs75P8kDp7KLFTNjBhP7sIRyzHn19Zh8ZSgLLUZKCMsYc+c+9HsVP8vXEqrNDq/VPTxmjc/XCjf0kdK7ZyVyOBfHty5+DMgCEZQdMaLdiMsY8hwW8Zm4CSfN1XZzbCt6/9aFKFW9qs0icGtre3IQPuPGvr8GReYv64+uitOfSmEaZW3AAah9a1epqWX971gWM+c2H3QiERPxnZpR5JUVs/EfNKBMR/6GotayHds+acyIRRcx5OCUx2DK8JsCs8w+56itACED07GHyzOf4iOYPpibIWJQ9P717CiyyxibzRXUxFlkn/KbB7xx5+68ff/0jh1hUpBa9e5s8Mx+LaBm/CWUi4l/dv6j9emz1NYa0iTm03SrnEED/kH963VHf55PWURcJhUKb8BF1P3RlU/HUg0sH/kDfxmuumUISZnvePYPzEoDzfeskEj4ZysauMGbHBqZ1Q2eRT8Yu9t0Nz2ycGWbBLUcsKSGBHn3Ime57bS3tUgIRpKNlr9DunTyeD/2tKBP5NU9e+8bWMaa1xhbrz07gf/UHWko3VTNrMwoCyySzQ2PDXeOGGRggY/XP/J/bxm29ycy3/iYbLYQEZV2yYm1l+dJFC/u6PhkMBsvppvj7+6dU49ksasdcfPfXBYea1TfeaMPZwwJjbEfFliX5RRTMQoE4lYSmPzd66ipLlvG5t176wNzp2+25/sYbrJ2IW+XATTVVhYsXdvBZIwoCy4uP3vzutBUtKBPR+eZV/3qi8FXz9802HrUYEhdmHu4qL1+WX2Cbv7TByOn26ybPWlVNlmWPXH3Xq2VXm6PWHbLBfKFJeI8ldRXr8+fVsLAIF4h6znn4y5mzulBGWnnf3f+ZXFO/suDmfddp6xcRlUAwdn1t9IS//26pF/u6BwVgmX7uy1MmL/BExvFFz479Zk4ngFu5o4mEIpFImnDYGBP+ERHt+cm0cc/+aX4lFfODkPOuvmzshxO7yGJ4+cRpK9bGZJ3P4OE/N8mRkDHhPGPMbr/dxUTiwNjkzdET/rswf4C5VSgrn6v3ueP1l7bgyDyxcUnR5noByJZG3zjo0mkXGpMXMcb87d8LNxScbJKEIWqPPT9m7Ip5W+mfnsjGJng976qnnv0SR5a2qriktJeUvmAQeG47Y35x50pAuNsgaRAoS78ydvzm/IU9bC5CmVjBGnPJYw+P7kbZ+DWVG4qHU8WtLLKO5dd8MwRYYcUpPWAaA8adbzxXUTi/yNl57Sidg6W373zCK//7dCkiq8r1+eUuVbIAC2CdAOR88kWLgJpEIDLnpIllxUvntdO+SOkcC0805sIV383vRWQ9uH7O7G6UQUpnrUhfuw8+ugaQpHwkTvtoU/nGhWsda8tQmk0HmlEnfwcgsk7ULp681onc5ud/9+d/PrxrG8yKJ9r736bi8qLFTcQX9iNA2JPMdqc/tMZZJ7L2G5Z9/fUgORpuXzz6hR962XLvocaYyDYOYyuKq8tWFCRoKEoz+Lu802+/vgpH1nLtC76aVIHIpaKV65Z/88WMLT70fXCsMaHCYcyKltZsya+DgmYElhU7nXLh0dcPoexonz7ui+VW5HSwekvBsoVT56wfdhZY/4TRwim/8asqKlcvjRJd4ad44/QLf/ObV3BkKaj5/J3P5w6Qm0RH9YZlU2cvLSobAFnBGVjZMPOxt7WqJL8UykoQjhUnHLzPb2ZiMxP4hR9/+NmCTkROo+Wl66ZP+mpVdVuUZM+VtlTKJqE9u9pKq9YtHsAVRhG4k8zexzfgMhG4ltnvT/huzQAC8BUY3XUlsz7Lr27pHXRJWPYllY2IeYCSyopl60TPRkRfYlZonwcQGfv1i8d/+MPaViFA3XFyOFi1Yl5RfV/C95TkNC6plC0UGbUxWlK1ZUEnlLfA2kWcsc9CbCaucdm3k2eXRQEBiXVNKKiER6J02Yw5K4o9XAqsH0gqG8YWPnn8xII14G3x/W8n9606qQ99juEtixYuLRsGBDBcuNkncOs0UFtcVVy0Pkpap5Y9TSiyTcP4bmf0hPLFDdDa0Drph3neYpGhrVyzubITJJLV0UFuvbayqtL1LcMuDZZx+44y23aVZf2lcVUblnlSzcwv839oJaNEZ0/UI9O2NhScgMaVqzeUdTbWJ9Igerc+GAmXDONSH19ZtawWedNmrV7b7jLKVrRObkSBAeps8+Xi7Z1+OgQ8ZFLJRPreeL+0unh5DNZMLygeIIeio2AgJ4ptbiF7+a44LCXDOMqbyqrXFfls/n5DcbtyAI4c2+Z+ZQfOnY2VTJT/qbGycslaNn+xYmlhH8oBys1QczfYWJKUwiKw3EIqGcbGxBtKiufXlHzw0adTynOT0+GqGZ8XlKyevbTdU3woVccA4PMOVjSMh92njf7vX49/4plHn1+JC87ZXMTLpk1e2TD7tXfnVnYN9A6T0o8BlmmlE5nllOd8+uNPbbXn/1511+JcSLmwXXXdDM0f/+XW4aG4SCmSLd9oV9k+aVvPnP7spmbPMy6fnhMCFyldyTdT5pevmd+HktywSzUXtHCSlNPcdzTGHDUtFzm0DhDxFRPefuvfL3wTTYVIPfiXA7CygSTW/t5PLhxzxg4zsSNMCZFSbsvk1x+95YYX1hLkiVjhQGC+6z+5cNRT+CNsqNmlKfvqzXvOveD68e0oq6qulhEtHWoYY3Z5ZsT5PUoVX/Te7T8LX/xNOyL7ym8lFQ8kkrfTDi8Fp6DSitrvXjp511++1o0IsM5T+pDyYcKRyOvB5VzVM58++o93r/dFkNk/mCcGY04tlgtqKJYjOvPvOeb2pY6Ac702Wj4x+7/pEMGKpX0oN0Prp0za6lBAtW+IFU9ku7U4R7Ci/V0cuVWsJyoCzz48AnbvtSJgx4J1Octt9g+XRwPYu5fAiH4hMSJdYM/3IsVT/upE8L2MQNftx2r7s3FK6vivRCl+sjNxwS2JjQBXv6mtozKrfi+pyueTyqf8MzDRc0ChXM7iNQ3tjV3KQtXWgte+OVY6oe/KGTloMleTu6H2QRezZCyK810Usr8yL1o64zwPXgzsHV6Dy1W015KliN/8jj+c9IgIhVdW9I8Gc2D/aG7LRSyuuO8PDCsbx6ZR7yHk1T5Y+VZ63nPoOMf8rgMF5bq7eru8eH+CbC1fmdHVSVOXQksncvjblQAXjM8dZt8vcUHh9dVVDRL3AvhP5P/eEM6/oxRfdImfe8IpTlCfmN2edgoMNZV0Y20AL29/9TScy0eIFQ9lzr9C4dZl8UAs8w/+6XwcxGNp8ucj3hrDKoAHD32hEsfMPQgAZeHR+X94eYkf0LqTLqyRA5QmawdyWcGJ+42O43h/zRBkgT5zgxmPC0Ki7Zab1mBJKcWt7YhlEaijeNShn+DEuGXRCIzfvLPTl/KDQPRdcek7faSvGmTlRudcOs9XED5jzD8nWom/9CMBIBz+/SercQElTjvhuhdqEGCbmz/bNFDeQWpJGugkSMe54fPnDUHf5BFiMfyjLN4LKAAc9x944nEfYEHRwhlvPb1k6rfVC7cmJbthBSD69zpobB+i+pfbIRGg2z2K8wUKQBRe9KefPmgdaMgjOR7f+H9vbezoaygraxeArJIk5xxgyTf7LsA5lv3hsoWRCAiZ0+Mw0E/GUpLfWz/1tTFTehEQl5MEDFd1e7Zry4wvvltcHxWAs6QUSnClOarfWexrj37n4KQhmDxz1FQGpy3ys5OXiHvWkaUjvddeX1+7an7pMBDrr9laC/CVybvaA1qv+9k9h85GkghQ2PyeI9+wyiBYz6VAEsj5PslD6za3vX3Jnw7YxRgzkep7jDFm9+N/oOywf718zWG/MsaEfwQwgxG9CshZz6bw0wCyFlD5hDemNal9sOGbY3c64M/HXTLWLX/90/HvPHTZ7xey4GCz855/q/z1HsaEfwRQW/9OgrVt1TWtXor0cg6gee71Z/50x7w9Tn+0E7y+GAySvjvGQPOKGZNmE+1ae7YZlRcObetE5t7+86jDuaxcf9+QJWMXA/qm33Xk/iGz009Pe21eC0gAjfc+Mb7b+r7vW9ILaDjAGGMieSol+9Q/LxagLLJNCC/etXr0CcaYHU++d3o7gASSz5g8c0GpFYAEsta3SJaer289fEdjIEnJpCt8uDfjlmqh4KT2OE1vXHHuqX/548OzKkm2VqSUen/6iwktlgAFUPvJdasnSFouCJstK80/aEKBJTuvt+LOPz+0EZC1EullqVjflXDWupRSOmStAH/6mDlBTQo22z/OzD3nC2xwFrw59z2wFmQdGUoE66yTSO186+7PX7oikKRQie9/+KP2XL1/8JwCcqAF1965SOBIL4nknpbmgdbVs757d1pB/obNRSVdCVI660Rq54M//aLtjYmEt1GXe94IzAvYJEnOKROHXfzQffkOHGklANs6sGD0fXfc/sS4yWMeuOHSR9/892sv3Hrn/U+9NbWoPQEg65LA+YnNPVvvP8iYUGQbJDrbn/3Bdf546y4dvm8d2TpY9drz831wpJXAH+rdMOf9sTOXTJuxYlXpgJw0jDyvrbhw+ntjn7nvjhc+X9EMyCqJZdf96w36P/qjMeHyoMw+4e2XnRndJPu9dRuXNyqVwx/7eIEFJ1ILaK+d/eabk2dsaewl6OGaGa/cesEN4yoBWTnyDzrsmSqwy84xJU4Mr9/rxKmfMe75J4856+7LzzhnbD8CHI3PjC73cCKlALo2zZwwfdWGDgCXUkgSILlkAbia7x4497qJFYDzePvBKRXygWklInGvD/ZHu2bed8Mr782v7ImT2rHxrvcqYoj0zvUseG9yXTQGIImgJesABpeNvfOx71sBesuiSNZRJJE5VvuX2shQLgWz7/qyzJJeQ1GavvhiQwyQE7mWsw6g+P3b7/u0h/S2SCjLOH0rhLW+dRLJGp783PQK3n+uNZ6KxNR3a5tiIDFS5awgtvjqo59pBSuAMoks9P+7qb2/WiKtRE9VZRnLf7bbKf0oqX9rybIqECNcFqh65PgnG8BpWwX0mAcnzcjHpRFpvzLmCSxCAy3tHkhOIwzkHHT++7Jnq8CqVELE/J3UcnJsbMcJOS4/qXpWo/AbYwInkHyNMEAW/K9ufb8dSoWEQ39I9MaBGMDGd4viACJa/uaDPr1dcRCpreePOJAF1n38Rl2xMKHQX/deDj1FVQVeyzszXqmVSCmfnupBMrfOjTjACt47omAmbP7W74jGPvrzKa9++8zX3Y5kOeistWTtpJEHDvoKFopsX4kDrTn1rKlPjamOk9Z2DTiUVaYaSWApWJ45F4EcH3z+yt2FPaS1HZ3kdoShckXMc61xwDF33JtXTmt0abzEMLmUT0qNHIpl5lgQODZ/8uHZ7xcPk7bHI7cOOQD92IntUCYfRM2U/x7/eEEnaX1ybH1krYjj9ONmfIQFxw+vzDniotnVSiElcuZ7gPU492mwuXLbNGMrfEB24vyTf/Xpujhp44zQoX3N7d34ypFNbLtE5n3BORCtm+42T+R3k9JuamGEyjv+QHPYMmRzgmID3rbK+Lb7IKKLvt7td5+Wkraw2rkRITpu6hi7l3kWrHIBiZ7+bZTKWu9KOC2ae4m5ccEASjEEzrcaAU6L74Gux/P+tBpsTmCgo0wRc4nnEJVfvr/dga+WIlLGJXB+QjmzjJv48XSovyp8fxyrnGCLFArtWIdDsa/nn2TO+XYglRyp/URcOVLs3oGvx8mDRb88bC7YnFCkiLkKi1g64428PR7biEhOpIPEsJcTy+zwYw4hi//Mrld1YfXjEgptt0lWdH+/6AhzzISBVBIZ+74NREryuc+Yn05AwkLV2Qd+Cv6PSp65DovYuuK50I63rESkIEtZ64IS8YPNKGOudZLkw/e/OKce1YGETZEsxNYt+pX57RvtaQKUc8oqpWWGCYd3DN1SEwMnZ0k89bOX8SpHETFnyiHaKh82oy6Z68ihnFNmziU5nWLyzL6HN7l4azM4LKw5+8h/uddBhPOWYcF1rjg4dPAztSgHIOlzCcCyNRIO7T3qKkHvF1/0I+d63yqbuOTJg16FEDGHI8CP3mVCJ37jkeusDJTmELpkjSEfYIGFH60Cj+mX0H3XUfmgH4UzcCAK9w7tdm8JytXndgAuT2kL9Oxfj0MivuDd9VCyxkLhpU/GUPlC5pAhhHjYmN9+MjSilGT9LGyh7tZpCMBBw7iZAyD58ProZuXimZApxIrWw0Pm1HzECJd7bS5lv7Hb/UguCRxsmrZWCCcGaoY9gLx1OOLTdjLhG2pHklOS5Uxa8N6fJ6MUDjm8aV90A1hQ+UJmv0HkBp80ZueXhlM4OxKGEgBODf1q7PDii55e4KBlS5sDJMoXNr9MILWeYswhUxEj1irJ8i8MZt3hNRcgupeR7KC/NSayT2gbFDKjKrEU7m/MEWW4kZPSsSqsCF0XeU2y4ufPRICEHXQBeBZWUDggMBMAANBPAJ0BKsAAwAA+bTCTRyQioaEqN0rYgA2JZG7hdKD52P0aHvvaecrXv77+s3EPnd7oM4/oa/RvsAfrr0q/MH+zv7ge776L/7h/rPYI/tP+Z6yH0B/259Oj90Pg2/tn/g/cv4Bv2V//PWAf+7icP8N9Evyc8iP0viH5bvmExWm/xu8J+Ad7W8zmHvox6Bftz944qvsLy2/hQeZewB+dvVj/wvIZ+f/6H9ofgC/ln9g/X32w/Y3+2PsPfrYdb04vjMxYIefxxgaekBGSdxW0SN14q7DRa52orGUCs6FvnvGMUZkpd7PjoeziS67E+SWSUPuMncdgvigWoETu+Ua4S6x1IRsyjK4SM2aHnCAtE0cAz840/65HvYNjCiBo0W1vkB84KePuXpSCfDNjRl3+mbQlfGNppDFshb8N56gUHGia05VPLrQR4BSsBG3mENpPFI86vPkBGX1eUWhiVDRTT2GHI0j6x4VsJCIUN9r4TGAut+kYgHb3FbQXs4viY1yzqQ3YhCx9v7z5iqD9dOV3l2BkTCsLXWTvqgmj3Vu/BjIIfWyizPmY28CbEmH9s75AYzwkv+1t00gq3QD/SSCbaE2a3s99Q5AU6iW2GBKPEjX8LRDwWqZjMRUupEYkEjP7uY2b51fcSocvzyWugR0c5AjekK0sJLzdKNzSfTHB1Y5+utXshEfAvjmMdD1UIPL7i33tWjq+MzI5czjWsy708kOR/Ht4AF1gdum9raSIIdZqjwQ482zA7IP/FpsiOB2OhLeUasFAKxyswWZUP99nIBWcTEN9QsqQ+56Blaw7ge+xl+ftxTdmKuIcG2b82EY4/KmOkJAPgPnm8zYti88Z0FkYjHfOjQwAAP7/u7BZ2MTXzAJONlHm00TpEMQJGCJlRP/1kHaps/s8NRhaxi8rRmEhmGAGeJ8V2uiU0emuyvRf2zM4RN/+Xm+8dIFyZHyejykA5R+Cf912lVvGaO+sdQX/hgKTSaHpPw4RtnVrZcWEQOQLDcalsTfjb4dUgA12KQjbresDHkMYQAF9vgaW3aJo1e/0Doj/CDIkju/Gxjri7vc5za/AsFyLo0+zmz4ky4B9RMW981yCbPTK9fwEzrJG7EgtbbYjjly+gvoj4F1PVVz4HuHjLsHjf2Q3AFUF9u5tNdZkHwJXahWO8tyUwh+T6oBWY3L3UkREAuQtyBYtvwT3krIaE3PsDzXYiw2vHTHX5vcgW0sa1vcmdvdo74Hj7eXHfARdU34V8vGcrhfZIvlpWxCMCet/tQj2KNKH91rcN6CRwFNFRQUSMfqXykNdoUhZUkJAliI9rJ8+aXs/UYwkkucnheZ2Ao8FQG2iz//CEzbXoHcJ6YMUwnPkUk/iL86b2QFGil3Og3YWmKrvWMBtPiS5PFch7R7DpZ59Q6SOSBo3N4OOSkqmdEjJ5pzIqDrpIoC9TkaADwjyYOACZVXomAXQnPCK0XqCUcB3A0NTaHA9C4Yj/HITnP8Y6vNVIoxHn8FhUOONOBhF3F8fI49r4/ENgoJN/CyGqmkScIvaSPCDD9295yv45YvdBifvRoxzZoLwj4FLDM9Zvz6xvR30hXM95jzdd+8zrhpQ3PNrBdJPbLisMovJEiqbb7uxYJN1QaF//kMecYZmrIZmFEncBDOYppDNN+GewWG80XB0YZD7jNmLg8seimQFKh41qzLq0+TAA/6picKTX5GABovoSveJSUtSE/wSKCRlJm8i0rgpl+NcGCiWpbi0u4ZtQ0BlkpZ/4s03QxacmH3dnZpDw0HM4qVTKv8P+5QDhVr2X7S3/ezG/DLe4WKDMisRRzUnObvl2sbzg+O4eKLgnOlZoNcVUfASfslZzeKZPwLH+hbKdKgFHZM2rALEmZGyXYWhnplM/C86DBNKZ93aCo99e43TK7RE91EyMCTKyXcZzKT2e5jHry0mm/j0OvOZ5GtY/T4yLU4U6I2xurlZikfy+VIAPI5V5X/gs6mKCmnVbCCb515q5nqJhcjQWWktAyPMEZBV2KJra9x+dho+wnrak7Yge9cWVmBUUg73kFEUUhPAzmFDgINVH/5p3Vq3hN6nLmJZycQSYSHAxpEvLDMzLeao/XiMl+9GsIsUHV52UcRg+qZfZNpVQTnjJf2c/Iz0whEXOBm/cZrgRWkuWMLIk/ELUf3ctGhtll9PAY/kb5QhOvSlshX9B/zSS9eeeK/itBR0WMDjfT33hD7b1GmeRWD+KyLcfacXKu/GnKTXa7j48n1Hi8C1p80r9dRRHlPlhjk/o3qXkRSfi068yJu7wYUw2kN7AxYfVcYxne7ZBWjIGFRQFMHlqurElVsb/kVC6drfQ5SKRy8hfwPnMMIbgfl219gdZx9XAvaRbpeQlLzDwGXJ+PdPII3H6BiKJYRsLDMJta0TI3WQjE3417y08SwlQdS7fVDHDF1eBye/4cjGSBV5FDYaljrBJS0xBgjxtKtrF0FaHwB4lHN0sa+ppzhbTUyJLrdSFKWxR3WT5LOw35L5N4nJIAIIKzfT8v17gBwSLjjt3YrFcHPxPfA14qpjM4ECgHTKAHmC1tKT68J+F1/4BCa8qSLaqsan6WAVzbjHGzvIMAqbyCQUmP5Y11zE8MILPjdny8f3TECYRyKATHzaHXwXDIerRMfZFor43z15VcmaFElK2qFo2djzCUPgap3Sv0CiiPDMTw9oqgyGT+QQj5GnnumXbh/D+ro7DBHJEbw5tBjBOdQJF6kZmweg+HiGgHaOzSmJd7p/ED1WHgHhns7R8bpEN8mC0Hkk8O/XVzxqdx4gOQI5/eseoAhTGFkHawwGxHMYSYN6PhRbnSxH8s7rFjwvQN7xgWK2nQtEEK0ggV3CAd+Iy9xsYf6SqgGrL5x7E/ORoEm4DqjduuUyhbnL0Tfdnn3ibs/KjIh1N+VjTsWb0l31dXTBeYqDTUBolAzoNFDFKypOQqSaGNzVJAbGjeCFExFCEKYGUWAbd3mKhrBpbEL2Nuxa+9V1PucSMzwuqePR18iT6u+G6k0G60N7p9B5a7WfdoYn3d9cC7w4Imu5oPZvJr1Vof7B08dRsHE1GYG7boKCW6EzyXFZmmrPcVQub1KNLf2hoOjBqKO/EkqCDRw/2s8CF9sOd2ZJO7fdeFSeju2OWyBsn94UMWrv1hHj7teJHNemb5iirhzA58v/GJ2wCw2/gcBLczpJen0jEiJAKb+An9vch0R368DdXjqGk4+0dBQDJspBPGT0GJHntGQaJLsAFdlzKI+XFtRQCJy7lFBu+YmudyNSbc9yZ1mu/KSgBhdJxKBn3XsCj+QCaQIBNSHEsDtqC7TJ7/0s4IP4KEEWGe6JsOlScHYj3nQ8xVMqRpyKappG1nd+nHBUr6Zu8Z5j3qnuxpRRxvhwoFkiBoWwrsQJAlvYT5KTse3r8bytEb3rOtoXPsOKcnObhKjQsA0Lq6zJVCxps83aRdVWysE2KKHf8oYi8+OTcAQYQEQcp41TKMBCdJOOF9h8vpm+cd8WUvlzGj4T+YG5+noCN7vQAzaukU6LEaB9FBqqhFp4RmD0kCrDOUx/fehugGJb/7u7gu26IKB0/aeCFz5a3RXLEDE7zKaLBu3yNcwKAZn3PfFJYr0vk7GjD2WUK2mmd5Xmu7yQdg4K+XLsDAATA9/KPI0/PrPYwSkWPzPYC4T7toZx8JXeU/45jvLFQFDwuH8oqEJvfd//H9lc7qg6ExmgeDlLfIIvnVr4sVIbwXBT/B8AQu5Xjs6eXMDA9+cYoeq3eRSY1mt/eBh4Yozk6nQL7iqox7t9tCdHyoufGejWZDSBk+ORpNMWdwNhZK6Oi5atTyw/FV/vw++V96mNGpAloEqaUXOp90xq4a+OK4S09Qt78ztMsgrtlWChjY+m5uZfk6m0jpK7e+9mgMkl8lQvsBKgQfMKP2S/pbJ+EI0griWlncZjy1aZKGi9x7soUdTk80waByRLOHALxTgEd0KhOfuMX5/K7K4gmR5QMMZAEJ9lJTE7d2uJHGOGckfAUsxvBHpgz+/WQdBFCPCU3NQ9wed5AmrJuwB2lPGcOgkwY7k/AzBAyGu2zmmsUr5Z9Nz0NYf63m8q2RZMxRI/N/yKierR+tyfi7zj7WG1CXHJaExnW8fZDTM8eRe3wRdPq1t/6cEUfD/F4MqNPY0AOlcWuhy3Z9lp+BFShXecGHkYVfShHMMmIgrlTZMRDDDNcudc0rphqbHTeXZYSXCkw8c5XHT1bfpMIQig3WGz6KowcTFH+XtWoRzTR/sDYX3AWrf9HpU8LmC4We/3y4X9hILXjAx+rfRUrT5FfIiQ9q/c2w/fUCMes4ESo92HiG3BAJZY9wJfU6uuDZTlsLC5ci1BhE51+iHgNwGkqO29P6TDfhuGgXGAlfApZ/C7M/sb6klprmutpqAkq9ZhsaxAqzpxDCu7+9PxiOq9SDKPLyMZHOPOViBhBSgvNt1uZxP1LTiFKhu3gJGFY0qdlvRRfgC5sAeMXeuFAXHP3kqkVU0zK0tDoPtdBE56TKdt8PocIJ8uG+gilCqy1WsL9Z3ejDvCtIwLgB1wOsT8XP18/ykDtWzP4caSIvEi3kT/UYcUPRmUYCrpquaaNQx8TNttOnL6/Z1ebDgTnFjSjZokEsvErgmyAi+D0a6KzIJVzVUN5MgoF6Z5WAUujLRlBanAB8DgpL81/XJ/NL+8XlQ8VLv6J93AxW2RH/xv7NHLgzyHQh2KKnx+K3K6u4F7BcBTpoPGJCkI/mlaXLIPbYfZ26lRAChVya+nPoleaiwhyjYkKKSVX2y103q6ldmafPQuzvIFEeSV78QI3zcR2uJ63rZA3hnekzUozkillWLLxWBdoxm3k1gSLRZy3HUMpfQBSwu32615WkpB+ddIL9iGsTW3U+N2ahyI74Kcu+za3jUdLshnHTE22fIBkmu4bpxntEbfHat5k9wRPqZRHEx8rbWGfcuQ4x/fm1M5MJ7oBw3x8nQZB01ClLmdd8rcroFd3i65Tzg0mMmYwi0b58fFVdX9yeUMK7n0D10uX7NgxuBT4hPPSyd6y91S58Ida/H3zBr9zFzJ1gTeLdr0ipYxppTg5pHYwIxyzqfjqQ+8c3mBDKxizTmmEYkm6qP+a9C+NyKTSxF0QNfn9DSdRwstNo2AEk1c8F+B3VkWeoQ+1KerIXGmSgPR+GzKfm3CVSqTGWOkswWCpQONj/qk9NrNojIqOH7EvPN1K38gpmfY7D6TKXlbp9WoF2KGY3JG5mmSc6UQ835AY/Zi3T05pNtp1+cv9Ig0IFxp0GGA8BgLdO/KPYMPGIOCFB7szUglLFVGj+tIWQLwZ3FsjtDd8Ko/HmFp1gcFJ/aErzxcqeUbnZRqZAUeYWT/yJfUOplkkdr3GwcP3J3fDrbrdB/SeIBScsWj76NUxlyedmF+Q2FN7A9odPOZdLB3dlH+IFj0kxnHQPg7mVEgUpCMk4yv56B71lcUxcrvlq0Ogx0PyafxI+CWqf7zemwS9+sd9/xU/aEj9HOl90wkqr+20MaUJgGXjJZWow3qJSblVHnILMPdjqmpOdpA2HOqt05IaItr6gWDH4u/mlTsgb/GSNQ4CDsqTKQJabNaMYhGl5zs76yDEPoP01y7rfpc1ry9VOKUn5vUsWeXxnDQaLLngfknnJx5JeEhJX4LnXMSmC/JqVKOBnC5IvhdypS4a569OsoCNbAGIEinVfbOtuvRM9J9hxkFW2cvchLaa5u88CMEzBK2e0O6jTJDtxPJ8yjtQCAD/1a3Qk8JzUan5CNHg8qRQblWGpgozpqRndDPIrSpIpyVegBQOvl1XqgFV9BB6Si19itoscYiAsnWMNo/56cdKs2r97YnhlLy6Dj/l+H0TSwGibTsegNtN0oPPcFLfhZmYu7D2n/5049PQvFLpvwd8/5kYpmYwJY62coW2cDdFU5OsoJNkgW5w6frqoDwV9M7g3tH3aRGGimfHJXYJgbR8hBrJuzFla/pdGfdPNsimWETLVBim5jXA1v1O/tcbug9ex8Z95dLg/MdabxjvQaUgEKkYJq0U275yF6LuJ2A+txgivktQu5noeaUxyR3UOuq7wGjl2eWjjW8+x7N5TuY/nvX95tLa45uxgOKZ0rhp72ryRWdM7udLAIh0q88hMloZgsDL9ba57/5aoW8xoHr7lWGDXb+ugEM5O92kLXo1dz47/h6GigQNWV6/S44Mjdlk5DCJCPF0ITaodSI9/XT6LxelppMlPmxMbSxxZpx0gkhS5d7ebXGxVFxGpnXHfUSx9rjCv+7DvFq1dKXy7cNoSodLkqRs6YCktCKh1ghHOV6zvfi3fZ9zUXhs5KTshzfiR6RfDU3gs73/eV3LH8ufuJQFa+GSI3w5ShwsGylfA4lVW1PR/jqwoEve9QcbS+K3SvS0rpg3KUKtRh+cxVbUynWpnKqkjOGRJ7m3Nmw1d0UE0S7tcUdu/wY/t4MeGY2Vot2etPSsE7FzziDOHNZwSMwo+5i7PgaZBhgLVNCDMCg0y5TO2vCdMx+0dDQ8AcSUvzP6f5CZX+buCFYfA3K8FxsAAA=",
    "archer": "data:image/webp;base64,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",
    "cavalry": "data:image/webp;base64,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",
    "pegasus": "data:image/webp;base64,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",
    "baby": "data:image/webp;base64,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",
    "dragon": "data:image/webp;base64,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",
    "catapult": "data:image/webp;base64,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",
    "giant": "data:image/webp;base64,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",
    "imp": "data:image/webp;base64,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",
    "mage": "data:image/webp;base64,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",
    "ram": "data:image/webp;base64,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",
    "cannon": "data:image/webp;base64,UklGRu4YAABXRUJQVlA4WAoAAAAQAAAAvwAAvwAAQUxQSEsIAAABsEbbtqlJ0j73fKlyJcu2FdHuTpRt27Zt27Zt27btTpvxzj37R0R8Ed93331/KyImAH+ZVkIIQUSkmokqOhdVqViiCgDLtC6+SP++M88EAKpSnSQA6DPk3HemxymTx4z64dsXzhzcE4CqVKMADNr8mm/Yxc8v2LgfAA3VR2rodeoIkm7RO4zRzEn+fsc2swKqFScIWt4ko0V2MVok+fW5SwKiUmEU4dAJLJzd6mbkhDvXBiCVJWDF50hj90cj+dL+vRGqiQQcPIHmbKibk8/PCa0kNZxIGhtvBd+cF7UKUsMutMimLPj9qqhVDsWaU6OzSY2j/4daxVC0jmVk0xrHbwitFAHz/8rIJo4sdkFPVakKInO+TWNTG8cMBAANTSQipSUhPEFjk0e+e+nZO84GqDZJEAChrBS7sWDTO0l+ffqSgIRmCEDfWXpAyknCLN97bD5GMyMn3LwmoNKwgFUfGfnDJ0MQSklxNI2JRiP51D8AbZDigBkkOW0lhBIKsvAY91RIt8hply6A0JCAZaewjeSopYNK+SgupzFpI4fvgSCNCE+zjb8fuOWyABDKRrHC5Ohp0QvyZEjotoAFpzpfmgvAPKsOUkjJBDxOY/LReGkNobsU63obT0GPvqf8Gcd8uBpCqSjWYmQZGh+ZHdJNNezN6by81vsFtv+qv0iZBDxAKwUWfLmfavcojuF0XoJLOcMZI/+OUCKCeUbTy4FtvAsQVdWaapD6BrvxlR0YPbrTykWxDSPL0njtsqhTVEM7EdVZf2MknRxV0KcvWioBd9JKg84ZT26+90XH7bbhkKVmBQBVDWi/f2HubG+8XgLKUzBgJL08aOx82i8v3HboEgAQZlmwdZP9R9HZPvKLGlSlNBTbMLJM3aKZWXS2n3jpYRc/8M5PkyLrdP509rIAQlkE3EkrlTo9mhk7j9ZZ+2mPri3QchD0/YNeTh26mVmM7qzbjeQr/0KQMlBswcj8ujmLYwEthatZZIikkbfPjlp6AY/R8kQ3vrUMNDVBz88YM0UWHLU2NLn+I+nZorE4CJpWwLIzcsZIDoUmpVifkTk3/2GASEo17EnLGo13opaS4tzc0bgPNKk7suc+YQVoOiKvZI/GN3pJMoKenzPmjpGDoenIOxXA/Px0IHiRlr3IP/tD0nm8AjByO2gqintY5M/8CYR0bq4CzulLIyRzCS1/NO4JTeaUinBCQidUhAsT2r8SFLwzofXoFcD4HCQRwdxj6PmL/EghaUDwPC1/zv/PmYzi9GowIqX16PkzvqPJCOYeQ68Ad0CRquAFWgU4KSHF6V4FtklqfXrunNaSkGDgcI/ZG9UfkgwUJ9EyZ/5CEKQbZOBwj5njztCEoDiJlrXo380mklKQgcM95sy4HxRJK06mZSz6T7OJpBVk4PAY82U8C4rEFSexyJb75MUlpCZhzpdpuTLuB0Xygr5f0fIUeTYUEJG0oGgZy5ijyFd796ipAFCVlKAYMjl6hox7of3Mc/cAEFJCDdvRPD+Rh/xj15Nuevn78Z/cukMNkhJqOJG07JAzWOfrq0pISRRHTad5dkgzs+jRZvBuaEpAwGpPkjE37uy0iPelBgX2HE7PTL0Fr00OQbDACx5zZTwtPUgPPEXL1wEloFiLznztgFpyAQ/RsuVcC5pawNJT3XPlLFoRUlOcRWOePRYxLpZewKPZav/6LCKJCXp+wZinqd+89NieIQQkHrDARHqeRr188/FbLoPkFUPcmfEpl/QVSW0PWqY8mhl5JzS1C7LVobdxc2hSAY/kjeaf9hNJSND7K8as0XgINKk5/k/PnN+LkFSfrxnz5vyzLySl8F7u6FwLmhJey55xD9TSQcDDtOwdDU1IcQeL7J2Z2JW0zBW8PrEzK8AtiZ2YPeOliQ2jZ+/spAR9vmPM3SFJQXGtF7nbL7UtGJvDzaJ3XirOddISDBxOb4oueok4Rw+ApISAe92awDn2soe/HFt47JAlanwrSFoqu7AZzO8Aeg1aqbWlpaWltfUFxtIo/FookhbMN9pj4yI31x6oc+U28/piQpH7pgbF0bSGRf9+dhGR0HEP3MO2uiLTdY5fBCExCTN9QmuUcVco6gxhia/Y5p248evJyZjfh4DUAwZb9MYYH0OQehAw9/tktPaRfHahX+hNEP3lzbxLkduIJgfFhbSGRB++sATUr+h3wwh2PP6S3nifsQkKXo/PGeuL/kdfSHoS5vg+WiOMW0LR1QAM3OyAfY4+5YRN5oOE22mNc5/w33AOi/qMB0BRgootyNh9bbwWiq6LovNQwxaMjTO/E1jFzeuJ/u2sImWAgL2msOgmN37eN0g3AKIdBwh6fu2xYZEbSQ1nss07c+P6UJRjwD8/p3l3ROdjc0HQaMXJtEZFfjurhNDrZbqZuZPReCICyrKGvveQZuZ1uRW0k4CAhgfMN5beGI/cAIqA+Z6cwfbm5ElQlKcCx40nyWgdFmZO8vc1EQKaMOAWt8YYH0UQQIDlDr32lZGR/GJfBCkRiGD+LS54dSzrHfHU6fMiCJpR5X/0hngcs4gEABABgAEt2w3rBUHJBgCYf/099jv61EuuuPOWwwYPABDQpNLrA7dGFDwUio6DKjpUlG5QRRdFBc2q2JaFd1/Bd/sE6aS9BFVBOQetaeeCZg44mdZtkZP/iYCqG3Axi24yjh0CReUVxe00M++acfR/oajAEvo8QJJWmNdV8JdVoajEgjDszFenk6SbRScZLfLNBVBDRRYAWHr3q18ZxfbRSPLpOaGozKKK9oOGHXLbJ5NIfnjGvwQB1Tqoon1twQ0O/o8CEFRwUVV0qEFQ1SWoquAv//9lZABWUDggfBAAANBHAJ0BKsAAwAA+bTCUR6QioiEqcmq4gA2JTd+PkxTcsMXoF+s83K3dqEPBbj9H39p3ZXmL/Zb9qvd3/5P7Ve73+veoV/XP9B1nP7oew7/AP7X6cf7mfCl/aP91+3vwFfsj//+sA4EDt5/1HhP5Pfnmgrlz698KuAngHPV+W3oF2m2s94W19Tz/2CPz5/1fV+0RPWXsDfy7+xda79kvYm/YA627yH4a2k+ML1pfkWGG3Vkgv4BQU0olB7+iMGA2+FAkjZqo5dUwq40ymb+JS3MVKcuKOfd+n+JVQ1GKpmsAD+x2lyvuOXzzj91b4X1g1ckNhc3LsuNIKj4XSKNIV2qGPLoDkVnfAPbDy+41EtXCtRnV7CNDGBwfzlDXcQx2vtbM5p6hR9bkX//5FHhJTi9NFPhALH4TowRJdLchDShOFqc0/b/Ta7enD8nUuXef/u8ujkga9AlxVSEWFCFJRUS2x9d+wVeotE4TdAVvW6eJAhplFZTqv0SVibpb3Drv64yihBFd/PlzevB2O1Imt58pJcC6UPlthuOyKL32eIqV8M6ZqZtiF34QhXzm88EX0XGkgQraqwesWKJ17Bt1efCggGPdmZC4zYgGtxvaOdmxK27Q+1pEWl31xKoUGYJCHNaDmOeG9RlFb6Yg51HVzkNl3DQoBtfUNcKLhD1rhwWq1ap+sgRrgsJHVYgS57KV1nRjC+VUBilFfn0ZqJfFmMffVSqBTUX+HJsdBlawtsj8vwQn7ITVvkSL7hXl6/SbkSL7hXkv6AAA/v9SjApPeRVlDcswB+FASERX/GL8CCu7husS4WwUuSdRfRfPlA47EP9zz1NaakHuQSDqvQvsbh70e8GCWgBdRO7V/lBx7NTPEez7pSMn7/bwdhtIF/vhOJWKIQN/df7qHBxW/IWCyC91MWnpX1YEUxN955JJfgFcRWPc59YA2pJZB35ifwKMMVUhuOC8XRKe9TQ/JJs1F/k2Fycruf8lNNiKqqhGn3lvqAJWippk9eLgz5PMddA9T5HPzBZjl5MoPdTixa6+EZDX5/xKOohOA/0+SuYdm6cpLJbdGYpewX9xkgKwp5WoNGjscXQRIwfe/Va3FyE4gpxMZfAp/ucD77n2LH12Nj9Fkm17CsZYybjg016F+Qj8o1Hbb9bAp4b/6yWUq5LtWQ7fy2bbtIdXj/zFLbMXnU32pBnWisPkCdp2uDOZ8oPtjJV3Rpq84b/nPBqDuMcQ3YxxXrExx3kKUbRisFI744uqPQKLEh+WhK+kQQb6QsOwkeRifsyOxdWM3Xzg1fedZPaVSHCpMRNVR4gP8KPXDKtLyMwHfHoKGjmSwiuK9bCJQgNyUmLEe4g1ut1bGaSWnqGdd2NeFcSh7HoM9sogCjoBZ4b9+RoyIkXIA+sPxB/KJBhfiIowEIFL374G5EyLluO4mD+TiUOCY1yoC6ZxsAiVVIZOtSH3cGpC78A1hML/YXN3ZIyCdZ6GxRKFaLfSzBPr+8TE9ITwvQp84ue80bJdmcl4/TaCgBtuEi0cZ6fMGFzWRFKZUlob7mupWYIUvJbEvCgF4snhrGS44r+3dpbPH/n4xeF44w3fLVameuSvvhuPorjQQKl4JJvJh/jvn5Eb8AsdLEHZ+3O3/gxJTkLPxhbVlrOvz4W/QRrQMAwp6eBoqU3W1wYudJGL7xQkbXLMnoz5VdAf5jngXKsmdLdUtiLHbMNniqCRBvUPO7lMBZgkum49gaIHmXVz76Eq7s18FjL4nsp0G9e0xDNT5JEQLQIvbKH7MRDknjJ68XBnrQsv3mATLwGTzpvdS3zO03CkndGJQAfIIydKpQl+Vyu/5s5ckt27IqC0WC/u2WUH2tlRX+ysLBm6rqrxZJuOK4P7Cr58O8c4dQd8V1aLMmB0r+Ah3LFY+lzUjx9YEkJP6alaPhHGrujtTT+21h2LCiQR6L9zhKV+9zeznmgScLrrsQTdhCeoinIStN+7pR9lg26R9SZ4zGO7bfTIYSglpdcsuFlXJTg9P/Cjx/nF8hQLjqFjYLUW7AZzOzofy3hQTsVJVOpRo3qxNTbQNLXQPnvVBFMoymB6zNuO32ZYgMBTM2MJ1bNWTly/eNlxAFRIDI/60N9BzxUuQ7pB1gsMrw5/6eoPGTMBHsChG+murhluYFvJXz6NlRB+IrWWdUu+RazYN0QquANA0Pa87wRBBQvEh5+THUqStO/fe6tQHTi29ACvmKxAV/80+nIb6b+N+wupSnPGMuo7ZkDM1f7RG1zhQMl+yf6vMvoJNFa1q7ZMY+m1JfLhxXWy12f7uvQgpdkHG6AmOmemePNimlMGe540IqQfXpx8BoQchzNZbI5uO0dTgWcusCiX5qf9LohkYDa6C0wQi5CRjFP0hK2E6w1BOXv5Bx+GufoftfAqHOoUliUXV8pM1rX/aDYkBCbTNGYmlEX0lCCpfi+iNDn1lWxrIk5WgAaXtR+OwLt4tqEgXn7gvD2ZmKIwY0eBConbGZCil+A8L1e8veGXHNCZIwwDMOX+96UQk7qDAqkP1uhret/CkNYeUDgn7jZRfOHZeSdAqzQMD+8qYt7+eSVCDLS1enfXc4rk2A15DLyVEBCONv9DIQ8suxHxQXKzqNKzj1jEZiSvKH8gH/pguSby2AaOKruHFXd7Bjt+EfaRSuTf/6sPw0jR2TAjn69YvpGhTHt76W1Jv9sfiKtEHqXZDdF83TEu6Y9mvYbgHJrH3JLQ4my0VMgdASbPPk7XuKxKKHSpLO/5rNqJp/Ee5JLxbVwCXPLOW3UpIU9w7Sef+xmZPQeLsNZCc0w34EUlvQ8MF5u5y6T82Wt/4t2w7n6u6cyCBRwM7InxW+rdbUN4di60bACItADVsU2OCyFr6GPDKJl4tWEewjJApQnOfid9jsHzj0iNON51bWywQ7YB9+T0rs9vU5UY78TR1URHegpUuTE6YE4LbUdsG0tXQr2EQvedM+NIqZsC7pjhMbdKI9UWPFklM9oqDUIvcmoBm9duMAe9fmjOgAGN4ZgOn1jRbRe9SJ4b7Qf7ruUa8Wqttnd2+Bi9KM7f0NmwolZ/Vq5zuvmHZ+XSmr6Vw4DCIiZwzhTbuS43WlMDA4KYReQbdNm6ggxhAd7cmC4yU9sy8hEwY9n8z+h7nfAmqOQoiToaiLRQ67ylrKeg8LBR7yf9EaMl5brdb5AwMTtCW54dykOlWjDdjyx4UMq2ch7OHwXbbEzjJv3tcK1Xjt0EglTGipT1SE0e3WcO9+v9WB+B9xQq9nuti4IM4FCjSq1b2U2Vu5K2UNufg8sCkGMp7fMbHhY0L+l+U4oscyBFIm9kdux1Z6uRUoaSWbp7y33O8vBLb7uAS+Me2/VnRSgtQnsYLGcnXMelJI6OoCgeX5EJ9Gx3EDXPJrOI8sGoG2tRZ5tJfm5xoZrioFLBIVKxFRxq2eP91x/7MWW/yIv+gr2Vcw2/9czyLKMNmWWGO3HSHjH5J6BQCDmyLX56kbMd9LA03WZKmE2l1O+SgfqKDY5foSsXyZFFN53EHJR1Sooz3/gN7Kak2OktgUUNQtqDnq2Jlz2+IaJSJc5vSe1Ml18du1rY3tGQ/pqN9OLioXCKwL0Ktkcfm9kYWwcVsCBN5BziuO/jPgm6mxZwjrmRzh3+ZsHo6RFyRUP7cTKyBXp+YpmloZLk+yAzlT8n72HNW7I0GciPIFsiAvsNzakuPhZT29iGO34qzMZcoaDCQvgXo9XUyhBYe4UWs6Ht7oFWYm41cV3mWxB6mPbraN+Xzu52IvLSAVfjgW2BFL2Ys1Eaoy+vqwQLAyrt3hfQch8dGsU2jsMoY5xOB5wEQOW8sD5ekJtZupSpHyVyNYo1BLl+prDiVJKx2Y9YXDlnElVUVSQdQpaziAx6HcR2w10uXlyDNE1f+bbT8NE/JPlVJQ4LLzkGc8qPEqv24yD/UBRxExCF2kz8Vq5PuwPlLyzjc37Tl8km1ZIMNT6Jhq0OHMmZ47b7bWjc02N1rfto1MV5htZNeGCZziHrjfep5bqDO9GxuTULl/QBIwuB/lgfgoJlmegYBc0vtLDYSxF+8Q00a8Dnionk1mkxXx42ykhaWeKfClXSiM54amK/eo6IIHAN6mlrV8LGtSwGOQxJz1fpk/7j5/wS7PjwbE/9McCruhjmetCFeUJ6CpnmwVnQPj0WkdJkKOp2zxpNafB7WWMka+IsB5vQMTnti7NBGWZJW/xuiKups6HQIqupA9o7JAYhQyKoQQIxpWT8czq3vJn9G9/tdgOl3cJNP5e05TEkac7f1UTd9oUGUG4vI2h8gt6PVEHWm8AjAA2A16jD/rHd4t3u0rM1Sw094VYuwn8LYOQ9jys0LvkGn2O0w+0oGk/RKl8a3CJ71RdP3WeYVKU1QMig+ljw2EdAGNifbbCLeU5XlIAZmPyuKkKMIY4F39LWfhAWwoBRdeQuHdalUw/5Yu4SnpAVekU3fS9LOvtOroJBL1cyyjJMSVLZbOZ6+NElrukgmfhfJpRqQnDx+n1eS3pN0pugHOTmr82OyxGTItIb/66obMAuctfSxIdq2RbWtRVkQxyrbi+YBf+2Gq465Tq0SUe4tshOq4QBYGr3M8rLW2KGd4lfsOoyKJcNdEHKEuH9VTnuRFb5vshRWdwP+/o4l7aR54Z9t/Kml71Qv72uG0Hq7/0zRlUqQ1mhKBCUKR8MnM9bIKxLbL4ny/qPe6RQ9UzkqjHMtPlQajM7ckbKgD9xB8RtBYDYo6kXi75Uz8ZlvFPNWqmqHwrQXoLusBVCITJzOGSwbnMBgG80nLew3EqGUDqdbeWWk3V5b/XVlW2Taj9nN2FUknwQ8C28phGkHS8ymTt9xOC1m7OdtUu08Fr0JwSg6SIkmaVVNZ8ovsVfEA7NRX7XWcTVpdFWXmU6Vplh2S+s80gsNSKr8urpYZSyavxZCZYPdTtDejm1tKN4VeUKC21VxXgKVcQg4RMvJoX7b8I9LskIsooItrvceqLBCv62I07ZxPKyAQtzDmS65mnHb+RbS9J2nw65Go3wfoMQ5grqeRgFSuD5x/65/WoYlpjg2ORJuFbtVB6xPU4Ls5srCQiSyih3geVBKwF1mYmkExzy9AWC9HbGlpjJKPmi1CqHw2m40HFwNgm8+rdxMNPVQa9hyqk1KhwbTpMp0KiFmdn+PTiblBSpkT9a2mE+8zB9aP/KU/H22S4xJD4b9MN+fbrrSX4BeLGhy/FuC99cQSBMrZ9fZ0HRQfYjoMakSeZ926s3wv2k/+tDbNe3rDPWcYiDCLYSiJiu/fz6eT24yxDjV+w1WYs7Mu+/3EqOEeyWAVbx91aevSZDo9hNTB+dt61bKfINYpy9sGDYTShGziiUht7kat4AHysUjCw+W0nxjtpY1SEW7bJk1HLCkEWZMCt8+opWD5qvVGEphl0qOcfdU3IWXnpreYySUZunrtjcVAAARrqarQuQ7QfpPOIJREp5I0LGVr5M++Vjm7mRdrD3K9oc1BSJDb1wynxAp34AKPQDW8KDYlw1K7DxGfTJlV4it9c/98yHBh9BS66H9c9H1hB/RPl4esNoK4P0y3McJZ3gjzQSnGddrE5jVBNt04mxv/lDNuAcoZDfoIOwVAN/HQAAAAAAAAAA",
    "werewolf": "data:image/webp;base64,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",
    "trebuchet": "data:image/webp;base64,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",
    "hill": "data:image/webp;base64,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",
    "shieldmaiden": "data:image/webp;base64,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",
    "lord": "data:image/webp;base64,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",
    "dragonling": "data:image/webp;base64,UklGRsA1AABXRUJQVlA4WAoAAAAQAAAAvwAAvwAAQUxQSBwiAAABCYdt20gSZAeHGcTTf8GZva+CiP5PAH9bH5QfUvu9CJyNLb2ntY4T28kHVQbitt+rXU4SIwGpepBsB7EkqAe3JTG7s/FhLnfzAFX26aESnx4BdpInXxJYNqMvPV46sG1kaA0J1pFgb3NtwCqotYX2Bpsp1qopkU48P8irE0Zt5pMTkSFAp+4jeNQG6gWpkpLE16o6KwdAEsDNVRXw7YQ3q0MS7E+U2MkeDAdtI0lSxfxZz+zegyAiJmD/qm/zgWvRp4rIRwp9cb3W7jopF47QhqDSgd663vqOJ7ZQkDPUQmij9KhFLFUuk8dRFKEoWlDOUpTyULXR6UwJgkqpolIXnugQOm90J9kGvYaaPkbVgbZt2+T/wyNF3YuICZgAvNq2rZEk6Xm/PyISq7MGmnGYmZmZzBlvZvcQmMnb81ib12NmZmbm7eKM1P+9hqRfClVE2RExAdqwbVPlRpLeNyLOSRKTZcuSZS6mZu6F5mVmZmZmZmZm3mbmYrq62Mx2mQUpKTMPRcT7IyVZqZqu3xExAXP8HgvpwQ7hB7rkkVe/Yv0AR8z9zn/x9z/VePcm/IIz//SXfmJi3bxLoyZ+0T9mQHIZ79oeLh+RIZaeRDyQAR9HChnh7195IGNsfhjB0ATz5D/iwArtAxOOp5AFZIvfQRyWvUiFiUcVQQARv9eHxY3u+ZjjoAhoMHDzd35oIsMf4JBSU7/x+H/7HTKDYQQsGHYwMv7IZDAYfb2qDgZj65fOYeGvPyEzAEoTe2bGGs14OpMwMXvgvhiwefCKpzgg+tgnFKux3yYOAI2HD42PDKs39CXKLOnE/kN1bWBL+eItBwT4FEJi9fnhwJ0SJvYemIjo/35rBsocPILEFzFuRvJmDiaDOyYDgwMfgtkZgmOHjgGIQDTfVaxpVc+1oGZmKm0B54cD2D8OAREfx04ntf2PQKABxA/DDLfWCDSqYCK2FP9xOEx8ECAAvA9xZ1RPU0QHALIbYsbiwgbAtGuFLR38JT4U8AaqAM3It8GdMMm+Bgw2lfnOCnlKtnwXwNkW0dr5bw5m8kb6ROvZzO5AsC0Km8uufBMlE+PSLUhufVVoFG+AD4R87VUI4EuuXKSmiIsWwtb64hSTGTYAwV3SLFzT4eAlr+4pVNx3Apykb2Gb0d78IZQTmETQAHAb+AqRB+MNpxaALoxr3bgt/NrTDFsBGxcxteZqABQdcYvc0ksc0JeRAGGsXTwHNcnrrye1HV9sj0jGagCqXNi+mP/nOj4c1xikDCawES2ifOBTRthUADEUshGRAoanAfhgATaB/6cH5eHQUL+Z7zg1Bu/6eohNCUm25gMgsCVTdw0QpQgJrdH+4ASYHM7nR1RkVbg27cBNxGb7vziGAGKwvfecJREBtMamp+b3AsVtr2zT/uiLg4O6HUFVBNjF+4chEuCLdZU1kNV7XxbFv3ujadkpfGthfLxeomjrGJtm8cKninVQYqw/YOb+KUigcFQkAHfGpBS03G1GlkVh90eguM3Z2cB2i7n2xDkHVdxyCyE/dPixwy2ePHJOGkgjiR0sl+3cRIxg03z2klMOq/l3NRlQeM9v/bXvzYdBYCPRKG0mmmxswocI2bRmvPERdFiSX/nrkmMwaeqI8c/85qCvYE6BQJ5MeYM+ms23IQ6r41+/reIx2CSxNgqot8vepBwEMAF+sh4aHD/0g9ECGGtpZHY9DgDEPQf/+zRxYJBf8pm2qnpoEvmCD6JDA/7so17e7JVP4YMj1l+g7ovkwy9KLYfQXiDyvR+Tl2Q0H37q/cRyBEj7APONyuW4ukjzJV/GizHTvQ7eCyU/Lc3hdIM1lImOzA6DL7wrYynucxPVxy5A95/y+JeV04zpGzCIFDVDx+xUef4NxcugUmHiqZc9hu8/wt8pZvCAARO4SrWuVxs8oJmQP/sBxyKAqqr57fb8JWeg1xh/4k+UEwS2wfRtbGPXKHATiDtVm7qB3XpgwhPezO2HwHcQAZgbv8oEYQMIwEOKVQHolzt5sGN7DXZ8YSVwIeYxAZQfOzgOke8Qg36WlzBxRKCIkCIU61UgvnZ9fmxsmBmm9jV2hkpn3oYWQc3NlRTgzZH3TiLCvCPczz8MGDzzjtpmMD0hWSqrVdmsAHN6/+dr6M+W18f37giAxTW/DACPGwEi/egTH52HZHoGv/zxCBffdeFoqiP0hIQkgFvhV4bSWAAE2mF8FsqNnc1lUMNzBQGSoRz/2KcfgB6IDxy8EeGf5X+bHApAAsFAX35s+edUsUb0i+gJexrA/WeIRQA4NBwNCNLEYugjn/mlPcTkAz15bP/DuAHMaIhG8crhRlUTtuk7kZ5EJTfQUuwDff3GqTB7e8bx0ekc1fb6o6jBYl6vz/fAYPsFieliY13VopiPmpyJhgTBJK2vvVZjjB5vGsvfdA0R27SweHlyGLuRePTIqW1Q0o4Zu7L+3pJgyFjbrkUCH5hc79mJm58DsX1J0KWD3B2x9cR/34KSmVlYQ/PggLGZaHy+7aopm0gx4sEvHHeK/spDH4LuYfZQNrA7hcfRT0juyBPTI/+JmInaL3nwhV6W+04REatSEiY/tt9vgNENvbeG7UuzAQIB9XEgwCOIpITagScWk+7N/2/NIfOS31Q7ka/A2kRIsSRi7iG30iFiCGMPS35bCxU3M5qBeHBqCRGtxYcPNAD8d8gzyLzi2evXhVgYOCWx7HXmvV4HkPxGnW51N4hrV8dazkbvfbcxh81TcxjsPfLi3pm5o08kgKL9IYPJgodfcUTwmWEu2mB7OcLSkq/y9VXSuBA36mEZGhxQXO0VAZZJw05MbNGoEAKdBeR9qP+CU08sLi6OQaK7eQnTlTz37EqbXlblQlQ6MQtW9xaLvLfRprHWtt9oXCq4KwYtddqBEJOa4a/TPgcIhoE/BqdIHL3k4Sy+6uSV95BswLhi8ApjlhVlJtDa2qH9gBZhQB7QDP3scCmin0gkov0tv8Zqe4x45IEENpRlkawViQQIwq4loBeHfVX5Kh1N6+osX/5oLexbIwYjbiz8J4btMGL68WO0piyrsPaR/c8HJ2F3G7RW0xBVm1gYsjFgfQ3B/o7mzePXqK1I4LFHGkxjWVQl7f337X++l2BLBoiZ90jjKSTuGTKMQ4thLVu7sPaWzNr/MtjSMOK+D86Yuivzsiqryg9NHDv+TM+qj0TQ4NDvfS/qzajuchSJDy0ApUWMOl20VwBlNddHA2DqvUcarhazrCqLKiSh/UD54PSPEmwaZgLU3vsenC2aHheWfJCak1FMMZ7VETXKfgHT0SHAQDr2Cz8yauvIenmeF5VizV1f3N9+IrzQin0aC0Ct4+Zwi9Ard4zohxoG/a4isUsRuV15vwBmNEUc/tSf/R8LjXpSdLp51isiFOz40N6FovO+SxdqUZStBYh41NWO1QJfu4CQaNiIfYQcKBisuWci+M/1W//Jf/3jP6dZqzY2sqyXe4WQTO2dNMvzzW7zsX/eswRsIyBsrDCfO1YOmYOHonPhEIrVP77x/vFa4nx3rb26sbaWhaDG5MwIM6wcSpXP/aIAMKZJAIzLsqsHLp7LFh6JloMo9v5W+alainytvd7N1ta6lVdzdk8DknHrw5OVqvd/MjdQY3fgVghJ7cQ/O3WuwbT6AAjVX6n9fF9trK51sl6v0ykrjs5MNSSANGW14AP1heOZUd0UgPUqxJiur+SnX1w6iQMQzb+99dn19fZGL+t1e3np7djstIuRxKa9Qz4gJL9mtjBNNE1WRche9yhe/bEbeN+JX//hh1fzPMu63byoYjK1b9QGkdjctWfTABQjv7SBpgoCyjwqwt4IwI/82N6L5uTffrgofN7tFWWwQzOTQwwgiH6Cpmi0vLw6hz7PRiwAvioqSLSHf8573/As2nPC6tefs1VZFN60JidHEkVQiEIUpCgVYaayMWD94c9GNlzwlQ3Btm7Vj7z8JRzC//1fA9gYnxxLFUUQziJx9SRJ3cTk5L7ypkwMEZ1PP9ALiG99L19dd60GljpZ3D6+sfadwO/+uNYaadbo0vVms9psjjdxWkqJkBSBc5WzFGL66VMFnHqq0y7GYqdna6366SVivwsACKCMNDQ2xmmnTRohMY3ptY4lYZF8IgCUVQG/1APMUL15cou9LmLTGGVXNhAlFEgRiggkDJ3BUDNsZNEkabavoPqk6eWFIexQYk7von0G9O7e2siyssfp6RpoTJQoq1VZlVJCCkERgBojZr3dSNb9GVHJK+v6SJc4Op1c3jfq44DUW2tnSq0AJa6eyJChEqWEAtFIlBwei1lWJFdCkYeIMg8uNVQEVFm4IAAkBm1CseghrafYjWRQsKPjSnDufAiCYJMQBCFKRmCnFC0eUovBQtiyqkqnvNXUCHLYWpAAAgRnsgweRB1uYC1bVIBNU1tFQJK5e++CKyttagXFShGFqTXE8L2N9kZvvZdnZa+5vzF6fMwx3Dp5vhofG26YerNWrxFbR6RZDLxXYjFwY6OPNkkTZw1BAAjPzYwPhTCaNGAY4+r/cpVOFeNMkqYpraWQxZZd2+j21vJwtTpanZ6en5ytjyKYm1h++vkbFZikLk1qzXptePT4+Hxz+tg1AIm8J9YSqep0NxRrNKRLEmctCQgEmJ1aM73j90cAMNXYWuDMWlVFWflyaXim0Nis0H0rpK2RkeaKZiNDXPoPp/LhWlUJ0KYQkGJ98dRzi/PjFjFAALgVaqkVWmkXgh12NMY5Zw0JAkZRgHGhO3oQmyofY3LhLCBia2NAgJhb+OZf6WL/wYWJUHgabEoM1C6Tsbkji3PjCcoqRgFQn63JosQuGJ2hIQ0NSdoYiozNWhREphbsK4bRqM1M2QAoQhABssCsdb6bVEC6eGC+VRXR9G0uJO9jMrb/QDnmPGIIWZYLgFGRVXageJskrTUAYfydO1lZoTa2UI9kGBH6YzW2nS1dBCDsYmVAmxGEgNFD8/tMHsgt+iRiVcXzG1PTCISvuqEPRWGH4nLHcnMRvbtLASQUhhcmKoYJiBDXp7GDZJUA0e6aLJzDuggAhID5h/fViops6BfgsnUzPR6iYhn7HAjt4m14GkOAtlxajQYCAPrL4/MRNQBgb8zsBBIPQNit7momIGBLQsD4Q0ebZYmaohBpu+vD082qCgYARUjziSfKqggEidC+WxICBAgsLtiDyRCA/Nr8hLgjGyJ2rwUAY9BmAAihdfT+qe4y1aD+aLjRnjKEBYAiZGm23riKwkMQ/3cTDAYboL16IhuCLl9UEPOuuzXkUjZ/Ge3CrF92dIFZ4Bb9xuvNv/zcPzw5TgEArTXEDjOa4bKoIgEeSQaDAYyULJ/wwEMXzH4Mwl7Uc7gJhMHC/Yuudw/gjV/7+18LFDa/lO8M0Z1kUQQBbAgwNsMGZOBA8GzD9nLEMyW1AyRg9gMLRdkngAy7EZ75/x1GAMLS6VvBqVoN5B6CaglTDVBpE7DYrcUiBfaevM6chPDA+0assKUHvJu5/KUlI4C6au7kBpFNwJYRQGqkKeNkx6q5BBGbv+hJJAAUWu9jHSIgBGBCPW10vnmJElZWzOqK0q2lsAFU0hCmE5CzWv8tvBu8OxH5Sn0ClKunZgIoPHuz7oTthnqCGp49ScZrPvrrArE2DJdEwCbYaQW+8APaTSwBuJWNBJtgXsbsROeVn3TrBgSE7Niwhi59/QVvuoi4a/TKBNZBpomdJUyvuPuNb/o/vAvErs3ls3sOEvntinl6PoC688IZGTFoo2WcJWtXvnvjaFSoBNyuSZaKvDETxl/5nT8xv/lDMoNItKuHtMY+vjYkAAtA2DGI6FzqbULIt30QQNO48DfvLBYBnLFb8zD0+k6C5zBofXfT/fhvigQ4W8eOxYdPdJUgOhjsZRwAAINQBwhA1UoIUYCqW+1/enMoiGEZJtJo5ctAzISDWP+Nj2GQ6d2Ia//PSsnorAUHImAmEfrKVQUIcEt3G/l/OF8LSFhvVjTk+jYzm2FWw58/1GhwLStiNW3Umgnx7N0IeYhYfELQIAChsIKgckVBoBpXQ6CebTvWKdNgjNKrq12BKtNf/1Bm3+m0KSeb9VpkWkg2FkIoNIvYrrAalP6TzyYDIm6AAFiuKwqw9bsI3mQ/EWKlEUAac0doHvCQ7Y3/yvdhy46gWioMGgSI+aMRiFHqA//i2DTEAQD+lgEg31GMiC1WijEm184SuVuvjFFSpJh9QOwe//VzosAS0G2RiYiQWKxHwHiwNnswxUDZW3OCUAWJbFYMARJfZZmJlk49odn6yupDvy6NBsCib9F3GqQRGwRIUlzHYCIae/YOgQMAl3pWiN0oqIEKQVKEJ7JVpFHTQ0izkSamL9kgADNgds8Z6xr1epKQABCAgaSoiCzP/b11HkNA3YwNY7DpuFQFY2jKFdrYGEhMsKSxY9ECsxAkQD+8nwQwYjS/DhR56U1SbzSIwViLiUssIEuLeC/KqrHBUB+GuHPUcDP4ABChQgIYoz0sqXoj9M1I9FNhbgIIcGaMbVl0u91eALoEiA6gTeqN0bSWOMRtGaipFgLr9VFo5wBMNYsgAQqykZgs7I3eaDSNnIPYlCHdP4pNbRKBetqE2No9J8o8L7I8X4FguL1EJM3C+podcwOxR6sqAvRRxpIQ4R4fidGIexc2JUwY2uvAvkynBUi0CgBx7+XNEsC2aiaIiUQZ3YgDd4yaG40AoKiENFOJ+mRFuEmBUpPoE6DR6F5EAngwe9G2g+rj7DUK23aXKSQ3QfClhkYwQB5VgFgFCDDSDnA1T6XzVqRB9AkCJskOzGNT2yYHIligJrlCbSu2DFW3AFgr2GpBO0Xty0pA1qAvMdklFZEsOBCpJ/pCgEmS8u6nb5x+5g4EpAcTSmGZcxW4LeqVkMHVbegwppOA5gF4tYpQzQFJoCBHNhTohE0JASAjbb0Rb7z8g289+0t/9A8JCbbTfezWoxcy0WUUBNvVbfBQ0oB2SH6zFwWbQAZZJmssIONACIRAAHAJ1i88//2nbk3IHB2H8HA6LWwuDQx5AqvKQjLULtvQljCR7hDcvGCimCgAiwnykQkABED0y7hEy29fuf38dYyMWsK4D/Q8IhK7cApslyQEztokhg3CDDfAHQm8UUkuRV9YOzhKELIJCJFAklTLFy+3AVjMTHvEwEC6n8l4ePlNDSw0qfQuwkjUzg0AQzAIY8PYUeHmBmXqkBEzrNIIohVgIOvunruyDoAmYLQeaQNwejDT2COV/s1jtxUHNKPNEwgDZNcExI6hXBPivYGVZSOklASiIgwAJGQKb1e/uwaABKr6kVYwpgDSMNBnlOX81dl/YgaWk5JYUQxmbRO6XYNQn4B2gOEKgdRaACrkuDOQ0GwmN1Z/QblevwirIOjor0yDMRA0nk0MY+P4ww93pcFIk1CvPG0zqBYQhQyiHXc7gYteqLsEZEG1olKH/M2ra39g9Obq8YVX78CM7z1++P/CWEaakCM2ZjSMzsCcHPkPDAOKaSYtKtvGkkENEEJpDMyIQ1OEC+s2pknP4CkmDTj98uk68IXyi2bfnmRS+2enWq4XN2gJ0tcRzChl5wCcr/gU2om71PGUJCAnAM9fyq6n15h257pVkgZIxglTXT3+oysA8Mihf4aPHxpvna4Ws6KKNCfbBsYEX9M2ttNDUXYfhAq846nU0sJtHyGBTDP5jiT5/Bi3wcSLNiZWsvVqCbUpmvkHAMzs4bn/tP5IdTp9/Fc9+ayVDx7LVyItyj56mEFfaLouAkR8HC8NGXyIUYKNJTXROaS6ugA1AadKmsTXw6k3e4xNhnjpT2J88cjR5Pb/vrR/3+vTIXfJ976Ssj5+sDr/NkxV+C4TgxkP+0aETZWPfMi5NFgqsX1piwk8n0I+uoabhDO3nZx7+0kA8CMiYgSGzR8YXbt0+srdGt5/ITSzEFl+sTE5NpzUdPNmUVahZtppRhVbk+BmiI+/1ItL2by64gTbMMHy7YCwr63aTPdkUqvffhqEsHlAhDv84LGF4ZfO3DV1mmLPxPnR6CPE8o6V6GozvFH44FqrPSLVxl5sUy5fr7o0Onz1R0DsGVADKB2SKBerFgDf08l/3wIjNg/jsyP3H59LfLlqG406fdZ93w3fkAQg3vGWtBw9HjZCcNaaOWR5PYttR34IeVnCs//11dvnIrA9oBbonl8JyccnaCzi7D/9exfBiE3D8M7Pf2US+boXaI1LWwyL1dv11An9vTUH41I3scf4UDO7avrrIJ924HYwP6NcFqr/+sdv1Vdv1BKwp3H3qkgSZye08turRMSW/ODnPjKZvV0ldUaY4M3s3OSezqasVmsNxFUYyoRPfKOrWZM+awz7mkm7jV/E7hZP/OK/MD5TmFYUJEEgNdERErJrQlshMW4++Pn7tdH1SRSgCuMLcykQNqxgvFs4gMCbda2Z9C0ZJvdCE0z4cW61m8B//IFv8kEbo6WEPklqMXfvriRJjTFoK9Jjf/bB2BN8GRlLtOYPTXaurQAbDYfTI75raCHE6WlNDySMzUXcu84+jzgwbSPaG3/miw24+SCOUJBknNkC3HIogrQNw61aH86rEEKoitg6cnDSXzu/Gnyex/odUcdQBTJ6fWVG7VHsoI3fwOC5DeDL/2j4Ix9bnB+pkDSjNs2uyyaRESEw2kbciY6L3pedct9988WtW8shYfS+0+ONe7XmGCTwwCoYZlxoifdm8J3MakD5+Ta0ifjDtSto1x774BfSLFq3Sdarq65mA3DLYSjKt3ci1GzoFROPTt6+dFfOqt9YL28v0w33KKLAMD0j7CRPvoQ4EOHECxczAoqwL7/ySEMM3fD4b5xTZodAjNRs4o4NCEIGTRqqwzcPLtQvVWmNEfARQGM4P6HWbi4IKYzMgTti4rcxULO9lF/dyIIloFOmhJFNzdqB99y/2GqGItbMWruu67LJN+6FSAtmS3jKxMTIsXlXsGXBCEqKUa6Jo/U60rPYTuT0IHZY+G5lBqJrGh83WU5Yw4/tP2cL1WrOYRGP/Ipf8YU9JrK72m63NTNzzNr+R1VUVYSpOqauTx0ck01thowzJbJmKR1RmYVgzdOEpzbWPJD580ncOav7ujC0z6EqQgRxpJmt1etirP22WfRHX1SqylDmXaSpsz3g5lrIy6qs8KmN1XZxvVkZm6Q4bQD1EVc1mFMUrVeYOzNzG733M9HsGBRnkNr6SIxRMULAFDbgaDeO/EaBRL+6nW5RVR42TeqAWb4r76uyfPjTa7eZMq0qJCk1GVWUALKbBXEjQH50Cs0G4Dc2wPlwJdbIpqMBYEERw64TYuh+9oPRoF8+724oRh+ibFfN4EuFr3xV3XnuvVLTw7jTLmUT0xwRAZlzbHQMEJoL2KWJx38RBrnsa86q0bB0LjEAI9PG+vJ6dL9lRuzzoco6wQdfmobPzARsls7Y0pelb7/yYaulVrx1vkNDJoYkZs1ySYjDGKzwy/bFHeQ+dQbnnyqtTRKHTdkYvnT9evyVe0UA8lWRGZekLimKF18cKdMIr91RVZWZ8SzNa8N3r28I9x7MKKKTGYjyGLDBwi9Azof2GNbfOPO1pIYkSTYhCKB7PjwOQlLwUa16AsWIs5NNEb3iFfQ5H2obO2A2Ojsxb1iWiWJVYODSZx/GMxk//N6vN6/kqXV10LlNAEoG/RFRECAoSAQEqJSAzJkzpqic3G6bngwbPezOjfUIiJ0lDJ6a/ZRypjTP/8Gbv/WQUPb8uIzZol8iIRCA+gBAAClKiARezkKw80ZbzdDEXSBidQMAmDdZ5qOPQTsi2z7949NvIlRMquc+7DxLw+xmUCC+MF4oM2+3JU0bsBvDcmkhoTBaAlHfV8LFbYUoErz5356cde2baWFVP1c9uB62WpcdAabPOPsLKqW7u22dyTqAEBWxk40VWYn25ipmmVL7VgloG7EISBnTS7F1oLxWxtzQv/jeZOVGPT7XzsAAoD48WlrbW23VRtKKwTiJ2UWsdA0hVstdLLi69vIZGI25RIw+jiVZmN5fXqsP59We4bVOGScbrRaACZBD84V17xK3jOTtkNQddlotFRaECbcKaEGMnVMvL0EGDLAoSmfUbLOan+iOLcx87DiW/dTZRk6hnQ0KNqrcqTTXxGCknTPRXoEB4NrXQOxmAcXG668im9rR72FCs5cZc7Q3/PsWgCKZcqu1TIhFip3Lqctd1JQYSth5R1zqWgrk6hqoXdVf2Lu//leEybCQ5GnYbCub+oN/XYhgHVwBAWC0O1xpJ9Id2oeEnTfS83crC4JcvY13ILHWK3/9a7fARVQFRIbh0Pq5v+6zH22PmjK61AkEou/t1Zl2AVwsLLo1oQEI3MJtBKpTFwxFGV26x31ptllt4/XTMDD0vdILyo8+DXkNKkvjDERIkMX63ZvX73RxSly0MMjuIZIAKgUF0V6t3nl7LRGkdPWW8H0BVG1bu3s+gxCLKoKxDqwwgocVEEV599bl9sbdtRwpBirmVxLa2LsHA3Rv3WwjtNa6rLVZH6+Kjrx+e7UbnBUAtu/CmPuViGrg7FVQoDE8AQRCVcmQhstbty6tMM4aAw0G1+4mcFXnHnq3ry8VtLBtzLCKA40FpGjirRsg7l8BYNpYuioKhinDzstoHcv89r0aIQERIAZ8uXConyqobX2vgDPRByIQgAAsQoiiqxXnuxDe4alhrTp3CwZmZMj3smBQZUVQCEAyxOAvkI1br0HYdjAqizwmJ2HwkOiTNq2u/+gcKLzzCerSmYgyOwsgt8p9VQYaAAJVZzBwU11Kyec8cY+xyr2tm8qxEKNC8tXqiVdOngSEnxGpZKnbfeXSi2pggryMJCUEIq8TAxduLiXNN29Q95CTtAxY/d8f3rtj305kIfnVbvf2OmCInzGr9DfNv5xdrktZKcMDBhAG8+JR7IaL3aGrL1G418QaGXf9V/6UOQObffmRR/1Hx28uIxmq2RiMo2gNvAAaNOrYfeSHP3nj+sZMToF6OPndJ0GaZrM35QvFA0fvrFdJWQuCcc45E/JipEFjaLEb5a++JK+BJ6FmX/jyT4Bwetpe9ap/gK5lW91clbVxtdvJsjLMPTqEXcosnzi5xpxDb/+nFwGDyp5X0d2v1pSrl1nVcr0nM9pakrCqzR234r1Ys3D96IxZv/a/QCNh7wfuNss6jIt0HlcbRxwlgfHEncdmxO2l0Aw43Zwz77+AkfBTMHC74StaY0noxtGOAEKGZn0E91gJMZkYPT068jwGwk9F4Xqxd9XYlFC8wxkEAwIG+jhktlUJ0CQlrdOC5on4aWk2/tlfm+25BJK7Pp9XI0WwMOx+EjLodxqEEFjaqdGon3P4X3jtMw8K0Zr/eWq8XXwtJD7AlwzmVaeQAhzCTJSbqE3yADj10umf7Zj4v3kKAH7Tnz5VY68LA766vFoXCZMqmMlN7sGDYKOaLsi3/xpoBF38m7/sX/ZK9LtWQtWAI9KoicI8JtN3AUK6cQB48n/BxAAA9sk/t4b+KAIMRvTlNsyNNCbFBwBrOzj//U6dEf3BxKehvlUJSWkUGCHaw+QsZvAuUKqZ1f94+wOToDYRnuyyTyEJIAqWmOragXDQvhsAjTx34S0wop9YXjYCoAiBoAQzynFIo5Piu4KQN+NLYEQ/tXoDAsBQSEApzBsTWMRgAVZQOCB+EwAAEFYAnQEqwADAAD5tMpRHJCMiISayLDCADYlBDgAysNMXL9gOxxFnW0JIA7so+ibzCeef5ifOX9O39w9QD9gOtI9ADpSv7Z/5f2S+AD9ev//1gHDE/0b8YPd14+fj/yM/cz2R/G/sH9Z+Y+cy/If8Lid+WuhF/M/9pw5HQP7d36GtJkBfq//vvK58Obyr2AP5f/a/9/7MH93/5/9N6D/zn/Sf+X3Bf5N/Tv+N/eP8r3B/299jb9Ufv/bVCoC4p0TAuisUqOihRSDOy2zX1jq/5bSfKH2cHP6G468bQuBvbJXoclqDPoH/dremEf6DnhSofg4xRglxYOm6rRicomDJ+qJG+I6rpZfTCaAl8fehkfdyuY/oxWBY6cVXQKhypU3FxAsj3Ak6bxp37ssTOunh9BYJTbZ9WV+BLNiL09rFPndK1wB3GvV/on71r9qiZz9BrwsX8PBB59PaqDTl6xTf2PpZRvqCjAreurMTcFGs5s4QGcCU842OSIyfB1LRKRhPyemH6wW1NqaIkELwGdXf5v+4u7cUvug08FmLlDx/wTgyihCie3DRH01dGDJQGfWuhyPGJzFrQMB4njCDeizu+jlGnqk9NZ37EvM892W2dfM071Myicr/L8zlYBSEyd5H4C75fEDctMiKlhqL3EpZEW1KVsrQLryUdYhGQIt//2qHamCbGt4yxdGZMBjMsrOfmFjRwKmRHPZovfwIQMO/KO9D3kK6lqpKdL4b1MpfFNzeDo4/mlW2Hfuyas63GnpGVV9UDe4ZxrFRsC3LvkctDVG4SmXmgnVXx98U7XC/uXZ9SLLwtbuAdBffh5iq5DDKVivNGXUuXXC0vOah7v09/I5GqPhcuNKOzFop32QPJNa2UBfdOM35jVp+8GPL0us+tL7YR+lGyalCGS4SgPxUdCZkQrPo0nzcAAD+5CWAEgjAkkO/tx3VAsTfP39NoKCrgFDf69d58Z1OhQGq2VvDH/LkHGbD1etCodgLRHcxki84yD6iX94xk7zVKCofu1fxmt3mKLL+dYwOBnH89BXjuqV5GMrplua4dxKmh+qoHW+gaIgAUBMVZrIvTFa3uhhlukwcncPFKWutEcucbqIgcNJEE+lhPEIXhvf94ew/tb+A7fjvCibLPJHVIgopEyoRiukRbRFSroiEw4iH6eACoHvIVKxDf+lzw0lg/XgZPDBxerx05o2ncc2i2EIEO7uqT8TnXU6pv/HbqtfmP6zTVf6FMXnE/f3XwPrV/AgnhQwhT/oHjngK9D1rUDR61Zrv6Rg34BGH8gY2Eoeb/aVeWI2/MZ9t1t3/Pzp3xbF9PLcr8hdFS3OsV+T+vxUAym0a2evKMb6XZQYrwdcuoSp4bpQtDHBtUsObCx2ucSaF/Td+NaovY8NSlrVQB5Y27XACxRCxzebcRlANp/Um9q+0Xw7wbCOlCHaQAIO+iAZ+e/kvI/XF4qfCaQ46qL7oJrplc2SdRw0NCAywEfA9DssPb7zM+426jvGO1Mc3Fq3cwj2cG0yCB3hXdZIQSP3qt/WJgL5TDjqqLdgVsryZuzc4cDzgM/kMV3zOao6Bhv6wG1pD0M+wv3hvRo/3F2UlHcXufZz1QxUeVFSYAJXxCp6Ehmjxlg/Spdi2fkRnDipGck8oBMCHTLWygUhrpVzAGMYVPlaDVtI33egIIYujvvrPDLQgoJAdKpv8QqqzhLuYOtrSmUkVfcn7DBYkWG1IFm18WzkhMxThUXQcFkOE9g1/bB71oUAF+xEWtEBsUCpgE49xTG36u8jp0/X61KUa65esWVWPIUS4KrafEJph0Nuwh+aZfLsGdj4RkzhvcMtTRJub5K3OujlnVDLy27dYv1Kko+DWRPc8Wo8Q8idxUP5r5qcHG0S8z6VAhuRRg43AGIEOObtUiU36ul95LHmzlfVj+lO2xvdSErpex3ZlgOq1fZZtrIOK0p62iwbE2oKLAq77UvkKcs6II3D/3SCqrk9BCZKN3/ivWKQzbaCCJdMymiAAuwKNJwNiGY0nXz0rTPrnwafrvtnbSKwsqlm+K+nkxgD6xkZ0d0KP0jEndMGaZYLYWHm0/NEMRnstCQll2OutEor7Z08Cbi9HkLyGzlLGSw/rHNSGeRz2MoUVleTAGIWnf08tuYp8/IvwudFJ5d+OEonqoWT/eQ084n2ZgWF/COQ1MFbjKKJxjJhYy2tbeuYozZVyQmrCleJOezyeyr4rYNtjIivTyiH6lcD5DCjlPSgJf3btfV7SAQt5Oa5Qor86smdchdm9DM8VQ6r5dTZo5E9hgp79x9m2kXkue3pNjsoSW5Zs9dCrvHmphWBae/s9UpUZmBd3TJLV2HLn8SDvtR1CkbLMPnlsnkkmZC3RTR1aIvKW3WIqThrEKpoKpBP9sN///R4aR1dP7Uf6RfuYkt9+z7kU4A2+gYFx9L0X/Q5mchNvXsgYx+R/smwOH7khIsngHTZRN2cxsMrd3xNLH8aP3lFgq0oN312zYWTRBtpnfY6HDfK1457+Kpdj8ajhVQ7jWsg/5UQxR+Oaz9JJfJHjNkKmZ/U//tVidCBwaL55VnFOGqP3CFqM1kFxVmunMeoH0VZGbWX0qLH263ZPJ7I8hy2r/1PPvOGfM0a1c2f/5wjXZkrc3xc1MIf28WZOLdHK5RVFYp2Uf8ztA6z/m3tGAcc8J/RpiBUhGe2Y2lnYCxHqDYClUy0kTLeYndldMMhaR4jqR/B4RbADisncXBaFLSVfuq8wAj5WeCO22g+JveuKwWRuvesPfy8KvGv2BBfx03IQBC85ZwoE0I4JZV9UTiFR6EvB0WxmQ2BCDlYiUHP0cm0Hf5WXD2s2FYkWy2Nrlo64Abwflzu2jLaEY4GMmpJexMKmqctNAntie3MZ9z8G/Ak+94KMnPY4deKkefaDCDcnz2uvyfbnOtpkc/nkD+Md4I96xImm1k3l6O5ZL3iQECyIKiEhOfdl4Gm+9lxD10Pcjq/W8t/RWAWoOQ+u+1025uxzkPR65eukFGHNL3j1aLRMdlb6xKnWzkKoolw9eW0ozY8RodaTUv3V5Fari/MNs7H5YdtWZ5TuO7m+ZSgWO4SgX+w8Tkg8rL4vkYNrz3puD9CIlgCJeAVaTzilWlPfTLESwjBtoCaxmqx+oUlr0Itazrjziegn/41V3kXPmZBaz3SHEmJt/djfv6/kPiNKp0Qh7pHCB0ElZHCzJljz3gLTdXTESvtzQtEzNciIkpqYMSHX/KpwGdaCXiMlnlnCBTkkq/WO4iaqrWgmBkSTKM9oq/IRNGQ8xVqrEbk24IOpDRVNJsPIct0tF0U6UDBjecQitpvNYMKsW5M2n7zl3TSy0U2djD0xXf4+rg4ZFD4PPYc+sEMa1RjxikKGGyT7qh33SvEPk8YpTa25r2yDorObh98sPDk6XLY7xb2HoXJsHgVl3J8NJR3Fny8bqpUs5imYEcY0bsyLwU0Vmt/uZEawjVq15ym4rtVNnw4WtsCsdyYS2HQjhxicFACllT4fHp7iUcbth5OUM5lyYNbyABMMEkrHk5kVbvlGTACBijgKZyCIK98VI56NLgcqLhSoIjma6r3b/XY2gx3tWwDF5lVRV98+1P4rgyJ6hN0giBZlmXDUI88bjvCBb2LbsRL/bFi9qp6q75P4ietArXvNeJJugOSAnan69fADM6W6NA+vh+FPli1sEtJxpzge1DSfETwjdewpXK/80xsKOKHqUo5Y6xk7u+ZzXUqgL9dtCqnS3aNdVdTVH6BT8VXXZuZExI8TNMXnKadOPo8/Yt4CXNxhyO0m7uJJfPdztZ3I7kUuH3UDJ/jsLB+Ca1lVLN4lVZcASv4WSegO9MKWlaFId4aj+b5g1RhOpmSx6LK0nWtmExdtt+J3zhA2Dt4Bgxbx3I05j9Q5RxiPuMz5L2gAQ7JGcBLFslbzMb0DRhZLxpJf5P8XA14GdJZx0Hm7Mc5HHyDPdviYK+3C7F4xPWfmKlafMnDyaPnxUJZBpv8bYMxVvYJMRdwplr6ZZteG9PbEgO/m4dJhR/Zl2Hl0VdCxwoPeN4i7kHc2JmwvF2J+dJCFFnyQ8kpnW+Zyrh+feFI/eyEquFgDOnFqw9OLqDgwAWOu8cex6l+fTb11+rKpJcBQ640X5Q2au5nr7sCgIXPegXxxejiucpGbNBbddO3KW+hfQaQKh+R+XRdz0iiGxOebX6qcN7uArwYVocQkmTIn61GnBSW9243QM7puLb00c8j7k1qqJuRMC8QcW/g2Ek/PJu3UcYiX5p/LMrNHK+sMud90pw9WzqFrP3FgpL8ahCmoJTBYtgCZjzwF2pqCavvQZQh4K12Ejr7ADv9uSdJsDHLqsv9kxTUhp6Kks0Ctb3JVc6/tahpGfznDCTcSBPD86M5c7hUwWV1jKCtbZu9tGexfkwamd4WZL94/YSof4e98yAVr5YOzwArHfKm2Ei0XAMHKxKRV59yubHnO1DA52ozGbZ20nvWpHP4i+XuhdPx4NLyeyig9txpdej90YtpEPTFc/hL74kNDqjEWrU778x2+bodMgjLhUkV5Tsk0vsY786w2nauVL0w12FG8pIEFnH1OOCBYNpIY2KoOMlv5ecnLuaRY7Hl11pL0gAVptriFT9911nvNhxa8eFPfyKObKkJthmjzxBFUgTSfok0GZKGqTi5osUtlFbMAHSQHuZNWz2mJZO8ROXhaUy/VypTLSJOT3S7LDJVLCF34OHPLz2pkDvl8tkvQP+gPOtsT+J1iNV4sOV5/kvagCWGKgg8O3dCT+u8N6FbHpe+Z6EjF7Uwb6n9oFDiIu8k47uUg8Sge9toWQXeMmRG9gpB+Mtr2/eIQ3G9dHwgAvEAqGsa6l6cnAuaeiqIlV+8uZDqfm7KSGSTOVunGuqAn9q+4/KAmPIZHOuqIAc//RsGO8r16J/n5ZVLKvBa65d6mAXZ48qg1L7Nx+VsZsw4Qhd3Pe7oZyLSA1itGVhevw/Ci/dyTzmRd69FihNgmzcpOptjOEJZbj68ANmMJaJMzyVJIqPYz1oBJg6rOGDXUKyeHJom7euHx+JL0ClKb0FgkLZfIQ+CSWO8QqCjduvJgfgb1NjJNPtXcevhXMezXtjXqLullhLLLX94LAoBshJf0+iCibdPu1N0dkz15SErALMV6FRIDJ00/emStTyvWUfmN1h2vynlYV9rNOyFQ8/E2pnFeWchvO39+CBXmTTk3S8M7t8EWgeYoxxTTCZyZ5WY0N64fXwJlMdVVQvMYz4GgyYujDfSkgM7bQH8jsKYIq5SbMUWw1HK5FIF2HvG4SBuFWs9Iv97SQk0FKRg9Nh1fSj55oKse9d/8myq5SuYjTYi9Nt5tVvfk5VHSjJNebVHVI3TWh2989YDom6d5BnrTeAhBmirf1ZguOtIEAPX1jWP2QnU/+u+1uJ1tkrHrlnLr7art+e1tW6SYQOqgSDC2Bp0lJmeJ1mwtA4JtNMBx3mijMs+iaIc1zeVR+7iXju6Q+OfoxhUJB8ywo2g+Q37Ek+N4VTTxRrTfCCOPdH/F5QTBl7tnJi5Zl+R9R5IFgmSLn5iy4211bjS5a1Nmc38RbmeDZGrWHeBhOQkvUODFO8Dj4BIlMB0pdEoKOs733ojatuEkjpfv15Mu7dkCYJf5FijS6wSaTIaU0VGCfabO+f+BZ+IVT4DrkezhtBZy4z7bapAZA2esDJD1bGZehjR47W7kYuKX0eDoq6uZu5Sv2BF9Q2UyMkL+zABGeqwWNQqb91pZkfnNr+GYel1+/uWg7pRif+bjoHf32efXye5ZgANo4E4a4PQM1ZHZNqnKCSvJRmRQc0Dxos/N/uDp+b6sEUcqBUnKbRwRuAACk/SxhDOHd2pRgex6vNS+G6k0qRMC0z5ccGNlqCqEfG4DClq8fK4uUl6c+bM//xkIfIJmoKdp9LfsJB8FmeGTSSPGEh2HhkUX/dQLxjZSHallbvFMWqcmfcVvUZD6JsOTTSPf5W/g62qry7UT5bGeH595cg2jKEQH6ZC6a5n0lqifQy7O5GzZ6+i2eOYfg1oCj3b/xfYkzf36OPGumJNaH+2r/t59Ui0rsOWAl0rhinvQnFNuWEtg5h/3YuD2F2TUC/Wh+9t/m88VNYGsqh4KWgxCV4KlnPP+5gxWNfsfn4BfuSvSK4ShDGebFR0zoKMUscsBFPygbYwkuLtYK0dUeUV3NwCsRaD8oecgAACXA37t4AFcUWXBSu7jUGg87S1Iqyzxh0IQ7BAdgnhiTx5RyK2L2je9a/1ek/NED3W4wcAsY4goCHj+/lQdgRLJHgAY1/Jkg1y9vXtgCPURTUVdBBynDq1ULEAtcvFGSc9lGsSdf9fv6d606DVtWMpMPiJzs4Veur088/T0KJX7AX/4Nx3pMKd3hDf8sI9X80IeEKD+hDiwbsI7XmCTOhAT/Rj1S799LcOAZNj6OLWOqJTbfuRmxI22t6QFQewOonhSCTKtmKc5D4+xEt+eP77DC9PoNQKIioL7oUgAqUmIzhwyTlAh9EcM4Pv73bbU3pWaI8kSJgKZopqp0jOViz5vClXhWclk+XNNRPdv5cOLJ9g5on2ULnjLGKJXjvVnZHUPvy0GI/2j5O4ZpPSKb4h06ClrT+5z/wCyLjL0Co0RFzFVbn339CWUUMXKVOWOotwAAA==",
    "axerider": "data:image/webp;base64,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",
    "legionary": "data:image/webp;base64,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",
    "captain": "data:image/webp;base64,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",
    "ogre": "data:image/webp;base64,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",
    "gryphon": "data:image/webp;base64,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",
    "lich": "data:image/webp;base64,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",
    "treant": "data:image/webp;base64,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",
    "gryphonknight": "data:image/webp;base64,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",
    "darkrider": "data:image/webp;base64,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",
    "baby3": "data:image/webp;base64,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",
    "dragon3": "data:image/webp;base64,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"
  };

  // src/rarity.js
  var TIERS = [
    { k: "common", name: "Common", c: "#c3cfe0", g: "rgba(195,207,224,.4)" },
    // steel
    { k: "rare", name: "Rare", c: "#4fe08a", g: "rgba(79,224,138,.55)" },
    // green
    { k: "epic", name: "Epic", c: "#b660ff", g: "rgba(182,96,255,.62)" },
    // purple
    { k: "legendary", name: "Legendary", c: "#ffb52e", g: "rgba(255,181,46,.68)" },
    // gold
    { k: "mythic", name: "Mythic", c: "#38b6ff", g: "rgba(70,190,255,.95)" }
    // the strongest is BLUE (the owner's rule)
  ];
  var CUT = [22, 60, 100, 200];
  var unitPower = (t) => {
    const u = unitdefs_default.units[t];
    return u ? Math.sqrt(u.hp * u.dps) / 3 : 0;
  };
  var RARITY = {};
  for (const t of Object.keys(unitdefs_default.units)) {
    const p = unitPower(t);
    let i = 0;
    while (i < CUT.length && p >= CUT[i]) i++;
    RARITY[t] = TIERS[i];
  }

  // src/ui_theme.js
  var P3 = {
    // actions / ui
    up: "M12 20V5M5.5 11.5L12 5l6.5 6.5",
    train: "M5 14a7 7 0 0 1 14 0v5H5zM5 14h14M12 7v7",
    collect: "M12 3v12M7 10l5 5 5-5M5 20h14",
    bolt: "M13 3L5 13.5h6L10 21l8-10.5h-6z",
    clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2",
    info: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.4",
    list: "M5 7h14M5 12h14M5 17h14",
    move: "M12 3v18M3 12h18M12 3l-2.5 2.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5",
    x: "M6 6l12 12M18 6L6 18",
    lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
    star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
    check: "M5 12.5l4.5 4.5L19 7.5",
    arrow: "M5 12h14M13 6l6 6-6 6",
    shield: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z",
    heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10z",
    sword: "M5 19L19 5M14 5h5v5M7 14l3 3M4 20l3-3",
    people: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5M21 20c0-2.6-1.7-4.8-4-5.5",
    home: "M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5",
    box: "M4 8l8-4 8 4v9l-8 4-8-4zM4 8l8 4 8-4M12 12v9",
    drop: "M12 3c3.5 4.5 6 7.2 6 10.5a6 6 0 0 1-12 0C6 10.2 8.5 7.5 12 3z",
    // building glyphs (the emblem)
    keep: "M4 21V9l3-2v3h2V6l3-3 3 3v4h2V7l3 2v12zM10 21v-5h4v5",
    wall: "M3 20V8h3v3h3V8h3v3h3V8h3v12zM9 20v-4h6v4",
    towers: "M8 21V8h8v13M7 8V5h2v1h2V5h2v1h2V5h2v3M11 14h2v3h-2z",
    training: "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 11.5a.5.5 0 1 0 0 1",
    barracks: "M5 19L17 7M14 6h4v4M4 20l2-2M19 19L7 7M10 6H6v4M20 20l-2-2",
    stable: "M6 21v-3a6 6 0 1 1 12 0v3M3 21h5M16 21h5M9 11l3-3 3 3",
    workshop: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2",
    lair: "M12 3c2 4 6 5 6 10a6 6 0 0 1-12 0c0-3 2-4 3-6 1 1 2 1 3-4zM9 14l3 3 3-3",
    forge: "M3 9h14l-2 4h-4v3h4v3H7v-3h2v-3M17 9c2 0 4-1 4-3",
    mine: "M5 21l10-10M8 5c4-2 9-1 12 3-4-1-7 0-9 2z",
    vault: "M4 8h16v12H4zM4 8a8 4 0 0 1 16 0M10 13h4v3h-4z",
    wheat: "M12 21V9M12 9c-3 0-4-2-4-5 3 0 4 2 4 5zM12 9c3 0 4-2 4-5-3 0-4 2-4 5zM12 15c-3 0-4-2-4-4M12 15c3 0 4-2 4-4",
    axe: "M6 21l8-12M12 5c3-2 7-1 8 2-2 3-5 3-8 1z",
    fish: "M3 12c3-5 9-6 13-2l5-3v10l-5-3c-4 4-10 3-13-2zM8 11.5v.1",
    gear: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1",
    civic: "M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M3 10l9-6 9 6"
  };
  var ico = (n, sz = 18) => `<svg class="k-ic" viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P3[n] || P3.keep}"/></svg>`;
  var DISPLAY2 = "Cinzel,'Libre Baskerville',Vazirmatn,Georgia,serif";
  var LEATHER3 = "linear-gradient(180deg,#3c2a1b 0%,#291c11 52%,#1b120b 100%)";
  var PARCH2 = "linear-gradient(180deg,#ecdcb2,#d6bf8a)";
  var BRASS3 = "linear-gradient(180deg,#f5d583,#c0892a 54%,#8f6014)";
  var BRASS22 = "linear-gradient(180deg,#ffe9a6,#d49a2a 54%,#9a6a14)";
  var BTN2 = "linear-gradient(180deg,#5b4731,#3b2c1c)";
  var PLATE2 = "inset 0 0 0 4px #1b120b,inset 0 0 0 5px rgba(196,154,84,.55)";
  var KIT_CSS = `
.bw-ui .bw-sheet{border-radius:18px;padding:18px 20px 18px;background:${LEATHER3};border:1px solid #8a6a3a;box-shadow:${PLATE2},0 20px 56px rgba(0,0,0,.72);color:#f4e8cc}
.bw-ui .bw-sheet .h{font:900 17px/1.25 ${DISPLAY2};letter-spacing:.8px;text-transform:uppercase;color:#f4e8cc;padding-right:44px}
.bw-ui .bw-sheet .d{color:#c9b48a}
.bw-ui .bw-sheet .chip{background:rgba(255,226,160,.1);border-color:rgba(196,154,84,.45);color:#e0b255}
.bw-ui .bw-x{border-radius:12px;background:${BTN2};border:1px solid #8a6a3a;color:#f4e8cc}
.bw-ui .bwu-pan{border-radius:18px;background:${LEATHER3};border:1px solid #8a6a3a;box-shadow:${PLATE2},0 20px 60px rgba(0,0,0,.7);color:#f4e8cc}
.bw-ui .bwu-h .t{font:900 18px/1.2 ${DISPLAY2};letter-spacing:.8px;text-transform:uppercase;color:#f4e8cc}
.bw-ui .bwu-x{border-radius:12px;background:${BTN2};border:1px solid #8a6a3a;color:#f4e8cc}
.bw-ui .bwu-b{background:rgba(255,226,160,.08);border-color:rgba(196,154,84,.4)}
.bw-ui .bwu-b .ic{color:#e0b255}.bw-ui .bwu-b .tx{color:#c9b48a}.bw-ui .bwu-b .tx i{color:#a8926a}
.bw-ui .bwu-b.busy{border-color:#b9d48a;background:rgba(150,190,90,.12)}.bw-ui .bwu-b.busy .tx{color:#e3efc4}.bw-ui .bwu-b.busy .ic{color:#c5e58b}
.bw-ui .bwu-b .bar{background:linear-gradient(90deg,#c4872a,#f5d583)}
.bw-ui .bwu-tabs{border-color:rgba(196,154,84,.25)}
.bw-ui .bwu-tab{min-height:44px;display:flex;align-items:center;justify-content:center;gap:4px;color:#c9b48a;background:rgba(255,226,160,.06)}
.bw-ui .bwu-tab.on{color:#2c1a05;background:${BRASS3};border-color:#4d300a}
.bw-ui .bwu-cat{color:#c9b48a;border-color:rgba(196,154,84,.35)}
.bw-ui .bwu-cat.on{color:#2c1a05;background:#e0b255;border-color:#4d300a}
.bw-ui .bwu-r{background:${PARCH2};border:1px solid #8a6a3a;color:#3a2a14}
.bw-ui .bwu-r.hl{border-color:#f5d583;box-shadow:0 0 0 2px #f5d583,0 0 18px rgba(245,213,131,.6)}
.bw-ui .bwu-t{background:radial-gradient(circle at 50% 30%,#4a3622,#1b120b 80%);border:2px solid #c49a54;box-shadow:inset 0 2px 5px rgba(0,0,0,.7)}
.bw-ui .bwu-m .n{color:#3a2a14}.bw-ui .bwu-m .n small{color:#8f6014}.bw-ui .bwu-m .d{color:#6d5636}
.bw-ui .bwu-cost{color:#3a2a14}.bw-ui .bwu-cost span{padding:1px 8px 1px 3px;border-radius:999px;background:rgba(58,42,20,.12);border:1px solid rgba(58,42,20,.3)}
.bw-ui .bwu-cost span.no{background:rgba(255,64,88,.2);border-color:#c0283f;color:#8a1226}.bw-ui .bwu-cost .tm{background:none;border:0;color:#6d5636}
.bw-ui .bwu-go button{min-height:44px;border:1px solid #4d300a;background:${BRASS3};color:#2c1a05;box-shadow:inset 0 1px 0 rgba(255,244,200,.85),inset 0 -3px 0 rgba(70,40,6,.55)}
.bw-ui .bwu-go button.sec{background:${BTN2};border-color:#8a6a3a;color:#f4e8cc;box-shadow:none}
.bw-ui .bwu-go button.rush{background:${BRASS22}}
.bw-ui .bwu-pr{background:#1b120b;border-color:#8a6a3a}.bw-ui .bwu-pr i{background:linear-gradient(90deg,#c4872a,#f5d583);box-shadow:none}
.bw-ui .bwu-up{color:#3a2a14}.bw-ui .bwu-note{color:#c9b48a}
.bw-ui .bwu-road b{color:#e0b255}.bw-ui .bwu-road span{color:#e6d6b0}.bw-ui .bwu-road.done b{color:#b9d48a}.bw-ui .bwu-road.done span{color:#9c8f6e}
`;

  // src/units_looks.json
  var units_looks_default = {
    _about: "AR1: which design card / sheet (web/assets/units/c_<look>.webp, s_<look>.webp) each of the 31 unit kinds shows. 'low' is shown below the unit's level 'at', 'high' from 'at' on; when low == high the kind has one look at every level. The level is the unit's own level (= the level of the building that trains it, the 'Lv' on the card). 'at' defaults to 16; for kinds that only open at building level 10 or later it is unlock level + 6 so that look 1 is seen for at least six levels (a plain 'below 16' would never show look 1 of a dragon that opens at Lv 27). Change a number here and nothing else.",
    max_level: 50,
    kinds: {
      spear: {
        low: "spearman_1",
        high: "spearman_2",
        at: 16
      },
      sword: {
        low: "greatsword_1",
        high: "greatsword_2",
        at: 16
      },
      guard: {
        low: "shieldbearer",
        high: "shieldbearer"
      },
      archer: {
        low: "archer_1",
        high: "archer_2",
        at: 16
      },
      cavalry: {
        low: "cavalry_1",
        high: "cavalry_2",
        at: 16
      },
      axerider: {
        low: "axerider_1",
        high: "axerider_2",
        at: 22
      },
      pegasus: {
        low: "pegasus_1",
        high: "pegasus_2",
        at: 18
      },
      baby: {
        low: "babydragon_1",
        high: "babydragon_2",
        at: 19
      },
      dragon: {
        low: "dragon_1",
        high: "dragon_2",
        at: 33
      },
      catapult: {
        low: "catapult_1",
        high: "catapult_2",
        at: 16
      },
      giant: {
        low: "troll_1",
        high: "troll_2",
        at: 25
      },
      imp: {
        low: "frostjinn_1",
        high: "frostjinn_2",
        at: 16
      },
      mage: {
        low: "bonemage",
        high: "bonemage"
      },
      ram: {
        low: "ram_1",
        high: "ram_2",
        at: 19
      },
      cannon: {
        low: "cannon_1",
        high: "cannon_2",
        at: 21
      },
      werewolf: {
        low: "werewolf_1",
        high: "werewolf_2",
        at: 22
      },
      trebuchet: {
        low: "trebuchet_1",
        high: "trebuchet_2",
        at: 24
      },
      hill: {
        low: "giant_1",
        high: "giant_2",
        at: 30
      },
      shieldmaiden: {
        low: "shieldmaiden",
        high: "shieldmaiden"
      },
      lord: {
        low: "lord_1",
        high: "lord_2",
        at: 26
      },
      dragonling: {
        low: "drakeling_1",
        high: "drakeling_2",
        at: 24
      },
      legionary: {
        low: "legionary_1",
        high: "legionary_2",
        at: 16
      },
      captain: {
        low: "captain",
        high: "captain"
      },
      ogre: {
        low: "biggiant_1",
        high: "biggiant_2",
        at: 28
      },
      gryphon: {
        low: "griffin_1",
        high: "griffin_2",
        at: 29
      },
      lich: {
        low: "lich",
        high: "lich"
      },
      treant: {
        low: "treant_1",
        high: "treant_2",
        at: 32
      },
      gryphonknight: {
        low: "griffinknight_1",
        high: "griffinknight_2",
        at: 31
      },
      darkrider: {
        low: "darkrider_1",
        high: "darkrider_2",
        at: 34
      },
      baby3: {
        low: "babyhydra_1",
        high: "babyhydra_2",
        at: 35
      },
      dragon3: {
        low: "hydra_1",
        high: "hydra_2",
        at: 36
      }
    },
    weak: {
      imp: "Frost Imp -> frostjinn: only the frost theme matches (a human-sized frost spirit, the in-game imp is small); change by number if wrong"
    },
    unmapped_looks: [
      "crossbowman",
      "babygiant_1",
      "babygiant_2",
      "icegiant_1",
      "icegiant_2",
      "firegiant_1",
      "firegiant_2",
      "guardian_1",
      "guardian_2"
    ]
  };

  // src/unitcards.js
  var KINDS = units_looks_default.kinds || {};
  var MAX_LEVEL = units_looks_default.max_level || unitdefs_default.max_level || 50;
  var cardUrl = (look) => `${BASE}units/c_${look}.webp`;
  var sheetUrl = (look) => `${BASE}units/s_${look}.webp`;
  var esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  if (typeof document !== "undefined") {
    document.addEventListener("error", (e) => {
      const t = e.target;
      if (!t || t.tagName !== "IMG" || !t.dataset) return;
      if (t.dataset.uk && !t.dataset.fb) {
        t.dataset.fb = "1";
        const p = PORTRAIT[t.dataset.uk];
        if (p) t.src = p;
        else t.style.visibility = "hidden";
      } else if (t.classList.contains("ucp-sheet")) {
        const b = t.closest(".ucp-sheetb");
        if (b) b.classList.add("bad");
        t.style.visibility = "hidden";
      }
    }, true);
  }
  var DISPLAY3 = "Cinzel,'Libre Baskerville',Vazirmatn,Georgia,serif";
  var FONT2 = "'Libre Baskerville','Noto Sans Tai Viet',Vazirmatn,Georgia,serif";
  var UC_CSS = `
/* --- the card tile in the army list (unit cards only: .bwa-c.u) */
.bwa-c.u{padding:0 0 5px;touch-action:pan-y}
.bwa-c.u .pic{width:100%;aspect-ratio:2/3;border-radius:13px 13px 4px 4px;background:linear-gradient(180deg,#223a66,#0b1428);position:relative;overflow:hidden}
.bwa-c.u .pic img{width:100%;height:100%;object-fit:cover;object-position:50% 0;display:block;pointer-events:none}
.bwa-c.u .pic svg{width:46%;height:46%}
.bwa-c.u .pic:after{content:"";position:absolute;left:0;right:0;bottom:0;height:34%;background:linear-gradient(0deg,rgba(2,6,16,.78),rgba(2,6,16,0));pointer-events:none}
.bwa-c.u b.nm{margin:5px 4px 0;min-height:2.3em;font-size:11.5px;line-height:1.15;justify-content:center}
.bwa-c.u .lvb{left:5px;bottom:5px;z-index:2}
.bwa-c.u .own{left:5px;top:12px;z-index:2}
.bwa-c.u .qd{right:5px;top:12px;z-index:2}
.bwa-c.u .gdb{left:5px;bottom:30px;z-index:2}
.bwa-c.u .sr{display:flex;gap:4px;justify-content:center;align-items:center;font-size:10.5px;line-height:1;color:#dcebff;margin-top:3px;white-space:nowrap;letter-spacing:-.1px}
.bwa-c.u .sr span{display:inline-flex;align-items:center;gap:1px}.bwa-c.u .sr svg{width:10px;height:10px;opacity:.85;flex:0 0 auto}
.bwa-c.u .cs{gap:2px 6px;padding:0 3px;margin-top:3px;font-size:11px}
.bwa-c.u .cs .tm{color:#9fb8da}.bwa-c.u .cs .tm svg{width:11px;height:11px;margin-right:1px}
.bwa-c.u.lk .pic img{filter:grayscale(.85) brightness(.55)}
.bwa-c.u.lk .lock{top:22%}
.bwa-c.u.full:not(.lk) .pic img{filter:saturate(.65) brightness(.82)}
/* --- the info page */
.ucp{position:absolute;inset:0;z-index:14;pointer-events:none;display:flex;flex-direction:column;box-sizing:border-box;color:#f4e8cc;font-family:${FONT2};font-weight:400;background:linear-gradient(180deg,#3c2a1b 0%,#291c11 48%,#1b120b 100%);
  opacity:0;visibility:hidden;transform:translateY(14px);transition:opacity .22s,transform .26s cubic-bezier(.22,1,.36,1),visibility 0s linear .26s;-webkit-tap-highlight-color:transparent}
.ucp.on{pointer-events:auto;opacity:1;visibility:visible;transform:none;transition:opacity .22s,transform .26s cubic-bezier(.22,1,.36,1),visibility 0s}
.ucp *{box-sizing:border-box}
.ucp-top{flex:0 0 auto;display:flex;align-items:center;gap:10px;padding:calc(var(--st) + 8px) calc(12px + var(--sr)) 8px calc(12px + var(--sl));border-bottom:1px solid rgba(196,154,84,.4);background:linear-gradient(180deg,#2c1f13,#241910)}
.ucp-back{flex:0 0 44px;width:44px;height:44px;border-radius:12px;border:1px solid #8a6a3a;background:linear-gradient(180deg,#5b4731,#3b2c1c);color:#f4e8cc;display:grid;place-items:center;padding:0;cursor:pointer;font-family:inherit}
.ucp-back svg{width:22px;height:22px}
.ucp-tt{flex:1;min-width:0}.ucp-tt b{display:block;font:900 17px/1.2 ${DISPLAY3};letter-spacing:.8px;text-transform:uppercase;color:#f4e8cc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ucp-tt span{display:block;margin-top:2px;font-size:12px;color:#c9b48a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ucp-rt{flex:0 0 auto;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:#1b120b;background:var(--rc,#c3cfe0);box-shadow:0 0 10px var(--rg,transparent)}
.ucp-sc{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:14px calc(14px + var(--sr)) calc(var(--sb) + 28px) calc(14px + var(--sl))}
.ucp-hero{display:flex;gap:13px;align-items:flex-start}
.ucp-card{flex:0 0 132px;width:132px;aspect-ratio:2/3;border-radius:12px;overflow:hidden;position:relative;border:2px solid var(--rc,#c49a54);background:linear-gradient(180deg,#223a66,#0b1428);box-shadow:0 0 0 1px #1b120b,0 6px 16px rgba(0,0,0,.55),0 0 16px var(--rg,transparent)}
.ucp-card img{width:100%;height:100%;object-fit:cover;object-position:50% 0;display:block}
.ucp-card.old img{object-fit:contain;object-position:50% 50%}
.ucp-hx{flex:1;min-width:0}
.ucp-desc{margin:0 0 9px;font-size:13px;line-height:1.55;color:#e9dcbd}
.ucp .st{display:flex;flex-wrap:wrap;gap:6px}
.ucp .st span{padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700;color:#f4e8cc;background:rgba(255,226,160,.1);border:1px solid rgba(196,154,84,.45)}
.ucp .st span em{font-style:normal;font-weight:400;opacity:.8}
.ucp .st span .gem3{width:16px;height:16px;vertical-align:-3px}
.ucp-h{margin:20px 2px 8px;font:900 13px/1.2 ${DISPLAY3};letter-spacing:1.6px;text-transform:uppercase;color:#e0b255;display:flex;align-items:center;gap:8px}
.ucp-h:after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(196,154,84,.6),rgba(196,154,84,0))}
.ucp-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:16px}
.ucp-stat{padding:8px 4px 7px;border-radius:12px;text-align:center;background:linear-gradient(180deg,#ecdcb2,#d6bf8a);border:1px solid #8a6a3a;color:#3a2a14;min-height:56px}
.ucp-stat i{display:flex;align-items:center;justify-content:center;gap:4px;font-style:normal;font-size:11px;letter-spacing:.9px;text-transform:uppercase;color:#6d5636}
.ucp-stat i svg{width:13px;height:13px}
.ucp-stat b{display:block;margin-top:3px;font:900 17px/1.1 ${DISPLAY3};color:#2c1a05}
.ucp-cost{display:flex;flex-wrap:wrap;gap:7px;margin-top:9px;align-items:center}
.ucp-cost span{display:inline-flex;align-items:center;gap:4px;padding:3px 11px 3px 5px;border-radius:999px;font-size:14px;font-weight:700;background:rgba(255,226,160,.1);border:1px solid rgba(196,154,84,.45)}
.ucp-cost span .gem3{width:20px;height:20px}
.ucp-cost span.no{border-color:#c0283f;color:#ff9aa8}
.ucp-lks{display:flex;flex-direction:column;gap:8px}
.ucp-lk{display:flex;align-items:center;gap:12px;width:100%;min-height:72px;padding:6px 12px 6px 6px;border-radius:13px;text-align:left;cursor:pointer;color:#f4e8cc;font-family:inherit;background:rgba(255,226,160,.07);border:1px solid rgba(196,154,84,.4)}
.ucp-lk.on{border-color:#e0b255;box-shadow:0 0 0 1.5px #e0b255;background:rgba(255,226,160,.14)}
.ucp-lk .th{flex:0 0 44px;width:44px;aspect-ratio:2/3;border-radius:7px;overflow:hidden;background:#0b1428;border:1px solid #8a6a3a}
.ucp-lk .th img{width:100%;height:100%;object-fit:cover;display:block}
.ucp-lk .tx{flex:1;min-width:0}.ucp-lk .tx b{display:block;font-size:14px}.ucp-lk .tx span{display:block;margin-top:2px;font-size:12px;color:#c9b48a}
.ucp-lk .tg{flex:0 0 auto;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:700;color:#2c1a05;background:linear-gradient(180deg,#f5d583,#c0892a)}
.ucp-lk .tg.dim{color:#c9b48a;background:none;border:1px solid rgba(196,154,84,.4);font-weight:400}
.ucp-sheetb{position:relative;display:flex;flex-direction:column;width:100%;margin-top:10px;padding:0;border-radius:12px;overflow:hidden;cursor:zoom-in;border:2px solid #8a6a3a;background:#14100b;box-shadow:0 0 0 1px #1b120b,0 8px 22px rgba(0,0,0,.55);color:#c9b48a;font-family:inherit;text-align:center}
.ucp-sheetb .im{position:relative;display:block;width:100%;aspect-ratio:2/3;background:#14100b}
.ucp-sheetb .im:before{content:"Loading the design sheet\u2026";position:absolute;inset:0;display:grid;place-items:center;font-size:12.5px;letter-spacing:.5px}
.ucp-sheetb.bad .im:before{content:"The design sheet is not available offline"}
.ucp-sheet{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;display:block;background:#14100b}
.ucp-zh{display:flex;align-items:center;justify-content:center;gap:7px;min-height:46px;font-size:13px;font-weight:700;color:#2c1a05;background:linear-gradient(180deg,#f5d583,#c0892a 54%,#8f6014);border-top:1px solid #4d300a}
.ucp-zh svg{width:18px;height:18px}
.ucp-trn{display:flex;flex-direction:column;gap:6px;font-size:13px;color:#e9dcbd;line-height:1.5}.ucp-trn b{color:#f4e8cc}
.ucp-note{margin:10px 2px 0;font-size:11.5px;line-height:1.6;color:#a8926a}
.ucp .bwa-gd{margin:0 0 12px;padding:10px 12px;border-radius:14px;background:rgba(255,226,160,.08);border:1px solid rgba(196,154,84,.5);text-align:center;color:#f4e8cc}
.ucp .bwa-gd>b{display:block;font-size:13px;margin-bottom:6px;color:#f4e8cc}.ucp .bwa-gd.off{opacity:.7}.ucp .bwa-gd.off span{font-size:12px;color:#c9b48a}
.ucp .bwa-gd .gc{display:flex;align-items:center;justify-content:center;gap:14px}.ucp .bwa-gd .gc em{font-style:normal;font-size:20px;font-weight:800;min-width:60px}.ucp .bwa-gd .gc em i{font-style:normal;font-size:13px;opacity:.7;font-weight:600}
.ucp .bwa-gd button{width:44px;height:44px;border-radius:12px;border:1px solid #4d300a;background:linear-gradient(180deg,#f5d583,#c0892a 54%,#8f6014);color:#2c1a05;font-size:24px;font-weight:700;line-height:1;cursor:pointer;font-family:inherit}.ucp .bwa-gd button:disabled{opacity:.4}
.ucp .bwa-gd small{display:block;margin-top:7px;font-size:11.5px;line-height:1.5;color:#c9b48a}
.ucp-gap{height:10px}
/* the zoom viewer over the page */
.ucp-zm{position:absolute;inset:0;z-index:4;pointer-events:none;display:flex;flex-direction:column;background:#0b0805;opacity:0;visibility:hidden;transition:opacity .18s,visibility 0s linear .18s}
.ucp-zm.on{pointer-events:auto;opacity:1;visibility:visible;transition:opacity .18s,visibility 0s}
.ucp-zt{flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:calc(var(--st) + 8px) calc(12px + var(--sr)) 8px calc(12px + var(--sl));background:#17100a;border-bottom:1px solid rgba(196,154,84,.4)}
.ucp-zt .hint{flex:1;min-width:0;font-size:12px;color:#c9b48a;line-height:1.3}
.ucp-zb{flex:0 0 44px;width:44px;height:44px;border-radius:12px;border:1px solid #8a6a3a;background:linear-gradient(180deg,#5b4731,#3b2c1c);color:#f4e8cc;display:grid;place-items:center;padding:0;cursor:pointer;font:700 22px/1 ${FONT2}}
.ucp-zb svg{width:20px;height:20px}
.ucp-zs{position:relative;flex:1;min-height:0;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;cursor:grab;padding-bottom:var(--sb)}
.ucp-zs img{position:absolute;left:0;top:0;width:1024px;height:1536px;max-width:none;transform-origin:0 0;will-change:transform;pointer-events:none;-webkit-user-drag:none;user-select:none}
@media (min-width:560px){.ucp-sc{padding-left:max(14px,calc(50% - 260px));padding-right:max(14px,calc(50% - 260px))}}
@media (orientation:landscape) and (max-height:560px){.ucp-hero{gap:16px}.ucp-card{flex-basis:110px;width:110px}.ucp-sheetb{max-width:min(100%,360px);margin-left:auto;margin-right:auto}}
`;
  var cssIn = false;
  function ensureCss() {
    if (cssIn || typeof document === "undefined") return;
    cssIn = true;
    const s = document.createElement("style");
    s.id = "uc-css";
    s.textContent = UC_CSS;
    document.head.appendChild(s);
  }
  var statGrid = (cells) => `<div class="ucp-stats">${cells.map(([ic, lab, val]) => `<div class="ucp-stat"><i>${ico(ic, 13)}${esc(lab)}</i><b>${esc(val)}</b></div>`).join("")}</div>`;
  var section = (title, html) => `<div class="ucp-h">${esc(title)}</div>${html}`;
  var BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
  var ZIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  var ZOUT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>';
  var ZOOMIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5M8 10.5h5M10.5 8v5"/></svg>';
  function createUnitPage(host, { onClose } = {}) {
    ensureCss();
    const el = document.createElement("div");
    el.className = "ucp";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", "Details");
    el.innerHTML = `<div class="ucp-top"><button class="ucp-back" data-uc="back" aria-label="Back">${BACK}</button><div class="ucp-tt"><b></b><span></span></div><i class="ucp-rt"></i></div><div class="ucp-sc"></div>
    <div class="ucp-zm"><div class="ucp-zt"><button class="ucp-zb" data-uc="zclose" aria-label="Close the zoom">${BACK}</button><div class="hint">Pinch, double-tap or use + / \u2212 to zoom, drag to look around</div><button class="ucp-zb" data-uc="zout" aria-label="Zoom out">${ZOUT}</button><button class="ucp-zb" data-uc="zin" aria-label="Zoom in">${ZIN}</button></div><div class="ucp-zs"><img alt="" draggable="false" decoding="async"></div></div>`;
    host.appendChild(el);
    const $ = (s) => el.querySelector(s), TT = $(".ucp-tt b"), SUB = $(".ucp-tt span"), RT = $(".ucp-rt"), SC = $(".ucp-sc"), ZM = $(".ucp-zm"), ZS = $(".ucp-zs"), ZI = ZS.querySelector("img");
    const S3 = { model: null, sel: 0, open: false };
    function html(m) {
      const lk = m.looks && m.looks[S3.sel] || null, multi = m.looks && m.looks.length > 1;
      const card = lk ? `<div class="ucp-card">${`<img data-uk="${esc(m.kind || "")}" src="${cardUrl(lk.look)}" alt="" decoding="async">`}</div>` : `<div class="ucp-card old">${m.cardOld || ""}</div>`;
      const rows = m.looks && m.looks.length ? `<div class="ucp-lks">${m.looks.map((x, i) => `<button class="ucp-lk${i === S3.sel ? " on" : ""}" data-uc="look" data-i="${i}"><span class="th"><img src="${cardUrl(x.look)}" alt="" loading="lazy" decoding="async"></span><span class="tx"><b>${esc(x.label)}</b><span>${esc(x.range)}</span></span>${x.tag ? `<span class="tg${x.tagDim ? " dim" : ""}">${esc(x.tag)}</span>` : ""}</button>`).join("")}</div>` : "";
      const sheet = lk ? `<button class="ucp-sheetb" data-uc="zoom" aria-label="Zoom the design sheet"><span class="im"><img class="ucp-sheet" src="${sheetUrl(lk.look)}" alt="" loading="lazy" decoding="async"></span><span class="ucp-zh">${ZOOMIC}Tap to zoom \xB7 pinch to look closer</span></button>` : "";
      return `<div class="ucp-hero">${card}<div class="ucp-hx">${m.heroHtml || ""}</div></div>${m.topHtml || ""}
      ${lk ? section("Design sheet", (multi ? rows : "") + sheet) : ""}${m.restHtml || ""}`;
    }
    function paint(keep) {
      const m = S3.model, y = keep ? SC.scrollTop : 0;
      if (!m) return;
      TT.textContent = m.title || "";
      SUB.textContent = m.sub || "";
      if (m.chip) {
        RT.textContent = m.chip.text;
        RT.style.setProperty("--rc", m.chip.c);
        RT.style.setProperty("--rg", m.chip.g || "transparent");
        RT.style.display = "";
      } else RT.style.display = "none";
      el.style.setProperty("--rc", m.chip && m.chip.c || "#c49a54");
      el.style.setProperty("--rg", m.chip && m.chip.g || "transparent");
      SC.innerHTML = html(m);
      SC.scrollTop = y;
    }
    function open(m) {
      S3.model = m;
      S3.sel = Math.max(0, m.cur | 0);
      S3.open = true;
      zoomClose(true);
      paint(false);
      el.classList.add("on");
    }
    function refresh(m) {
      if (!S3.open) return;
      S3.model = m;
      paint(true);
    }
    function close() {
      if (!S3.open) return;
      S3.open = false;
      zoomClose(true);
      el.classList.remove("on");
      if (onClose) onClose();
    }
    const Z = { s: 1, x: 0, y: 0, W: 1, H: 1, fit: 0.3, on: false }, IW = 1024, IH = 1536, MAXS = 4.5;
    const P4 = /* @__PURE__ */ new Map();
    let g = null, lastTap = null;
    const apply = () => {
      ZI.style.transform = `translate(${Z.x}px,${Z.y}px) scale(${Z.fit * Z.s})`;
    };
    function clampXY() {
      const w = IW * Z.fit * Z.s, h = IH * Z.fit * Z.s;
      Z.x = w <= Z.W ? (Z.W - w) / 2 : Math.min(0, Math.max(Z.W - w, Z.x));
      Z.y = h <= Z.H ? (Z.H - h) / 2 : Math.min(0, Math.max(Z.H - h, Z.y));
    }
    function measure() {
      const r = ZS.getBoundingClientRect();
      Z.W = Math.max(1, r.width);
      Z.H = Math.max(1, r.height - (parseFloat(getComputedStyle(ZS).paddingBottom) || 0));
      Z.fit = Math.min(Z.W / IW, Z.H / IH);
    }
    function zoomTo(s, cx, cy) {
      s = Math.max(1, Math.min(MAXS, s));
      const k = Z.fit * Z.s, ix = (cx - Z.x) / k, iy = (cy - Z.y) / k;
      Z.s = s;
      const k2 = Z.fit * s;
      Z.x = cx - ix * k2;
      Z.y = cy - iy * k2;
      clampXY();
      apply();
    }
    function zoomOpen() {
      const lk = S3.model && S3.model.looks && S3.model.looks[S3.sel];
      if (!lk) return;
      ZI.src = sheetUrl(lk.look);
      ZM.classList.add("on");
      Z.on = true;
      measure();
      Z.s = 1;
      Z.x = 0;
      Z.y = 0;
      clampXY();
      apply();
    }
    function zoomClose(quiet) {
      if (!Z.on && !quiet) return;
      Z.on = false;
      ZM.classList.remove("on");
      P4.clear();
      g = null;
    }
    const mid = () => {
      const a = [...P4.values()];
      return { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2, d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1 };
    };
    const local = (e) => {
      const r = ZS.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    ZS.addEventListener("pointerdown", (e) => {
      try {
        ZS.setPointerCapture(e.pointerId);
      } catch (_) {
      }
      const p = local(e);
      P4.set(e.pointerId, { x: p.x, y: p.y, x0: p.x, y0: p.y, t0: e.timeStamp });
      if (P4.size === 2) {
        const m = mid();
        g = { mode: "pinch", d0: m.d, s0: Z.s, ix: (m.x - Z.x) / (Z.fit * Z.s), iy: (m.y - Z.y) / (Z.fit * Z.s) };
        lastTap = null;
      } else if (P4.size === 1) g = { mode: "pan", x: Z.x, y: Z.y, px: p.x, py: p.y, moved: false };
    });
    ZS.addEventListener("pointermove", (e) => {
      const q = P4.get(e.pointerId);
      if (!q || !g) return;
      const p = local(e);
      q.x = p.x;
      q.y = p.y;
      if (g.mode === "pinch" && P4.size >= 2) {
        const m = mid();
        Z.s = Math.max(1, Math.min(MAXS, g.s0 * m.d / g.d0));
        const k = Z.fit * Z.s;
        Z.x = m.x - g.ix * k;
        Z.y = m.y - g.iy * k;
        clampXY();
        apply();
      } else if (g.mode === "pan" && P4.size === 1) {
        if (Math.hypot(p.x - g.px, p.y - g.py) > 4) g.moved = true;
        Z.x = g.x + (p.x - g.px);
        Z.y = g.y + (p.y - g.py);
        clampXY();
        apply();
      }
    });
    const up = (e) => {
      const q = P4.get(e.pointerId);
      if (!q) return;
      P4.delete(e.pointerId);
      const tap = e.type === "pointerup" && g && g.mode === "pan" && !g.moved && e.timeStamp - q.t0 < 350;
      if (P4.size === 1 && g && g.mode === "pinch") {
        const r = [...P4.values()][0];
        g = { mode: "pan", x: Z.x, y: Z.y, px: r.x, py: r.y, moved: true };
      } else if (P4.size === 0) g = null;
      if (tap) {
        const now = e.timeStamp;
        if (lastTap && now - lastTap.t < 320 && Math.hypot(q.x - lastTap.x, q.y - lastTap.y) < 28) {
          zoomTo(Z.s > 1.05 ? 1 : 2.6, q.x, q.y);
          lastTap = null;
        } else lastTap = { t: now, x: q.x, y: q.y };
      }
    };
    ZS.addEventListener("pointerup", up);
    ZS.addEventListener("pointercancel", up);
    ZS.addEventListener("wheel", (e) => {
      e.preventDefault();
      const p = local(e);
      zoomTo(Z.s * Math.exp(-e.deltaY * 22e-4), p.x, p.y);
    }, { passive: false });
    window.addEventListener("resize", () => {
      if (Z.on) {
        measure();
        clampXY();
        apply();
      }
    });
    el.addEventListener("click", (e) => {
      const t = e.target.closest("[data-uc]");
      if (t) {
        const a = t.dataset.uc;
        if (a === "back") return close();
        if (a === "zoom") return zoomOpen();
        if (a === "zclose") return zoomClose();
        if (a === "zin") return zoomTo(Z.s * 1.5, Z.W / 2, Z.H / 2);
        if (a === "zout") return zoomTo(Z.s / 1.5, Z.W / 2, Z.H / 2);
        if (a === "look") {
          const i = +t.dataset.i;
          if (i !== S3.sel) {
            S3.sel = i;
            paint(true);
          }
          return;
        }
      }
      if (S3.model && S3.model.onAction) S3.model.onAction(e);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && S3.open) {
        if (Z.on) zoomClose();
        else close();
      }
    });
    return { open, refresh, close, isOpen: () => S3.open, el };
  }
  if (typeof window !== "undefined" && !window.BW_chars) {
    window.BW_unitcards = { BASE, createUnitPage, ensureCss, statGrid, section, cardUrl, sheetUrl, esc };
    let loading = null;
    window.BW_chars = {
      stub: true,
      open(key) {
        if (!loading) loading = new Promise((ok, no) => {
          const s = document.createElement("script");
          s.src = `${BASE}units/chars.js`;
          s.onload = ok;
          s.onerror = () => {
            loading = null;
            no(new Error("chars.js not found"));
          };
          document.head.appendChild(s);
        });
        return loading.then(() => {
          if (window.BW_chars.stub) throw new Error("chars.js did not start");
          return window.BW_chars.open(key);
        });
      }
    };
  }

  // src/armyui.js
  var ICON = {
    spear: "M4 20L17 7M14 4l6-1-1 6-5-5zM4 20l-1 1M7 17l2 2",
    sword: "M20.5 3.5L10 14M14 4l6.5-.5L20 10M7.5 11.5l5 5M10 14l-5.5 5.5M3.5 20.5h2",
    guard: "M12 3l7.5 3v6c0 4.2-3.2 7.2-7.5 9-4.3-1.8-7.5-4.8-7.5-9V6zM12 7v11M8 11h8",
    archer: "M7 3c10 3 10 15 0 18M7 3v18M3 12h16M15.5 8.5L19 12l-3.5 3.5",
    cavalry: "M5 20v-6l2-5 4 1 2-4 4 2-1 4 3 3v5M9 20v-4M16 20v-4M11 9l2 2",
    axerider: "M4 21v-5l2-4 3 1 2-3 3 1M8 21v-3M13 21v-3M12 10l7-7M15 3l5 1-1 5-3-2",
    pegasus: "M4 20v-5l3-4 3 1 2-3M10 12l9-8c1 6-1 10-6 11M8 20v-4M14 20v-4M13 9c-3-1-5 0-6 2",
    baby: "M5 17c0-5 4-9 9-9l4-3-1 5c2 2 1 6-3 7l-2 3-3-2zM10 11h.01",
    dragon: "M3 15c3-1 4-5 8-6l1-5 3 3 5-1-3 4c1 4-3 9-8 9-3 0-5-1-6-4zM12 12h.01",
    catapult: "M3 19h18M6 19l3-8M14 19l-3-8M9 11l8-7M17 4l3 1-1 3M4 21h3M14 21h3",
    giant: "M9 4h6l1 5-2 2v4l2 5h-3l-1-4-1 4H8l2-5v-4L8 9z",
    imp: "M6 5l3 3M18 5l-3 3M7 9h10l1 6-3 5H9l-3-5zM9 12h.01M15 12h.01M10 16h4",
    mage: "M12 2l5 9H7zM5 11h14M9 14a3 3 0 0 0 6 0M10 20l2-3 2 3M12 22v0",
    ram: "M3 15h14l3-3v-2l-3-1H6l-3 3zM6 15v4M14 15v4M17 9l3-2",
    cannon: "M3 14h13l5-4v6l-5-2H3zM7 17v3M13 17v3M4 20h12",
    werewolf: "M5 20l1-8 3-3-1-5 4 3 4-3-1 5 3 3 1 8M9 13h.01M15 13h.01M10 17h4",
    trebuchet: "M4 20h14M7 20l3-12M15 20l-3-12M10 8l8-4M18 4l2 1-1 3M3 21l2-1",
    hill: "M8 4h8l1 4-2 2v3l3 7h-4l-1-5-1 5H8l3-7v-3L7 8zM17 2l4 3-2 3",
    shieldmaiden: "M12 2l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V5zM12 6v10M8 10h8M16 3l3 2",
    lord: "M3 21v-6l2-4 3 1 2-4 4 2-1 3 3 2v6M7 21v-4M14 21v-4M12 5l3-3 2 2",
    dragonling: "M8 8l-2-4 4 2M16 8l2-4-4 2M7 9h10l1 5-3 4H9l-3-4zM3 11l4 1M21 11l-4 1M10 12h.01M14 12h.01",
    legionary: "M6 4h12v9c0 4-3 6-6 8-3-2-6-4-6-8zM12 6v12M9 11h6M19 3l-5 5",
    captain: "M12 2l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V5zM12 2v18M5 7h14M9 14l3-3 3 3",
    ogre: "M7 5h10l2 5-2 5v5h-3v-3h-4v3H7v-5L5 10zM9 10h.01M15 10h.01M9 14h6M19 3l2 5",
    gryphon: "M4 18l5-4 3 1 4-6 4 2-3 3 1 4-4 1-3 3-3-2zM12 9l-2-5M16 7l1-4M8 14h.01",
    lich: "M12 2l5 9H7zM8 11v4a4 4 0 0 0 8 0v-4M10 20l2-3 2 3M12 7h.01M9 14l-4 4M15 14l4 4",
    treant: "M12 22v-8M12 14l-5-4M12 14l5-4M12 10l-4-5M12 10l4-5M12 8V3M9 22h6",
    gryphonknight: "M3 19l5-4 3 1 4-6 4 2-3 3 1 4-4 1-3 3-3-2zM13 9l-2-5M17 7l1-4M12 3l3 1",
    darkrider: "M3 15c3-1 4-5 8-6l1-5 3 3 5-1-3 4c1 4-3 9-8 9-3 0-5-1-6-4zM12 12h.01M7 4l2 3M3 8l3 2",
    baby3: "M12 14c-3 0-5-2-5-5l1-4 2 3 2-3 2 3 2-3 1 4c0 3-2 5-5 5zM8 20l4-6 4 6M10 9h.01M14 9h.01",
    dragon3: "M3 15c3-1 4-5 8-6M12 14c-3 0-6-3-6-8l2 3 2-5 2 5 2-5 2 5 2-3c0 5-3 8-6 8zM12 14l-4 7M12 14l4 7M9 6h.01M15 6h.01",
    ready: "M5 19L17 7M14 6h4v4M4 20l2-2M19 19L7 7M10 6H6v4M20 20l-2-2"
  };
  var icon = (k, sz = 26) => `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${ICON[k] || ICON.ready}"/></svg>`;

  // src/cups.js
  var LEAGUES = [
    ["steel", "Steel", 0, "#a9b8cc"],
    ["azure", "Azure", 300, "#7cc8ff"],
    ["sapphire", "Sapphire", 700, "#3f8cff"],
    ["cobalt", "Cobalt", 1200, "#5f86ff"],
    ["obsidian", "Obsidian", 1900, "#9fd8ff"],
    ["crown", "Blue Crown", 2800, "#43e0ff"]
  ].map(([id, name, from, color]) => ({ id, name, from, color }));
  var leagueIdx = (t) => {
    let i = 0;
    for (let k = 0; k < LEAGUES.length; k++) if (t >= LEAGUES[k].from) i = k;
    return i;
  };
  var mix = (a, b, k) => {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const x = p(a), y = p(b);
    return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, "0")).join("");
  };
  var uid = 0;
  var SHIELD2 = "M32 3L58 12V35C58 51 47 62 32 69C17 62 6 51 6 35V12Z";
  var ORN = [
    (c) => `<path d="M20 38L32 29L44 38" fill="none" stroke="${c}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    (c) => `<path d="M20 42L32 33L44 42M20 31L32 22L44 31" fill="none" stroke="${c}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>`,
    (c) => `<path d="M20 46L32 38L44 46M20 36L32 28L44 36M20 26L32 18L44 26" fill="none" stroke="${c}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    (c) => `<path d="M32 17L36.4 28.6L48.8 29.4L39.2 37.2L42.4 49.2L32 42.4L21.6 49.2L24.8 37.2L15.2 29.4L27.6 28.6Z" fill="${c}" stroke="${c}" stroke-width="1.5" stroke-linejoin="round"/>`,
    (c) => `<path d="M32 15L47 35L32 55L17 35Z" fill="none" stroke="${c}" stroke-width="3.4" stroke-linejoin="round"/><path d="M32 24L40 35L32 46L24 35Z" fill="${c}"/>`,
    (c) => `<path d="M16 48L16 26L25 36L32 20L39 36L48 26L48 48Z" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/><path d="M16 53H48" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/>`
  ];
  function leagueBadge(i, sz = 64, cls = "lgb") {
    const L = LEAGUES[Math.max(0, Math.min(5, i))], c = L.color, id = "lg" + uid++, dark = i === 4;
    const t = dark ? "#33415f" : mix(c, "#ffffff", 0.18), m = dark ? "#0b1022" : mix(c, "#0b2350", 0.52), b = dark ? "#02040a" : "#071634";
    const orn = dark ? "#bfe8ff" : mix(c, "#ffffff", i === 5 ? 0.9 : 0.72);
    const glow = i === 5 ? `filter:drop-shadow(0 0 5px ${c})` : i >= 3 ? `filter:drop-shadow(0 0 3px ${mix(c, "#000000", 0.3)})` : "";
    return `<svg class="${cls}" viewBox="0 0 64 72" width="${sz}" height="${Math.round(sz * 72 / 64)}" style="display:block;${glow}" aria-label="${L.name}"><defs>
    <linearGradient id="${id}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t}"/><stop offset=".55" stop-color="${m}"/><stop offset="1" stop-color="${b}"/></linearGradient>
    <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="${c}"/><stop offset="1" stop-color="${mix(c, "#06122b", 0.5)}"/></linearGradient></defs>
    <path d="${SHIELD2}" fill="url(#${id}a)" stroke="url(#${id}b)" stroke-width="3.2" stroke-linejoin="round"/>
    <path d="${SHIELD2}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="1" transform="translate(32 36) scale(.82) translate(-32 -36)"/>
    ${ORN[Math.max(0, Math.min(5, i))](orn)}</svg>`;
  }

  // src/logos.js
  var PICK = "B";
  var S2 = {
    A: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="bwlabl" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#d4e6f8"/><stop offset=".5" stop-color="#8aa6c6"/><stop offset="1" stop-color="#46618a"/></linearGradient><linearGradient id="bwlagd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f7ff"/><stop offset=".45" stop-color="#8ea8c8"/><stop offset="1" stop-color="#34496b"/></linearGradient><linearGradient id="bwlagp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4f8f"/><stop offset="1" stop-color="#0b1c42"/></linearGradient><radialGradient id="bwlapm" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#c9f1ff"/><stop offset=".5" stop-color="#4fb6f2"/><stop offset="1" stop-color="#1b5aa8"/></radialGradient><radialGradient id="bwlagl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9fe6ff" stop-opacity=".75"/><stop offset=".6" stop-color="#4aa8ff" stop-opacity=".22"/><stop offset="1" stop-color="#4aa8ff" stop-opacity="0"/></radialGradient><linearGradient id="bwlash" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f86d6"/><stop offset=".55" stop-color="#1c4a98"/><stop offset="1" stop-color="#0a1f4d"/></linearGradient></defs><circle cx="50" cy="48" r="44" fill="url(#bwlagl)"/><g opacity=".9"><path d="M50 8 L52 30 L50 34 L48 30Z M50 92 L52 70 L50 66 L48 70Z" fill="#bfeaff" opacity=".0"/></g><g transform="translate(50 70) rotate(0) scale(1.12)"><path d="M-4.2 -4 L-4.2 -48 L0 -62 L0 -4Z" fill="url(#bwlabl)" /><path d="M0 -4 L0 -62 L4.2 -48 L4.2 -4Z" fill="#6d8bb2"/><path d="M-4.2 -4 L-4.2 -48 L0 -62 L4.2 -48 L4.2 -4Z" fill="none" stroke="#071229" stroke-width="1.1" stroke-linejoin="round"/><path d="M0 -9 L0 -44" stroke="#4c668c" stroke-width="1.3" stroke-linecap="round"/><path d="M-3.1 -5 L-3.1 -47" stroke="#fff" stroke-width=".7" opacity=".9" stroke-linecap="round"/><path d="M-15 1 Q-15 -3.5 -11 -4.3 L11 -4.3 Q15 -3.5 15 1 Q13 2.2 10 1 L-10 1 Q-13 2.2 -15 1Z" fill="url(#bwlagd)" stroke="#071229" stroke-width="1" stroke-linejoin="round"/><circle cx="-15" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/><circle cx="15" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/><rect x="-2.3" y="1.5" width="4.6" height="15" rx="1.6" fill="url(#bwlagp)" stroke="#071229" stroke-width=".9"/><path d="M-2.3 4.0 L2.3 5.4" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 7.2 L2.3 8.600000000000001" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 10.4 L2.3 11.8" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 13.600000000000001 L2.3 15.000000000000002" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><circle cx="0" cy="19.6" r="3.9" fill="url(#bwlagd)" stroke="#071229" stroke-width=".9"/><circle cx="0" cy="19.6" r="1.7" fill="url(#bwlapm)"/></g></svg>`,
    B: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="bwlbbl" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#d4e6f8"/><stop offset=".5" stop-color="#8aa6c6"/><stop offset="1" stop-color="#46618a"/></linearGradient><linearGradient id="bwlbgd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f7ff"/><stop offset=".45" stop-color="#8ea8c8"/><stop offset="1" stop-color="#34496b"/></linearGradient><linearGradient id="bwlbgp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4f8f"/><stop offset="1" stop-color="#0b1c42"/></linearGradient><radialGradient id="bwlbpm" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#c9f1ff"/><stop offset=".5" stop-color="#4fb6f2"/><stop offset="1" stop-color="#1b5aa8"/></radialGradient><radialGradient id="bwlbgl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9fe6ff" stop-opacity=".75"/><stop offset=".6" stop-color="#4aa8ff" stop-opacity=".22"/><stop offset="1" stop-color="#4aa8ff" stop-opacity="0"/></radialGradient><linearGradient id="bwlbsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f86d6"/><stop offset=".55" stop-color="#1c4a98"/><stop offset="1" stop-color="#0a1f4d"/></linearGradient></defs><circle cx="50" cy="48" r="44" fill="url(#bwlbgl)"/><g transform="translate(34 72) rotate(42) scale(1.05)"><path d="M-3.9 -4 L-3.9 -50 L0 -64 L0 -4Z" fill="url(#bwlbbl)" /><path d="M0 -4 L0 -64 L3.9 -50 L3.9 -4Z" fill="#6d8bb2"/><path d="M-3.9 -4 L-3.9 -50 L0 -64 L3.9 -50 L3.9 -4Z" fill="none" stroke="#071229" stroke-width="1.1" stroke-linejoin="round"/><path d="M0 -9 L0 -46" stroke="#4c668c" stroke-width="1.3" stroke-linecap="round"/><path d="M-2.8 -5 L-2.8 -49" stroke="#fff" stroke-width=".7" opacity=".9" stroke-linecap="round"/><path d="M-12.5 1 Q-12.5 -3.5 -8.5 -4.3 L8.5 -4.3 Q12.5 -3.5 12.5 1 Q10.5 2.2 7.5 1 L-7.5 1 Q-10.5 2.2 -12.5 1Z" fill="url(#bwlbgd)" stroke="#071229" stroke-width="1" stroke-linejoin="round"/><circle cx="-12.5" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/><circle cx="12.5" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/><rect x="-2.3" y="1.5" width="4.6" height="15" rx="1.6" fill="url(#bwlbgp)" stroke="#071229" stroke-width=".9"/><path d="M-2.3 4.0 L2.3 5.4" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 7.2 L2.3 8.600000000000001" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 10.4 L2.3 11.8" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 13.600000000000001 L2.3 15.000000000000002" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><circle cx="0" cy="19.6" r="3.9" fill="url(#bwlbgd)" stroke="#071229" stroke-width=".9"/><circle cx="0" cy="19.6" r="1.7" fill="url(#bwlbpm)"/></g><g transform="translate(66 72) rotate(-42) scale(1.05)"><path d="M-3.9 -4 L-3.9 -50 L0 -64 L0 -4Z" fill="url(#bwlbbl)" /><path d="M0 -4 L0 -64 L3.9 -50 L3.9 -4Z" fill="#6d8bb2"/><path d="M-3.9 -4 L-3.9 -50 L0 -64 L3.9 -50 L3.9 -4Z" fill="none" stroke="#071229" stroke-width="1.1" stroke-linejoin="round"/><path d="M0 -9 L0 -46" stroke="#4c668c" stroke-width="1.3" stroke-linecap="round"/><path d="M-2.8 -5 L-2.8 -49" stroke="#fff" stroke-width=".7" opacity=".9" stroke-linecap="round"/><path d="M-12.5 1 Q-12.5 -3.5 -8.5 -4.3 L8.5 -4.3 Q12.5 -3.5 12.5 1 Q10.5 2.2 7.5 1 L-7.5 1 Q-10.5 2.2 -12.5 1Z" fill="url(#bwlbgd)" stroke="#071229" stroke-width="1" stroke-linejoin="round"/><circle cx="-12.5" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/><circle cx="12.5" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/><rect x="-2.3" y="1.5" width="4.6" height="15" rx="1.6" fill="url(#bwlbgp)" stroke="#071229" stroke-width=".9"/><path d="M-2.3 4.0 L2.3 5.4" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 7.2 L2.3 8.600000000000001" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 10.4 L2.3 11.8" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 13.600000000000001 L2.3 15.000000000000002" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><circle cx="0" cy="19.6" r="3.9" fill="url(#bwlbgd)" stroke="#071229" stroke-width=".9"/><circle cx="0" cy="19.6" r="1.7" fill="url(#bwlbpm)"/></g></svg>`,
    C: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="bwlcbl" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#d4e6f8"/><stop offset=".5" stop-color="#8aa6c6"/><stop offset="1" stop-color="#46618a"/></linearGradient><linearGradient id="bwlcgd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f7ff"/><stop offset=".45" stop-color="#8ea8c8"/><stop offset="1" stop-color="#34496b"/></linearGradient><linearGradient id="bwlcgp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4f8f"/><stop offset="1" stop-color="#0b1c42"/></linearGradient><radialGradient id="bwlcpm" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#c9f1ff"/><stop offset=".5" stop-color="#4fb6f2"/><stop offset="1" stop-color="#1b5aa8"/></radialGradient><radialGradient id="bwlcgl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9fe6ff" stop-opacity=".75"/><stop offset=".6" stop-color="#4aa8ff" stop-opacity=".22"/><stop offset="1" stop-color="#4aa8ff" stop-opacity="0"/></radialGradient><linearGradient id="bwlcsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f86d6"/><stop offset=".55" stop-color="#1c4a98"/><stop offset="1" stop-color="#0a1f4d"/></linearGradient></defs><circle cx="50" cy="48" r="44" fill="url(#bwlcgl)"/><g transform="translate(50 52) scale(1.08)"><path d="M-20 -22 L20 -22 L20 2 Q20 18 0 28 Q-20 18 -20 2Z" fill="url(#bwlcsh)" stroke="#071229" stroke-width="2" stroke-linejoin="round"/><path d="M-20 -22 L20 -22 L20 2 Q20 18 0 28 Q-20 18 -20 2Z" fill="none" stroke="url(#bwlcgd)" stroke-width="2.6" stroke-linejoin="round" transform="scale(.93)"/><path d="M0 -22 L0 28" stroke="#cfe6ff" stroke-width=".9" opacity=".35"/></g><g transform="translate(50 66) rotate(0) scale(0.95)"><path d="M-4.0 -4 L-4.0 -46 L0 -60 L0 -4Z" fill="url(#bwlcbl)" /><path d="M0 -4 L0 -60 L4.0 -46 L4.0 -4Z" fill="#6d8bb2"/><path d="M-4.0 -4 L-4.0 -46 L0 -60 L4.0 -46 L4.0 -4Z" fill="none" stroke="#071229" stroke-width="1.1" stroke-linejoin="round"/><path d="M0 -9 L0 -42" stroke="#4c668c" stroke-width="1.3" stroke-linecap="round"/><path d="M-2.9 -5 L-2.9 -45" stroke="#fff" stroke-width=".7" opacity=".9" stroke-linecap="round"/><path d="M-15 1 Q-15 -3.5 -11 -4.3 L11 -4.3 Q15 -3.5 15 1 Q13 2.2 10 1 L-10 1 Q-13 2.2 -15 1Z" fill="url(#bwlcgd)" stroke="#071229" stroke-width="1" stroke-linejoin="round"/><circle cx="-15" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/><circle cx="15" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/><rect x="-2.3" y="1.5" width="4.6" height="15" rx="1.6" fill="url(#bwlcgp)" stroke="#071229" stroke-width=".9"/><path d="M-2.3 4.0 L2.3 5.4" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 7.2 L2.3 8.600000000000001" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 10.4 L2.3 11.8" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 13.600000000000001 L2.3 15.000000000000002" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><circle cx="0" cy="19.6" r="3.9" fill="url(#bwlcgd)" stroke="#071229" stroke-width=".9"/><circle cx="0" cy="19.6" r="1.7" fill="url(#bwlcpm)"/></g></svg>`,
    D: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="bwldbl" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#d4e6f8"/><stop offset=".5" stop-color="#8aa6c6"/><stop offset="1" stop-color="#46618a"/></linearGradient><linearGradient id="bwldgd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f7ff"/><stop offset=".45" stop-color="#8ea8c8"/><stop offset="1" stop-color="#34496b"/></linearGradient><linearGradient id="bwldgp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4f8f"/><stop offset="1" stop-color="#0b1c42"/></linearGradient><radialGradient id="bwldpm" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#c9f1ff"/><stop offset=".5" stop-color="#4fb6f2"/><stop offset="1" stop-color="#1b5aa8"/></radialGradient><radialGradient id="bwldgl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9fe6ff" stop-opacity=".75"/><stop offset=".6" stop-color="#4aa8ff" stop-opacity=".22"/><stop offset="1" stop-color="#4aa8ff" stop-opacity="0"/></radialGradient><linearGradient id="bwldsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f86d6"/><stop offset=".55" stop-color="#1c4a98"/><stop offset="1" stop-color="#0a1f4d"/></linearGradient></defs><circle cx="50" cy="48" r="44" fill="url(#bwldgl)"/><g transform="translate(50 50) scale(.92)"><g transform="translate(-5 6) scale(-1 1)"><g transform="rotate(112)"><path d="M0 0 C6.2 -6.0 6.2 -21.6 0 -30 C-6.2 -21.6 -6.2 -6.0 0 0Z" fill="url(#bwldbl)" stroke="#071229" stroke-width="1.3" stroke-linejoin="round"/><path d="M0 -3.0 L0 -24.6" stroke="#7f9cc0" stroke-width=".8"/></g><g transform="rotate(98)"><path d="M0 0 C6.6 -7.6 6.6 -27.4 0 -38 C-6.6 -27.4 -6.6 -7.6 0 0Z" fill="url(#bwldbl)" stroke="#071229" stroke-width="1.3" stroke-linejoin="round"/><path d="M0 -3.8 L0 -31.2" stroke="#7f9cc0" stroke-width=".8"/></g><g transform="rotate(84)"><path d="M0 0 C7 -9.0 7 -32.4 0 -45 C-7 -32.4 -7 -9.0 0 0Z" fill="url(#bwldbl)" stroke="#071229" stroke-width="1.3" stroke-linejoin="round"/><path d="M0 -4.5 L0 -36.9" stroke="#7f9cc0" stroke-width=".8"/></g><g transform="rotate(68)"><path d="M0 0 C7 -9.4 7 -33.8 0 -47 C-7 -33.8 -7 -9.4 0 0Z" fill="url(#bwldbl)" stroke="#071229" stroke-width="1.3" stroke-linejoin="round"/><path d="M0 -4.7 L0 -38.5" stroke="#7f9cc0" stroke-width=".8"/></g><g transform="rotate(52)"><path d="M0 0 C6.6 -8.6 6.6 -31.0 0 -43 C-6.6 -31.0 -6.6 -8.6 0 0Z" fill="url(#bwldbl)" stroke="#071229" stroke-width="1.3" stroke-linejoin="round"/><path d="M0 -4.3 L0 -35.3" stroke="#7f9cc0" stroke-width=".8"/></g><g transform="rotate(36)"><path d="M0 0 C6 -7.2 6 -25.9 0 -36 C-6 -25.9 -6 -7.2 0 0Z" fill="url(#bwldbl)" stroke="#071229" stroke-width="1.3" stroke-linejoin="round"/><path d="M0 -3.6 L0 -29.5" stroke="#7f9cc0" stroke-width=".8"/></g></g><g transform="translate(5 6) scale(1 1)"><g transform="rotate(112)"><path d="M0 0 C6.2 -6.0 6.2 -21.6 0 -30 C-6.2 -21.6 -6.2 -6.0 0 0Z" fill="url(#bwldbl)" stroke="#071229" stroke-width="1.3" stroke-linejoin="round"/><path d="M0 -3.0 L0 -24.6" stroke="#7f9cc0" stroke-width=".8"/></g><g transform="rotate(98)"><path d="M0 0 C6.6 -7.6 6.6 -27.4 0 -38 C-6.6 -27.4 -6.6 -7.6 0 0Z" fill="url(#bwldbl)" stroke="#071229" stroke-width="1.3" stroke-linejoin="round"/><path d="M0 -3.8 L0 -31.2" stroke="#7f9cc0" stroke-width=".8"/></g><g transform="rotate(84)"><path d="M0 0 C7 -9.0 7 -32.4 0 -45 C-7 -32.4 -7 -9.0 0 0Z" fill="url(#bwldbl)" stroke="#071229" stroke-width="1.3" stroke-linejoin="round"/><path d="M0 -4.5 L0 -36.9" stroke="#7f9cc0" stroke-width=".8"/></g><g transform="rotate(68)"><path d="M0 0 C7 -9.4 7 -33.8 0 -47 C-7 -33.8 -7 -9.4 0 0Z" fill="url(#bwldbl)" stroke="#071229" stroke-width="1.3" stroke-linejoin="round"/><path d="M0 -4.7 L0 -38.5" stroke="#7f9cc0" stroke-width=".8"/></g><g transform="rotate(52)"><path d="M0 0 C6.6 -8.6 6.6 -31.0 0 -43 C-6.6 -31.0 -6.6 -8.6 0 0Z" fill="url(#bwldbl)" stroke="#071229" stroke-width="1.3" stroke-linejoin="round"/><path d="M0 -4.3 L0 -35.3" stroke="#7f9cc0" stroke-width=".8"/></g><g transform="rotate(36)"><path d="M0 0 C6 -7.2 6 -25.9 0 -36 C-6 -25.9 -6 -7.2 0 0Z" fill="url(#bwldbl)" stroke="#071229" stroke-width="1.3" stroke-linejoin="round"/><path d="M0 -3.6 L0 -29.5" stroke="#7f9cc0" stroke-width=".8"/></g></g></g><g transform="translate(50 72) rotate(0) scale(1.0)"><path d="M-4.0 -4 L-4.0 -46 L0 -60 L0 -4Z" fill="url(#bwldbl)" /><path d="M0 -4 L0 -60 L4.0 -46 L4.0 -4Z" fill="#6d8bb2"/><path d="M-4.0 -4 L-4.0 -46 L0 -60 L4.0 -46 L4.0 -4Z" fill="none" stroke="#071229" stroke-width="1.1" stroke-linejoin="round"/><path d="M0 -9 L0 -42" stroke="#4c668c" stroke-width="1.3" stroke-linecap="round"/><path d="M-2.9 -5 L-2.9 -45" stroke="#fff" stroke-width=".7" opacity=".9" stroke-linecap="round"/><path d="M-11 1 Q-11 -3.5 -7 -4.3 L7 -4.3 Q11 -3.5 11 1 Q9 2.2 6 1 L-6 1 Q-9 2.2 -11 1Z" fill="url(#bwldgd)" stroke="#071229" stroke-width="1" stroke-linejoin="round"/><circle cx="-11" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/><circle cx="11" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/><rect x="-2.3" y="1.5" width="4.6" height="15" rx="1.6" fill="url(#bwldgp)" stroke="#071229" stroke-width=".9"/><path d="M-2.3 4.0 L2.3 5.4" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 7.2 L2.3 8.600000000000001" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 10.4 L2.3 11.8" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 13.600000000000001 L2.3 15.000000000000002" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><circle cx="0" cy="19.6" r="3.9" fill="url(#bwldgd)" stroke="#071229" stroke-width=".9"/><circle cx="0" cy="19.6" r="1.7" fill="url(#bwldpm)"/></g></svg>`,
    E: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="bwlebl" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#d4e6f8"/><stop offset=".5" stop-color="#8aa6c6"/><stop offset="1" stop-color="#46618a"/></linearGradient><linearGradient id="bwlegd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f7ff"/><stop offset=".45" stop-color="#8ea8c8"/><stop offset="1" stop-color="#34496b"/></linearGradient><linearGradient id="bwlegp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4f8f"/><stop offset="1" stop-color="#0b1c42"/></linearGradient><radialGradient id="bwlepm" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#c9f1ff"/><stop offset=".5" stop-color="#4fb6f2"/><stop offset="1" stop-color="#1b5aa8"/></radialGradient><radialGradient id="bwlegl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9fe6ff" stop-opacity=".75"/><stop offset=".6" stop-color="#4aa8ff" stop-opacity=".22"/><stop offset="1" stop-color="#4aa8ff" stop-opacity="0"/></radialGradient><linearGradient id="bwlesh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f86d6"/><stop offset=".55" stop-color="#1c4a98"/><stop offset="1" stop-color="#0a1f4d"/></linearGradient><linearGradient id="bwlegl2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#4aa8ff" stop-opacity="0"/><stop offset=".6" stop-color="#9fe6ff" stop-opacity=".9"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs><circle cx="50" cy="48" r="44" fill="url(#bwlegl)"/><path d="M10 80 C26 36 60 14 92 16 C66 26 40 46 10 80Z" fill="url(#bwlegl2)" opacity=".95"/><path d="M16 84 C34 44 64 26 90 26 C64 34 42 54 16 84Z" fill="#8fe0ff" opacity=".35"/><g transform="translate(30 72) rotate(45) scale(1.12)"><path d="M-3.9 -4 L-3.9 -46 L0 -60 L0 -4Z" fill="url(#bwlebl)" /><path d="M0 -4 L0 -60 L3.9 -46 L3.9 -4Z" fill="#6d8bb2"/><path d="M-3.9 -4 L-3.9 -46 L0 -60 L3.9 -46 L3.9 -4Z" fill="none" stroke="#071229" stroke-width="1.1" stroke-linejoin="round"/><path d="M0 -9 L0 -42" stroke="#4c668c" stroke-width="1.3" stroke-linecap="round"/><path d="M-2.8 -5 L-2.8 -45" stroke="#fff" stroke-width=".7" opacity=".9" stroke-linecap="round"/><path d="M-13 1 Q-13 -3.5 -9 -4.3 L9 -4.3 Q13 -3.5 13 1 Q11 2.2 8 1 L-8 1 Q-11 2.2 -13 1Z" fill="url(#bwlegd)" stroke="#071229" stroke-width="1" stroke-linejoin="round"/><circle cx="-13" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/><circle cx="13" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/><rect x="-2.3" y="1.5" width="4.6" height="15" rx="1.6" fill="url(#bwlegp)" stroke="#071229" stroke-width=".9"/><path d="M-2.3 4.0 L2.3 5.4" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 7.2 L2.3 8.600000000000001" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 10.4 L2.3 11.8" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 13.600000000000001 L2.3 15.000000000000002" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><circle cx="0" cy="19.6" r="3.9" fill="url(#bwlegd)" stroke="#071229" stroke-width=".9"/><circle cx="0" cy="19.6" r="1.7" fill="url(#bwlepm)"/></g></svg>`,
    F: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="bwlfbl" x1="0" x2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#d4e6f8"/><stop offset=".5" stop-color="#8aa6c6"/><stop offset="1" stop-color="#46618a"/></linearGradient><linearGradient id="bwlfgd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1f7ff"/><stop offset=".45" stop-color="#8ea8c8"/><stop offset="1" stop-color="#34496b"/></linearGradient><linearGradient id="bwlfgp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b4f8f"/><stop offset="1" stop-color="#0b1c42"/></linearGradient><radialGradient id="bwlfpm" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#c9f1ff"/><stop offset=".5" stop-color="#4fb6f2"/><stop offset="1" stop-color="#1b5aa8"/></radialGradient><radialGradient id="bwlfgl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9fe6ff" stop-opacity=".75"/><stop offset=".6" stop-color="#4aa8ff" stop-opacity=".22"/><stop offset="1" stop-color="#4aa8ff" stop-opacity="0"/></radialGradient><linearGradient id="bwlfsh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f86d6"/><stop offset=".55" stop-color="#1c4a98"/><stop offset="1" stop-color="#0a1f4d"/></linearGradient></defs><circle cx="50" cy="48" r="44" fill="url(#bwlfgl)"/><g transform="translate(34 74) rotate(42) scale(1.0)"><path d="M-3.8 -4 L-3.8 -46 L0 -60 L0 -4Z" fill="url(#bwlfbl)" /><path d="M0 -4 L0 -60 L3.8 -46 L3.8 -4Z" fill="#6d8bb2"/><path d="M-3.8 -4 L-3.8 -46 L0 -60 L3.8 -46 L3.8 -4Z" fill="none" stroke="#071229" stroke-width="1.1" stroke-linejoin="round"/><path d="M0 -9 L0 -42" stroke="#4c668c" stroke-width="1.3" stroke-linecap="round"/><path d="M-2.6999999999999997 -5 L-2.6999999999999997 -45" stroke="#fff" stroke-width=".7" opacity=".9" stroke-linecap="round"/><path d="M-12 1 Q-12 -3.5 -8 -4.3 L8 -4.3 Q12 -3.5 12 1 Q10 2.2 7 1 L-7 1 Q-10 2.2 -12 1Z" fill="url(#bwlfgd)" stroke="#071229" stroke-width="1" stroke-linejoin="round"/><circle cx="-12" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/><circle cx="12" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/><rect x="-2.3" y="1.5" width="4.6" height="15" rx="1.6" fill="url(#bwlfgp)" stroke="#071229" stroke-width=".9"/><path d="M-2.3 4.0 L2.3 5.4" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 7.2 L2.3 8.600000000000001" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 10.4 L2.3 11.8" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 13.600000000000001 L2.3 15.000000000000002" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><circle cx="0" cy="19.6" r="3.9" fill="url(#bwlfgd)" stroke="#071229" stroke-width=".9"/><circle cx="0" cy="19.6" r="1.7" fill="url(#bwlfpm)"/></g><g transform="translate(66 74) rotate(-42) scale(1.0)"><path d="M-3.8 -4 L-3.8 -46 L0 -60 L0 -4Z" fill="url(#bwlfbl)" /><path d="M0 -4 L0 -60 L3.8 -46 L3.8 -4Z" fill="#6d8bb2"/><path d="M-3.8 -4 L-3.8 -46 L0 -60 L3.8 -46 L3.8 -4Z" fill="none" stroke="#071229" stroke-width="1.1" stroke-linejoin="round"/><path d="M0 -9 L0 -42" stroke="#4c668c" stroke-width="1.3" stroke-linecap="round"/><path d="M-2.6999999999999997 -5 L-2.6999999999999997 -45" stroke="#fff" stroke-width=".7" opacity=".9" stroke-linecap="round"/><path d="M-12 1 Q-12 -3.5 -8 -4.3 L8 -4.3 Q12 -3.5 12 1 Q10 2.2 7 1 L-7 1 Q-10 2.2 -12 1Z" fill="url(#bwlfgd)" stroke="#071229" stroke-width="1" stroke-linejoin="round"/><circle cx="-12" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/><circle cx="12" cy="1" r="1.9" fill="#bcd4ee" stroke="#071229" stroke-width=".8"/><rect x="-2.3" y="1.5" width="4.6" height="15" rx="1.6" fill="url(#bwlfgp)" stroke="#071229" stroke-width=".9"/><path d="M-2.3 4.0 L2.3 5.4" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 7.2 L2.3 8.600000000000001" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 10.4 L2.3 11.8" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><path d="M-2.3 13.600000000000001 L2.3 15.000000000000002" stroke="#7fc4ff" stroke-width=".8" opacity=".85"/><circle cx="0" cy="19.6" r="3.9" fill="url(#bwlfgd)" stroke="#071229" stroke-width=".9"/><circle cx="0" cy="19.6" r="1.7" fill="url(#bwlfpm)"/></g><g transform="translate(50 25) scale(0.62)"><path d="M-22 10 L-26 -14 L-12 -2 L0 -22 L12 -2 L26 -14 L22 10Z" fill="url(#bwlfgd)" stroke="#071229" stroke-width="1.8" stroke-linejoin="round"/><rect x="-22" y="10" width="44" height="8" rx="2" fill="url(#bwlfsh)" stroke="#071229" stroke-width="1.5"/><circle cx="-26" cy="-14" r="3" fill="url(#bwlfpm)" stroke="#071229" stroke-width="1"/><circle cx="0" cy="-22" r="3.4" fill="url(#bwlfpm)" stroke="#071229" stroke-width="1"/><circle cx="26" cy="-14" r="3" fill="url(#bwlfpm)" stroke="#071229" stroke-width="1"/><circle cx="-13" cy="14" r="1.5" fill="#bfeaff"/><circle cx="0" cy="14" r="1.5" fill="#bfeaff"/><circle cx="13" cy="14" r="1.5" fill="#bfeaff"/></g></svg>`
  };
  var attackLogo = (k = PICK) => S2[k] || S2[PICK];

  // src/assist.js
  var fmtN = (n) => Math.floor(n).toLocaleString("en-US");
  var fmtT = (s) => {
    s = Math.max(0, Math.ceil(s));
    const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), q = s % 60;
    return d ? d + "d " + h + "h" : h ? h + "h " + String(m).padStart(2, "0") + "m" : m + ":" + String(q).padStart(2, "0");
  };
  var I = (d, sz = 28) => `<svg viewBox="0 0 24 24" width="${sz}" height="${sz}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  var ICONS = {
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>',
    clan: '<path d="M12 3l7.5 2.6v5.6c0 4.6-3.2 8.2-7.5 9.8-4.3-1.6-7.5-5.2-7.5-9.8V5.6z"/><path d="M8.5 11.5l3.5 3 3.5-3"/>',
    friends: '<circle cx="9" cy="8.5" r="3.4"/><path d="M2.8 20c.6-3.6 3.2-5.6 6.2-5.6s5.6 2 6.2 5.6"/><path d="M18 6.5v6M15 9.5h6"/>',
    log: '<path d="M6 3.5h9.5l3.5 3.5v13.5H6z"/><path d="M9 11h7M9 14.5h7M9 18h4"/>',
    set: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1"/>',
    flag: '<path d="M6 21V4"/><path d="M6 5h11l-2.4 3.6L17 12H6"/>'
  };
  var CSS2 = `
/* ---- the Assist button: a forged steel bezel with a turning light, an enamelled core and the royal star seal; it breathes softly and pulses when something waits */
.bwh-btn{pointer-events:auto;position:absolute;-webkit-tap-highlight-color:transparent;user-select:none;-webkit-user-select:none;transition:opacity .6s,transform .15s}
.bw-ui.wel>.bwh-btn{opacity:0;pointer-events:none}
.bwh-btn{right:calc(12px + var(--sr));bottom:calc(var(--sb) + 14px);width:58px;height:58px;cursor:pointer}
.bwh-btn:active{transform:scale(.92)}
.bwh-btn .halo{position:absolute;left:-12px;top:-12px;width:82px;height:82px;border-radius:50%;background:radial-gradient(circle,rgba(120,205,255,.42) 0,rgba(70,150,255,.16) 46%,rgba(40,110,255,0) 70%);pointer-events:none;will-change:opacity,transform;animation:bwhBr 4.2s ease-in-out infinite}
@keyframes bwhBr{0%,100%{opacity:.35;transform:scale(.9)}50%{opacity:.9;transform:scale(1.04)}}
.bwh-btn .bez{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 210deg,#f4f9ff,#93a9c6 16%,#33476a 34%,#dfeaf8 52%,#6b82a6 70%,#c9d8ec 86%,#f4f9ff);box-shadow:0 5px 14px rgba(0,0,0,.6),0 0 0 1.5px #01060f,inset 0 1px 1px rgba(255,255,255,.7)}
.bwh-btn .bez:after{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,rgba(255,255,255,0) 0 64%,rgba(255,255,255,.95) 72%,rgba(190,235,255,.4) 76%,rgba(255,255,255,0) 84%);-webkit-mask:radial-gradient(circle,transparent 24.5px,#000 25.5px);mask:radial-gradient(circle,transparent 24.5px,#000 25.5px);will-change:transform;animation:bwhSp 7s linear infinite}
@keyframes bwhSp{to{transform:rotate(360deg)}}
.bwh-btn .core{position:absolute;inset:4px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 28%,#3d6db3,#0d2858 58%,#040d24);box-shadow:inset 0 2px 6px rgba(170,215,255,.45),inset 0 -4px 8px rgba(0,0,0,.6),0 0 0 1px #020a1c}
.bwh-btn .core:before{content:"";position:absolute;left:8%;right:8%;top:4%;height:44%;border-radius:50% 50% 45% 45%;background:linear-gradient(rgba(255,255,255,.28),rgba(255,255,255,0));pointer-events:none}
.bwh-btn .ico{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.7));pointer-events:none}
.bwh-btn .seal{position:absolute;left:50%;top:50%;width:40px;height:40px;margin:-20px 0 0 -20px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.65)) drop-shadow(0 0 5px rgba(120,210,255,.45));will-change:transform;animation:bwhSl 24s linear infinite}
@keyframes bwhSl{to{transform:rotate(45deg)}}
.bwh-btn .gem{position:absolute;left:50%;top:50%;width:13px;height:13px;margin:-6.5px 0 0 -6.5px;border-radius:50%;background:radial-gradient(circle at 36% 30%,#ffffff 0,#bdf0ff 22%,#47b4ff 52%,#0d4fb8 82%,#05275f);box-shadow:0 0 0 1px #02122e,0 0 7px 1px rgba(110,210,255,.6)}
.bwh-btn .gem:after{content:"";position:absolute;left:-7px;top:-7px;right:-7px;bottom:-7px;border-radius:50%;background:radial-gradient(circle,rgba(170,235,255,.85),rgba(90,190,255,0) 70%);opacity:.3;will-change:opacity;animation:bwhGm 3.1s ease-in-out infinite}
@keyframes bwhGm{0%,100%{opacity:.25}50%{opacity:1}}
.bwh-btn .pulse{position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 2px rgba(150,230,255,.9);opacity:0;pointer-events:none}
.bwh-btn.hot .pulse{will-change:transform,opacity;animation:bwhPu 2.4s ease-out infinite}
@keyframes bwhPu{0%{opacity:.9;transform:scale(1)}80%,100%{opacity:0;transform:scale(1.55)}}
.bwh-btn.tap .core{animation:bwhTp .45s ease-out}
@keyframes bwhTp{0%{filter:brightness(1.9)}100%{filter:brightness(1)}}
.bwh-btn .bd{position:absolute;right:-4px;top:-4px;min-width:20px;height:20px;padding:0 5px;box-sizing:border-box;border-radius:10px;background:linear-gradient(#7dffb5,#12a85a);border:1.5px solid #01220f;color:#031a0e;font-size:10.5px;font-weight:700;line-height:17px;text-align:center;font-variant-numeric:tabular-nums;z-index:2}
.bwh-btn .bd:empty{display:none}
@media (prefers-reduced-motion:reduce){.bwh-btn .halo,.bwh-btn .bez:after,.bwh-btn .seal,.bwh-btn .gem,.bwh-btn.hot .pulse{animation:none}}
/* the wide ATTACK tile at the top of the hub */
.bwh-a{position:relative;display:flex;align-items:center;gap:12px;margin:0 0 10px;padding:7px 14px 7px 9px;border-radius:17px;cursor:pointer;color:#eaf6ff;overflow:hidden;background:linear-gradient(180deg,rgba(70,146,246,.42),rgba(8,28,70,.7));border:1px solid rgba(150,215,255,.6);box-shadow:inset 0 1px 0 rgba(200,232,255,.32),0 4px 14px rgba(0,0,0,.4);transition:transform .12s,filter .2s}
.bwh-a:active{transform:scale(.97)}
.bwh-a:after{content:"";position:absolute;top:0;bottom:0;left:-40%;width:34%;background:linear-gradient(100deg,rgba(255,255,255,0),rgba(210,240,255,.22),rgba(255,255,255,0));transform:skewX(-18deg) translateX(0);pointer-events:none;opacity:0}
.bwh.on .bwh-a.hot:after{opacity:1;will-change:transform;animation:bwhSw 3.4s ease-in-out .6s infinite}
@keyframes bwhSw{0%{transform:skewX(-18deg) translateX(0)}55%,100%{transform:skewX(-18deg) translateX(460%)}}
.bwh-a .bz{flex:0 0 auto;width:64px;height:64px;padding:3px;box-sizing:border-box;border-radius:50%;background:conic-gradient(from 200deg,#f2f7ff,#8aa0bd 20%,#3a4d6e 40%,#d6e4f5 58%,#6d83a6 78%,#f2f7ff);box-shadow:0 3px 9px rgba(0,0,0,.5)}
.bwh-a .ring{position:relative;width:58px;height:58px;border-radius:50%;background:conic-gradient(from 0deg,#8fe8ff calc(var(--p,0) * 1%),#0a1c3e 0);box-shadow:0 0 0 1.5px #01060f}
.bwh-a .core{position:absolute;left:5px;top:5px;width:48px;height:48px;border-radius:50%;background:radial-gradient(circle at 50% 24%,#35609f,#0b1f4a 62%,#030a1c);box-shadow:inset 0 2px 6px rgba(170,215,255,.4);overflow:hidden}
.bwh-a .core svg{position:absolute;left:50%;top:50%;margin:-30px 0 0 -26px;width:52px;height:52px;display:block;filter:drop-shadow(0 2px 2px rgba(0,0,0,.6));pointer-events:none}
.bwh-a .tx{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:3px}
.bwh-a .tx b{font-size:17px;letter-spacing:2.5px;text-transform:uppercase;color:#fff;line-height:20px;text-shadow:0 0 10px rgba(130,210,255,.55)}
.bwh-a .tx small{font-size:12px;color:#a9d4ff;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.bwh-a .ch{flex:0 0 auto;width:22px;height:22px;color:#bfe6ff;opacity:.9}
.bwh-a.hot{border-color:#8fe8ff}
.bwh.on .bwh-a.hot .core:after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:inset 0 0 14px 1px rgba(140,225,255,.95);opacity:0;will-change:opacity;pointer-events:none;animation:bwhGl 2.6s ease-in-out infinite}
@keyframes bwhGl{0%,100%{opacity:0}50%{opacity:1}}
.bwh-a.off{filter:grayscale(.55) brightness(.85)}
/* ---- the hub: a royal panel (steel-rimmed, enamel-dark, a light running along its top edge), the realm's crest in the header, medallion tiles that rise in one after another */
.bwh{position:absolute;inset:0;pointer-events:auto;z-index:12;background:radial-gradient(ellipse at 50% 46%,rgba(4,16,44,.5),rgba(0,3,10,.78));opacity:0;visibility:hidden;transition:opacity .22s,visibility .22s;font-family:'Libre Baskerville','Noto Sans Tai Viet',Georgia,serif;color:#eaf6ff;-webkit-tap-highlight-color:transparent}
.bwh.on{opacity:1;visibility:visible}.bwh *{box-sizing:border-box}
.bwh-pan{position:absolute;left:50%;top:50%;width:min(344px,calc(100% - 32px - var(--sl) - var(--sr)));transform:translate(-50%,-46%) scale(.96);padding:12px 12px 14px;border-radius:24px;border:1.5px solid transparent;background:linear-gradient(180deg,#0f3068,#061331 38%,#020814) padding-box,conic-gradient(from 180deg,#dfeaf8,#5b7398 18%,#22324f 34%,#a9bedb 52%,#3b5072 70%,#c7d6ea 86%,#dfeaf8) border-box;box-shadow:0 22px 60px rgba(0,0,0,.75),inset 0 1px 0 rgba(200,230,255,.28),inset 0 0 40px rgba(60,130,255,.08);transition:transform .28s cubic-bezier(.2,.9,.25,1.1)}
.bwh-pan:before{content:"";position:absolute;left:18px;right:18px;top:-1px;height:2px;border-radius:2px;background:linear-gradient(90deg,rgba(140,220,255,0),rgba(200,240,255,.95),rgba(140,220,255,0));background-size:50% 100%;background-repeat:no-repeat;background-position:-60% 0;pointer-events:none}
.bwh.on .bwh-pan:before{animation:bwhEd 4.5s ease-in-out .3s infinite}
@keyframes bwhEd{0%{background-position:-60% 0}60%,100%{background-position:160% 0}}
.bwh.on .bwh-pan{transform:translate(-50%,-50%)}
.bwh-h{display:flex;align-items:center;gap:10px;padding:0 2px 10px}
.bwh-h .cr{flex:0 0 auto;width:36px;height:40px;display:grid;place-items:center;filter:drop-shadow(0 2px 3px rgba(0,0,0,.6))}.bwh-h .cr img{width:34px;height:auto}
.bwh-h .tt{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;line-height:1.15}
.bwh-h .tt b{font-size:16px;letter-spacing:3px;text-transform:uppercase;color:#f2f9ff;text-shadow:0 0 12px rgba(120,200,255,.45)}
.bwh-h .tt span{font-size:11px;letter-spacing:.6px;color:#8fb4e0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bwh-x{flex:0 0 auto;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;background:rgba(255,255,255,.08);border:1px solid rgba(150,200,255,.28);font-size:13px;cursor:pointer}
.bwh-x:active{transform:scale(.9)}
.bwh-sep{height:1px;margin:0 6px 10px;background:linear-gradient(90deg,rgba(140,200,255,0),rgba(160,215,255,.55),rgba(140,200,255,0))}
.bwh-g{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
.bwh-t{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:4px;padding:8px 2px 7px;min-height:92px;border-radius:16px;cursor:pointer;color:#cfe6ff;background:linear-gradient(180deg,rgba(58,120,214,.26),rgba(8,26,64,.55));border:1px solid rgba(140,205,255,.3);box-shadow:inset 0 1px 0 rgba(190,225,255,.16);transition:transform .12s,border-color .2s}
.bwh-t:active{transform:scale(.93);border-color:rgba(170,225,255,.75)}
.bwh.on .bwh-t,.bwh.on .bwh-a{animation:bwhIn .34s cubic-bezier(.2,.85,.25,1.08) both;animation-delay:calc(var(--i,0) * 26ms)}
@keyframes bwhIn{from{opacity:0;transform:translateY(10px) scale(.94)}to{opacity:1;transform:none}}
.bwh-t .ic{position:relative;width:46px;height:46px;border-radius:50%;padding:2.5px;background:conic-gradient(from 210deg,#eef5ff,#8297b6 20%,#2c3d5d 40%,#cfdcef 58%,#5e7598 78%,#eef5ff);box-shadow:0 3px 8px rgba(0,0,0,.5)}
.bwh-t .ic>i{position:absolute;inset:2.5px;border-radius:50%;display:grid;place-items:center;color:#c9ecff;background:radial-gradient(circle at 50% 26%,#2f5c9e,#0b2049 60%,#040c22);box-shadow:inset 0 2px 5px rgba(170,215,255,.35)}
.bwh-t .ic svg{width:25px;height:25px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.6))}
.bwh-t .ic img{width:34px;height:34px;display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.65))}
.bwh-t .ic .lgb{width:26px;height:auto}.bwh-t .ic .gem3{width:30px;height:30px;filter:drop-shadow(0 0 6px rgba(110,150,255,.7))}.bwh-t .ic img{width:27px;height:auto}
.bwh-t b{font-size:11.5px;letter-spacing:.4px;color:#eaf6ff;font-weight:700}
.bwh-t small{font-size:10.5px;color:#8fb4e0;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.bwh-t .bd{position:absolute;right:-3px;top:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:linear-gradient(#7dffb5,#12a85a);border:1.5px solid #01220f;color:#031a0e;font-size:10.5px;font-weight:700;line-height:17px;text-align:center}.bwh-t .bd:empty{display:none}
@media (prefers-reduced-motion:reduce){.bwh.on .bwh-t,.bwh.on .bwh-a,.bwh.on .bwh-pan:before,.bwh.on .bwh-a.hot:after{animation:none}}
@media (orientation:landscape) and (max-height:560px){.bwh-pan{width:min(520px,calc(100% - 40px - var(--sl) - var(--sr)));padding:9px 12px 10px}.bwh-h{padding-bottom:6px}.bwh-sep{margin-bottom:7px}.bwh-g{grid-template-columns:repeat(5,1fr);gap:7px}.bwh-t{min-height:80px;padding-top:6px}.bwh-t .ic{width:40px;height:40px}.bwh-t small{font-size:10px}.bwh-a{margin-bottom:7px;padding:4px 14px 4px 8px}.bwh-a .bz{transform:scale(.82);margin:-6px -4px -6px -6px}}
/* the "\u2039" back button the hub puts into a panel it opened (returns to the hub) */
.bwnav{flex:0 0 auto;width:34px;height:34px;border-radius:11px;display:grid;place-items:center;cursor:pointer;color:#dff2ff;background:linear-gradient(180deg,rgba(90,160,255,.28),rgba(20,50,110,.35));border:1px solid rgba(150,210,255,.45);box-shadow:inset 0 1px 0 rgba(200,232,255,.25);-webkit-tap-highlight-color:transparent}
.bwnav:active{transform:scale(.9)}.bwnav svg{width:18px;height:18px}
.bw-ui .bwa-btn,.bw-ui .bwa-chip,.bw-ui .bwu-btn,.bw-ui .bwk-chip{display:none!important}
`;
  var BACK2 = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
  var CHEV = '<svg class="ch" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';
  var esc2 = (x) => String(x == null ? "" : x).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  function createAssist(mount, { econ: econ2, ui: ui2, audio, army, upgrade, rank, social, shop, tg = null } = {}) {
    const host = ui2 && ui2.root || mount;
    const stEl = document.createElement("style");
    stEl.textContent = CSS2;
    document.head.appendChild(stEl);
    const btn = document.createElement("div");
    btn.className = "bwh-btn";
    btn.setAttribute("role", "button");
    btn.setAttribute("aria-label", "Assist");
    btn.innerHTML = `<i class="halo"></i><div class="bez"></div><div class="core"><img class="ico" alt="" src="${BASE}ui/assist_icon.webp?v=3"></div><i class="pulse"></i><div class="bd"></div>`;
    const hub = document.createElement("div");
    hub.className = "bwh";
    hub.innerHTML = `<div class="bwh-pan"><div class="bwh-h"><div class="cr"></div><div class="tt"><b>Assist</b><span>&nbsp;</span></div><div class="bwh-x" data-a="x" role="button" aria-label="Close">\u2715</div></div><div class="bwh-sep"></div><div class="bwh-a" data-a="attack" role="button" aria-label="Attack"><div class="bz"><div class="ring"><div class="core">${attackLogo()}</div></div></div><div class="tx"><b>Attack</b><small>&nbsp;</small></div>${CHEV}</div><div class="bwh-g"></div></div>`;
    host.appendChild(btn);
    host.appendChild(hub);
    const G = hub.querySelector(".bwh-g"), AT = hub.querySelector(".bwh-a"), ATs = AT.querySelector("small"), ATr = AT.querySelector(".ring"), CR = hub.querySelector(".bwh-h .cr"), SUB = hub.querySelector(".bwh-h .tt span");
    const S3 = { open: false, ret: null };
    const click = () => {
      audio && audio.click && audio.click();
      ui2 && ui2.haptic && ui2.haptic("light");
    };
    const now = () => econ2 && econ2.now ? econ2.now() : Date.now() / 1e3;
    const P4 = () => econ2 && econ2.st && econ2.st.prog;
    const A = () => econ2 && econ2.st && econ2.st.army;
    function paintAttack() {
      const a = A();
      if (!a || !a.fam || !a.spell) {
        AT.style.display = "none";
        return;
      }
      AT.style.display = "";
      const rd = Math.max(0, Math.min(100, Math.round(+a.ready || 0)));
      const sub = !a.attack ? "Attacks are not open yet" : a.space <= 0 ? "Train an army first" : rd + "% ready";
      if (ATs.textContent !== sub) ATs.textContent = sub;
      ATr.style.setProperty("--p", rd);
      AT.classList.toggle("hot", rd >= 80 && !!a.attack);
      AT.classList.toggle("off", !a.attack || a.space <= 0);
    }
    function tiles() {
      const p = P4(), a = A(), t = Math.max(0, econ2.st && econ2.st.tro || 0), tn = now();
      let bsub = "Kingdom";
      if (p && p.builders) {
        const busy = Object.values(p.structs || {}).filter((r) => r.up && !r.up.reserved), total = p.builders, free = Math.max(0, total - busy.length);
        if (free > 0) bsub = free + "/" + total + " free";
        else {
          const nx = busy.reduce((m, r) => Math.min(m, r.up.end), Infinity);
          bsub = isFinite(nx) ? "Next " + fmtT(nx - tn) : "All busy";
        }
      }
      let asub = "";
      if (a && a.fam) {
        const lanes = [...Object.values(a.fam).map((f) => f.q), a.spell && a.spell.q].filter((q2) => q2 && q2.length);
        if (lanes.length) {
          const fin = lanes.reduce((m, q2) => Math.max(m, q2[q2.length - 1].fin || 0), 0), n = lanes.reduce((s, q2) => s + q2.reduce((x, b) => x + (b.n || 0), 0), 0);
          asub = fmtN(n) + " \xB7 " + (fin > tn ? fmtT(fin - tn) : "done");
        } else asub = (a.ready != null ? Math.round(a.ready) : 0) + "% ready";
      }
      const tag = social && social.clanTag ? social.clanTag() : "", un = social && social.unseen ? social.unseen() : 0;
      const li = leagueIdx(t), L = [
        ["build", `<img src="${BASE}ui/build_hammer.webp?v=2" alt="">`, "Build", bsub, ""],
        ["army", icon("guard", 30), "Army", asub, ""],
        ["shop", GEMS.sap, "Shop", "Gems & chests", ""],
        ["rank", leagueBadge(li, 28), "Rank", fmtN(t) + " cups", ""],
        ["clan", I(ICONS.clan, 30), "Clan", tag ? "[" + esc2(tag) + "]" : "Join", ""],
        ["friends", I(ICONS.friends, 30), "Friends", "Invite", ""],
        ["log", I(ICONS.log, 30), "Log", un ? un + " new" : "History", un ? String(un) : ""],
        ["set", I(ICONS.set, 30), "Settings", "", ""],
        ["banner", crestImg(econ2.st && econ2.st.emblem || "swords", 30, "crest", "display:block"), "Banner", "Crest", ""]
      ];
      L.li = li;
      return L;
    }
    function paintHub() {
      paintAttack();
      const em = econ2.st && econ2.st.emblem || "swords";
      if (CR.dataset.e !== em) {
        CR.dataset.e = em;
        CR.innerHTML = crestImg(em, 34, "crest", "display:block");
      }
      const nm = econ2.st && econ2.st.name || "", lv = econ2.st && econ2.st.level || 1, sub = (nm ? nm + " \xB7 " : "") + "Keep " + lv;
      if (SUB.textContent !== sub) SUB.textContent = sub;
      const T2 = tiles(), sig = T2.map((x) => x[0] + "" + x[2]).join("") + "" + T2.li + "" + em;
      if (G.dataset.sig !== sig) {
        G.dataset.sig = sig;
        G.innerHTML = T2.map(([k, ic, l], i) => `<div class="bwh-t" data-a="${k}" role="button" style="--i:${i + 1}"><div class="ic"><i>${ic}</i></div><b>${l}</b><small>&nbsp;</small><i class="bd"></i></div>`).join("");
      }
      for (const [k, , , sub2, bd] of T2) {
        const tl = G.querySelector('[data-a="' + k + '"]');
        if (!tl) continue;
        const sm = tl.querySelector("small"), v = String(sub2 || "");
        if (sm && sm.dataset.v !== v) {
          sm.dataset.v = v;
          sm.innerHTML = v || "&nbsp;";
        }
        const b = tl.querySelector(".bd");
        if (b && b.textContent !== bd) b.textContent = bd;
      }
    }
    function tick() {
      if (S3.open && !document.hidden) paintHub();
    }
    function paintBadge() {
      const un = social && social.unseen ? social.unseen() : 0;
      const b = btn.querySelector(".bd"), s = un ? String(un) : "";
      if (b.textContent !== s) b.textContent = s;
      const a = A(), hot = !!un || !!(a && a.attack && a.space > 0 && (+a.ready || 0) >= 80);
      if (btn.classList.contains("hot") !== hot) btn.classList.toggle("hot", hot);
    }
    function openHub() {
      if (S3.open) return;
      S3.open = true;
      G.dataset.sig = "";
      paintHub();
      hub.classList.add("on");
      click();
      social && social.refresh && social.refresh();
      sync();
    }
    function closeHub() {
      if (!S3.open) return;
      S3.open = false;
      hub.classList.remove("on");
      sync();
    }
    const q = (sel) => document.querySelector(sel);
    const PANE = {
      build: { el: q(".bwu"), hd: ".bwu-h", close: () => upgrade && upgrade.close && upgrade.close() },
      army: { el: q(".bwa"), hd: ".bwa-h", close: () => army && army.close && army.close() },
      shop: { el: q(".bws"), hd: ".bws-h", close: () => shop && shop.close && shop.close() },
      rank: { el: q(".bwk:not(.bwc)"), hd: ".bwk-h", close: () => rank && rank.close && rank.close() },
      social: { el: q(".bwc"), hd: ".bwk-h", close: () => social && social.close && social.close() },
      set: { el: q(".bw-set"), hd: ".bw-ph", close: () => ui2 && ui2.openSettings && ui2.openSettings(false) }
    };
    const PANE_OF = { build: "build", army: "army", banner: "army", shop: "shop", rank: "rank", clan: "social", friends: "social", log: "social", set: "set" };
    const order = [];
    const track = () => {
      for (const k of Object.keys(PANE)) {
        const e = PANE[k].el, on = !!(e && e.classList.contains("on")), i = order.indexOf(k);
        if (on && i < 0) order.push(k);
        else if (!on && i >= 0) order.splice(i, 1);
      }
    };
    const openPane = () => {
      track();
      return order.length ? order[order.length - 1] : null;
    };
    function backBtn(k, on) {
      const P5 = PANE[k];
      if (!P5 || !P5.el) return;
      const hd = P5.el.querySelector(P5.hd);
      if (!hd) return;
      let b = hd.querySelector(":scope > .bwnav");
      if (on && !b) {
        b = document.createElement("div");
        b.className = "bwnav";
        b.setAttribute("role", "button");
        b.setAttribute("aria-label", "Back");
        b.innerHTML = BACK2;
        b.addEventListener("click", (e) => {
          e.stopPropagation();
          click();
          back();
        });
        hd.insertBefore(b, hd.firstChild);
      } else if (!on && b) b.remove();
    }
    const TB = tg && tg.BackButton && (!tg.isVersionAtLeast || tg.isVersionAtLeast("6.1")) ? tg.BackButton : null;
    let tbOn = false;
    const onTB = () => back();
    if (TB) {
      try {
        TB.onClick(onTB);
      } catch (e) {
      }
    }
    function sync() {
      const k = openPane();
      if (S3.ret && !order.includes(S3.ret)) {
        backBtn(S3.ret, false);
        S3.ret = null;
      }
      const want = S3.open || !!k;
      if (TB && want !== tbOn) {
        tbOn = want;
        try {
          if (want) TB.show();
          else TB.hide();
        } catch (e) {
        }
      }
    }
    function back() {
      if (S3.open) {
        closeHub();
        return;
      }
      const k = openPane();
      if (!k) {
        sync();
        return;
      }
      const toHub = S3.ret === k;
      PANE[k].close();
      sync();
      if (toHub && !openPane()) openHub();
    }
    if (typeof MutationObserver !== "undefined") {
      const mo = new MutationObserver(() => sync());
      for (const k of Object.keys(PANE)) if (PANE[k].el) mo.observe(PANE[k].el, { attributes: true, attributeFilter: ["class"] });
    }
    function go(k) {
      closeHub();
      if (k === "attack") army && army.attack && army.attack();
      else if (k === "build") upgrade && upgrade.open && upgrade.open();
      else if (k === "army") army && army.open && army.open();
      else if (k === "shop") shop && shop.open && shop.open();
      else if (k === "rank") rank && rank.open && rank.open();
      else if (k === "clan") social && social.open("clan");
      else if (k === "friends") social && social.open("friends");
      else if (k === "log") social && social.open("log");
      else if (k === "set") ui2 && ui2.openSettings && ui2.openSettings(true);
      else if (k === "banner") army && army.emblem && army.emblem();
      const pk = PANE_OF[k];
      if (pk && PANE[pk].el && PANE[pk].el.classList.contains("on")) {
        S3.ret = pk;
        backBtn(pk, true);
      }
      sync();
    }
    btn.addEventListener("click", () => {
      btn.classList.remove("tap");
      void btn.offsetWidth;
      btn.classList.add("tap");
      openHub();
    });
    hub.addEventListener("click", (e) => {
      const a = e.target.closest("[data-a]");
      if (!a) {
        if (e.target === hub) closeHub();
        return;
      }
      if (a.dataset.a === "x") {
        click();
        closeHub();
        return;
      }
      click();
      go(a.dataset.a);
    });
    const timer = setInterval(tick, 1e3);
    function update() {
      paintBadge();
      if (S3.open) paintHub();
    }
    update();
    return { update, openHub, closeHub, back, get isOpen() {
      return S3.open;
    }, dispose() {
      clearInterval(timer);
      if (TB) {
        try {
          TB.offClick(onTB);
          TB.hide();
        } catch (e) {
        }
      }
    } };
  }

  // ../../../../dev/ui1_r3_rig.js
  var root = document.getElementById("root");
  var ui = new UI({ mount: root, tg: null, version: "dev", onShop: () => {
  } });
  var econ = { now: () => Date.now() / 1e3, prem: () => ({ sap: 120, onyx: 8 }), st: { level: 30, vault: {}, tro: 27, prog: { builders: 3, builders_busy: 0, structs: {} }, army: { ready: 89, attack: true, space: 10, fam: { inf: { q: [] } }, spell: { q: [] } } } };
  ui.setProfile({ name: "Wingless", level: 30, cups: 27 });
  ui.setGems({ ruby: { n: 1250, cap: 79603 }, emerald: { n: 860, cap: 178e3 }, turq: { n: 3400, cap: 59562 } });
  ui.setPrem(econ.prem());
  createAssist(root, { econ, ui, audio: null, shop: { open() {
  } }, army: { open() {
  }, attack() {
  }, emblem() {
  } }, upgrade: { open() {
  } }, rank: { open() {
  } }, social: { unseen: () => 0, clanTag: () => "", open() {
  }, refresh() {
  } } });
  var hb = document.createElement("button");
  hb.className = "rp-open";
  hb.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l4.6 4.2L12 5.5l3.9 7.2 4.6-4.2-1.8 10H5.3z"/><path d="M5.8 21h12.4"/></svg>';
  hb.style.cssText = "position:absolute;z-index:6;left:10px;top:calc(env(safe-area-inset-top,0px) + 150px);width:44px;height:44px;display:flex;align-items:center;justify-content:center;border-radius:50%;border:1.5px solid rgba(205,214,224,.5);background:radial-gradient(circle at 50% 35%,rgba(66,74,84,.62),rgba(22,26,32,.72));box-shadow:0 0 12px rgba(61,245,224,.25);color:#e6ecf2";
  root.appendChild(hb);
  window.__hero = (on) => {
    root.classList.toggle("hero-on", !!on);
    hb.style.display = on ? "none" : "flex";
  };
  var TOP = "max(env(safe-area-inset-top,0px),calc(var(--tg-safe-area-inset-top,0px) + var(--tg-content-safe-area-inset-top,0px)))";
  var BOT = "max(env(safe-area-inset-bottom,0px),calc(var(--tg-safe-area-inset-bottom,0px) + var(--tg-content-safe-area-inset-bottom,0px)))";
  var st = document.createElement("style");
  st.textContent = ".rp-b{position:absolute;z-index:42;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1.5px solid rgba(205,214,224,.5);background:rgba(40,46,54,.7);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px)}.rp-perf{position:absolute;z-index:43;top:calc(" + TOP + " + 8px);right:8px;min-width:46px;padding:4px 7px}#rphud{position:absolute;inset:0;z-index:40;display:none;pointer-events:none}.hero-on #rphud{display:block}.hero-on>.bw-ui{visibility:hidden!important}";
  document.head.appendChild(st);
  var hud = document.createElement("div");
  hud.id = "rphud";
  root.appendChild(hud);
  var sb = `calc(${BOT} + `;
  for (const [id, css] of [["jump", `right:22px;bottom:${sb}92px);width:78px;height:78px`], ["dodge", `right:110px;bottom:${sb}56px);width:62px;height:62px`], ["sprint", `right:30px;bottom:${sb}186px);width:58px;height:58px`], ["cam", `left:12px;top:calc(${TOP} + 58px);width:46px;height:46px`], ["exit", `left:12px;top:calc(${TOP} + 6px);width:42px;height:42px`], ["act", `right:30px;bottom:${sb}256px);width:62px;height:62px`], ["gate", `left:12px;top:calc(${TOP} + 116px);width:46px;height:46px`]]) {
    const b = document.createElement("div");
    b.className = "rp-b rp-k";
    b.dataset.rp = id;
    b.style.cssText = css + ";pointer-events:auto";
    b.textContent = id[0];
    hud.appendChild(b);
  }
  var pf = document.createElement("div");
  pf.className = "rp-perf rp-k";
  pf.textContent = "53 fps";
  hud.appendChild(pf);
  window.__ready = true;
})();
