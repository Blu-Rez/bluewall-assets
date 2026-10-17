// layout_text.js — LY1: the words of the layout editor (plain English, no codes).  No THREE, no DOM: the editor, the sync wiring and the tests all use it.
//   whyText(codes)           the broken rules as a short sentence («On a street · Another building is in the way»)
//   nameOfId('cottage_03')   «Cottage»  (storehouses: «Timber storehouse»)
//   droppedText / nudgedText / rejectedText / statusText   the messages the player gets (never a bare «something changed»)
export const WHY = {
  WALL: 'Too close to the town wall', MOAT: 'Too close to the moat', GATE: 'Blocks the gate', MARKET: 'Too close to the market square', VAULT: 'Too close to a gem vault', STREET: 'On a street',
  RIVER: 'Too close to the river', WATER: 'Needs to stand by the water', STREAM: 'On a stream bed', DRY: 'Ground too wet', SLOPE: 'Ground too steep', OVERLAP: 'Another building is in the way', GEN: 'A house is in the way',
  UNKNOWN: 'No longer exists in this version',
};
export const NAME = { cottage: 'Cottage', craftsman: 'Craftsman house', merchant: 'Merchant house', noble: 'Noble house', tavern: 'Tavern', townhall: 'Town hall', chapel: 'Chapel', well: 'Well', sawmill: 'Sawmill', masonry: 'Masonry', smelter: 'Smelter', mint: 'Mint',
  refinery: 'Refinery', mill: 'Mill', bakery: 'Bakery', butcher: 'Butcher', smokehouse: 'Smokehouse', jeweler: 'Jeweler', store: 'Storehouse' };
export const STORE_NAME = { wood: 'Timber', stone: 'Stone', iron: 'Iron', gold: 'Gold', oil: 'Oil', food: 'Food' };
export const nameOfId = (id) => {
  const s = String(id); if (s.startsWith('store_')) return (STORE_NAME[s.slice(6)] || '') + ' storehouse';
  const k = s.replace(/_\d+$/, ''); return NAME[k] || k;
};
const low = (t) => (t ? t.charAt(0).toLowerCase() + t.slice(1) : t);
export const whyText = (codes, n = 2) => (codes && codes.length ? codes.map((w) => WHY[w] || w).slice(0, n).join(' · ') : '');
const list = (ids) => { const names = [...new Set(ids.map(nameOfId))]; return ids.length === 1 ? names[0] : names.length <= 3 ? names.join(', ') : names.slice(0, 2).join(', ') + ' +' + (names.length - 2) + ' more'; };
const reasonOf = (id, reasons) => (reasons && reasons[id] && reasons[id].length ? low(whyText(reasons[id], 1)) : '');
// the server (or this phone, on load) put buildings back on their old places: which ones and why
export function droppedText(ids, reasons, version) {
  if (!ids || !ids.length) return '';
  const rs = ids.length === 1 ? reasonOf(ids[0], reasons) : [...new Set(ids.map((i) => reasonOf(i, reasons)).filter(Boolean))].slice(0, 2).join(' / '), why = rs ? ': ' + rs : '';
  const head = ids.length === 1 ? list(ids) + ' was put back on its old place' : ids.length + ' buildings were put back on their old places (' + list(ids) + ')';
  return head + why + (version ? ' — the town changed in this version' : '');
}
export function nudgedText(nudged) {
  const ids = Object.keys(nudged || {}); if (!ids.length) return '';
  return (ids.length === 1 ? list(ids) + ' was' : ids.length + ' buildings were') + ' moved a little because the town changed' + (ids.length > 1 ? ' (' + list(ids) + ')' : '');
}
const REJECT = { size: 'too many changes at once', bad: 'it could not be read', version: 'the game and the server are on different versions', 'not an object': 'it could not be read', m: 'it could not be read', id: 'it could not be read', triple: 'it could not be read', range: 'a building is outside the map' };
export const rejectedText = (why) => { const w = String(why); return 'Your arrangement was not saved — ' + (REJECT[w] || REJECT[w.split(' ')[0]] || 'the server refused it (' + w.slice(0, 40) + ')'); };
export const statusText = { saving: 'Saving…', saved: 'Saved ✓', offline: 'Not saved yet — will try again', local: 'Saved on this phone only', rejected: 'Not saved' };
