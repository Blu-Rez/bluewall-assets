import './node_stub.js';
// TR2-S4d node-side checks: the module loads without a browser, and BEFORE preload every entry point says "no" (so the old code stays in charge)
import * as TL from '../../bot/bluebot_v2/bluewall/client/src/tr2_life.js';
let bad = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad = 1; };
ok(TL.ready() === false, 'ready() is false before preload');
ok(TL.has('animal_cow') === false && TL.has('villager_man') === false, 'has() false before preload');
ok(TL.fauna('animal_cow', { len: 3 }) === null, 'fauna() → null before preload (pas_life / wslife fall back to the old cow)');
ok(TL.horses({ len: 5 }) === null, 'horses() → null before preload');
ok(TL.people('villager_man', {}) === null, 'people() → null before preload');
ok(TL.skinned('villager_man') === null, 'skinned() → null before preload (units.js keeps the old peasants)');
ok(TL.gltfLike('birds/eagle', { w: 4 }) === null, 'gltfLike() → null before preload (life.js keeps the old eagle)');
ok(TL.dyn('poultry_fish_pack/hen', 4, { h: 0.8 }) === null, 'dyn() → null before preload (life.js keeps the old hens)');
ok(TL.PEOPLE.villager_man > 1.5 && TL.PEOPLE.villager_man < 2.2, 'villager heights are in game metres (man ' + TL.PEOPLE.villager_man + ')');
ok(TL.ANIMAL_FILES.length === 12 && TL.PEOPLE_FILES.length === 4, '12 animal files + 4 villager files');
process.exit(bad);
