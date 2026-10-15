// AN1: tr2_life.js with the DEFAULT flag (Tripo animals off): the villagers load, every animal entry point says "no" (the old animated animals stay), and no animal file is requested.
import { preload, state, has, fauna, horses, gltfLike, dyn, people } from '../../bot/bluebot_v2/bluewall/client/src/tr2_life.js';
import { tr2 } from '../../bot/bluebot_v2/bluewall/client/src/tr2lib.js';
(async () => {
  try {
    await tr2.init({ base: 'assets/tr2/' });
    await preload();
    window.__res = {
      ok: state.ok, useAnimals: state.useAnimals, err: state.err,
      hasAnimal: ['animal_cow', 'animal_calf', 'animal_horse_white', 'animal_horse_brown', 'animal_horse_black', 'animal_sheep', 'animal_pig', 'animal_dog', 'animal_wolf', 'birds', 'poultry_fish_pack'].map((k) => has(k)),
      hasVill: ['villager_man', 'villager_woman', 'villager_youngman', 'villager_oldman'].map((k) => has(k)),
      fauna: fauna('animal_cow', { len: 3 }) === null, horses: horses({ len: 5 }) === null,
      gltf: gltfLike('birds/eagle', { w: 4 }) === null && gltfLike('birds/crow', { w: 2 }) === null && gltfLike('animal_dog') === null && gltfLike('poultry_fish_pack/carp', { w: 1.5 }) === null,
      dyn: dyn('poultry_fish_pack/hen', 4, { h: 0.8 }) === null,
      people: !!people('villager_man', { capacity: 4 }),
    };
    window.__ready = true;
  } catch (e) { window.__err = String((e && e.stack) || e); }
})();
