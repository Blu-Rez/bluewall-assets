import { orb, abilOrb } from '/home/claude/bot/bluebot_v2/bluewall/client/src/spellart.js';
import fs from 'fs';
const ks = (process.argv[2] || 'shield,shield2,shield3,rally,rally2,rally3').split(',');
let h = '<body style="margin:0;background:#5d6e33;font:14px sans-serif;color:#fff"><div style="display:flex;flex-wrap:wrap;gap:14px;padding:14px;width:760px">';
for (const k of ks) h += `<div style="text-align:center;width:230px"><div style="width:200px;height:200px;margin:auto">${(abilOrb(k,1)?abilOrb:orb)(k, 200)}</div><div style="margin-top:6px">${k} &nbsp; <span style="display:inline-block;width:54px;height:54px;vertical-align:middle">${(abilOrb(k,1)?abilOrb:orb)(k, 54)}</span></div></div>`;
h += '</div></body>';
fs.writeFileSync('/home/claude/dev/s33/orb_sheet.html', h);
