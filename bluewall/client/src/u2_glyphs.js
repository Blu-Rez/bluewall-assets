// u2_glyphs.js — the squad emblem glyphs (neon line icons, 100 x 100 box, squadicon.js format) of the ogre, drawn to match its real model (the treant keeps the old glyph: its U2 model was rejected by the owner, 7 Oct 2026):
//   ogre   = a horned, heavy-jawed brute with two tusks, broad shoulders and clenched fists (the Behemoth model; its mace is not part of the glyph)
const dot = (x, y, r) => `M${x - r} ${y}A${r} ${r} 0 1 0 ${x + r} ${y}A${r} ${r} 0 1 0 ${x - r} ${y}Z`;
export const U2_GLYPH = {
  ogre: ['M24 42Q24 20 50 20Q76 20 76 42V52Q76 66 62 68H38Q24 66 24 52Z',                         // the head: wide and heavy
    'M28 30Q17 28 15 12Q26 13 33 23', 'M72 30Q83 28 85 12Q74 13 67 23',                                // the short curved horns
    'M30 38L46 43M70 38L54 43', dot(39, 47, 2.3), dot(61, 47, 2.3), { d: 'M50 47V56', soft: 1 },     // brow, eyes, nose
    'M38 62L33 51L44 58M62 62L67 51L56 58', { d: 'M38 62Q50 66 62 62', soft: 1 },                    // the tusks and the underbite
    'M10 98Q5 80 22 73Q32 69 42 68M90 98Q95 80 78 73Q68 69 58 68',                                    // the shoulders
    { d: 'M50 70V94M36 82Q50 90 64 82', soft: 1 }, dot(15, 92, 6), dot(85, 92, 6)],                  // belly and fists
};
