// Things built but switched OFF until the owner has seen the sample and said OK (flip the default here).  Dev override: ?f=resultInfo,scout,squad (dev builds only, see main.js / dev.html).
const Q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams('');
const on = new Set((Q.get('dev') || Q.get('f') ? (Q.get('f') || '').split(',') : []).filter(Boolean));
export const FEATURES = {
  resultInfo: false,      // S10: result card = damage taken by source + one hint
  scout: false,           // S8: defence preview before the attack (range rings, defence card, % chips)
  squad: false,           // S9: squad tools (focus target, split)
};
for (const k of on) if (k in FEATURES) FEATURES[k] = true;
