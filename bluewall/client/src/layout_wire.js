// layout_wire.js — LY1: what the game does with the player's layout and the server's answers (main.js only calls this).  No THREE, no DOM: dev/ly1_test.sh runs it against the real server.
//
//   const wire = createLayoutWire({ econ, world, ui, battleOn })      wire.sync = the layout_sync.js object (the editor saves through it)       wire.attach(layoutUI)   the «load» event + the editor's words
// The rules that make «a house I moved is removed later» impossible:
//   1. the server's record is only shown when it is NEWER than what is on screen (layout_sync.js: stale answers are dropped, one save at a time, in order);
//   2. a building that goes back to its old place is NAMED, with the reason (the server's, or this phone's rules when the town changed between two versions of the game);
//   3. a record that has to be corrected on load (a spot that is not valid any more) is first moved to the nearest valid spot (≤ 8 m, layout_live.js nudge), and the corrected record is saved, so the server and this phone agree;
//   4. while an attack is on screen the player's own record waits (layout_live.js loadOwn) and comes back with leaveBattle().
import * as LS from './layout_store.js';
import { createLayoutSync } from './layout_sync.js';
import { droppedText, nudgedText, rejectedText } from './layout_text.js';

export function createLayoutWire({ econ, world, ui, battleOn = () => false, gap }) {
  let edui = null, last = '';
  const live = () => world.layout;
  const say = (m, sticky = true) => { if (!m || m === last) return; last = m; setTimeout(() => { if (last === m) last = ''; }, 4000); const ms = Math.min(9000, 2600 + m.length * 50); if (edui && edui.notice) edui.notice(m, sticky ? ms + 2000 : ms); else ui.toast(m, ms); };
  const status = (s) => { if (edui && edui.setStatus) edui.setStatus(s); };
  const sync = createLayoutSync(econ, {
    gap, getRev: () => LS.rev(),
    onServer: (j) => { if (j && j.ok && j.changed && !j.stale && live()) { live().loadOwn(j.layout || { v: 1, m: {} }); } },            // (the server's effective record is what the game shows — unless the player has edited since)
    onEvent: (e) => {
      if (e.t === 'saving') status('saving');
      else if (e.t === 'saved') { status('saved'); if (e.dropped && e.dropped.length && !e.stale) say(droppedText(e.dropped, e.reasons)); }
      else if (e.t === 'rejected') { status('rejected'); say(rejectedText(e.why)); }
      else if (e.t === 'kept') { status(e.why === 'off' ? 'local' : 'offline'); if (e.final) say(e.why === 'off' ? '' : 'Could not reach the server — your arrangement is kept on this phone and will be sent later'); }
    },
  });
  // what loading the player's own record put back / moved (layout_live.js load(rec, { own: true })): said once, and the corrected record goes to the server so that both agree
  const onLoaded = (res) => {
    const m = [nudgedText(res.nudged), droppedText(res.dropped, res.reasons, true)].filter(Boolean).join('. ');
    if (m) { say(m); sync.save(live().own()); }
  };
  function attach(layoutUI) {
    edui = layoutUI; if (live()) live().onLoaded = onLoaded;
    econ.on((st, ev) => {
      if (ev !== 'load' || battleOn()) return;
      const e0 = sync.edits;
      sync.load().then((rec) => { if (rec && !layoutUI.active && !battleOn() && sync.edits === e0 && live()) live().loadOwn(rec); }).catch((e) => console.warn('layout', e));
    });
  }
  return { sync, attach, onLoaded, say };
}
