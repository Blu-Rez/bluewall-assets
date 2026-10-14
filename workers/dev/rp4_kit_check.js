// RP4 — `bash dev/rp4_kit_check.sh <sister>` runs this: the kit file combat/kit_<sister>.js against the contract + the sister's real GLB.  Exit code 0 = the kit may go in.
// Prints: field-path errors (validateKit), the timing table of every beat / skill / block, every behaviour check, warnings.  Nothing here is shipped to the game.
import { checkKit } from './rp4_kitcheck.js';
import { SISTERS, CLIPS_33 } from '../bot/bluebot_v2/bluewall/web/assets/rpg/combat.js';
const fs = require('fs'), path = require('path');
const ASSETS = '/home/claude/bot/bluebot_v2/bluewall/web/assets/rpg/';
export function runCheck(kit, id) {
  const out = [], bad = [], warn = [];
  const glb = ASSETS + id + '.glb'; let clips = null, clipDur = null;
  if (fs.existsSync(glb)) {                                              // the real clips of the sister's GLB (RP0B: 33 clips each)
    const b = fs.readFileSync(glb), jl = b.readUInt32LE(12), js = JSON.parse(b.slice(20, 20 + jl).toString('utf8')); clips = []; clipDur = {};
    for (const a of js.animations) { let m = 0; for (const sm of a.samplers) m = Math.max(m, js.accessors[sm.input].max[0]); clips.push(a.name); clipDur[a.name] = m; }
    out.push(`GLB ${id}.glb: ${clips.length} clips`);
  } else { clips = CLIPS_33; warn.push(`${id}.glb not found next to rpg.js: clip NAMES are checked against the standard 33, durations are NOT checked`); }
  if (kit.id !== id) bad.push(`kit.id is "${kit.id}" but the file is kit_${id}.js`);
  if (SISTERS[id] && kit.element !== SISTERS[id].element) bad.push(`kit.element "${kit.element}" is not the sister's element "${SISTERS[id].element}" (SISTERS table / the book)`);
  // everything the player can see in the hero UI is icons and digits: ids / names / roles in a kit must be plain ASCII (the owner's rule: no Persian text in the hero UI, no "bot")
  const strs = []; (function walk(o, p) { if (typeof o === 'string') strs.push([p, o]); else if (o && typeof o === 'object') for (const k in o) walk(o[k], p ? p + '.' + k : k); })(kit, '');
  for (const [p, s] of strs) { if (/[^\x20-\x7e]/.test(s)) bad.push(`${p}: non-ASCII text "${s}" (no Persian / special text in the hero UI)`); if (/bot|ربات/i.test(s)) bad.push(`${p}: "${s}" contains "bot"`); }
  // weapon models: the file must exist, live under combat/, and be one the owner picked from a sheet (this tool can only check the first two)
  for (const w of (kit.weapons || [])) { const f = ASSETS + w.url; if (!fs.existsSync(f)) bad.push(`weapon ${w.url}: file not found under web/assets/rpg/`); else out.push(`weapon ${w.url} (${(fs.statSync(f).size / 1024).toFixed(0)} kB) — must be a model the OWNER numbered from a sheet`); }
  const R = checkKit(kit, { clips, clipDur });
  for (const t of R.table) out.push('  ' + t);
  for (const w of R.warnings.concat(warn)) out.push('WARN ' + w);
  for (const f of R.fails.concat(bad)) out.push('FAIL ' + f);
  const all = R.fails.length + bad.length === 0;
  out.push(`${all ? 'KIT OK' : 'KIT FAILED'} (${R.passes.length} checks passed, ${R.fails.length + bad.length} failed, ${R.warnings.length + warn.length} warnings) — ${id}`);
  console.log(out.join('\n')); process.exit(all ? 0 : 1);
}
