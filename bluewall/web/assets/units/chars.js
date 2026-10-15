/* chars.js - AR1 Part B: the story characters gallery (24 cards + 24 design sheets).
   Not part of the game bundle and never loaded with the game: the stub window.BW_chars (made by unitcards.js) fetches this file the first time window.BW_chars.open() is called.
   It needs window.BW_unitcards (createUnitPage, ensureCss, cardUrl, sheetUrl, esc, statGrid, section), replaces the stub with the real API and opens the gallery.
   API   window.BW_chars.open([key])   the gallery (and the character's page when a key is given)      .close()   .isOpen()   .list() -> the 24 keys   .info(key)
   Files web/assets/units/c_<key>.webp (card 384x576), s_<key>.webp (design sheet 1024x1536).  The entry point in the game menu is the owner's decision (nothing in main.js calls this). */
(function () {
  'use strict';
  var U = window.BW_unitcards;
  if (!U) { if (window.console) console.warn('chars.js: the game UI is not ready yet'); return; }
  var esc = U.esc;

  // key, name, age, role line, traits (the info line printed on each design sheet, in the order of the cast index; a short line where the sheet has none)
  var DATA = [
    ['araz', 'Araz', '60', 'King of Azaran', 'Tired · Majestic · A father underneath'],
    ['atousa', 'Atousa', '48', 'First Queen', 'Hard · Precise · Rarely smiles'],
    ['mandana', 'Mandana', '46', 'Queen', 'Gentle · Patient · A teacher'],
    ['aida', 'Aida', '45', 'Queen', 'Shy · Quiet · Kind'],
    ['noura', 'Noura', 'about 48', 'Mother of Shida and Sooda', ''],
    ['shahrzad', 'Shahrzad', '50', 'Wife of Aran', 'Quiet · Careful · Brave at last'],
    ['aram', 'Aram', '58', "The king's sister", 'Dry · Sharp · Never cries'],
    ['nila', 'Nila', '23', 'Cousin of the six sisters', ''],
    ['nika', 'Nika', '22', 'Cousin of the six sisters', ''],
    ['niaz', 'Niaz', '19', 'Cousin of the six sisters', ''],
    ['aran', 'Aran', 'about 55', 'Uncle of the six sisters', ''],
    ['shida', 'Shida', '24', 'Wife of Shahriar', ''],
    ['sooda', 'Sooda', '23', 'Wife of Shahan', ''],
    ['elias', 'Elias', '25', 'Crown Prince', 'Warm · Calm · Loves books'],
    ['mehrdad', 'Mehrdad', '24', 'Prince', 'Funny · Carefree · Loves horses'],
    ['aydin', 'Aydin', '22', 'Prince', 'Restless · Joking · Secretly in love'],
    ['shahriar', 'Shahriar', '28', 'Ruler of Zarrin', 'Charming · Cold underneath'],
    ['shahan', 'Shahan', '26', 'Prince and poet', 'Gentle · Thoughtful · Loyal'],
    ['shayan', 'Shayan', 'about 60', 'Captain of the guard', ''],
    ['arash', 'Arash', 'about 32', 'Mountain archer', ''],
    ['giti', 'Giti', 'about 45', 'Of the White Fortress', ''],
    ['kaveh', 'Kaveh', 'about 55', 'Master of the forge workshop', ''],
    ['barbad', 'Barbad', 'about 25', 'Musician', ''],
    ['bibimehro', 'Bibi Mehro', 'about 70', 'Story character', '']
  ].map(function (r, i) { return { n: i + 1, key: r[0], name: r[1], age: r[2], role: r[3], tr: r[4] }; });

  var CSS = '' +
    '.chg .ucp-sc{padding-top:12px}' +
    '.chg-g{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}' +
    '@media (orientation:landscape) and (max-height:560px){.chg-g{grid-template-columns:repeat(6,minmax(0,1fr))}}' +
    '.chg-t{position:relative;display:block;min-width:0;min-height:44px;margin:0;padding:0;border-radius:12px;border:1.5px solid #8a6a3a;background:linear-gradient(180deg,#33240f,#1b120b);overflow:hidden;text-align:left;font:inherit;color:#f4e8cc;cursor:pointer;-webkit-tap-highlight-color:transparent;box-shadow:0 3px 10px rgba(0,0,0,.45)}' +
    '.chg-t:active{transform:scale(.97)}' +
    '.chg-t .pic{display:block;position:relative;aspect-ratio:2/3;background:#120c07;overflow:hidden}' +
    '.chg-t .pic img{width:100%;height:100%;object-fit:cover;object-position:50% 0;display:block}' +
    '.chg-t .pic:after{content:"";position:absolute;left:0;right:0;bottom:0;height:30%;background:linear-gradient(0deg,rgba(18,12,7,.9),transparent);pointer-events:none}' +
    '.chg-t .no{position:absolute;left:6px;top:6px;z-index:1;min-width:24px;height:24px;padding:0 6px;box-sizing:border-box;border-radius:12px;background:rgba(18,12,7,.78);border:1px solid rgba(224,178,85,.7);color:#f0cf86;font:900 11px/22px Cinzel,Georgia,serif;text-align:center}' +
    '.chg-t .tx{display:block;padding:6px 8px 9px}' +
    '.chg-t b{display:block;font:900 13px/1.25 Cinzel,"Libre Baskerville",Georgia,serif;letter-spacing:.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.chg-t span.r{display:block;margin-top:2px;font-size:10.5px;line-height:1.3;color:#c9b48a;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:2.6em}' +
    '.chg-nav{display:flex;gap:10px;margin-top:22px}' +
    '.chg-nav button{flex:1;min-height:48px;border-radius:12px;border:1.5px solid #8a6a3a;background:linear-gradient(180deg,#4a3420,#2a1c10);color:#f4e8cc;font:900 13px/1 Cinzel,Georgia,serif;letter-spacing:1px;text-transform:uppercase;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '.chg-nav button:active{transform:scale(.97)}';
  var BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';

  var host = null, G = null, page = null, idx = -1, opened = false;

  function tile(d) {
    return '<button class="chg-t" data-ch="open" data-k="' + d.key + '" aria-label="' + esc(d.name + ', ' + d.role) + '"><span class="pic"><span class="no">' + d.n + '</span>' +
      '<img src="' + U.cardUrl(d.key) + '" alt="" loading="lazy" decoding="async" draggable="false"></span>' +
      '<span class="tx"><b>' + esc(d.name) + '</b><span class="r">' + esc(d.role) + '</span></span></button>';
  }
  function model(d) {
    return {
      id: d.key, kind: '', title: d.name, sub: d.role, chip: null, cur: 0,
      looks: [{ look: d.key, label: 'Story sheet', range: '', tag: '' }],
      heroHtml: '<div class="st"><span>' + esc('Age ' + d.age) + '</span><span>#' + d.n + ' of ' + DATA.length + '</span></div>' + (d.tr ? '<p class="ucp-desc" style="margin-top:12px">' + esc(d.tr) + '</p>' : ''),
      restHtml: '<div class="chg-nav"><button data-ch="prev">&lsaquo; Previous</button><button data-ch="next">Next &rsaquo;</button></div>',
      onAction: function (e) {
        var t = e.target.closest && e.target.closest('[data-ch]'); if (!t) return;
        var a = t.dataset.ch; if (a === 'prev' || a === 'next') show((idx + (a === 'next' ? 1 : DATA.length - 1)) % DATA.length);
      }
    };
  }
  function show(i) { idx = i; page.open(model(DATA[i])); }

  function build() {
    if (G) return;
    U.ensureCss();
    if (!document.getElementById('chg-css')) { var s = document.createElement('style'); s.id = 'chg-css'; s.textContent = CSS; document.head.appendChild(s); }
    host = document.querySelector('.bw-ui') || document.body;
    G = document.createElement('div'); G.className = 'ucp chg'; G.setAttribute('role', 'dialog'); G.setAttribute('aria-label', 'Characters');
    G.innerHTML = '<div class="ucp-top"><button class="ucp-back" data-ch="back" aria-label="Back">' + BACK + '</button><div class="ucp-tt"><b>Characters</b><span>' + DATA.length + ' story characters · tap one for the design sheet</span></div></div>' +
      '<div class="ucp-sc"><div class="chg-g">' + DATA.map(tile).join('') + '</div></div>';
    host.appendChild(G);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && opened && !page.isOpen()) close(); });     // (registered BEFORE the page's own Esc handler: one key press closes one layer)
    page = U.createUnitPage(host, { onClose: function () { idx = -1; } });     // (created after the gallery: it sits above it)
    G.addEventListener('click', function (e) {
      var t = e.target.closest('[data-ch]'); if (!t) return;
      if (t.dataset.ch === 'back') close();
      else if (t.dataset.ch === 'open') { for (var i = 0; i < DATA.length; i++) if (DATA[i].key === t.dataset.k) { show(i); break; } }
    });
    G.addEventListener('error', function (e) { var t = e.target; if (t && t.tagName === 'IMG') t.style.visibility = 'hidden'; }, true);
  }
  function open(key) {
    build(); G.classList.add('on'); opened = true;
    if (key) info(key);
    return true;
  }
  function info(key) {
    for (var i = 0; i < DATA.length; i++) if (DATA[i].key === key) { if (!opened) open(); show(i); return true; }
    return false;
  }
  function close() { if (!G) return; page.close(); G.classList.remove('on'); opened = false; }

  window.BW_chars = { open: open, close: close, isOpen: function () { return opened; }, list: function () { return DATA.map(function (d) { return d.key; }); }, info: info };
})();
